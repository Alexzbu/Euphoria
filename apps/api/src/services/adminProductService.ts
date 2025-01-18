import { Types, type Model } from 'mongoose';
import { logger } from '../config/logger.js';
import { Cart } from '../models/Cart.js';
import { Order } from '../models/Order.js';
import { Product, type ProductDocument } from '../models/Product.js';
import { Variant } from '../models/Variant.js';
import { Brand, Category, Sex, type Taxonomy } from '../models/taxonomy.js';
import type { CreateProductInput, UpdateProductInput } from '../schemas/adminProduct.js';
import { MAX_IMAGES_PER_PRODUCT, processProductImage } from './imageService.js';
import {
  REFERENCES,
  SUMMARY_FIELDS,
  toSummary,
  type PopulatedReferences,
  type ProductRow,
  type ProductSummary,
} from './productService.js';
import { imageStorage } from '../storage/imageStorage.js';
import { badRequest, conflict, notFound, unprocessable } from '../utils/AppError.js';

export interface AdminProductView extends ProductSummary {
  isActive: boolean;
  updatedAt: string;
}

type AdminProductRow = ProductRow & { isActive: boolean; updatedAt: Date };

const ADMIN_FIELDS = `${SUMMARY_FIELDS} isActive updatedAt`;

const toAdminView = (row: AdminProductRow): AdminProductView => ({
  ...toSummary(row),
  isActive: row.isActive,
  updatedAt: row.updatedAt.toISOString(),
});

async function loadAdminProduct(id: string): Promise<AdminProductView> {
  const row = await Product.findById(id)
    .select(ADMIN_FIELDS)
    .populate<PopulatedReferences>(REFERENCES)
    .lean<AdminProductRow | null>();

  if (!row) throw notFound('Product not found');
  return toAdminView(row);
}

// a reference pointing at nothing is a well-formed id, so the schema takes it and
// then the catalog renders a blank where the brand should be
const REFERENCE_MODELS: Record<string, Model<Taxonomy>> = {
  brand: Brand,
  category: Category,
  sex: Sex,
};

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

// best effort, and deliberately quiet about its own failures. this runs while some
// other error is already on its way out, and throwing here would replace it with a
// worse one.
async function discardImages(urls: readonly string[]): Promise<void> {
  for (const url of urls) {
    try {
      await imageStorage.remove(url);
    } catch (error) {
      logger.error({ err: error, url }, 'Could not remove a stored image');
    }
  }
}

// hands back whatever was already stored if a later one fails. half an upload isn't
// a partial success, it's a product with photos its owner never picked.
async function storeImages(files: readonly Express.Multer.File[]): Promise<string[]> {
  const urls: string[] = [];

  try {
    for (const file of files) {
      const stored = await imageStorage.save(await processProductImage(file.buffer));
      urls.push(stored.url);
    }
  } catch (error) {
    await discardImages(urls);
    throw error;
  }

  return urls;
}

export async function createProduct(
  input: CreateProductInput,
  files: readonly Express.Multer.File[],
): Promise<AdminProductView> {
  await assertReferencesExist(input);

  const images = await storeImages(files);

  try {
    const product = await Product.create({ ...input, images });
    return await loadAdminProduct(product._id.toString());
  } catch (error) {
    // the product doesn't exist, so neither should pictures of it
    await discardImages(images);
    throw error;
  }
}

type ProductFields = Omit<UpdateProductInput, 'removeImages'>;

// assigned field by field, not merged. a merge takes whatever the request happened
// to carry, which is how a validated body and the document stop matching.
function applyFields(product: ProductDocument, fields: ProductFields): void {
  if (fields.name !== undefined) product.name = fields.name;
  if (fields.description !== undefined) product.description = fields.description;
  if (fields.priceCents !== undefined) product.priceCents = fields.priceCents;
  if (fields.brand !== undefined) product.brand = new Types.ObjectId(fields.brand);
  if (fields.category !== undefined) product.category = new Types.ObjectId(fields.category);
  if (fields.sex !== undefined) product.sex = new Types.ObjectId(fields.sex);
  if (fields.isActive !== undefined) product.isActive = fields.isActive;
}

// an entry naming an image the product doesn't have is refused, not skipped: the
// client is working from a stale copy and quietly succeeding would confirm a
// deletion that never happened.
function partitionImages(current: readonly string[], removing: readonly string[]): string[] {
  const unknown = removing.find((url) => !current.includes(url));
  if (unknown !== undefined) throw unprocessable(`This product has no image at ${unknown}`);

  return current.filter((url) => !removing.includes(url));
}

export async function updateProduct(
  id: string,
  input: UpdateProductInput,
  files: readonly Express.Multer.File[],
): Promise<AdminProductView> {
  const { removeImages = [], ...fields } = input;

  // files aren't fields, so an upload-only patch turns up with an empty body.
  // emptiness can only be judged with both in view.
  if (Object.keys(fields).length === 0 && removeImages.length === 0 && files.length === 0) {
    throw badRequest('Provide at least one field, image, or removal');
  }

  const product = await Product.findById(id);
  if (!product) throw notFound('Product not found');

  await assertReferencesExist(fields);

  const kept = partitionImages(product.images, removeImages);
  const added = await storeImages(files);

  if (kept.length + added.length > MAX_IMAGES_PER_PRODUCT) {
    await discardImages(added);
    throw badRequest(`A product may have at most ${String(MAX_IMAGES_PER_PRODUCT)} images`);
  }

  applyFields(product, fields);
  product.images = [...kept, ...added];

  try {
    // saved through the document rather than an update query, so the hook keeping
    // the slug in step with the name actually runs. an update query skips it and
    // the product's url quietly keeps the old name.
    await product.save();
  } catch (error) {
    await discardImages(added);
    throw error;
  }

  // only now, with the change durable. deleting first would leave the product
  // pointing at a file that's gone if the save then failed.
  await discardImages(removeImages);

  return loadAdminProduct(id);
}

// orders keep their own copy of what was bought so history survives, but they still
// reference the product, and a shop that can erase what someone paid for can't
// answer for it later. once there's an order, deactivate instead.
export async function deleteProduct(id: string): Promise<void> {
  const product = await Product.findById(id).select('images').lean<{ images: string[] } | null>();
  if (!product) throw notFound('Product not found');

  if (await Order.exists({ 'items.product': id })) {
    throw conflict('This product has been ordered, deactivate it instead of deleting it');
  }

  const variantIds = await Variant.distinct<'_id', Types.ObjectId>('_id', { product: id });

  // a cart line pointing at a variant that's gone is a line nobody can act on, so
  // clear it here instead of leaving the cart to skip it
  await Cart.updateMany({}, { $pull: { items: { variant: { $in: variantIds } } } });
  await Variant.deleteMany({ product: id });
  await Product.deleteOne({ _id: id });

  await discardImages(product.images);
}
