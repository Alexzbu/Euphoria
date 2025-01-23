import { Link } from 'react-router-dom';
import { ProductCard } from '../features/catalog/ProductCard';
import { useProducts, useTaxonomy } from '../features/catalog/queries';
import { ROUTES } from '../routes/paths';
import styles from './Home.module.css';

const FEATURED_COUNT = 4;

// the listing already sorts newest first, so the first page of it is the arrivals
// shelf. nothing on this page is hardcoded.
function FeaturedProducts() {
  const { data, isPending, isError } = useProducts({ limit: FEATURED_COUNT });

  if (isPending) {
    return (
      <div className={styles.grid}>
        {Array.from({ length: FEATURED_COUNT }, (_, index) => (
          <div key={index} className={styles.skeleton} />
        ))}
      </div>
    );
  }

  if (isError) {
    return <p className={styles.message}>New arrivals are taking a moment. Try again shortly.</p>;
  }

  if (data.items.length === 0) {
    return <p className={styles.message}>Nothing in the catalog yet. Check back soon.</p>;
  }

  return (
    <div className={styles.grid}>
      {data.items.map((product, index) => (
        <ProductCard key={product.id} product={product} eager={index === 0} />
      ))}
    </div>
  );
}

function BrandStrip() {
  const { data } = useTaxonomy();
  const brands = data?.brands ?? [];

  if (brands.length === 0) return null;

  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Shop by brand</h2>
      </div>
      <div className={styles.brands}>
        {brands.map((brand) => (
          <Link
            key={brand.id}
            className={styles.brand}
            to={`${ROUTES.catalog}?brand=${brand.slug}`}
          >
            {brand.name}
          </Link>
        ))}
      </div>
    </section>
  );
}

export function Home() {
  return (
    <>
      <section className={styles.hero}>
        <img className={styles.heroImage} src="/image/hero/slide-1.jpg" alt="" />
        <div className={styles.heroInner}>
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>We made your everyday fashion better</h1>
            <p className={styles.heroText}>
              Comfortable, affordable pieces you will actually reach for. New arrivals every week.
            </p>
            <Link className={styles.button} to={ROUTES.catalog}>
              Shop now
            </Link>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>New arrivals</h2>
          <Link className={styles.sectionLink} to={ROUTES.catalog}>
            View all
          </Link>
        </div>
        <FeaturedProducts />
      </section>

      <BrandStrip />

      <section className={styles.section}>
        <div className={styles.promo}>
          <div>
            <h2 className={styles.sectionTitle}>Everyday wear, built to last</h2>
            <p className={styles.heroText}>
              Heavier cotton, better seams, and a fit that survives the wash. Free shipping on
              orders over $100.
            </p>
            <Link className={styles.button} to={`${ROUTES.catalog}?category=t-shirts`}>
              Explore the range
            </Link>
          </div>
          <img className={styles.promoImage} src="/image/shop-now/01.jpg" alt="" loading="lazy" />
        </div>
      </section>
    </>
  );
}
