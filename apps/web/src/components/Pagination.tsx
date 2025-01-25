import { Icon } from './Icon';
import { cx } from '../lib/cx';
import styles from './Pagination.module.css';

interface Props {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

// first, last, and the neighbours of the current page. a 40 page catalog shouldn't
// render 40 buttons.
function pagesAround(page: number, totalPages: number): (number | 'gap')[] {
  const pages = new Set([1, totalPages, page - 1, page, page + 1]);
  const visible = [...pages]
    .filter((value) => value >= 1 && value <= totalPages)
    .sort((a, b) => a - b);

  return visible.flatMap((value, index) => {
    const previous = visible[index - 1];
    return previous !== undefined && value - previous > 1 ? ['gap' as const, value] : [value];
  });
}

export function Pagination({ page, totalPages, onChange }: Props) {
  if (totalPages <= 1) return null;

  return (
    <nav className={styles.nav} aria-label="Pagination">
      <button
        type="button"
        className={styles.button}
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
      >
        <Icon name="chevronLeft" size={16} />
      </button>

      {pagesAround(page, totalPages).map((value, index) =>
        value === 'gap' ? (
          <span key={`gap-${String(index)}`} className={styles.gap}>
            …
          </span>
        ) : (
          <button
            key={value}
            type="button"
            className={cx(styles.button, value === page && styles.current)}
            onClick={() => onChange(value)}
            aria-label={`Page ${String(value)}`}
            aria-current={value === page ? 'page' : undefined}
          >
            {value}
          </button>
        ),
      )}

      <button
        type="button"
        className={styles.button}
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="Next page"
      >
        <Icon name="chevronRight" size={16} />
      </button>
    </nav>
  );
}
