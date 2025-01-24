import { useState } from 'react';
import { Icon } from '../../components/Icon';
import { cx } from '../../lib/cx';
import { FilterGroup } from './FilterGroup';
import { PriceFilter } from './PriceFilter';
import { useTaxonomy } from './queries';
import type { Filters } from './useFilters';
import styles from './FilterPanel.module.css';

interface Props {
  filters: Filters;
}

export function FilterPanel({ filters }: Props) {
  const { data } = useTaxonomy();
  const [open, setOpen] = useState(false);

  return (
    <aside className={styles.panel} aria-label="Product filters">
      <button
        type="button"
        className={styles.toggle}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <Icon name="filter" size={16} />
        {open ? 'Hide filters' : 'Filter'}
      </button>

      <div className={cx(styles.body, open && styles.bodyOpen)}>
        <div className={styles.header}>
          <h2 className={styles.heading}>
            <Icon name="filter" size={16} />
            Filters
          </h2>
          {filters.active.length > 0 && (
            <button type="button" className={styles.reset} onClick={filters.clearAll}>
              Clear all
            </button>
          )}
        </div>

        <FilterGroup
          title="Category"
          filterKey="category"
          items={data?.categories ?? []}
          selected={filters.selected('category')}
          onToggle={filters.toggle}
        />
        <PriceFilter min={filters.price.min} max={filters.price.max} onCommit={filters.setPrice} />
        <FilterGroup
          title="Colour"
          filterKey="color"
          items={data?.colors ?? []}
          selected={filters.selected('color')}
          onToggle={filters.toggle}
          variant="swatch"
        />
        <FilterGroup
          title="Size"
          filterKey="size"
          items={data?.sizes ?? []}
          selected={filters.selected('size')}
          onToggle={filters.toggle}
          variant="chip"
        />
        <FilterGroup
          title="Brand"
          filterKey="brand"
          items={data?.brands ?? []}
          selected={filters.selected('brand')}
          onToggle={filters.toggle}
        />
        <FilterGroup
          title="Department"
          filterKey="sex"
          items={data?.sexes ?? []}
          selected={filters.selected('sex')}
          onToggle={filters.toggle}
        />
      </div>
    </aside>
  );
}
