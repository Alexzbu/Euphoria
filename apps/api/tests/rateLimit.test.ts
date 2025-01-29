import express, { type Express } from 'express';
import supertest from 'supertest';
import { describe, expect, it } from 'vitest';
import { errorHandler } from '../src/middleware/errorHandler.js';
import { createRateLimiter } from '../src/middleware/rateLimit.js';
import { requestLogger } from '../src/middleware/requestLogger.js';

// own apps, own limiters. the exported ones read their limits from env once at
// import, and the suite runs with those set high enough not to interfere.
function appWith(hops: number, limit: number): Express {
  const app = express();
  app.set('trust proxy', hops);
  // the error handler reports through req.log and req.id, both of which this puts
  // on the request
  app.use(requestLogger);
  app.use(createRateLimiter(limit));
  app.get('/ping', (_req, res) => {
    res.json({ ok: true });
  });
  app.use(errorHandler);
  return app;
}

const nginx = (app: Express, client: string) =>
  supertest(app).get('/ping').set('X-Forwarded-For', client);

describe('rate limiter', () => {
  it('refuses past the limit with the standard error body', async () => {
    const app = appWith(0, 2);
    const request = () => supertest(app).get('/ping');

    await request().expect(200);
    await request().expect(200);

    const res = await request().expect(429);
    expect(res.body.error.code).toBe('TOO_MANY_REQUESTS');
    expect(res.headers['ratelimit-policy']).toBeDefined();
  });

  it('counts forwarded clients separately behind one proxy', async () => {
    const app = appWith(1, 2);

    await nginx(app, '203.0.113.1').expect(200);
    await nginx(app, '203.0.113.1').expect(200);
    await nginx(app, '203.0.113.1').expect(429);

    // a different client, and the first one's spent budget is not its problem
    await nginx(app, '203.0.113.2').expect(200);
  });

  it('lumps forwarded clients together when no proxy is trusted', async () => {
    const app = appWith(0, 2);

    await nginx(app, '203.0.113.1').expect(200);
    await nginx(app, '203.0.113.2').expect(200);
    // both arrived on the same socket, so this is the third request from what the
    // limiter sees as one caller
    await nginx(app, '203.0.113.3').expect(429);
  });

  it('ignores an address a client prepended to the forwarded chain', async () => {
    const app = appWith(1, 2);
    const spoofed = () =>
      supertest(app).get('/ping').set('X-Forwarded-For', '198.51.100.9, 203.0.113.5');

    await spoofed().expect(200);
    await spoofed().expect(200);
    // the rightmost entry is the one nginx wrote, and rotating the left end buys
    // nothing
    await supertest(app)
      .get('/ping')
      .set('X-Forwarded-For', '198.51.100.10, 203.0.113.5')
      .expect(429);
  });
});
