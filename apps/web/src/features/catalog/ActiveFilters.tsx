import { Icon } from '../../components/Icon';
import { formatCents } from '../../lib/money';
import { useTaxonomy } from './queries';
import type { ActiveFilter, Filters } from './useFilters';
import type { TaxonomyMap } from '../../api/types';
import styles from './ActiveFilters.module.css';

const TAXONOMY_OF: Record<string, keyof TaxonomyMap> = {
  brand: 'brands',
  category: 'categories',
  sex: 'sexes',
  color: 'colors',
  size: 'sizes',
};

interface Props {
  filters: Filters;
}

export function ActiveFilters({ filters }: Props) {
  const { data } = useTaxonomy();

  if (filters.active.length === 0) return null;

  // a chip says what was picked, so it shows the name the user clicked, not the
  // slug the url carries
  const label = (filter: ActiveFilter): string => {
    if (filter.key === 'search') return `“${filter.value}”`;
    if (filter.key === 'price') {
      const { min, max } = filters.price;
      if (min !== undefined && max !== undefined)
        return `${formatCents(min)} – ${formatCents(max)}`;
      if (min !== undefined) return `From ${formatCents(min)}`;
      return `Up to ${formatCents(max ?? 0)}`;
    }

    const kind = TAXONOMY_OF[filter.key];
    const match = kind ? data?.[kind].find((item) => item.slug === filter.value) : undefined;
    return match?.name ?? filter.value;
  };

  return (
    <div className={styles.wrapper}>
      {filters.active.map((filter) => (
        <button
          key={`${filter.key}-${filter.value}`}
          type="button"
          className={styles.chip}
          onClick={() => filters.remove(filter)}
        >
          {label(filter)}
          <Icon name="close" size={12} title={`Remove ${label(filter)} filter`} />
        </button>
      ))}
      <button type="button" className={styles.reset} onClick={filters.clearAll}>
        Reset
      </button>
    </div>
  );
}
