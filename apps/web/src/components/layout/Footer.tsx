import { Link } from 'react-router-dom';
import { Icon } from '../Icon';
import { ROUTES } from '../../routes/paths';
import styles from './Footer.module.css';

const SHOP_LINKS = [
  { label: 'All products', to: ROUTES.catalog },
  { label: 'Men', to: `${ROUTES.catalog}?sex=men` },
  { label: 'Women', to: `${ROUTES.catalog}?sex=women` },
  { label: 'Unisex', to: `${ROUTES.catalog}?sex=unisex` },
];

const CATEGORY_LINKS = [
  { label: 'T-Shirts', to: `${ROUTES.catalog}?category=t-shirts` },
  { label: 'Hoodies', to: `${ROUTES.catalog}?category=hoodies` },
  { label: 'Jeans', to: `${ROUTES.catalog}?category=jeans` },
  { label: 'Jackets', to: `${ROUTES.catalog}?category=jackets` },
];

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.about}>
          <Link to={ROUTES.home} className={styles.logo}>
            <img src="/image/logo.svg" alt="Euphoria" width={93} height={45} />
          </Link>
          <p>Everyday clothing, made to be worn every day. Free shipping over $100.</p>
        </div>

        <div>
          <h2 className={styles.title}>Shop</h2>
          <ul className={styles.list}>
            {SHOP_LINKS.map((link) => (
              <li key={link.label}>
                <Link className={styles.link} to={link.to}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className={styles.title}>Categories</h2>
          <ul className={styles.list}>
            {CATEGORY_LINKS.map((link) => (
              <li key={link.label}>
                <Link className={styles.link} to={link.to}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className={styles.title}>Get in touch</h2>
          <ul className={styles.list}>
            <li>
              <a className={styles.link} href="mailto:alexzbu@gmail.com">
                alexzbu@gmail.com
              </a>
            </li>
          </ul>
          <div className={styles.social}>
            <a
              className={styles.socialLink}
              href="https://linkedin.com/in/oleksandr-zbuker-developer"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Icon name="linkedin" title="LinkedIn" />
            </a>
          </div>
        </div>
      </div>

      <div className={styles.copy}>© 2025 Euphoria</div>
    </footer>
  );
}
