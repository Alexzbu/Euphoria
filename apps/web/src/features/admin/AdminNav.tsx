import { NavLink } from 'react-router-dom';
import { cx } from '../../lib/cx';
import { ROUTES } from '../../routes/paths';
import styles from './Admin.module.css';

const className = ({ isActive }: { isActive: boolean }): string =>
  cx(styles.navLink, isActive && styles.navLinkActive);

export function AdminNav() {
  return (
    <nav className={styles.nav} aria-label="Admin sections">
      <NavLink to={ROUTES.adminProducts} className={className}>
        Products
      </NavLink>
      <NavLink to={ROUTES.adminTaxonomy} className={className}>
        Taxonomy
      </NavLink>
    </nav>
  );
}
