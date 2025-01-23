import { Link } from 'react-router-dom';
import { formatCents } from '../../lib/money';
import { productPath } from '../../routes/paths';
import type { ProductSummary } from '../../api/types';
import styles from './ProductCard.module.css';

interface Props {
  product: ProductSummary;
  // the first card on a page is usually the LCP element
  eager?: boolean;
}

export function ProductCard({ product, eager = false }: Props) {
  const [image] = product.images;

  return (
    <article className={styles.card}>
      <Link to={productPath(product.id)} className={styles.pictureLink} tabIndex={-1} aria-hidden>
        {image ? (
          <img
            className={styles.image}
            src={image}
            alt=""
            loading={eager ? 'eager' : 'lazy'}
            decoding="async"
          />
        ) : (
          <div className={styles.placeholder}>No photo yet</div>
        )}
      </Link>
      <div>
        <h3 className={styles.title}>
          <Link to={productPath(product.id)}>{product.name}</Link>
        </h3>
        <p className={styles.meta}>
          {product.brand.name} · {product.category.name}
        </p>
      </div>
      <p className={styles.price}>{formatCents(product.priceCents)}</p>
    </article>
  );
}
