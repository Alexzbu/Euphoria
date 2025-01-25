import { useState, type FormEvent } from 'react';
import { cx } from '../../lib/cx';
import type { ShippingAddress } from '../../api/types';
import styles from './AddressForm.module.css';

// same fields, and the same "required means non-empty after trimming", as the
// schema the api validates against. the server still checks; this is so a typo
// costs a glance instead of a round trip.
const FIELDS = [
  { name: 'fullName', label: 'Full name', autoComplete: 'name', required: true, wide: true },
  { name: 'line1', label: 'Address', autoComplete: 'address-line1', required: true, wide: true },
  {
    name: 'line2',
    label: 'Apartment, suite (optional)',
    autoComplete: 'address-line2',
    required: false,
    wide: true,
  },
  { name: 'city', label: 'City', autoComplete: 'address-level2', required: true, wide: false },
  {
    name: 'postalCode',
    label: 'Postal code',
    autoComplete: 'postal-code',
    required: true,
    wide: false,
  },
  { name: 'country', label: 'Country', autoComplete: 'country-name', required: true, wide: true },
] as const;

type FieldName = (typeof FIELDS)[number]['name'];

interface Props {
  onSubmit: (address: ShippingAddress) => void;
  submitting: boolean;
}

export function AddressForm({ onSubmit, submitting }: Props) {
  const [values, setValues] = useState<Record<FieldName, string>>({
    fullName: '',
    line1: '',
    line2: '',
    city: '',
    postalCode: '',
    country: '',
  });
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({});

  const submit = (event: FormEvent) => {
    event.preventDefault();

    const missing: Partial<Record<FieldName, string>> = {};
    for (const field of FIELDS) {
      if (field.required && values[field.name].trim().length === 0) {
        missing[field.name] = `${field.label} is required`;
      }
    }

    setErrors(missing);
    if (Object.keys(missing).length > 0) return;

    const line2 = values.line2.trim();
    onSubmit({
      fullName: values.fullName.trim(),
      line1: values.line1.trim(),
      ...(line2 ? { line2 } : {}),
      city: values.city.trim(),
      postalCode: values.postalCode.trim(),
      country: values.country.trim(),
    });
  };

  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      {FIELDS.map((field) => (
        <div key={field.name} className={cx(styles.field, field.wide && styles.wide)}>
          <label className={styles.label} htmlFor={field.name}>
            {field.label}
          </label>
          <input
            id={field.name}
            name={field.name}
            className={cx(styles.input, errors[field.name] && styles.inputInvalid)}
            autoComplete={field.autoComplete}
            value={values[field.name]}
            aria-invalid={errors[field.name] ? true : undefined}
            aria-describedby={errors[field.name] ? `${field.name}-error` : undefined}
            onChange={(event) =>
              setValues((current) => ({ ...current, [field.name]: event.target.value }))
            }
          />
          {errors[field.name] && (
            <p className={styles.error} id={`${field.name}-error`}>
              {errors[field.name]}
            </p>
          )}
        </div>
      ))}

      <button type="submit" className={styles.submit} disabled={submitting}>
        {submitting ? 'Placing order…' : 'Continue to payment'}
      </button>
    </form>
  );
}
