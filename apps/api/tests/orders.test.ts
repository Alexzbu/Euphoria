import { beforeEach, describe, expect, it } from 'vitest';
import { Product } from '../src/models/Product.js';
import { Variant } from '../src/models/Variant.js';
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

const ADDRESS = {
  fullName: 'Alice Example',
  line1: '1 Test Street',
  city: 'Berlin',
  postalCode: '10115',
  country: 'DE',
};

let taxonomy: Taxonomy;
let alice: Session;
let admin: Session;
let variantId: string;

/** a cart with one line, which is the precondition for every checkout below */
async function fillCart(session: Session, quantity = 2): Promise<void> {
  await api().post('/api/cart/items').set(session.auth).send({ variantId, quantity }).expect(200);
}

async function placeOrder(session: Session): Promise<{ id: string; orderNumber: string }> {
  const res = await api()
    .post('/api/orders')
    .set(session.auth)
    .send({ shippingAddress: ADDRESS })
    .expect(201);
  return res.body.order;
}

beforeEach(async () => {
  await seedRoles();
  taxonomy = await createTaxonomy();
  alice = await registerAndSignIn('alice@example.com');
  admin = await registerAndSignIn('admin@example.com', 'ADMIN');
  const product = await createProduct(taxonomy, { name: 'Classic Tee', priceCents: 2500 });
  variantId = (await createVariant(product, taxonomy, 10)).id;
});

describe('POST /api/orders', () => {
  it('turns the cart into an order', async () => {
    await fillCart(alice, 2);
    const res = await api()
      .post('/api/orders')
      .set(alice.auth)
      .send({ shippingAddress: ADDRESS })
      .expect(201);

    expect(res.body.order).toMatchObject({ status: 'PENDING_PAYMENT' });
    expect(res.body.order.items).toHaveLength(1);
    expect(res.body.order.orderNumber).toBeTypeOf('string');
  });

  it('totals in whole cents and adds shipping below the free threshold', async () => {
    await fillCart(alice, 2);
    const order = (
      await api().post('/api/orders').set(alice.auth).send({ shippingAddress: ADDRESS }).expect(201)
    ).body.order;

    expect(order.subtotalCents).toBe(5000);
    expect(order.shippingCents).toBe(499);
    expect(order.totalCents).toBe(5499);
  });

  it('ships free once the subtotal reaches the threshold', async () => {
    await fillCart(alice, 4);
    const order = (
      await api().post('/api/orders').set(alice.auth).send({ shippingAddress: ADDRESS }).expect(201)
    ).body.order;

    expect(order.subtotalCents).toBe(10_000);
    expect(order.shippingCents).toBe(0);
  });

  // the price on the order is a snapshot. changing the catalog afterwards must not
  // rewrite what someone already paid.
  it('freezes the price, so a later catalog change does not move it', async () => {
    await fillCart(alice, 1);
    const order = await placeOrder(alice);

    await Product.updateMany({ name: 'Classic Tee' }, { priceCents: 999_99 });

    const res = await api().get(`/api/orders/${order.id}`).set(alice.auth).expect(200);
    expect(res.body.order.items[0].unitPriceCents).toBe(2500);
  });

  it('claims the stock', async () => {
    await fillCart(alice, 3);
    await placeOrder(alice);

    const variant = await Variant.findById(variantId).orFail();
    expect(variant.stock).toBe(7);
  });

  it('empties the cart, but only after the order exists', async () => {
    await fillCart(alice, 1);
    await placeOrder(alice);

    const cart = await api().get('/api/cart').set(alice.auth).expect(200);
    expect(cart.body.items).toEqual([]);
  });

  it('refuses an empty cart', async () => {
    const res = await api()
      .post('/api/orders')
      .set(alice.auth)
      .send({ shippingAddress: ADDRESS })
      .expect(422);
    expect(res.body.error.code).toBe('UNPROCESSABLE_ENTITY');
  });

  it('refuses more than the stock can cover, and gives the stock back', async () => {
    await fillCart(alice, 5);
    await Variant.findByIdAndUpdate(variantId, { stock: 1 });

    await api().post('/api/orders').set(alice.auth).send({ shippingAddress: ADDRESS }).expect(409);

    const variant = await Variant.findById(variantId).orFail();
    expect(variant.stock).toBe(1);
  });

  it('requires a shipping address', async () => {
    await fillCart(alice, 1);
    await api().post('/api/orders').set(alice.auth).send({}).expect(400);
  });

  // the client says where to ship and nothing else. a body that could name a price
  // is a body that could name a lower one.
  it('refuses a body that tries to set the total', async () => {
    await fillCart(alice, 1);
    await api()
      .post('/api/orders')
      .set(alice.auth)
      .send({ shippingAddress: ADDRESS, totalCents: 1 })
      .expect(400);
  });

  it('requires a signed-in caller', async () => {
    await api().post('/api/orders').send({ shippingAddress: ADDRESS }).expect(401);
  });
});

