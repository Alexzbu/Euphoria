import { Types, type Model } from 'mongoose';
import { Cart } from '../models/Cart.js';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { Variant, type VariantDocument } from '../models/Variant.js';
import { Color, Size, slugify, type Taxonomy } from '../models/taxonomy.js';
import type { CreateVariantInput, UpdateVariantInput } from '../schemas/adminVariant.js';
import { toVariantOption, type VariantOption, type VariantRow } from './productService.js';
import { compareSizeSlugs } from '../utils/sizeOrder.js';
import { conflict, notFound, unprocessable } from '../utils/AppError.js';

export interface AdminVariantView extends VariantOption {
  productId: string;
}

const REFERENCES = [
  { path: 'color', select: 'name slug' },
  { path: 'size', select: 'name slug' },
];

type VariantWithProduct = VariantRow & { product: Types.ObjectId };

const toAdminView = (row: VariantWithProduct): AdminVariantView => ({
  ...toVariantOption(row),
  productId: row.product.toString(),
});

async function loadVariant(id: string): Promise<AdminVariantView> {
  const row = await Variant.findById(id)
    .select('sku stock color size product')
    .populate(REFERENCES)
    .lean<VariantWithProduct | null>();

  if (!row) throw notFound('Variant not found');
  return toAdminView(row);
}

// mongo reports every violated unique index with the same code, so the key that
// collided is the only thing saying whether a sku or a colour/size was repeated.
function rethrowDuplicate(error: unknown): never {
  const duplicate =
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === 11000;

  if (!duplicate) throw error;

  const keys = Object.keys((error as { keyPattern?: Record<string, unknown> }).keyPattern ?? {});

  if (keys.includes('sku')) throw conflict('That SKU already belongs to another variant');
  throw conflict('This product already has a variant in that colour and size');
}

// asked before the write even though the index would refuse it anyway. a derived sku
// is a function of product+colour+size, so repeating the combination repeats the sku,
// and mongo reports whichever index it checked first. that sends an admin off to
// invent a code for a variant they shouldn't be adding at all.
async function assertCombinationFree(
  productId: Types.ObjectId | string,
  color: string,
  size: string,
  exceptId?: string,
): Promise<void> {
  const clash = await Variant.exists({
    product: productId,
    color,
    size,
    ...(exceptId !== undefined && { _id: { $ne: exceptId } }),
  });

  if (clash) throw conflict('This product already has a variant in that colour and size');
}

const REFERENCE_MODELS: Record<string, Model<Taxonomy>> = { color: Color, size: Size };

async function assertReferencesExist(fields: Record<string, unknown>): Promise<void> {
  await Promise.all(
    Object.entries(REFERENCE_MODELS).map(async ([field, model]) => {
      const id = fields[field];
      if (typeof id !== 'string') return;

      if (!(await model.exists({ _id: id }))) {
        throw unprocessable(`No ${field} exists with id ${id}`);
      }
    }),
  );
}

interface ProductLean {
  _id: Types.ObjectId;
  slug: string;
}

async function requireProduct(productId: string): Promise<ProductLean> {
  const product = await Product.findById(productId).select('slug').lean<ProductLean | null>();
  if (!product) throw notFound('Product not found');
  return product;
}

// built from what the variant already is. readable on a packing slip, and identical
// for the same combination, which is what makes a repeat obvious.
async function deriveSku(productSlug: string, colorId: string, sizeId: string): Promise<string> {
  const [color, size] = await Promise.all([
    Color.findById(colorId).select('slug').lean<{ slug: string } | null>(),
    Size.findById(sizeId).select('slug').lean<{ slug: string } | null>(),
  ]);

  const parts = [productSlug.slice(0, 22), (color?.slug ?? 'x').slice(0, 6), size?.slug ?? 'x'];
  return slugify(parts.join('-')).toUpperCase();
}

// every variant a product has, in the order a size picker should offer them
export async function listVariants(productId: string): Promise<AdminVariantView[]> {
  await requireProduct(productId);

  const rows = await Variant.find({ product: productId })
    .select('sku stock color size product')
    .populate(REFERENCES)
    .lean<VariantWithProduct[]>();

  return rows
    .sort(
      (a, b) =>
        a.color.name.localeCompare(b.color.name) || compareSizeSlugs(a.size.slug, b.size.slug),
    )
    .map(toAdminView);
}

export async function createVariant(
  productId: string,
  input: CreateVariantInput,
): Promise<AdminVariantView> {
  const product = await requireProduct(productId);
  await assertReferencesExist(input);
  await assertCombinationFree(product._id, input.color, input.size);

  const sku = input.sku ?? (await deriveSku(product.slug, input.color, input.size));

  try {
    const variant = await Variant.create({ ...input, sku, product: product._id });
    return await loadVariant(variant._id.toString());
  } catch (error) {
    rethrowDuplicate(error);
  }
}

function applyFields(variant: VariantDocument, fields: UpdateVariantInput): void {
  if (fields.color !== undefined) variant.color = new Types.ObjectId(fields.color);
  if (fields.size !== undefined) variant.size = new Types.ObjectId(fields.size);
  if (fields.sku !== undefined) variant.sku = fields.sku;
  if (fields.stock !== undefined) variant.stock = fields.stock;
}

// set, not adjusted. a count is what someone reading a shelf has, and a delta would
// depend on what the shelf said when the form was opened.
export async function updateVariant(
  id: string,
  input: UpdateVariantInput,
): Promise<AdminVariantView> {
  const variant = await Variant.findById(id);
  if (!variant) throw notFound('Variant not found');

  await assertReferencesExist(input);

  if (input.color !== undefined || input.size !== undefined) {
    await assertCombinationFree(
      variant.product,
      input.color ?? variant.color.toString(),
      input.size ?? variant.size.toString(),
      id,
    );
  }

  applyFields(variant, input);

  try {
    await variant.save();
  } catch (error) {
    rethrowDuplicate(error);
  }

  return loadVariant(id);
}

// refused once the variant has been bought, same reason a sold product can't be
// deleted. stock zero takes it out of circulation without taking it out of the record.
export async function deleteVariant(id: string): Promise<void> {
  const variant = await Variant.findById(id).select('_id').lean<{ _id: Types.ObjectId } | null>();
  if (!variant) throw notFound('Variant not found');

  if (await Order.exists({ 'items.variant': id })) {
    throw conflict('This variant has been ordered, set its stock to zero instead of deleting it');
  }

  // a cart line pointing at a variant that's gone is a line nobody can act on, so
  // it goes too
  await Cart.updateMany({}, { $pull: { items: { variant: variant._id } } });
  await Variant.deleteOne({ _id: id });
}
