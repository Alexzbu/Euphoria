import { beforeEach, describe, expect, it } from 'vitest';
import type { ProductSummary } from '../src/services/productService.js';
import {
  api,
  createProduct,
  createTaxonomy,
  createVariant,
  registerAndSignIn,
  seedRoles,
  type Session,
  type Taxonomy,
} from './fixtures.js';

let taxonomy: Taxonomy;

const names = (body: { items: ProductSummary[] }): string[] => body.items.map((p) => p.name);

beforeEach(async () => {
  await seedRoles();
  taxonomy = await createTaxonomy();
});

describe('GET /api/products', () => {
  it('returns active products with a page envelope', async () => {
    await createProduct(taxonomy, { name: 'Tee' });
    const res = await api().get('/api/products').expect(200);

    expect(res.body).toMatchObject({ page: 1, total: 1, totalPages: 1 });
    expect(names(res.body)).toEqual(['Tee']);
  });

  it('leaves deactivated products out', async () => {
    await createProduct(taxonomy, { name: 'Live' });
    await createProduct(taxonomy, { name: 'Retired', isActive: false });

    const res = await api().get('/api/products').expect(200);
    expect(names(res.body)).toEqual(['Live']);
  });

  it('resolves brand, category and sex rather than returning raw ids', async () => {
    await createProduct(taxonomy);
    const res = await api().get('/api/products').expect(200);

    expect(res.body.items[0].brand).toMatchObject({ name: 'Nike', slug: 'nike' });
    expect(res.body.items[0].category.slug).toBe('tops');
  });
});

// the one this suite exists for. a listing with no price filter must not quietly
// apply a ceiling, or everything above it vanishes with no error and no empty state.
describe('the expensive-product canary', () => {
  beforeEach(async () => {
    await createProduct(taxonomy, { name: 'Everyday Tee', priceCents: 2999 });
    await createProduct(taxonomy, { name: 'Designer Coat', priceCents: 200_000 });
  });

  it('an unfiltered listing includes a product priced over $1000', async () => {
    const res = await api().get('/api/products').expect(200);

    expect(names(res.body)).toContain('Designer Coat');
    expect(res.body.total).toBe(2);
  });

  it('and it is still there when only a floor is given', async () => {
    const res = await api().get('/api/products?priceMin=0').expect(200);
    expect(names(res.body)).toContain('Designer Coat');
  });

  it('an explicit ceiling is the only thing that removes it', async () => {
    const res = await api().get('/api/products?priceMax=100000').expect(200);
    expect(names(res.body)).toEqual(['Everyday Tee']);
  });
});

describe('price filters', () => {
  beforeEach(async () => {
    await createProduct(taxonomy, { name: 'Cheap', priceCents: 1000 });
    await createProduct(taxonomy, { name: 'Mid', priceCents: 5000 });
    await createProduct(taxonomy, { name: 'Dear', priceCents: 20_000 });
  });

  it('filters on a floor', async () => {
    const res = await api().get('/api/products?priceMin=5000').expect(200);
    expect(names(res.body).sort()).toEqual(['Dear', 'Mid']);
  });

  it('filters on a range, inclusive at both ends', async () => {
    const res = await api().get('/api/products?priceMin=1000&priceMax=5000').expect(200);
    expect(names(res.body).sort()).toEqual(['Cheap', 'Mid']);
  });

  it('rejects a range that cannot contain anything', async () => {
    const res = await api().get('/api/products?priceMin=9000&priceMax=1000').expect(400);
    expect(res.body.error.code).toBe('BAD_REQUEST');
  });
});

describe('taxonomy filters', () => {
  it('filters by brand slug', async () => {
    const other = await createTaxonomy('-alt');
    await createProduct(taxonomy, { name: 'Nike Tee' });
    await createProduct(other, { name: 'Other Tee' });

    const res = await api().get('/api/products?brand=nike').expect(200);
    expect(names(res.body)).toEqual(['Nike Tee']);
  });

  it('accepts several slugs comma-separated', async () => {
    const other = await createTaxonomy('-alt');
    await createProduct(taxonomy, { name: 'Nike Tee' });
    await createProduct(other, { name: 'Other Tee' });

    const res = await api().get('/api/products?brand=nike,nike-alt').expect(200);
    expect(names(res.body).sort()).toEqual(['Nike Tee', 'Other Tee']);
  });

  // a brand nobody has must match nothing. matching everything would be the same
  // response as no filter at all, which is the opposite of what was asked.
  it('an unknown slug returns nothing, not everything', async () => {
    await createProduct(taxonomy, { name: 'Tee' });
    const res = await api().get('/api/products?brand=does-not-exist').expect(200);

    expect(res.body.items).toEqual([]);
    expect(res.body.total).toBe(0);
  });

  it('filters by colour and size through the variants', async () => {
    const other = await createTaxonomy('-alt');
    const wanted = await createProduct(taxonomy, { name: 'Red M Tee' });
    const unwanted = await createProduct(taxonomy, { name: 'Alt Tee' });
    await createVariant(wanted, taxonomy);
    await createVariant(unwanted, other);

    const res = await api().get('/api/products?color=red&size=m').expect(200);
    expect(names(res.body)).toEqual(['Red M Tee']);
  });
});

