import { beforeEach, describe, expect, it } from 'vitest';
import {
  api,
  createProduct,
  createTaxonomy,
  createVariant,
  registerAndSignIn,
  seedRoles,
  type Session,
  type Taxonomy,
} from './fixtures.js';

let taxonomy: Taxonomy;
let alice: Session;
let variantId: string;

function addToCart(session: Session, variant: string, quantity = 1) {
  return api().post('/api/cart/items').set(session.auth).send({ variantId: variant, quantity });
}

beforeEach(async () => {
  await seedRoles();
  taxonomy = await createTaxonomy();
  alice = await registerAndSignIn('alice@example.com');
  const product = await createProduct(taxonomy, { priceCents: 2500 });
  variantId = (await createVariant(product, taxonomy, 10)).id;
});

describe('GET /api/cart', () => {
  it('requires a signed-in caller', async () => {
    await api().get('/api/cart').expect(401);
  });

  // a GET must not create anything, or every visit from a signed-in browser
  // leaves a cart document behind
  it('answers an empty cart without creating one', async () => {
    const res = await api().get('/api/cart').set(alice.auth).expect(200);
    expect(res.body).toEqual({ items: [], totalItems: 0, subtotalCents: 0 });
  });
});

describe('POST /api/cart/items', () => {
  it('adds a line and totals it in whole cents', async () => {
    const res = await addToCart(alice, variantId, 2).expect(200);

    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0]).toMatchObject({
      quantity: 2,
      unitPriceCents: 2500,
      lineTotalCents: 5000,
    });
    expect(res.body.subtotalCents).toBe(5000);
    expect(Number.isInteger(res.body.subtotalCents)).toBe(true);
  });

  it('defaults the quantity to one', async () => {
    const res = await api().post('/api/cart/items').set(alice.auth).send({ variantId }).expect(200);
    expect(res.body.items[0].quantity).toBe(1);
  });

  it('refuses more than there is to sell', async () => {
    const res = await addToCart(alice, variantId, 99).expect(409);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  it('refuses a quantity of zero or a negative one', async () => {
    await addToCart(alice, variantId, 0).expect(400);
    await addToCart(alice, variantId, -1).expect(400);
  });

  it('refuses a non-integer quantity', async () => {
    await addToCart(alice, variantId, 1.5).expect(400);
  });

  it('refuses a quantity that arrived as a string', async () => {
    await api()
      .post('/api/cart/items')
      .set(alice.auth)
      .send({ variantId, quantity: '2' })
      .expect(400);
  });

  it('404s for a variant that does not exist', async () => {
    await addToCart(alice, '507f1f77bcf86cd799439011').expect(404);
  });

  it('400s for a malformed variant id', async () => {
    await addToCart(alice, 'not-an-id').expect(400);
  });

  it('will not let the body name an owner', async () => {
    await api()
      .post('/api/cart/items')
      .set(alice.auth)
      .send({ variantId, quantity: 1, userId: '507f1f77bcf86cd799439011' })
      .expect(400);
  });

  it('a second add of the same variant adds to the line instead of duplicating it', async () => {
    await addToCart(alice, variantId, 1).expect(200);
    const res = await addToCart(alice, variantId, 2).expect(200);

    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].quantity).toBe(3);
  });

  it('refuses an increment that would take the line past the stock', async () => {
    await addToCart(alice, variantId, 8).expect(200);
    await addToCart(alice, variantId, 5).expect(409);
  });
});

describe('PATCH /api/cart/items/:id', () => {
  let lineId: string;

  beforeEach(async () => {
    const res = await addToCart(alice, variantId, 1).expect(200);
    lineId = res.body.items[0].id;
  });

  it('sets the quantity', async () => {
    const res = await api()
      .patch(`/api/cart/items/${lineId}`)
      .set(alice.auth)
      .send({ quantity: 3 })
      .expect(200);
    expect(res.body.items[0].quantity).toBe(3);
  });

  it('refuses to go past the stock', async () => {
    await api()
      .patch(`/api/cart/items/${lineId}`)
      .set(alice.auth)
      .send({ quantity: 50 })
      .expect(409);
  });

  // emptying a line is a removal, which has its own verb
  it('refuses a quantity of zero', async () => {
    await api()
      .patch(`/api/cart/items/${lineId}`)
      .set(alice.auth)
      .send({ quantity: 0 })
      .expect(400);
  });

  it('404s for a line that is not in the cart', async () => {
    await api()
      .patch('/api/cart/items/507f1f77bcf86cd799439011')
      .set(alice.auth)
      .send({ quantity: 2 })
      .expect(404);
  });
});

