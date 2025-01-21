import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../features/auth/useAuth';
import { ROUTES } from './paths';

interface Props {
  // 'admin' is a stronger requirement than 'auth', not a different one
  require?: 'auth' | 'admin';
}

// Wraps route groups as a layout route, so the routes it protects sit inside it in
// the route table and can't quietly end up outside it.
//
// The guard is a convenience, not the boundary. Every admin endpoint checks the
// role itself, because anyone can type the url or call the api directly.
export function ProtectedRoute({ require = 'auth' }: Props) {
  const { status, isAdmin } = useAuth();
  const location = useLocation();

  // the session check is one request away from finishing. redirecting now would
  // bounce a signed-in user to the login page on every hard refresh.
  if (status === 'loading') {
    return <p role="status">Checking your session…</p>;
  }

  if (status === 'anonymous') {
    // where they were headed, so signing in can finish the journey
    return <Navigate to={ROUTES.login} state={{ from: location }} replace />;
  }

  if (require === 'admin' && !isAdmin) {
    return <Navigate to={ROUTES.home} replace />;
  }

  return <Outlet />;
}
