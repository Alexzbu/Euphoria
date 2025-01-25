import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { AuthCallback } from '../pages/AuthCallback';
import { Cart } from '../pages/Cart';
import { Catalog } from '../pages/Catalog';
import { Checkout } from '../pages/Checkout';
import { Home } from '../pages/Home';
import { Login } from '../pages/Login';
import { NotFound } from '../pages/NotFound';
import { Product } from '../pages/Product';
import { Register } from '../pages/Register';
import { Placeholder } from '../pages/Placeholder';
import { ProtectedRoute } from './ProtectedRoute';
import { ROUTES } from './paths';

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path={ROUTES.home} element={<Home />} />
        <Route path={ROUTES.catalog} element={<Catalog />} />
        <Route path={ROUTES.product} element={<Product />} />
        <Route path={ROUTES.cart} element={<Cart />} />
        <Route path={ROUTES.login} element={<Login />} />
        <Route path={ROUTES.register} element={<Register />} />
        <Route path={ROUTES.authCallback} element={<AuthCallback />} />

        {/* signed in: the cart belongs to an account, so checkout and orders need one */}
        <Route element={<ProtectedRoute />}>
          <Route path={ROUTES.checkout} element={<Checkout />} />
          <Route path={ROUTES.account} element={<Placeholder title="Your account" />} />
        </Route>

        <Route element={<ProtectedRoute require="admin" />}>
          <Route path={ROUTES.admin} element={<Navigate to={ROUTES.adminProducts} replace />} />
          <Route path={ROUTES.adminProducts} element={<Placeholder title="Products" />} />
          <Route path={ROUTES.adminTaxonomy} element={<Placeholder title="Taxonomy" />} />
        </Route>

        {/* last, and it matches everything left. a url with no page still gets one. */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
