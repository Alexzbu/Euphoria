import express, { Router } from 'express';
import { isStripeWebhookConfigured } from '../config/stripe.js';
import { stripeWebhookHandler } from '../controllers/stripeWebhookController.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const stripeWebhookRouter: Router = Router();

if (isStripeWebhookConfigured) {
  // its own body parser, producing a Buffer. signature verification needs the bytes
  // exactly as they arrived, see verifyStripeEvent.
  stripeWebhookRouter.post(
    '/webhook',
    express.raw({ type: 'application/json', limit: '1mb' }),
    asyncHandler(stripeWebhookHandler),
  );
}
