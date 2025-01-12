import type { FilterQuery, Model, Types } from 'mongoose';
import { Product } from '../models/Product.js';
import { Variant } from '../models/Variant.js';
import { Brand, Category, Color, Sex, Size, type Taxonomy } from '../models/taxonomy.js';
import type { ListProductsQuery } from '../schemas/product.js';

interface TaxonomyLean {
  _id: Types.ObjectId;
  name: string;
  slug: string;
}

interface ProductRow {
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

export interface TaxonomyRef {
  id: string;
  name: string;
  slug: string;
}

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

export interface ProductPage {
  items: ProductSummary[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const SUMMARY_FIELDS = 'name slug description priceCents images brand category sex createdAt';

const REFERENCES = [
  { path: 'brand', select: 'name slug' },
  { path: 'category', select: 'name slug' },
  { path: 'sex', select: 'name slug' },
];

type PopulatedReferences = Pick<ProductRow, 'brand' | 'category' | 'sex'>;

const toRef = (doc: TaxonomyLean): TaxonomyRef => ({
  id: doc._id.toString(),
  name: doc.name,
  slug: doc.slug,
});

function toSummary(row: ProductRow): ProductSummary {
  return {
    id: row._id.toString(),
    name: row.name,
    slug: row.slug,
    description: row.description,
    priceCents: row.priceCents,
    images: row.images,
    brand: toRef(row.brand),
    category: toRef(row.category),
    sex: toRef(row.sex),
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

export async function listProducts(query: ListProductsQuery): Promise<ProductPage> {
  const { page, limit } = query;
  const filter = await buildCatalogFilter(query);

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
