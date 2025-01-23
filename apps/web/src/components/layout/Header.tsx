import { useEffect, useId, useState, type FormEvent } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Icon } from '../Icon';
import { cx } from '../../lib/cx';
import { useAuth } from '../../features/auth/useAuth';
import { ROUTES } from '../../routes/paths';
import styles from './Header.module.css';

// men and women are taxonomy slugs the catalog filters on, so these links land on
// a filtered catalog instead of a page of their own
const NAV_LINKS = [
  { label: 'Catalog', sex: null },
  { label: 'Men', sex: 'men' },
  { label: 'Women', sex: 'women' },
];

const navClass = ({ isActive }: { isActive: boolean }): string =>
  cx(styles.navLink, isActive && styles.navLinkActive);

export function Header() {
  const { status, isAdmin, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [term, setTerm] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const panelId = useId();
  const onCatalog = location.pathname === ROUTES.catalog;
  const sex = new URLSearchParams(location.search).get('sex');

  // a tap on a link inside the panel navigates, and the panel has to get out of
  // the way by itself
  useEffect(() => setMenuOpen(false), [location.pathname, location.search]);

  const search = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = term.trim();
    navigate(trimmed ? `${ROUTES.catalog}?search=${encodeURIComponent(trimmed)}` : ROUTES.catalog);
  };

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link to={ROUTES.home} className={styles.logo}>
          <img src="/image/logo.svg" alt="Euphoria" width={93} height={45} />
        </Link>

        <div className={cx(styles.panel, menuOpen && styles.panelOpen)} id={panelId}>
          <nav className={styles.nav} aria-label="Main">
            {NAV_LINKS.map((link) => {
              // NavLink only compares pathnames, and all three of these share one,
              // so the sex filter has to be matched by hand
              const isActive = onCatalog && sex === link.sex;
              return (
                <Link
                  key={link.label}
                  to={link.sex ? `${ROUTES.catalog}?sex=${link.sex}` : ROUTES.catalog}
                  className={navClass({ isActive })}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {link.label}
                </Link>
              );
            })}
            {isAdmin && (
              <NavLink to={ROUTES.adminProducts} className={navClass}>
                Admin
              </NavLink>
            )}
          </nav>

          <form className={styles.search} role="search" onSubmit={search}>
            <Icon name="search" size={16} className={styles.searchIcon} />
            <label className="visually-hidden" htmlFor="header-search">
              Search products
            </label>
            <input
              id="header-search"
              className={styles.searchInput}
              type="search"
              placeholder="Search"
              value={term}
              onChange={(event) => setTerm(event.target.value)}
            />
          </form>
        </div>

        <div className={styles.actions}>
          {status === 'authenticated' ? (
            <>
              <Link to={ROUTES.account} className={styles.iconButton} aria-label="Your account">
                <Icon name="user" />
              </Link>
              <button
                type="button"
                className={styles.iconButton}
                onClick={() => void logout()}
                aria-label="Sign out"
              >
                <Icon name="signOut" />
              </button>
            </>
          ) : (
            <Link to={ROUTES.login} className={styles.signIn}>
              Sign in
            </Link>
          )}

          <Link to={ROUTES.cart} className={styles.iconButton} aria-label="Your cart">
            <Icon name="cart" />
          </Link>

          <button
            type="button"
            className={styles.burger}
            aria-expanded={menuOpen}
            aria-controls={panelId}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className={styles.burgerBars} />
          </button>
        </div>
      </div>
    </header>
  );
}
