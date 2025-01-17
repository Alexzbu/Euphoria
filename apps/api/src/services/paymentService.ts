import type { Types } from 'mongoose';
import type Stripe from 'stripe';
import { requireStripe, requireWebhookSecret } from '../config/stripe.js';
import { logger } from '../config/logger.js';
import { Order, type OrderStatus } from '../models/Order.js';
import { AppError, badRequest, conflict, notFound } from '../utils/AppError.js';

// the amount comes from the order that's already stored, never from the request. a
// checkout that lets the client say what it owes can be told it owes one cent, and
// the only reliable defence is not reading the number from anywhere it can write.

interface PayableOrder {
  _id: Types.ObjectId;
  orderNumber: string;
  status: OrderStatus;
  totalCents: number;
  currency: string;
}

export interface PaymentIntentView {
  clientSecret: string;
  amountCents: number;
  currency: string;
}

export async function createPaymentIntent(
  userId: string,
  orderId: string,
): Promise<PaymentIntentView> {
  const order = await Order.findOne({ _id: orderId, user: userId })
    .select('orderNumber status totalCents currency')
    .lean<PayableOrder | null>();

  if (!order) throw notFound('Order not found');
  if (order.status !== 'PENDING_PAYMENT') throw conflict('This order is not awaiting payment');

  const intent = await requireStripe().paymentIntents.create(
    {
      amount: order.totalCents,
      currency: order.currency,
      // stripe tells the webhook which order was paid, not the browser that comes
      // back afterwards. a redirect can be forged, a signed event can't.
      metadata: { orderId: order._id.toString(), orderNumber: order.orderNumber, userId },
      automatic_payment_methods: { enabled: true },
    },
    // keyed on the order, so a customer who reloads the payment page gets the same
    // intent back instead of a second one that could also be charged
    { idempotencyKey: `order-${order._id.toString()}` },
  );

  if (!intent.client_secret) {
    throw new AppError(502, 'Payment provider returned no client secret', 'PAYMENT_INTENT_INVALID');
  }

  await Order.updateOne({ _id: order._id }, { $set: { paymentIntentId: intent.id } });

  return {
    clientSecret: intent.client_secret,
    amountCents: order.totalCents,
    currency: order.currency,
  };
}

// took me a while to get this one. the signature is computed over the exact bytes
// stripe sent, which is why the route hands this a Buffer and not a parsed object:
// json that's been decoded and re-encoded is no longer the payload that was signed,
// so it fails verification even when it's completely genuine.
export function verifyStripeEvent(payload: Buffer, signature: string): Stripe.Event {
  try {
    return requireStripe().webhooks.constructEvent(payload, signature, requireWebhookSecret());
  } catch (error) {
    logger.warn({ err: error }, 'Rejected a Stripe webhook with an invalid signature');
    throw badRequest('Stripe signature verification failed');
  }
}

interface PaidOrderRow {
  _id: Types.ObjectId;
  orderNumber: string;
  status: OrderStatus;
  totalCents: number;
  currency: string;
}

// stripe names the order twice: on the intent we stored, and in the metadata we set
async function findOrderForIntent(intent: Stripe.PaymentIntent): Promise<PaidOrderRow | null> {
  const byIntent = await Order.findOne({ paymentIntentId: intent.id }).lean<PaidOrderRow | null>();
  if (byIntent) return byIntent;

  const orderId = intent.metadata.orderId;
  if (!orderId) return null;

  return Order.findOne({ _id: orderId }).lean<PaidOrderRow | null>();
}

// stripe delivers at least once and retries anything it can't confirm, so the same
// success can turn up several times. the update is conditional on the order still
// awaiting payment, which makes the second delivery a no-op.
//
// the amount is checked before anything moves: an intent that settled for less than
// the order total isn't payment for this order, whatever it says on it.
async function markOrderPaid(intent: Stripe.PaymentIntent): Promise<void> {
  const order = await findOrderForIntent(intent);
  if (!order) {
    logger.error({ intentId: intent.id }, 'Payment succeeded for an order that cannot be found');
    return;
  }

  if (intent.amount_received < order.totalCents || intent.currency !== order.currency) {
    logger.error(
      {
        orderNumber: order.orderNumber,
        expected: { amount: order.totalCents, currency: order.currency },
        received: { amount: intent.amount_received, currency: intent.currency },
      },
      'Payment does not match the order total, leaving the order unpaid',
    );
    return;
  }

  const applied = await Order.updateOne(
    { _id: order._id, status: 'PENDING_PAYMENT' },
    { $set: { status: 'PAID', paymentIntentId: intent.id } },
  );

  if (applied.matchedCount === 0) {
    logger.info({ orderNumber: order.orderNumber }, 'Payment event for an order already settled');
    return;
  }

  logger.info({ orderNumber: order.orderNumber }, 'Order marked as paid');
}

// events this deployment acts on. anything else is acknowledged and ignored, since
// erroring on an event we don't care about would have stripe retrying it for days.
export async function applyStripeEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case 'payment_intent.succeeded':
      await markOrderPaid(event.data.object);
      break;

    case 'payment_intent.payment_failed':
      // not a state change, the order stays awaiting payment so it can be retried
      logger.warn(
        { intentId: event.data.object.id, reason: event.data.object.last_payment_error?.message },
        'Payment attempt failed',
      );
      break;

    default:
      logger.debug({ type: event.type }, 'Ignoring unhandled Stripe event');
  }
}
