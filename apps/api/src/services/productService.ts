import type { FilterQuery, Model, Types } from 'mongoose';
import { Product } from '../models/Product.js';
import { Variant } from '../models/Variant.js';
import { Brand, Category, Color, Sex, Size, type Taxonomy } from '../models/taxonomy.js';
import type { ListProductsQuery } from '../schemas/product.js';
import { toTaxonomyRef, type TaxonomyLean, type TaxonomyRef } from './taxonomyService.js';
import { escapeRegExp } from '../utils/escapeRegExp.js';
import { compareSizeSlugs } from '../utils/sizeOrder.js';
import { notFound } from '../utils/AppError.js';

export interface VariantRow {
  _id: Types.ObjectId;
  sku: string;
  stock: number;
  color: TaxonomyLean;
  size: TaxonomyLean;
}

export interface ProductRow {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  priceCents: number;
  images: string[];
  brand: TaxonomyLean;
  category: TaxonomyLean;
  sex: TaxonomyLean;
  createdAt: Date;
}

export type { TaxonomyRef };

export interface ProductSummary {
  id: string;
  name: string;
  slug: string;
  description?: string;
  priceCents: number;
  images: string[];
  brand: TaxonomyRef;
  category: TaxonomyRef;
  sex: TaxonomyRef;
  createdAt: string;
}

export interface VariantOption {
  id: string;
  sku: string;
  stock: number;
  inStock: boolean;
  color: TaxonomyRef;
  size: TaxonomyRef;
}

export interface ProductDetail extends ProductSummary {
  variants: VariantOption[];
}

