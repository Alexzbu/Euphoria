import { beforeEach, describe, expect, it } from 'vitest';
import { REFRESH_COOKIE } from '../src/utils/cookies.js';
import { api, createUser, PASSWORD, registerAndSignIn, seedRoles, signIn } from './fixtures.js';

/** supertest gives set-cookie as raw header strings; this pulls the refresh cookie out */
function refreshCookie(res: { headers: Record<string, unknown> }): string | undefined {
  const set = res.headers['set-cookie'];
  const all = Array.isArray(set) ? (set as string[]) : [];
  return all.find((c) => c.startsWith(`${REFRESH_COOKIE}=`));
}

beforeEach(async () => {
  await seedRoles();
});

describe('POST /api/auth/register', () => {
  it('creates an account and returns a session', async () => {
    const res = await api()
      .post('/api/auth/register')
      .send({ email: 'new@example.com', password: PASSWORD })
      .expect(201);

    expect(res.body.accessToken).toBeTypeOf('string');
    expect(res.body.user).toMatchObject({ email: 'new@example.com', role: 'CUSTOMER' });
  });

  it('never returns the password, hashed or otherwise', async () => {
    const res = await api()
      .post('/api/auth/register')
      .send({ email: 'quiet@example.com', password: PASSWORD })
      .expect(201);

    expect(JSON.stringify(res.body)).not.toContain(PASSWORD);
    expect(res.body.user.password).toBeUndefined();
  });

  it('puts the refresh token in an httpOnly cookie and not in the body', async () => {
    const res = await api()
      .post('/api/auth/register')
      .send({ email: 'cookie@example.com', password: PASSWORD })
      .expect(201);

    const cookie = refreshCookie(res);
    expect(cookie).toBeDefined();
    expect(cookie).toContain('HttpOnly');
    expect(res.body.refreshToken).toBeUndefined();
  });

  it('rejects a duplicate email as a conflict, not a server error', async () => {
    await createUser('taken@example.com');
    const res = await api()
      .post('/api/auth/register')
      .send({ email: 'taken@example.com', password: PASSWORD })
      .expect(409);

    expect(res.body.error.code).toBe('CONFLICT');
  });

  it('treats an email as the same account whatever its casing', async () => {
    await createUser('mixed@example.com');
    await api()
      .post('/api/auth/register')
      .send({ email: 'Mixed@Example.com', password: PASSWORD })
      .expect(409);
  });

  it('rejects a password under the policy', async () => {
    const res = await api()
      .post('/api/auth/register')
      .send({ email: 'short@example.com', password: 'abc' })
      .expect(400);

    expect(res.body.error.code).toBe('BAD_REQUEST');
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await createUser('user@example.com');
  });

  it('signs in with the right password', async () => {
    const res = await api()
      .post('/api/auth/login')
      .send({ email: 'user@example.com', password: PASSWORD })
      .expect(200);

    expect(res.body.user.email).toBe('user@example.com');
  });

  // the whole point of the shared message: neither answer may reveal which case it was
  it('gives the same answer for a wrong password and an unknown account', async () => {
    const wrong = await api()
      .post('/api/auth/login')
      .send({ email: 'user@example.com', password: 'not-the-password' })
      .expect(401);

    const missing = await api()
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: PASSWORD })
      .expect(401);

    expect(wrong.body.error.message).toBe(missing.body.error.message);
    expect(wrong.body.error.code).toBe(missing.body.error.code);
  });
});

describe('login lockout', () => {
  beforeEach(async () => {
    await createUser('locked@example.com');
  });

  it('locks the account after the configured number of failures', async () => {
    for (let i = 0; i < 5; i += 1) {
      await api()
        .post('/api/auth/login')
        .send({ email: 'locked@example.com', password: 'wrong' })
        .expect(401);
    }

    // the right password now, and it still must not get in
    const res = await api()
      .post('/api/auth/login')
      .send({ email: 'locked@example.com', password: PASSWORD })
      .expect(429);

    expect(res.body.error.code).toBe('TOO_MANY_REQUESTS');
  });

  it('a success in between clears the count', async () => {
    for (let i = 0; i < 4; i += 1) {
      await api()
        .post('/api/auth/login')
        .send({ email: 'locked@example.com', password: 'wrong' })
        .expect(401);
    }
    await signIn('locked@example.com');

    for (let i = 0; i < 4; i += 1) {
      await api()
        .post('/api/auth/login')
        .send({ email: 'locked@example.com', password: 'wrong' })
        .expect(401);
    }
    // still under the threshold, because the counter went back to zero
    await signIn('locked@example.com');
  });
});

