import type { RequestHandler } from 'express';
import { notFound } from '../utils/AppError.js';

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(notFound(`Cannot ${req.method} ${req.originalUrl}`));
};
