import { useEffect, useState } from 'react';
import { formatCents } from '../../lib/money';
import { FilterSection } from './FilterSection';
import styles from './PriceFilter.module.css';

// A ceiling, not a default upper bound. Anything sitting at the top of the range
// sends no priceMax at all, so the most expensive things in the catalog stay in an
// unfiltered listing instead of being quietly cut off by the widget's own maximum.
const CEILING_CENTS = 250_000;
const STEP_CENTS = 1_000;

interface Props {
  min: number | undefined;
  max: number | undefined;
  onCommit: (min: number | undefined, max: number | undefined) => void;
}

export function PriceFilter({ min, max, onCommit }: Props) {
  const [low, setLow] = useState(min ?? 0);
  const [high, setHigh] = useState(max ?? CEILING_CENTS);

  // the url can change from outside the slider: a chip removed, a reset, the back
  // button. the handles follow it.
  useEffect(() => {
    setLow(min ?? 0);
    setHigh(max ?? CEILING_CENTS);
  }, [min, max]);

  // dragging fires continuously. committing on every frame would refetch the grid
  // dozens of times per drag, so the url waits for the pointer to come up.
  const commit = (nextLow: number, nextHigh: number) => {
    onCommit(nextLow > 0 ? nextLow : undefined, nextHigh < CEILING_CENTS ? nextHigh : undefined);
  };

  const percent = (value: number) => `${String((value / CEILING_CENTS) * 100)}%`;

  return (
    <FilterSection title="Price">
      <div
        className={styles.slider}
        style={{ ['--from' as string]: percent(low), ['--to' as string]: percent(high) }}
      >
        <div className={styles.track} />
        <div className={styles.fill} />
        <input
          className={styles.range}
          type="range"
          min={0}
          max={CEILING_CENTS}
          step={STEP_CENTS}
          value={low}
          aria-label="Minimum price"
          onChange={(event) => setLow(Math.min(Number(event.target.value), high))}
          onPointerUp={() => commit(low, high)}
          onKeyUp={() => commit(low, high)}
        />
        <input
          className={styles.range}
          type="range"
          min={0}
          max={CEILING_CENTS}
          step={STEP_CENTS}
          value={high}
          aria-label="Maximum price"
          onChange={(event) => setHigh(Math.max(Number(event.target.value), low))}
          onPointerUp={() => commit(low, high)}
          onKeyUp={() => commit(low, high)}
        />
      </div>
      <p className={styles.values}>
        <span>{formatCents(low)}</span>
        <span>{high >= CEILING_CENTS ? `${formatCents(CEILING_CENTS)}+` : formatCents(high)}</span>
      </p>
    </FilterSection>
  );
}
