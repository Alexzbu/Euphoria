import { Product } from '../models/Product.js';
import { Variant } from '../models/Variant.js';
import { taxonomyModels, type TaxonomyDocument } from '../models/taxonomy.js';
import {
  TAXONOMY_PATHS,
  toTaxonomyRef,
  type TaxonomyLean,
  type TaxonomyPath,
  type TaxonomyRef,
} from './taxonomyService.js';
import { conflict, notFound } from '../utils/AppError.js';

const modelFor = (path: TaxonomyPath) => taxonomyModels[TAXONOMY_PATHS[path]];

// the singular noun for this kind, for messages a person has to read
const nounFor = (path: TaxonomyPath): string => TAXONOMY_PATHS[path].toLowerCase();

// the slug is derived from the name and has a unique index, so "T-Shirts" and
// "t shirts" collide: different names, same thing.
function rethrowDuplicate(error: unknown, path: TaxonomyPath, name: string): never {
  const duplicate =
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === 11000;

  if (!duplicate) throw error;
  throw conflict(`A ${nounFor(path)} indistinguishable from "${name}" already exists`);
}

async function requireEntry(path: TaxonomyPath, id: string): Promise<TaxonomyDocument> {
  const doc = await modelFor(path).findById(id);
  if (!doc) throw notFound(`No ${nounFor(path)} exists with id ${id}`);
  return doc;
}

export async function createTaxonomy(path: TaxonomyPath, name: string): Promise<TaxonomyRef> {
  try {
    // through the model rather than an insert, so the slug-deriving hook runs
    const doc = await modelFor(path).create({ name });
    return toTaxonomyRef(doc.toObject<TaxonomyLean>());
  } catch (error) {
    rethrowDuplicate(error, path, name);
  }
}

// renaming moves the slug too, since the slug is what the name looks like in a url.
// leaving it behind means filtering on a word nobody sees any more.
export async function updateTaxonomy(
  path: TaxonomyPath,
  id: string,
  name: string,
): Promise<TaxonomyRef> {
  const doc = await requireEntry(path, id);
  doc.name = name;

  try {
    await doc.save();
  } catch (error) {
    rethrowDuplicate(error, path, name);
  }

  return toTaxonomyRef(doc.toObject<TaxonomyLean>());
}

// product carries three directly, colour and size hang off the variants because
// that's where a buyable combination lives
const USERS: Record<TaxonomyPath, (id: string) => Promise<number>> = {
  brands: (id) => Product.countDocuments({ brand: id }),
  categories: (id) => Product.countDocuments({ category: id }),
  sexes: (id) => Product.countDocuments({ sex: id }),
  colors: (id) => Variant.countDocuments({ color: id }),
  sizes: (id) => Variant.countDocuments({ size: id }),
};

const NOUN_FOR_USER: Record<TaxonomyPath, string> = {
  brands: 'product',
  categories: 'product',
  sexes: 'product',
  colors: 'variant',
  sizes: 'variant',
};

// refused while anything still points at it, otherwise products end up referencing a
// brand that doesn't exist and quietly go with it. the count is in the message
// because "still in use" isn't actionable and "still on 14 products" is.
export async function deleteTaxonomy(path: TaxonomyPath, id: string): Promise<void> {
  await requireEntry(path, id);

  const inUse = await USERS[path](id);
  if (inUse > 0) {
    const noun = NOUN_FOR_USER[path];
    throw conflict(
      `This ${nounFor(path)} is still on ${String(inUse)} ${noun}${inUse === 1 ? '' : 's'}`,
    );
  }

  await modelFor(path).deleteOne({ _id: id });
}