describe('ownership scoping', () => {
  let bob: Session;
  let aliceOrder: { id: string };

  beforeEach(async () => {
    bob = await registerAndSignIn('bob@example.com');
    await fillCart(alice, 1);
    aliceOrder = await placeOrder(alice);
  });

  it("bob's history does not contain alice's order", async () => {
    const res = await api().get('/api/orders').set(bob.auth).expect(200);
    expect(res.body.items).toEqual([]);
    expect(res.body.total).toBe(0);
  });

  it("bob gets a 404 for alice's order id, never her data", async () => {
    const res = await api().get(`/api/orders/${aliceOrder.id}`).set(bob.auth).expect(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
    expect(JSON.stringify(res.body)).not.toContain('Alice Example');
  });

  it("bob cannot cancel alice's order", async () => {
    await api().post(`/api/orders/${aliceOrder.id}/cancel`).set(bob.auth).expect(404);

    const still = await api().get(`/api/orders/${aliceOrder.id}`).set(alice.auth).expect(200);
    expect(still.body.order.status).toBe('PENDING_PAYMENT');
  });

  it("an admin has no customer powers over someone else's order either", async () => {
    // the admin route is PATCH /status; the customer cancel route is scoped to the
    // caller, so even an admin reaches it only for their own orders
    await api().post(`/api/orders/${aliceOrder.id}/cancel`).set(admin.auth).expect(404);
  });

  it('alice sees her own order in her history', async () => {
    const res = await api().get('/api/orders').set(alice.auth).expect(200);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].id).toBe(aliceOrder.id);
  });
});

describe('status transitions', () => {
  let orderId: string;

  beforeEach(async () => {
    await fillCart(alice, 1);
    orderId = (await placeOrder(alice)).id;
  });

  const setStatus = (session: Session, status: string) =>
    api().patch(`/api/orders/${orderId}/status`).set(session.auth).send({ status });

  it('an admin can move a pending order to paid', async () => {
    const res = await setStatus(admin, 'PAID').expect(200);
    expect(res.body.order.status).toBe('PAID');
  });

  it('walks the legal path pending -> paid -> fulfilled -> refunded', async () => {
    await setStatus(admin, 'PAID').expect(200);
    await setStatus(admin, 'FULFILLED').expect(200);
    const res = await setStatus(admin, 'REFUNDED').expect(200);
    expect(res.body.order.status).toBe('REFUNDED');
  });

  it('refuses a move the state machine does not allow', async () => {
    const res = await setStatus(admin, 'FULFILLED').expect(409);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  it('nothing leaves a terminal state', async () => {
    await setStatus(admin, 'CANCELLED').expect(200);
    await setStatus(admin, 'PAID').expect(409);
  });

  it('rejects a status that is not one of the known ones', async () => {
    await setStatus(admin, 'BANANA').expect(400);
  });

  it('a customer cannot drive the state machine', async () => {
    await setStatus(alice, 'PAID').expect(403);
  });

  // a retried webhook meaning "already done" is not a conflict
  it('asking for the status it already has succeeds and changes nothing', async () => {
    await setStatus(admin, 'PAID').expect(200);
    const res = await setStatus(admin, 'PAID').expect(200);
    expect(res.body.order.status).toBe('PAID');
  });
});

describe('customer cancellation', () => {
  let orderId: string;

  beforeEach(async () => {
    await fillCart(alice, 2);
    orderId = (await placeOrder(alice)).id;
  });

  it('a customer can cancel while nobody has paid', async () => {
    const res = await api().post(`/api/orders/${orderId}/cancel`).set(alice.auth).expect(200);
    expect(res.body.order.status).toBe('CANCELLED');
  });

  it('cancelling gives the stock back', async () => {
    await api().post(`/api/orders/${orderId}/cancel`).set(alice.auth).expect(200);

    const variant = await Variant.findById(variantId).orFail();
    expect(variant.stock).toBe(10);
  });

  // once money has moved, undoing it is a refund, which the payer does not do alone
  it('a customer cannot cancel once the order is paid', async () => {
    await api()
      .patch(`/api/orders/${orderId}/status`)
      .set(admin.auth)
      .send({ status: 'PAID' })
      .expect(200);

    await api().post(`/api/orders/${orderId}/cancel`).set(alice.auth).expect(409);
  });
});

describe('GET /api/orders', () => {
  it("paginates the caller's own orders", async () => {
    for (let i = 0; i < 3; i += 1) {
      await fillCart(alice, 1);
      await placeOrder(alice);
    }

    const page = await api().get('/api/orders?page=1&limit=2').set(alice.auth).expect(200);
    expect(page.body).toMatchObject({ page: 1, limit: 2, total: 3, totalPages: 2 });
    expect(page.body.items).toHaveLength(2);
  });

  it('requires a signed-in caller', async () => {
    await api().get('/api/orders').expect(401);
  });

  it('rejects an unknown query key', async () => {
    await api().get('/api/orders?nope=1').set(alice.auth).expect(400);
  });
});
