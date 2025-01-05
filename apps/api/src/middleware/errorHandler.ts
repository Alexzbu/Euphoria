import type { ErrorRequestHandler } from 'express';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

interface ErrorBody {
  error: {
    code: string;
    message: string;
    requestId: string;
    details?: unknown;
    stack?: string;
  };
}

// every failure leaves through here as json, so a caller can parse the error path
// the same way it parses the success path. register it last, and keep all four
// params: express identifies error handlers by arity.
export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  // headers already flushed means the response is mid-flight, only express's own
  // handler can close it properly
  if (res.headersSent) {
    next(err);
    return;
  }

  const isKnown = err instanceof AppError;
  const status = isKnown ? err.status : 500;
  const requestId = String(req.id ?? '');

  if (status >= 500) {
    req.log.error({ err }, 'Request failed');
  } else {
    req.log.warn({ err: { message: (err as Error).message, status } }, 'Request rejected');
  }

  const body: ErrorBody = {
    error: {
      code: isKnown ? err.code : 'INTERNAL_SERVER_ERROR',
      message: isKnown ? err.message : 'An unexpected error occurred',
      requestId,
    },
  };

  if (isKnown && err.details !== undefined) {
    body.error.details = err.details;
  }
  if (env.NODE_ENV === 'development' && !isKnown && err instanceof Error) {
    body.error.stack = err.stack;
  }

  res.status(status).json(body);
};
