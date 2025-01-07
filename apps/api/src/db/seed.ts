import mongoose, { type Model, type Types } from 'mongoose';
import { logger } from '../config/logger.js';
import { Product } from '../models/Product.js';
import { Role, ROLES } from '../models/Role.js';
import { User } from '../models/User.js';
import { Variant } from '../models/Variant.js';
import { slugify, taxonomyModels, type Taxonomy, type TaxonomyKind } from '../models/taxonomy.js';
import { connectDatabase, disconnectDatabase } from './connection.js';
import { BRANDS, CATEGORIES, COLORS, PRODUCTS, SEXES, SIZES } from './seedData.js';

type IdMap = Map<string, Types.ObjectId>;

async function upsertTaxonomy(kind: TaxonomyKind, names: readonly string[]): Promise<IdMap> {
  const model = taxonomyModels[kind] as Model<Taxonomy>;
  const ids: IdMap = new Map();

  for (const name of names) {
    const slug = slugify(name);
    const doc = await model.findOneAndUpdate(
      { slug },
      { $setOnInsert: { name, slug } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    ids.set(name, doc._id as Types.ObjectId);
  }

  return ids;
}

function requireId(map: IdMap, key: string, kind: string): Types.ObjectId {
  const id = map.get(key);
  if (!id) throw new Error(`Seed data references unknown ${kind} "${key}"`);
  return id;
}

// deterministic, so re-running matches the same variant instead of making a new one
function buildSku(productSlug: string, color: string, size: string): string {
  return `${productSlug.slice(0, 22)}-${slugify(color).slice(0, 6)}-${slugify(size)}`.toUpperCase();
}

async function seedRoles(): Promise<IdMap> {
  const ids: IdMap = new Map();
  for (const name of ROLES) {
    const role = await Role.findOneAndUpdate(
      { name },
      { $setOnInsert: { name } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    ids.set(name, role._id as Types.ObjectId);
  }
  return ids;
}

async function seedAdmin(adminRoleId: Types.ObjectId): Promise<void> {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;

  // refuse rather than invent a default. an admin whose password is a known
  // constant is worse than no admin at all.
  if (!email || !password) {
    logger.fatal(
      'SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must both be set: refusing to create an admin without a password',
    );
    process.exit(1);
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    logger.info({ email }, 'Admin already exists, leaving its password untouched');
    return;
  }

  // through save() so the pre-save hook hashes the password
  await User.create({ email, password, role: adminRoleId });
  logger.info({ email }, 'Created admin user');
}

async function seedCatalog(taxonomy: Record<TaxonomyKind, IdMap>): Promise<void> {
  for (const item of PRODUCTS) {
    const slug = slugify(item.name);
    const product = await Product.findOneAndUpdate(
      { slug },
      {
        $set: {
          name: item.name,
          description: item.description,
          priceCents: item.priceCents,
          brand: requireId(taxonomy.Brand, item.brand, 'brand'),
          category: requireId(taxonomy.Category, item.category, 'category'),
          sex: requireId(taxonomy.Sex, item.sex, 'sex'),
          images: item.images,
          isActive: true,
        },
        $setOnInsert: { slug },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    for (const variant of item.variants) {
      await Variant.findOneAndUpdate(
        { sku: buildSku(slug, variant.color, variant.size) },
        {
          $set: {
            product: product._id,
            color: requireId(taxonomy.Color, variant.color, 'color'),
            size: requireId(taxonomy.Size, variant.size, 'size'),
            stock: variant.stock,
          },
          $setOnInsert: { sku: buildSku(slug, variant.color, variant.size) },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
    }
  }
}

async function seed(): Promise<void> {
  await connectDatabase();

  // bring indexes in line with the schemas before writing, so uniqueness is actually
  // enforced during the seed and not after it
  await Promise.all([
    Product.syncIndexes(),
    Variant.syncIndexes(),
    User.syncIndexes(),
    Role.syncIndexes(),
    ...Object.values(taxonomyModels).map((m) => m.syncIndexes()),
  ]);

  const roles = await seedRoles();
  const taxonomy: Record<TaxonomyKind, IdMap> = {
    Brand: await upsertTaxonomy('Brand', BRANDS),
    Color: await upsertTaxonomy('Color', COLORS),
    Size: await upsertTaxonomy('Size', SIZES),
    Category: await upsertTaxonomy('Category', CATEGORIES),
    Sex: await upsertTaxonomy('Sex', SEXES),
  };

  await seedAdmin(requireId(roles, 'ADMIN', 'role'));
  await seedCatalog(taxonomy);

  const [products, variants] = await Promise.all([
    Product.countDocuments(),
    Variant.countDocuments(),
  ]);
  logger.info({ products, variants }, 'Seed complete');
}

try {
  await seed();
} catch (error) {
  logger.fatal({ err: error }, 'Seed failed');
  await mongoose.disconnect();
  process.exit(1);
}

await disconnectDatabase();
