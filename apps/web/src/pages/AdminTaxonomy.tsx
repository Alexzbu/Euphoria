import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AdminNav } from '../features/admin/AdminNav';
import { useCreateTaxonomy, useDeleteTaxonomy, useRenameTaxonomy } from '../features/admin/queries';
import { useTaxonomy } from '../features/catalog/queries';
import { cx } from '../lib/cx';
import type { TaxonomyKind, TaxonomyRef } from '../api/types';
import styles from '../features/admin/Admin.module.css';
import layout from './AdminTaxonomy.module.css';

const KINDS: { kind: TaxonomyKind; label: string; singular: string }[] = [
  { kind: 'brands', label: 'Brands', singular: 'brand' },
  { kind: 'categories', label: 'Categories', singular: 'category' },
  { kind: 'colors', label: 'Colours', singular: 'colour' },
  { kind: 'sizes', label: 'Sizes', singular: 'size' },
  { kind: 'sexes', label: 'Departments', singular: 'department' },
];

const isKind = (value: string | null): value is TaxonomyKind =>
  KINDS.some((entry) => entry.kind === value);

// the tabs decide the order, this decides the words. one source for both.
const INFO = Object.fromEntries(KINDS.map((entry) => [entry.kind, entry])) as Record<
  TaxonomyKind,
  (typeof KINDS)[number]
>;

function Row({ item, kind }: { item: TaxonomyRef; kind: TaxonomyKind }) {
  const rename = useRenameTaxonomy(kind);
  const remove = useDeleteTaxonomy(kind);
  const [draft, setDraft] = useState<string | null>(null);

  const commit = () => {
    const name = draft?.trim() ?? '';
    if (name.length === 0 || name === item.name) {
      setDraft(null);
      return;
    }

    rename.mutate({ id: item.id, name }, { onSuccess: () => setDraft(null) });
  };

  return (
    <li className={layout.item}>
      {draft === null ? (
        <>
          <span className={layout.name}>{item.name}</span>
          <span className={layout.slug}>/{item.slug}</span>
          {/* real buttons wired to real requests: nothing here is an anchor that
              goes nowhere, and nothing reloads the page afterwards */}
          <button type="button" className={layout.link} onClick={() => setDraft(item.name)}>
            Rename
          </button>
          <button
            type="button"
            className={layout.remove}
            disabled={remove.isPending}
            onClick={() => remove.mutate(item.id)}
          >
            {remove.isPending ? 'Deleting…' : 'Delete'}
          </button>
        </>
      ) : (
        <>
          <label className="visually-hidden" htmlFor={`rename-${item.id}`}>
            New name for {item.name}
          </label>
          <input
            id={`rename-${item.id}`}
            className={layout.renameInput}
            value={draft}
            autoFocus
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') commit();
              if (event.key === 'Escape') setDraft(null);
            }}
          />
          <button
            type="button"
            className={layout.link}
            disabled={rename.isPending}
            onClick={commit}
          >
            {rename.isPending ? 'Saving…' : 'Save'}
          </button>
          <button type="button" className={layout.remove} onClick={() => setDraft(null)}>
            Cancel
          </button>
        </>
      )}

      {(rename.isError || remove.isError) && (
        // the api explains a refused delete by saying what still points at it
        <p className={styles.error}>{(rename.error ?? remove.error)?.message}</p>
      )}
    </li>
  );
}

export function AdminTaxonomy() {
  const [params, setParams] = useSearchParams();
  const parameter = params.get('kind');
  const kind: TaxonomyKind = isKind(parameter) ? parameter : 'brands';
  const active = INFO[kind];

  const { data, isPending } = useTaxonomy();
  const create = useCreateTaxonomy(kind);
  const [name, setName] = useState('');

  const items = data?.[kind] ?? [];

  const add = () => {
    const trimmed = name.trim();
    if (trimmed.length === 0) return;

    create.mutate(trimmed, { onSuccess: () => setName('') });
  };

  return (
    <div className={layout.page}>
      <AdminNav />

      <div className={styles.header}>
        <h1 className={styles.title}>Taxonomy</h1>
      </div>

      <div className={layout.tabs}>
        {KINDS.map((entry) => (
          <button
            key={entry.kind}
            type="button"
            className={cx(layout.tab, entry.kind === kind && layout.tabActive)}
            aria-current={entry.kind === kind ? 'true' : undefined}
            onClick={() => setParams({ kind: entry.kind })}
          >
            {entry.label}
          </button>
        ))}
      </div>

      <div className={layout.layout}>
        <div>
          {isPending && <p className={styles.hint}>Loading…</p>}

          {!isPending && items.length === 0 && (
            <p className={layout.empty}>No {active.label.toLowerCase()} yet.</p>
          )}

          {items.length > 0 && (
            <ul className={layout.list}>
              {items.map((item) => (
                <Row key={item.id} item={item} kind={kind} />
              ))}
            </ul>
          )}
        </div>

        <aside className={layout.aside}>
          <h2 className={layout.asideTitle}>Add a {active.singular}</h2>
          <div className={layout.stack}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="taxonomy-name">
                Name
              </label>
              <input
                id="taxonomy-name"
                className={styles.input}
                value={name}
                onChange={(event) => setName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') add();
                }}
              />
            </div>
            <button
              type="button"
              className={styles.primary}
              onClick={add}
              disabled={create.isPending}
            >
              {create.isPending ? 'Adding…' : `Add ${active.singular}`}
            </button>
            {create.isError && <p className={styles.error}>{create.error.message}</p>}
            <p className={styles.hint}>The url slug is derived from the name.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
