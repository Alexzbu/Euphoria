import { Link } from 'react-router-dom';
import { ROUTES } from '../routes/paths';
import styles from './NotFound.module.css';

export function NotFound() {
  return (
    <section className={styles.wrapper}>
      <p className={styles.code}>404</p>
      <h1 className={styles.title}>We can&apos;t find that page</h1>
      <p className={styles.message}>
        The link may be out of date, or the page may have moved. The catalog is a good place to pick
        things back up.
      </p>
      <Link className={styles.link} to={ROUTES.catalog}>
        Browse the catalog
      </Link>
    </section>
  );
}
