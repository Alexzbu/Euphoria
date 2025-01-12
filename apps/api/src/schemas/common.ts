import { z } from 'zod';

export const objectIdField = z
  .string()
  .regex(/^[0-9a-f]{24}$/i, 'Must be a 24-character hexadecimal id');

export const idParamsSchema = z.object({ id: objectIdField }).strict();

export type IdParams = z.infer<typeof idParamsSchema>;
