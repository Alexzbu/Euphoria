import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { NotFound } from '../pages/NotFound';
import { Placeholder } from '../pages/Placeholder';
import { ProtectedRoute } from './ProtectedRoute';
import { ROUTES } from './paths';

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path={ROUTES.home} element={<Placeholder title="Home" />} />
        <Route path={ROUTES.catalog} element={<Placeholder title="Catalog" />} />
        <Route path={ROUTES.product} element={<Placeholder title="Product" />} />
        <Route path={ROUTES.cart} element={<Placeholder title="Cart" />} />
        <Route path={ROUTES.login} element={<Placeholder title="Sign in" />} />
        <Route path={ROUTES.register} element={<Placeholder title="Create an account" />} />
        <Route path={ROUTES.authCallback} element={<Placeholder title="Signing you in" />} />

        {/* signed in: the cart belongs to an account, so checkout and orders need one */}
        <Route element={<ProtectedRoute />}>
          <Route path={ROUTES.checkout} element={<Placeholder title="Checkout" />} />
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
