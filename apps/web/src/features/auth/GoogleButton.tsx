import { startGoogleSignIn } from './googleAuth';
import styles from './AuthCard.module.css';

interface Props {
  destination: string;
  label: string;
}

export function GoogleButton({ destination, label }: Props) {
  return (
    <>
      <p className={styles.divider}>or</p>
      <button
        type="button"
        className={styles.google}
        onClick={() => startGoogleSignIn(destination)}
      >
        <img src="/image/google.svg" alt="" width={20} height={20} />
        {label}
      </button>
    </>
  );
}