export interface ProductPage {
  items: ProductSummary[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// exported because admin reads answer with the same product. kept separate the two
// views drift, and it shows up as a field an admin can edit but nobody can see.
export const SUMMARY_FIELDS =
  'name slug description priceCents images brand category sex createdAt';

export const REFERENCES = [
  { path: 'brand', select: 'name slug' },
  { path: 'category', select: 'name slug' },
  { path: 'sex', select: 'name slug' },
];

export type PopulatedReferences = Pick<ProductRow, 'brand' | 'category' | 'sex'>;

export function toSummary(row: ProductRow): ProductSummary {
  return {
    id: row._id.toString(),
    name: row.name,
    slug: row.slug,
    description: row.description,
    priceCents: row.priceCents,
    images: row.images,
    brand: toTaxonomyRef(row.brand),
    category: toTaxonomyRef(row.category),
    sex: toTaxonomyRef(row.sex),
    createdAt: row.createdAt.toISOString(),
  };
}

// deactivating is how a product leaves the catalog without taking the orders that
// reference it along with it
const visible: FilterQuery<Product> = { isActive: true };

// filters name taxonomy by slug, the database stores references. an unknown slug
// resolves to an empty id list: no products, never all of them.
async function idsForSlugs(
  model: Model<Taxonomy>,
  slugs: string[] | undefined,
): Promise<Types.ObjectId[] | undefined> {
  if (!slugs) return undefined;

  const docs = await model
    .find({ slug: { $in: slugs } })
    .select('_id')
    .lean<{ _id: Types.ObjectId }[]>();

  return docs.map((doc) => doc._id);
}

// colour and size belong to a variant, so those two filters get answered by finding
// variants and mapping back. both conditions go into one variant query on purpose:
// red and L means one variant that is red AND L, not a product sold in red
// somewhere and L somewhere else.
async function productIdsMatchingVariants(
  colors: Types.ObjectId[] | undefined,
  sizes: Types.ObjectId[] | undefined,
): Promise<Types.ObjectId[] | undefined> {
  if (!colors && !sizes) return undefined;

  const filter: FilterQuery<Variant> = {};
  if (colors) filter.color = { $in: colors };
  if (sizes) filter.size = { $in: sizes };

  return Variant.distinct<'product', Types.ObjectId>('product', filter);
}

function priceRange({ priceMin, priceMax }: ListProductsQuery): { $gte?: number; $lte?: number } {
  const range: { $gte?: number; $lte?: number } = {};
  if (priceMin !== undefined) range.$gte = priceMin;
  if (priceMax !== undefined) range.$lte = priceMax;
  return range;
}

async function buildCatalogFilter(query: ListProductsQuery): Promise<FilterQuery<Product>> {
  const [brands, categories, sexes, colors, sizes] = await Promise.all([
    idsForSlugs(Brand, query.brand),
    idsForSlugs(Category, query.category),
    idsForSlugs(Sex, query.sex),
    idsForSlugs(Color, query.color),
    idsForSlugs(Size, query.size),
  ]);

  const filter: FilterQuery<Product> = { ...visible };
  if (brands) filter.brand = { $in: brands };
  if (categories) filter.category = { $in: categories };
  if (sexes) filter.sex = { $in: sexes };

  const price = priceRange(query);
  if (Object.keys(price).length > 0) filter.priceCents = price;

  const variantMatches = await productIdsMatchingVariants(colors, sizes);
  if (variantMatches) filter._id = { $in: variantMatches };

  return filter;
}

async function findPage(
  filter: FilterQuery<Product>,
  page: number,
  limit: number,
): Promise<ProductPage> {
  const [rows, total] = await Promise.all([
    Product.find(filter)
      .select(SUMMARY_FIELDS)
      .populate<PopulatedReferences>(REFERENCES)
      // _id breaks ties. sorting on createdAt alone leaves documents sharing a
      // timestamp in an order mongo may pick differently per query, which is how a
      // paginated listing shows the same product twice and skips another.
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Product.countDocuments(filter),
  ]);

  return {
    items: rows.map(toSummary),
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

// two passes. the text index answers first: name and description, title weighted
// above body, whole words after stemming. that last part is also its limit, "hood"
// isn't a word in "Hoodie", so a partial word would find nothing. when the index
// comes back empty the term is matched again as a literal substring of the name,
// escaped so it's only ever text.
// TODO: the substring pass can't use an index. fine at this catalog size, will
// need revisiting.
async function searchProducts(
  filter: FilterQuery<Product>,
  term: string,
  page: number,
  limit: number,
): Promise<ProductPage> {
  const byRelevance = await findPage({ ...filter, $text: { $search: term } }, page, limit);
  if (byRelevance.total > 0) return byRelevance;

  return findPage({ ...filter, name: new RegExp(escapeRegExp(term), 'i') }, page, limit);
}

export async function listProducts(query: ListProductsQuery): Promise<ProductPage> {
  const { page, limit, search } = query;
  const filter = await buildCatalogFilter(query);

  if (search) return searchProducts(filter, search, page, limit);
  return findPage(filter, page, limit);
}

const VARIANTS = {
  path: 'variants',
  select: 'sku stock color size',
  populate: [
    { path: 'color', select: 'name slug' },
    { path: 'size', select: 'name slug' },
  ],
};

export function toVariantOption(row: VariantRow): VariantOption {
  return {
    id: row._id.toString(),
    sku: row.sku,
    stock: row.stock,
    // a size chip is either selectable or greyed out, and that shouldn't depend on
    // every client re-deriving it from a number the same way
    inStock: row.stock > 0,
    color: toTaxonomyRef(row.color),
    size: toTaxonomyRef(row.size),
  };
}

// variants come back with the product instead of from a second endpoint. a product
// page can't render a size picker without them.
export async function getProduct(id: string): Promise<ProductDetail> {
  const row = await Product.findOne({ _id: id, ...visible })
    .select(SUMMARY_FIELDS)
    .populate<PopulatedReferences>(REFERENCES)
    .populate<{ variants: VariantRow[] }>(VARIANTS)
    .lean();

  if (!row) throw notFound('Product not found');

  const variants = row.variants
    .sort(
      (a, b) =>
        a.color.name.localeCompare(b.color.name) || compareSizeSlugs(a.size.slug, b.size.slug),
    )
    .map(toVariantOption);

  return { ...toSummary(row), variants };
}
