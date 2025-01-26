import { useState } from 'react';
import { AdminNav } from '../features/admin/AdminNav';
import { ProductForm } from '../features/admin/ProductForm';
import { VariantEditor } from '../features/admin/VariantEditor';
import { useDeleteProduct } from '../features/admin/queries';
import { useProducts } from '../features/catalog/queries';
import { formatCents } from '../lib/money';
import type { ProductSummary } from '../api/types';
import styles from '../features/admin/Admin.module.css';
import layout from './AdminProducts.module.css';

type Editing = { product: ProductSummary | null } | null;

export function AdminProducts() {
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Editing>(null);
  const [confirming, setConfirming] = useState<string | null>(null);

  // the catalog listing, which is also what a shopper sees. searching it needs two
  // characters, so a blank box means "everything".
  const { data, isPending } = useProducts({
    limit: 24,
    ...(search.trim().length >= 2 ? { search: search.trim() } : {}),
  });
  const remove = useDeleteProduct();

  if (editing) {
    const { product } = editing;

    return (
      <div className={layout.page}>
        <AdminNav />
        <div className={styles.header}>
          <h1 className={styles.title}>{product ? product.name : 'New product'}</h1>
        </div>
        <ProductForm
          product={product}
          onSaved={() => setEditing(null)}
          onCancel={() => setEditing(null)}
        />
        {/* variants hang off a product that exists, so a new one gets them on the
            next pass through this screen */}
        {product && <VariantEditor productId={product.id} />}
      </div>
    );
  }

  return (
    <div className={layout.page}>
      <AdminNav />

      <div className={styles.header}>
        <h1 className={styles.title}>Products</h1>
        <div className={styles.header}>
          <label className="visually-hidden" htmlFor="admin-search">
            Search products
          </label>
          <input
            id="admin-search"
            className={layout.search}
            type="search"
            placeholder="Search products"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <button
            type="button"
            className={styles.primary}
            onClick={() => setEditing({ product: null })}
          >
            New product
          </button>
        </div>
      </div>

      {remove.isError && <p className={styles.formError}>{remove.error.message}</p>}

      {isPending && <p className={styles.hint}>Loading products…</p>}

      {data && data.items.length === 0 && (
        <p className={layout.empty}>No products match that search.</p>
      )}

      {data && data.items.length > 0 && (
        <table className={layout.table}>
          <thead>
            <tr>
              <th scope="col">
                <span className="visually-hidden">Image</span>
              </th>
              <th scope="col">Product</th>
              <th scope="col">Price</th>
              <th scope="col">
                <span className="visually-hidden">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((product) => (
              <tr key={product.id}>
                <td>
                  {product.images[0] ? (
                    <img className={layout.thumb} src={product.images[0]} alt="" />
                  ) : (
                    <div className={layout.thumb} />
                  )}
                </td>
                <td>
                  <p className={layout.name}>{product.name}</p>
                  <p className={layout.meta}>
                    {product.brand.name} · {product.category.name} · {product.sex.name}
                  </p>
                </td>
                <td>{formatCents(product.priceCents)}</td>
                <td>
                  {confirming === product.id ? (
                    <p className={layout.confirm}>
                      Delete {product.name}?
                      <button
                        type="button"
                        className={styles.danger}
                        disabled={remove.isPending}
                        onClick={() =>
                          remove.mutate(product.id, { onSettled: () => setConfirming(null) })
                        }
                      >
                        Yes, delete
                      </button>
                      <button
                        type="button"
                        className={styles.danger}
                        onClick={() => setConfirming(null)}
                      >
                        Keep
                      </button>
                    </p>
                  ) : (
                    <div className={layout.rowActions}>
                      <button
                        type="button"
                        className={styles.secondary}
                        onClick={() => setEditing({ product })}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className={styles.danger}
                        onClick={() => setConfirming(product.id)}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
