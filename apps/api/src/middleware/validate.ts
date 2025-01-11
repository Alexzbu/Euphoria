import type { Request, RequestHandler } from 'express';
import type { ZodIssue, ZodTypeAny } from 'zod';
import { AppError, badRequest } from '../utils/AppError.js';

export type ValidationSource = 'params' | 'query' | 'body';

export type ValidationSchemas = Partial<Record<ValidationSource, ZodTypeAny>>;

export type ValidatedRequest = Partial<Record<ValidationSource, unknown>>;

/** a rejected field, shaped so the client can render it next to the input */
export interface ValidationIssue {
  source: ValidationSource;
  path: string;
  message: string;
}

const SOURCES: readonly ValidationSource[] = ['params', 'query', 'body'];

function describe(source: ValidationSource, issues: readonly ZodIssue[]): ValidationIssue[] {
  return issues.map((issue) => ({
    source,
    path: issue.path.join('.'),
    message: issue.message,
  }));
}

// stored on req.validated instead of written back over req.query and friends.
// express 5 exposes query through a getter with no setter, so assigning just fails.
export function validate(schemas: ValidationSchemas): RequestHandler {
  return (req, _res, next) => {
    const validated: ValidatedRequest = {};
    const issues: ValidationIssue[] = [];

    for (const source of SOURCES) {
      const schema = schemas[source];
      if (!schema) continue;

      const result = schema.safeParse(req[source]);
      if (result.success) {
        validated[source] = result.data;
      } else {
        // parse every part before reporting anything, so someone fixing a request
        // hears about all of its problems at once
        issues.push(...describe(source, result.error.issues));
      }
    }

    if (issues.length > 0) {
      next(badRequest('Request validation failed', issues));
      return;
    }

    req.validated = validated;
    next();
  };
}

// the cast lives here and nowhere else: the route names the schema, the handler names
// the type. reading a part the route never declared is a wiring mistake, so it 500s
// instead of handing back something unchecked.
export function validated<T>(req: Request, source: ValidationSource): T {
  const value = req.validated?.[source];
  if (value === undefined) {
    throw new AppError(
      500,
      `Route did not validate the request ${source}`,
      'VALIDATION_NOT_CONFIGURED',
    );
  }
  return value as T;
}
