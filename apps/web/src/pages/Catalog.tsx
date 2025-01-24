import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ActiveFilters } from '../features/catalog/ActiveFilters';
import { FilterPanel } from '../features/catalog/FilterPanel';
import { Pagination } from '../features/catalog/Pagination';
import { ProductCard } from '../features/catalog/ProductCard';
import { useCatalogQuery, DEFAULT_PAGE_SIZE } from '../features/catalog/catalogQuery';
import { useFilters } from '../features/catalog/useFilters';
import { useProducts } from '../features/catalog/queries';
import { ROUTES } from '../routes/paths';
import styles from './Catalog.module.css';

export function Catalog() {
  const [params, setParams] = useSearchParams();
  const query = useCatalogQuery();
  const filters = useFilters();
  const { data, isPending, isError, error } = useProducts(query);

  const page = query.page ?? 1;

  // paging without this leaves the reader at the bottom of the previous page,
  // looking at the pagination of a grid that changed above them
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [page]);

  const goToPage = (next: number) => {
    const updated = new URLSearchParams(params);
    if (next <= 1) updated.delete('page');
    else updated.set('page', String(next));
    setParams(updated);
  };

  return (
    <div className={styles.page}>
      <div className={styles.layout}>
        <FilterPanel filters={filters} />
        <div>
          <div className={styles.header}>
            <h1 className={styles.title}>
              {query.search ? `Results for “${query.search}”` : 'Catalog'}
            </h1>
            {data && (
              <p className={styles.count}>
                {data.total === 0
                  ? 'No products'
                  : `${String(data.total)} ${data.total === 1 ? 'product' : 'products'}`}
              </p>
            )}
          </div>

          <ActiveFilters filters={filters} />

          {isPending && (
            <div className={styles.grid}>
              {Array.from({ length: DEFAULT_PAGE_SIZE }, (_, index) => (
                <div key={index} className={styles.skeleton} />
              ))}
            </div>
          )}

          {isError && (
            <div className={styles.empty}>
              <h2 className={styles.emptyTitle}>We couldn&apos;t load the catalog</h2>
              <p className={styles.emptyText}>{error.message}</p>
            </div>
          )}

          {data && data.items.length === 0 && (
            <div className={styles.empty}>
              <h2 className={styles.emptyTitle}>No matches found</h2>
              <p className={styles.emptyText}>
                Nothing here fits those filters.{' '}
                <Link className={styles.link} to={ROUTES.catalog}>
                  Clear them and start again
                </Link>
                .
              </p>
            </div>
          )}

          {data && data.items.length > 0 && (
            <>
              <div className={styles.grid}>
                {data.items.map((product, index) => (
                  <ProductCard key={product.id} product={product} eager={index < 3} />
                ))}
              </div>
              <Pagination page={data.page} totalPages={data.totalPages} onChange={goToPage} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
