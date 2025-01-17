import type { Types } from 'mongoose';
import { requireStripe } from '../config/stripe.js';
import { Order, type OrderStatus } from '../models/Order.js';
import { AppError, conflict, notFound } from '../utils/AppError.js';

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