describe('refresh token rotation', () => {
  it('exchanges the cookie for a new session', async () => {
    const first = await api()
      .post('/api/auth/register')
      .send({ email: 'rotate@example.com', password: PASSWORD })
      .expect(201);

    const cookie = refreshCookie(first);
    expect(cookie).toBeDefined();

    const res = await api()
      .post('/api/auth/refresh')
      .set('Cookie', cookie as string)
      .expect(200);
    expect(res.body.accessToken).toBeTypeOf('string');
    expect(refreshCookie(res)).not.toBe(cookie);
  });

  it('revokes the whole family when a spent token is presented again', async () => {
    const first = await api()
      .post('/api/auth/register')
      .send({ email: 'replay@example.com', password: PASSWORD })
      .expect(201);
    const spent = refreshCookie(first) as string;

    const second = await api().post('/api/auth/refresh').set('Cookie', spent).expect(200);
    const successor = refreshCookie(second) as string;

    // replaying the spent one is the signal that two parties hold it
    await api().post('/api/auth/refresh').set('Cookie', spent).expect(401);

    // and the successor goes down with the family, so the thief gains nothing
    await api().post('/api/auth/refresh').set('Cookie', successor).expect(401);
  });

  it('refuses a refresh with no cookie at all', async () => {
    await api().post('/api/auth/refresh').expect(401);
  });
});

describe('POST /api/auth/logout', () => {
  it('answers 204 whether or not a token was sent', async () => {
    await api().post('/api/auth/logout').expect(204);

    const session = await api()
      .post('/api/auth/register')
      .send({ email: 'out@example.com', password: PASSWORD })
      .expect(201);
    await api()
      .post('/api/auth/logout')
      .set('Cookie', refreshCookie(session) as string)
      .expect(204);
  });

  it('the token stops working once it has been used to sign out', async () => {
    const session = await api()
      .post('/api/auth/register')
      .send({ email: 'gone@example.com', password: PASSWORD })
      .expect(201);
    const cookie = refreshCookie(session) as string;

    await api().post('/api/auth/logout').set('Cookie', cookie).expect(204);
    await api().post('/api/auth/refresh').set('Cookie', cookie).expect(401);
  });
});

describe('GET /api/auth/me', () => {
  it('returns the caller behind a valid token', async () => {
    const session = await registerAndSignIn('me@example.com');
    const res = await api().get('/api/auth/me').set(session.auth).expect(200);
    expect(res.body.user).toMatchObject({ email: 'me@example.com', role: 'CUSTOMER' });
  });

  it('401s with no token, a malformed header, or a bad token', async () => {
    await api().get('/api/auth/me').expect(401);
    await api().get('/api/auth/me').set({ Authorization: 'nonsense' }).expect(401);
    await api().get('/api/auth/me').set({ Authorization: 'Bearer not.a.jwt' }).expect(401);
  });
});

describe('role guards', () => {
  // a well-formed id for a product that was never created. whether the guard or the
  // handler answers is exactly what distinguishes the three callers below.
  const SOME_ID = '507f1f77bcf86cd799439011';

  it('keeps a customer out of the admin routes', async () => {
    const customer = await registerAndSignIn('shopper@example.com');
    const res = await api().delete(`/api/admin/products/${SOME_ID}`).set(customer.auth).expect(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('an unauthenticated caller gets 401, not 403', async () => {
    await api().delete(`/api/admin/products/${SOME_ID}`).expect(401);
  });

  it('lets an admin past the guard, so the handler is what answers', async () => {
    const admin = await registerAndSignIn('admin@example.com', 'ADMIN');
    const res = await api().delete(`/api/admin/products/${SOME_ID}`).set(admin.auth).expect(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('an admin can actually write', async () => {
    const admin = await registerAndSignIn('writer@example.com', 'ADMIN');
    const res = await api()
      .post('/api/admin/taxonomy/brands')
      .set(admin.auth)
      .send({ name: 'Adidas' })
      .expect(201);
    expect(res.body.item).toMatchObject({ name: 'Adidas', slug: 'adidas' });
  });
});
