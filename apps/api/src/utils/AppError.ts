export class AppError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: unknown;

  constructor(status: number, message: string, code: string, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, AppError);
  }
}

export const badRequest = (message: string, details?: unknown): AppError =>
  new AppError(400, message, 'BAD_REQUEST', details);

export const unauthorized = (message = 'Authentication required'): AppError =>
  new AppError(401, message, 'UNAUTHORIZED');

export const forbidden = (message = 'Insufficient permissions'): AppError =>
  new AppError(403, message, 'FORBIDDEN');

export const notFound = (message = 'Resource not found'): AppError =>
  new AppError(404, message, 'NOT_FOUND');

export const conflict = (message: string): AppError => new AppError(409, message, 'CONFLICT');

export const unprocessable = (message: string, details?: unknown): AppError =>
  new AppError(422, message, 'UNPROCESSABLE_ENTITY', details);

export const tooManyRequests = (message = 'Too many requests'): AppError =>
  new AppError(429, message, 'TOO_MANY_REQUESTS');