describe('pagination', () => {
  beforeEach(async () => {
    for (let i = 1; i <= 5; i += 1) {
      await createProduct(taxonomy, { name: `Product ${String(i)}` });
    }
  });

  it('honours page and limit as numbers, not strings', async () => {
    const res = await api().get('/api/products?page=2&limit=2').expect(200);

    expect(res.body).toMatchObject({ page: 2, limit: 2, total: 5, totalPages: 3 });
    expect(res.body.items).toHaveLength(2);
  });

  it('pages do not repeat or drop a product', async () => {
    const seen: string[] = [];
    for (const page of [1, 2, 3]) {
      const res = await api()
        .get(`/api/products?page=${String(page)}&limit=2`)
        .expect(200);
      seen.push(...names(res.body));
    }
    expect(new Set(seen).size).toBe(5);
  });

  it('a page past the end is empty rather than an error', async () => {
    const res = await api().get('/api/products?page=99&limit=2').expect(200);
    expect(res.body.items).toEqual([]);
  });

  it('refuses a limit above the cap', async () => {
    await api().get('/api/products?limit=100000').expect(400);
  });

  it('refuses an unknown query key instead of ignoring it', async () => {
    await api().get('/api/products?brnad=nike').expect(400);
  });
});

describe('search', () => {
  beforeEach(async () => {
    await createProduct(taxonomy, { name: 'Hoodie', description: 'warm and fleecy' });
    await createProduct(taxonomy, { name: 'Running Shorts', description: 'light' });
  });

  it('matches on the name', async () => {
    const res = await api().get('/api/products?search=Hoodie').expect(200);
    expect(names(res.body)).toEqual(['Hoodie']);
  });

  it('matches a partial word, which the text index alone would miss', async () => {
    const res = await api().get('/api/products?search=hood').expect(200);
    expect(names(res.body)).toEqual(['Hoodie']);
  });

  it('matches on the description', async () => {
    const res = await api().get('/api/products?search=fleecy').expect(200);
    expect(names(res.body)).toEqual(['Hoodie']);
  });

  // the term reaches the database as a pattern, so it has to arrive escaped
  it('treats regex metacharacters as literal text', async () => {
    const res = await api()
      .get('/api/products?search=' + encodeURIComponent('(a+)+$'))
      .expect(200);
    expect(res.body.items).toEqual([]);
  });

  it('refuses a search too short to be worth a scan', async () => {
    await api().get('/api/products?search=a').expect(400);
  });
});

describe('GET /api/products/:id', () => {
  it('returns one product with its variants', async () => {
    const product = await createProduct(taxonomy, { name: 'Tee' });
    await createVariant(product, taxonomy, 4);

    const res = await api().get(`/api/products/${product.id}`).expect(200);
    expect(res.body.product).toMatchObject({ name: 'Tee' });
    expect(res.body.product.variants).toHaveLength(1);
    expect(res.body.product.variants[0]).toMatchObject({ stock: 4, inStock: true });
  });

  it('reports a variant with no stock as out of stock rather than hiding it', async () => {
    const product = await createProduct(taxonomy);
    await createVariant(product, taxonomy, 0);

    const res = await api().get(`/api/products/${product.id}`).expect(200);
    expect(res.body.product.variants[0]).toMatchObject({ stock: 0, inStock: false });
  });

  it('404s for a deactivated product', async () => {
    const product = await createProduct(taxonomy, { isActive: false });
    await api().get(`/api/products/${product.id}`).expect(404);
  });

  it('400s for an id that is not an object id, rather than 500', async () => {
    const res = await api().get('/api/products/not-an-id').expect(400);
    expect(res.body.error.code).toBe('BAD_REQUEST');
  });

  it('404s for a well-formed id that names nothing', async () => {
    await api().get('/api/products/507f1f77bcf86cd799439011').expect(404);
  });
});

