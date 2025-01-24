import { cx } from '../../lib/cx';
import { FilterSection } from './FilterSection';
import type { FilterKey } from './catalogQuery';
import type { TaxonomyRef } from '../../api/types';
import styles from './FilterGroup.module.css';

type Variant = 'list' | 'chip' | 'swatch';

interface Props {
  title: string;
  filterKey: FilterKey;
  items: TaxonomyRef[];
  selected: string[];
  onToggle: (key: FilterKey, slug: string) => void;
  variant?: Variant;
}

// One component for every taxonomy filter. Category, brand, colour and size differ
// in the label and how an option is drawn, so those are props.
export function FilterGroup({
  title,
  filterKey,
  items,
  selected,
  onToggle,
  variant = 'list',
}: Props) {
  if (items.length === 0) return null;

  const containerClass =
    variant === 'swatch' ? styles.swatches : variant === 'chip' ? styles.chips : styles.list;

  return (
    <FilterSection title={title}>
      <div className={containerClass}>
        {items.map((item) => {
          const checked = selected.includes(item.slug);

          const optionClass =
            variant === 'swatch'
              ? cx(styles.swatch, checked && styles.swatchChecked)
              : variant === 'chip'
                ? cx(styles.chip, checked && styles.chipChecked)
                : cx(styles.option, checked && styles.optionChecked);

          return (
            <label
              key={item.id}
              className={optionClass}
              title={variant === 'swatch' ? item.name : undefined}
              style={variant === 'swatch' ? { ['--swatch-color' as string]: item.slug } : undefined}
            >
              <input
                type="checkbox"
                className={variant === 'list' ? styles.checkbox : styles.input}
                name={filterKey}
                value={item.slug}
                checked={checked}
                onChange={() => onToggle(filterKey, item.slug)}
              />
              {variant === 'swatch' ? (
                <span className="visually-hidden">{item.name}</span>
              ) : (
                item.name
              )}
            </label>
          );
        })}
      </div>
    </FilterSection>
  );
}
