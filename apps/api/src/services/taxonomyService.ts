import type { Types } from 'mongoose';
import { taxonomyModels, type TaxonomyKind } from '../models/taxonomy.js';
import { compareSizeSlugs } from '../utils/sizeOrder.js';

export interface TaxonomyLean {
  _id: Types.ObjectId;
  name: string;
  slug: string;
}

export interface TaxonomyRef {
  id: string;
  name: string;
  slug: string;
}

export const toTaxonomyRef = (doc: TaxonomyLean): TaxonomyRef => ({
  id: doc._id.toString(),
  name: doc.name,
  slug: doc.slug,
});

// url segments, plural and lowercase. the values name the models behind them.
export const TAXONOMY_PATHS = {
  brands: 'Brand',
  colors: 'Color',
  sizes: 'Size',
  categories: 'Category',
  sexes: 'Sex',
} as const satisfies Record<string, TaxonomyKind>;

export type TaxonomyPath = keyof typeof TAXONOMY_PATHS;

export const TAXONOMY_PATH_NAMES = Object.keys(TAXONOMY_PATHS) as [TaxonomyPath, ...TaxonomyPath[]];

export async function listTaxonomy(path: TaxonomyPath): Promise<TaxonomyRef[]> {
  const docs = await taxonomyModels[TAXONOMY_PATHS[path]]
    .find()
    .select('name slug')
    .sort({ name: 1 })
    .lean<TaxonomyLean[]>();

  const items = docs.map(toTaxonomyRef);

  // sizes are the one kind whose meaningful order isn't its name's order
  return path === 'sizes' ? items.sort((a, b) => compareSizeSlugs(a.slug, b.slug)) : items;
}

// everything the filter sidebar needs, in one response. five requests to draw one
// panel is five chances for it to render half-populated.
export async function listAllTaxonomy(): Promise<Record<TaxonomyPath, TaxonomyRef[]>> {
  const lists = await Promise.all(TAXONOMY_PATH_NAMES.map((path) => listTaxonomy(path)));

  return Object.fromEntries(
    TAXONOMY_PATH_NAMES.map((path, index) => [path, lists[index] ?? []]),
  ) as Record<TaxonomyPath, TaxonomyRef[]>;
}
