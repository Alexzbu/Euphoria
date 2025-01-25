import { Outlet } from 'react-router-dom';
import { useGuestCartMerge } from '../../features/cart/useCart';
import { Footer } from './Footer';
import { Header } from './Header';
import styles from './Layout.module.css';

// the frame every page renders inside. it owns the only <main> on the page, so a
// page contributes sections, not another landmark.
export function Layout() {
  // mounted once, above every page: signing in can happen on any of them
  useGuestCartMerge();

  return (
    <>
      <a className={styles.skipLink} href="#main">
        Skip to content
      </a>
      <Header />
      <main id="main" className={styles.main}>
        <Outlet />
      </main>
      <Footer />
    </>
  );
}
