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

  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: false }));
  app.use(cookieParser());

  // outside /api, probes shouldn't have to know the api's routing conventions
  app.use(healthRouter);
  app.use('/api/auth', authRouter);

  // nothing matched above, so it doesn't exist
  app.use(notFoundHandler);

  // last. express only reaches an error handler after everything registered above it.
  app.use(errorHandler);

  return app;
}
