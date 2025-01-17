import Stripe from 'stripe';
import { env } from './env.js';
import { AppError } from '../utils/AppError.js';

// pinned, not floating. the api version decides the shape of every object this
// code reads, so following the account default means someone changing a setting
// in a dashboard changes what the server receives.
const API_VERSION = '2024-12-18.acacia';

function createClient(): Stripe | null {
  const key = env.STRIPE_SECRET_KEY;
  if (!key) return null;

  return new Stripe(key, { apiVersion: API_VERSION, typescript: true });
}

const client = createClient();

export const isStripeConfigured = client !== null;

// needs its own secret as well as the api key, so it's configured and mounted
// separately from the rest of the payment flow
export const isStripeWebhookConfigured = client !== null && env.STRIPE_WEBHOOK_SECRET !== undefined;

export function requireWebhookSecret(): string {
  const secret = env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new AppError(503, 'Payments are not configured', 'PAYMENTS_NOT_CONFIGURED');
  }
  return secret;
}

/** never reached from an unregistered route */
export function requireStripe(): Stripe {
  if (!client) {
    throw new AppError(503, 'Payments are not configured', 'PAYMENTS_NOT_CONFIGURED');
  }
  return client;
}
