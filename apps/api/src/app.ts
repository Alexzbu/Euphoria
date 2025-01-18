import express, { type Express } from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import { requestLogger } from './middleware/requestLogger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFoundHandler } from './middleware/notFoundHandler.js';
import { healthRouter } from './routes/health.js';
import { authRouter } from './routes/auth.js';
import { productRouter } from './routes/products.js';
import { taxonomyRouter } from './routes/taxonomy.js';
import { cartRouter } from './routes/cart.js';
import { orderRouter } from './routes/orders.js';
import { stripeWebhookRouter } from './routes/stripeWebhook.js';
import { adminProductRouter } from './routes/adminProducts.js';
import { adminVariantRouter } from './routes/adminVariants.js';
import { imageStorage } from './storage/imageStorage.js';

export function createApp(): Express {
  const app = express();

  // first in the chain, so even requests rejected downstream get logged
  app.use(requestLogger);
  app.use(helmet());
  app.use(
    cors({
      origin: env.WEB_ORIGIN,
      credentials: true,
    }),
  );

  // ahead of the json parser, deliberately. the webhook verifies a signature over
  // the raw body, and that's gone once a parser has turned it into an object.
  app.use('/api/stripe', stripeWebhookRouter);

  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: false }));
  app.use(cookieParser());

  // only the disk backend needs this process to serve images, an object store
  // answers for its own. names are unique per upload so cache hard, and the resource
  // policy is relaxed here alone: helmet's default is same-origin, which is right
  // for an api and wrong for a picture the storefront renders.
  if (imageStorage.localRoot !== undefined) {
    app.use(
      env.MEDIA_BASE_PATH,
      helmet.crossOriginResourcePolicy({ policy: 'cross-origin' }),
      express.static(imageStorage.localRoot, {
        index: false,
        dotfiles: 'ignore',
        immutable: true,
        maxAge: '1y',
        // a missing image falls through to the json 404 instead of being answered by
        // the static handler in a format nothing else here uses
        fallthrough: true,
      }),
    );
  }

  // outside /api, probes shouldn't have to know the api's routing conventions
  app.use(healthRouter);
  app.use('/api/auth', authRouter);
  app.use('/api/products', productRouter);
  app.use('/api/taxonomy', taxonomyRouter);
  app.use('/api/cart', cartRouter);
  app.use('/api/orders', orderRouter);

  // own prefix, so what a path grants is visible in the path and not only in the
  // guards behind it
  app.use('/api/admin/products', adminProductRouter);
  app.use('/api/admin/variants', adminVariantRouter);

  // nothing matched above, so it doesn't exist
  app.use(notFoundHandler);

  // last. express only reaches an error handler after everything registered above it.
  app.use(errorHandler);

  return app;
}
