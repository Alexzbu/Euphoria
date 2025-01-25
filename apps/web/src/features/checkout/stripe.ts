import { loadStripe, type Stripe } from '@stripe/stripe-js';

// Stripe.js is loaded once per page, and only when there's a key to load it with.
// A deployment without one still takes orders, it just can't collect payment, and
// that's better than a checkout that white-screens on a missing variable.
const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

export const isStripeConfigured = Boolean(publishableKey);

let cached: Promise<Stripe | null> | null = null;

export function getStripe(): Promise<Stripe | null> {
  if (!publishableKey) return Promise.resolve(null);
  cached ??= loadStripe(publishableKey);
  return cached;
}
