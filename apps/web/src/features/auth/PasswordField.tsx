import { useState } from 'react';
import { Icon } from '../../components/Icon';
import { cx } from '../../lib/cx';
import styles from './AuthCard.module.css';

interface Props {
  id: string;
  label: string;
  value: string;
  error?: string;
  autoComplete: 'current-password' | 'new-password';
  onChange: (value: string) => void;
}

export function PasswordField({ id, label, value, error, autoComplete, onChange }: Props) {
  const [revealed, setRevealed] = useState(false);

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>
      <div className={styles.inputWrap}>
        <input
          id={id}
          className={cx(styles.input, error && styles.inputInvalid)}
          type={revealed ? 'text' : 'password'}
          autoComplete={autoComplete}
          value={value}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          onChange={(event) => onChange(event.target.value)}
        />
        <button
          type="button"
          className={styles.reveal}
          onClick={() => setRevealed((current) => !current)}
          aria-label={revealed ? 'Hide password' : 'Show password'}
        >
          <Icon name={revealed ? 'eyeOff' : 'eye'} size={18} />
        </button>
      </div>
      {error && (
        <p className={styles.error} id={`${id}-error`}>
          {error}
        </p>
      )}
    </div>
  );
}
