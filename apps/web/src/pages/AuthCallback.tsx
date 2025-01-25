import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { AUTH_QUERY_KEY } from '../features/auth/AuthContext';
import { consumeReturnPath } from '../features/auth/googleAuth';
import { useAuth } from '../features/auth/useAuth';
import { ROUTES } from '../routes/paths';
import styles from '../features/auth/AuthCard.module.css';

// Where Google's sign-in lands. The api has already set the refresh cookie and
// sent the browser here with nothing in the url: the access token deliberately
// isn't in the query string, since that ends up in history and in logs.
//
// So this page asks who we are. /auth/me answers 401 because there's no token in
// memory yet, the client spends the cookie, and the retry comes back with the
// account.
export function AuthCallback() {
  const queryClient = useQueryClient();
  const { status } = useAuth();
  const navigate = useNavigate();
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    void queryClient
      .invalidateQueries({ queryKey: AUTH_QUERY_KEY })
      .finally(() => setSettled(true));
  }, [queryClient]);

  useEffect(() => {
    if (status === 'authenticated') navigate(consumeReturnPath(ROUTES.home), { replace: true });
  }, [status, navigate]);

  if (settled && status === 'anonymous') {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <h1 className={styles.title}>That sign-in didn&apos;t finish</h1>
          <p className={styles.subtitle}>
            Google sent you back, but no session came with it. It usually works on a second try.
          </p>
          <p className={styles.switch}>
            <Link className={styles.link} to={ROUTES.login}>
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Signing you in</h1>
        <p className={styles.status} role="status">
          One moment…
        </p>
      </div>
    </div>
  );
}
