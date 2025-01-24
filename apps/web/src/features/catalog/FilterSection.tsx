import { useId, useState, type ReactNode } from 'react';
import { Icon } from '../../components/Icon';
import { cx } from '../../lib/cx';
import styles from './FilterSection.module.css';

interface Props {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}

// the collapsible shell every filter block sits in. one of these, not one per
// field: the blocks differ by what's inside them and nothing else.
export function FilterSection({ title, children, defaultOpen = true }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const bodyId = useId();

  return (
    <div className={styles.section}>
      <h3 className={styles.title}>
        <button
          type="button"
          className={styles.toggle}
          aria-expanded={open}
          aria-controls={bodyId}
          onClick={() => setOpen((value) => !value)}
        >
          {title}
          <Icon
            name="chevronDown"
            size={16}
            className={cx(styles.chevron, open && styles.chevronOpen)}
          />
        </button>
      </h3>
      {open && (
        <div className={styles.body} id={bodyId}>
          {children}
        </div>
      )}
    </div>
  );
}
