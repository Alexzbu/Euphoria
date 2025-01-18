import { z } from 'zod';
import { formBoolean, objectIdField, repeatable } from './common.js';

// a ceiling, not a guess at the priciest thing anyone will ever sell. the mistake
// this catches is a coat listed at 129,900 because the cents got typed twice.
const MAX_PRICE_CENTS = 10_000_000;

const nameField = z
  .string()
  .trim()
  .min(2, 'Name must be at least 2 characters')
  .max(120, 'Name must be at most 120 characters');

const descriptionField = z.string().trim().max(5000, 'Description must be at most 5000 characters');

const priceField = z.coerce
  .number({ invalid_type_error: 'Price is a whole number of cents' })
  .int('Price is a whole number of cents')
  .min(0, 'Price cannot be negative')
  .max(MAX_PRICE_CENTS, 'Price is implausibly high (prices are in cents)');

const referenceFields = {
  brand: objectIdField,
  category: objectIdField,
  sex: objectIdField,
};

export const createProductSchema = z
  .object({
    name: nameField,
    description: descriptionField.optional(),
    priceCents: priceField,
    ...referenceFields,
    // live unless said otherwise. someone who filled in the form and uploaded
    // photos has finished, not started.
    isActive: formBoolean.default(true),
  })
  .strict();

export type CreateProductInput = z.infer<typeof createProductSchema>;

// everything optional, and no insistence on at least one field. a patch carrying
// only uploaded photos has an empty body by the time it lands here (files aren't
// fields), so "did this ask for anything?" is the handler's question to answer.
export const updateProductSchema = z
  .object({
    name: nameField.optional(),
    description: descriptionField.optional(),
    priceCents: priceField.optional(),
    brand: objectIdField.optional(),
    category: objectIdField.optional(),
    sex: objectIdField.optional(),
    isActive: formBoolean.optional(),

    // images already on the product that should go. uploads get added, this is how
    // one comes off, so a photo can be swapped in a single request.
    removeImages: repeatable(z.string().min(1)).optional(),
  })
  .strict();

export type UpdateProductInput = z.infer<typeof updateProductSchema>;
