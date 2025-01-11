import type { FilterQuery, Types } from 'mongoose';
import { Product } from '../models/Product.js';
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

export async function listProducts({ page, limit }: ListProductsQuery): Promise<ProductPage> {
  const [rows, total] = await Promise.all([
    Product.find(visible)
      .select(SUMMARY_FIELDS)
      .populate<PopulatedReferences>(REFERENCES)
      // _id breaks ties. sorting on createdAt alone leaves documents sharing a
      // timestamp in an order mongo may pick differently per query, which is how a
      // paginated listing shows the same product twice and skips another.
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Product.countDocuments(visible),
  ]);

  return {
    items: rows.map(toSummary),
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}