describe('GET /api/taxonomy', () => {
  it('returns every kind in one response', async () => {
    const res = await api().get('/api/taxonomy').expect(200);
    expect(Object.keys(res.body)).toEqual(
      expect.arrayContaining(['brands', 'colors', 'sizes', 'categories', 'sexes']),
    );
  });

  it('rejects an unknown kind in the path', async () => {
    await api().get('/api/taxonomy/wombats').expect(400);
  });
});

// the catalog's write side. an admin reads unfiltered, because they have to be able
// to find the product they just deactivated.
describe('admin catalog writes', () => {
  let admin: Session;

  beforeEach(async () => {
    admin = await registerAndSignIn('admin@example.com', 'ADMIN');
  });

  const newProduct = () => ({
    name: 'Admin Tee',
    priceCents: 3500,
    brand: taxonomy.brand,
    category: taxonomy.category,
    sex: taxonomy.sex,
  });

  describe('products', () => {
    it('creates a product, live by default', async () => {
      const res = await api()
        .post('/api/admin/products')
        .set(admin.auth)
        .send(newProduct())
        .expect(201);

      expect(res.body.product).toMatchObject({ name: 'Admin Tee', priceCents: 3500 });

      const listed = await api().get('/api/products').expect(200);
      expect(names(listed.body)).toContain('Admin Tee');
    });

    it('coerces the price out of a form field rather than storing a string', async () => {
      const res = await api()
        .post('/api/admin/products')
        .set(admin.auth)
        .field('name', 'Form Tee')
        .field('priceCents', '4200')
        .field('brand', taxonomy.brand)
        .field('category', taxonomy.category)
        .field('sex', taxonomy.sex)
        .expect(201);

      expect(res.body.product.priceCents).toBe(4200);
    });

    // a reference that points at nothing is a well-formed id, so only a check here
    // stops the catalog rendering a blank where the brand should be
    it('refuses a reference that names nothing', async () => {
      // the body is well formed, so this is 422 and not 400: the id is shaped like
      // an id, it just does not point at a brand
      const res = await api()
        .post('/api/admin/products')
        .set(admin.auth)
        .send({ ...newProduct(), brand: '507f1f77bcf86cd799439011' })
        .expect(422);
      expect(res.body.error.code).toBe('UNPROCESSABLE_ENTITY');
    });

    it('refuses an implausible price', async () => {
      await api()
        .post('/api/admin/products')
        .set(admin.auth)
        .send({ ...newProduct(), priceCents: 99_999_999 })
        .expect(400);
    });

    it('refuses an unknown field instead of ignoring it', async () => {
      await api()
        .post('/api/admin/products')
        .set(admin.auth)
        .send({ ...newProduct(), sneaky: true })
        .expect(400);
    });

    it('updates a product and moves the slug with the name', async () => {
      const product = await createProduct(taxonomy, { name: 'Old Name' });
      const res = await api()
        .patch(`/api/admin/products/${product.id}`)
        .set(admin.auth)
        .send({ name: 'New Name' })
        .expect(200);

      expect(res.body.product).toMatchObject({ name: 'New Name', slug: 'new-name' });
    });

    it('deactivates a product, taking it out of the shopper listing', async () => {
      const product = await createProduct(taxonomy, { name: 'Going Away' });
      await api()
        .patch(`/api/admin/products/${product.id}`)
        .set(admin.auth)
        .send({ isActive: 'false' })
        .expect(200);

      const listed = await api().get('/api/products').expect(200);
      expect(names(listed.body)).not.toContain('Going Away');
    });

    it('deletes a product that never sold', async () => {
      const product = await createProduct(taxonomy);
      await api().delete(`/api/admin/products/${product.id}`).set(admin.auth).expect(204);
      await api().get(`/api/products/${product.id}`).expect(404);
    });

    it('404s when deleting something that is not there', async () => {
      await api()
        .delete('/api/admin/products/507f1f77bcf86cd799439011')
        .set(admin.auth)
        .expect(404);
    });
  });

  describe('variants', () => {
    it('lists a product variants, including for a deactivated product', async () => {
      const product = await createProduct(taxonomy, { isActive: false });
      await createVariant(product, taxonomy);

      const res = await api()
        .get(`/api/admin/products/${product.id}/variants`)
        .set(admin.auth)
        .expect(200);
      expect(res.body.items).toHaveLength(1);
    });

    it('creates a variant and derives the sku when none is given', async () => {
      const product = await createProduct(taxonomy);
      const res = await api()
        .post(`/api/admin/products/${product.id}/variants`)
        .set(admin.auth)
        .send({ color: taxonomy.color, size: taxonomy.size, stock: 5 })
        .expect(201);

      expect(res.body.variant.sku).toBeTypeOf('string');
      expect(res.body.variant.stock).toBe(5);
    });

    // one colour/size per product, refused by a unique index rather than a check
    it('refuses the same colour and size twice on one product', async () => {
      const product = await createProduct(taxonomy);
      const body = { color: taxonomy.color, size: taxonomy.size, stock: 1 };

      await api()
        .post(`/api/admin/products/${product.id}/variants`)
        .set(admin.auth)
        .send(body)
        .expect(201);
      const res = await api()
        .post(`/api/admin/products/${product.id}/variants`)
        .set(admin.auth)
        .send(body)
        .expect(409);
      expect(res.body.error.code).toBe('CONFLICT');
    });

    it('sets stock rather than adjusting it', async () => {
      const product = await createProduct(taxonomy);
      const variant = await createVariant(product, taxonomy, 10);

      const res = await api()
        .patch(`/api/admin/variants/${variant.id}`)
        .set(admin.auth)
        .send({ stock: 3 })
        .expect(200);
      expect(res.body.variant.stock).toBe(3);
    });

    it('refuses an update that asks for nothing', async () => {
      const product = await createProduct(taxonomy);
      const variant = await createVariant(product, taxonomy);
      await api().patch(`/api/admin/variants/${variant.id}`).set(admin.auth).send({}).expect(400);
    });

    it('deletes a variant that was never bought', async () => {
      const product = await createProduct(taxonomy);
      const variant = await createVariant(product, taxonomy);
      await api().delete(`/api/admin/variants/${variant.id}`).set(admin.auth).expect(204);
    });
  });

  describe('taxonomy', () => {
    it('creates an entry and derives its slug', async () => {
      const res = await api()
        .post('/api/admin/taxonomy/brands')
        .set(admin.auth)
        .send({ name: "Levi's" })
        .expect(201);
      expect(res.body.item).toMatchObject({ name: "Levi's", slug: 'levis' });
    });

    it('refuses two entries that would slug the same', async () => {
      await api()
        .post('/api/admin/taxonomy/categories')
        .set(admin.auth)
        .send({ name: 'T-Shirts' })
        .expect(201);
      await api()
        .post('/api/admin/taxonomy/categories')
        .set(admin.auth)
        .send({ name: 't shirts' })
        .expect(409);
    });

    it('renames an entry and moves the slug with it', async () => {
      const created = await api()
        .post('/api/admin/taxonomy/brands')
        .set(admin.auth)
        .send({ name: 'Puma' })
        .expect(201);

      const res = await api()
        .patch(`/api/admin/taxonomy/brands/${created.body.item.id}`)
        .set(admin.auth)
        .send({ name: 'Puma Sport' })
        .expect(200);
      expect(res.body.item.slug).toBe('puma-sport');
    });

    // deleting anyway would leave products pointing at a brand that is gone
    it('refuses to delete an entry a product still uses', async () => {
      await createProduct(taxonomy);
      const res = await api()
        .delete(`/api/admin/taxonomy/brands/${taxonomy.brand}`)
        .set(admin.auth)
        .expect(409);
      expect(res.body.error.message).toMatch(/\d/);
    });

    it('deletes an entry nothing refers to', async () => {
      const created = await api()
        .post('/api/admin/taxonomy/brands')
        .set(admin.auth)
        .send({ name: 'Unused' })
        .expect(201);
      await api()
        .delete(`/api/admin/taxonomy/brands/${created.body.item.id}`)
        .set(admin.auth)
        .expect(204);
    });

    it('rejects an unknown kind in the path', async () => {
      await api()
        .post('/api/admin/taxonomy/wombats')
        .set(admin.auth)
        .send({ name: 'Nope' })
        .expect(400);
    });
  });
});

// mounted only when a key is configured, so an unconfigured deployment answers
// "no such endpoint" rather than failing inside a checkout
describe('routes that depend on optional configuration', () => {
  it('the stripe webhook is absent without a webhook secret', async () => {
    await api().post('/api/stripe/webhook').send({}).expect(404);
  });

  it('google sign-in is absent without oauth credentials', async () => {
    await api().get('/api/auth/google').expect(404);
  });
});
