import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { fieldErrors, loginSchema, type LoginValues } from '../features/auth/schemas';
import { PasswordField } from '../features/auth/PasswordField';
import { redirectTarget } from '../features/auth/redirectTarget';
import { useAuth } from '../features/auth/useAuth';
import { cx } from '../lib/cx';
import { ROUTES } from '../routes/paths';
import styles from '../features/auth/AuthCard.module.css';

export function Login() {
  const { login, status } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const destination = redirectTarget(location.state, ROUTES.home);

  const [values, setValues] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState<Partial<Record<keyof LoginValues, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // already signed in, so there's nothing to do here
  if (status === 'authenticated') return <Navigate to={destination} replace />;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);

    const parsed = loginSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(fieldErrors<LoginValues>(parsed.error));
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      await login(parsed.data);
      navigate(destination, { replace: true });
    } catch (error) {
      // the api's own wording, which already avoids saying whether the account
      // exists, and carries the lockout message when one applies
      setFormError(error instanceof Error ? error.message : 'Could not sign you in');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Sign in</h1>
        <p className={styles.subtitle}>Your cart and orders are waiting.</p>

        <form className={styles.form} onSubmit={(event) => void submit(event)} noValidate>
          {formError && <p className={styles.formError}>{formError}</p>}

          <div className={styles.field}>
            <label className={styles.label} htmlFor="email">
              Email
            </label>
            <input
              id="email"
              className={cx(styles.input, errors.email && styles.inputInvalid)}
              type="email"
              autoComplete="email"
              value={values.email}
              aria-invalid={errors.email ? true : undefined}
              aria-describedby={errors.email ? 'email-error' : undefined}
              onChange={(event) => setValues({ ...values, email: event.target.value })}
            />
            {errors.email && (
              <p className={styles.error} id="email-error">
                {errors.email}
              </p>
            )}
          </div>

          <PasswordField
            id="password"
            label="Password"
            autoComplete="current-password"
            value={values.password}
            error={errors.password}
            onChange={(password) => setValues({ ...values, password })}
          />

          <button type="submit" className={styles.submit} disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className={styles.switch}>
          New here?{' '}
          <Link className={styles.link} to={ROUTES.register} state={location.state}>
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
