import type { Request, Response } from 'express';
import * as paymentService from '../services/paymentService.js';
import { badRequest } from '../utils/AppError.js';

export async function stripeWebhookHandler(req: Request, res: Response): Promise<void> {
  const signature = req.get('stripe-signature');
  if (signature === undefined) throw badRequest('Missing Stripe signature header');

  const event = paymentService.verifyStripeEvent(req.body as Buffer, signature);

  // handled synchronously, so a failure here leaves the event unacknowledged and
  // stripe retries it. answering 200 first and working afterwards would turn a
  // database outage into payments that are never recorded.
  await paymentService.applyStripeEvent(event);

  res.json({ received: true });
}