describe('DELETE /api/cart/items/:id', () => {
  it('removes the line and answers 204', async () => {
    const added = await addToCart(alice, variantId, 1).expect(200);
    await api().delete(`/api/cart/items/${added.body.items[0].id}`).set(alice.auth).expect(204);

    const res = await api().get('/api/cart').set(alice.auth).expect(200);
    expect(res.body.items).toEqual([]);
  });

  it('404s rather than 500s when there was nothing to remove', async () => {
    const res = await api()
      .delete('/api/cart/items/507f1f77bcf86cd799439011')
      .set(alice.auth)
      .expect(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});

// the reason this suite exists. the cart is resolved from the token and the request
// has no way to name a different user, so bob must never reach alice's cart.
describe('cross-user access', () => {
  let bob: Session;
  let aliceLineId: string;

  beforeEach(async () => {
    bob = await registerAndSignIn('bob@example.com');
    const res = await addToCart(alice, variantId, 2).expect(200);
    aliceLineId = res.body.items[0].id;
  });

  it("bob's cart is his own and empty, not alice's", async () => {
    const res = await api().get('/api/cart').set(bob.auth).expect(200);
    expect(res.body.items).toEqual([]);
  });

  it("bob cannot read alice's line by its id", async () => {
    // there is no route that takes a line id for reading, so the closest thing is
    // updating it: the answer must be 404, never the data
    const res = await api()
      .patch(`/api/cart/items/${aliceLineId}`)
      .set(bob.auth)
      .send({ quantity: 1 })
      .expect(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it("bob cannot delete alice's line", async () => {
    await api().delete(`/api/cart/items/${aliceLineId}`).set(bob.auth).expect(404);

    // and alice still has it
    const res = await api().get('/api/cart').set(alice.auth).expect(200);
    expect(res.body.items).toHaveLength(1);
  });

  // 404 and not 403: a different answer would confirm the id is real, which is the
  // one thing someone guessing ids is trying to learn
  it("gets the same answer for alice's line as for an id that never existed", async () => {
    const real = await api()
      .patch(`/api/cart/items/${aliceLineId}`)
      .set(bob.auth)
      .send({ quantity: 1 })
      .expect(404);

    const invented = await api()
      .patch('/api/cart/items/507f1f77bcf86cd799439011')
      .set(bob.auth)
      .send({ quantity: 1 })
      .expect(404);

    expect(real.body.error.code).toBe(invented.body.error.code);
    expect(real.body.error.message).toBe(invented.body.error.message);
  });
});

describe('POST /api/cart/merge', () => {
  it('folds a guest cart into the account', async () => {
    const res = await api()
      .post('/api/cart/merge')
      .set(alice.auth)
      .send({ items: [{ variantId, quantity: 2 }] })
      .expect(200);

    expect(res.body.items[0].quantity).toBe(2);
  });

  // merging runs over a network the client cannot trust, so a retried request must
  // not double the line
  it('is idempotent: merging the same cart twice does not add up', async () => {
    const body = { items: [{ variantId, quantity: 3 }] };
    await api().post('/api/cart/merge').set(alice.auth).send(body).expect(200);
    const second = await api().post('/api/cart/merge').set(alice.auth).send(body).expect(200);

    expect(second.body.items[0].quantity).toBe(3);
  });

  it('raises an existing line to the larger quantity rather than summing', async () => {
    await addToCart(alice, variantId, 1).expect(200);
    const res = await api()
      .post('/api/cart/merge')
      .set(alice.auth)
      .send({ items: [{ variantId, quantity: 4 }] })
      .expect(200);

    expect(res.body.items[0].quantity).toBe(4);
  });

  it('keeps the larger quantity when the guest cart asks for less', async () => {
    await addToCart(alice, variantId, 5).expect(200);
    const res = await api()
      .post('/api/cart/merge')
      .set(alice.auth)
      .send({ items: [{ variantId, quantity: 2 }] })
      .expect(200);

    expect(res.body.items[0].quantity).toBe(5);
  });

  // a shopper must not be unable to finish signing in because something in last
  // week's cart went out of print
  it('skips a variant that has left the catalog instead of failing', async () => {
    const res = await api()
      .post('/api/cart/merge')
      .set(alice.auth)
      .send({
        items: [
          { variantId, quantity: 1 },
          { variantId: '507f1f77bcf86cd799439011', quantity: 1 },
        ],
      })
      .expect(200);

    expect(res.body.items).toHaveLength(1);
  });

  it('accepts an empty list and does nothing', async () => {
    const res = await api().post('/api/cart/merge').set(alice.auth).send({ items: [] }).expect(200);
    expect(res.body.items).toEqual([]);
  });

  it('requires a signed-in caller', async () => {
    await api().post('/api/cart/merge').send({ items: [] }).expect(401);
  });
});
