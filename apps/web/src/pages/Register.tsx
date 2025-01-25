import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import {
  fieldErrors,
  registerSchema,
  MIN_PASSWORD_LENGTH,
  type RegisterValues,
} from '../features/auth/schemas';
import { GoogleButton } from '../features/auth/GoogleButton';
import { GOOGLE_AUTH_ENABLED } from '../features/auth/googleAuth';
import { PasswordField } from '../features/auth/PasswordField';
import { redirectTarget } from '../features/auth/redirectTarget';
import { useAuth } from '../features/auth/useAuth';
import { cx } from '../lib/cx';
import { ROUTES } from '../routes/paths';
import styles from '../features/auth/AuthCard.module.css';

export function Register() {
  const { register, status } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const destination = redirectTarget(location.state, ROUTES.home);

  const [values, setValues] = useState({ email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState<Partial<Record<keyof RegisterValues, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (status === 'authenticated') return <Navigate to={destination} replace />;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);

    const parsed = registerSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(fieldErrors<RegisterValues>(parsed.error));
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      await register({ email: parsed.data.email, password: parsed.data.password });
      navigate(destination, { replace: true });
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Could not create your account');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Create an account</h1>
        <p className={styles.subtitle}>One account for orders, addresses and your cart.</p>

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
            label={`Password (at least ${String(MIN_PASSWORD_LENGTH)} characters)`}
            autoComplete="new-password"
            value={values.password}
            error={errors.password}
            onChange={(password) => setValues({ ...values, password })}
          />

          <PasswordField
            id="confirmPassword"
            label="Confirm password"
            autoComplete="new-password"
            value={values.confirmPassword}
            error={errors.confirmPassword}
            onChange={(confirmPassword) => setValues({ ...values, confirmPassword })}
          />

          <button type="submit" className={styles.submit} disabled={submitting}>
            {submitting ? 'Creating account…' : 'Sign up'}
          </button>
        </form>

        {GOOGLE_AUTH_ENABLED && (
          <GoogleButton destination={destination} label="Sign up with Google" />
        )}

        <p className={styles.switch}>
          Already have an account?{' '}
          <Link className={styles.link} to={ROUTES.login} state={location.state}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
