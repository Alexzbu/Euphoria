import type { Express } from 'express';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { Role, type RoleName } from '../src/models/Role.js';
import { User, type UserDocument } from '../src/models/User.js';
import { Product, type ProductDocument } from '../src/models/Product.js';
import { Variant, type VariantDocument } from '../src/models/Variant.js';
import { Brand, Category, Color, Sex, Size } from '../src/models/taxonomy.js';

export const app: Express = createApp();
export const api = () => request(app);

export const PASSWORD = 'correct-horse-battery';

export async function seedRoles(): Promise<void> {
  await Role.create([{ name: 'ADMIN' }, { name: 'CUSTOMER' }]);
}

export async function createUser(
  email: string,
  role: RoleName = 'CUSTOMER',
  password: string = PASSWORD,
): Promise<UserDocument> {
  const roleDoc = await Role.findOne({ name: role }).orFail();
  // through create() rather than insertMany so the pre-save hook hashes the password
  return User.create({ email, password, role: roleDoc._id });
}

export interface Session {
  accessToken: string;
  userId: string;
  auth: { Authorization: string };
}

/** signs in over the real route, so a session here went through the same code a client does */
export async function signIn(email: string, password: string = PASSWORD): Promise<Session> {
  const res = await api().post('/api/auth/login').send({ email, password }).expect(200);
  const body = res.body as { accessToken: string; user: { id: string } };
  return {
    accessToken: body.accessToken,
    userId: body.user.id,
    auth: { Authorization: `Bearer ${body.accessToken}` },
  };
}

export async function registerAndSignIn(
  email: string,
  role: RoleName = 'CUSTOMER',
): Promise<Session> {
  await createUser(email, role);
  return signIn(email);
}

export interface Taxonomy {
  brand: string;
  category: string;
  sex: string;
  color: string;
  size: string;
}

export async function createTaxonomy(suffix = ''): Promise<Taxonomy> {
  const [brand, category, sex, color, size] = await Promise.all([
    Brand.create({ name: `Nike${suffix}` }),
    Category.create({ name: `Tops${suffix}` }),
    Sex.create({ name: `Unisex${suffix}` }),
    Color.create({ name: `Red${suffix}` }),
    Size.create({ name: `M${suffix}` }),
  ]);
  return {
    brand: brand._id.toString(),
    category: category._id.toString(),
    sex: sex._id.toString(),
    color: color._id.toString(),
    size: size._id.toString(),
  };
}

export async function createProduct(
  taxonomy: Taxonomy,
  overrides: Partial<{
    name: string;
    priceCents: number;
    isActive: boolean;
    description: string;
  }> = {},
): Promise<ProductDocument> {
  return Product.create({
    name: overrides.name ?? 'Classic Tee',
    priceCents: overrides.priceCents ?? 2999,
    isActive: overrides.isActive ?? true,
    description: overrides.description,
    brand: taxonomy.brand,
    category: taxonomy.category,
    sex: taxonomy.sex,
  });
}

let skuCounter = 0;

export async function createVariant(
  product: ProductDocument,
  taxonomy: Taxonomy,
  stock = 10,
): Promise<VariantDocument> {
  skuCounter += 1;
  return Variant.create({
    product: product._id,
    color: taxonomy.color,
    size: taxonomy.size,
    sku: `SKU-${String(skuCounter).padStart(4, '0')}`,
    stock,
  });
}
