import { useState } from 'react';
import { Icon } from '../../components/Icon';
import { useTaxonomy } from '../catalog/queries';
import { fieldErrors } from '../auth/schemas';
import { useCreateVariant, useDeleteVariant, useUpdateVariant, useVariants } from './queries';
import { variantSchema, type VariantValues } from './schemas';
import { cx } from '../../lib/cx';
import styles from './Admin.module.css';
import layout from './VariantEditor.module.css';

interface Props {
  productId: string;
}

// A variant is one buyable combination, so stock lives here and not on the product.
export function VariantEditor({ productId }: Props) {
  const { data: taxonomy } = useTaxonomy();
  const { data: variants, isPending } = useVariants(productId);
  const create = useCreateVariant(productId);
  const update = useUpdateVariant(productId);
  const remove = useDeleteVariant(productId);

  const [draft, setDraft] = useState({ color: '', size: '', sku: '', stock: '0' });
  const [errors, setErrors] = useState<Partial<Record<keyof VariantValues, string>>>({});

  const add = () => {
    const parsed = variantSchema.safeParse({
      color: draft.color,
      size: draft.size,
      sku: draft.sku.trim() === '' ? undefined : draft.sku.trim(),
      stock: Number(draft.stock),
    });

    if (!parsed.success) {
      setErrors(fieldErrors<VariantValues>(parsed.error));
      return;
    }

    setErrors({});
    create.mutate(parsed.data, {
      onSuccess: () => setDraft({ color: '', size: '', sku: '', stock: '0' }),
    });
  };

  return (
    <section className={layout.section}>
      <h3 className={layout.title}>Variants</h3>

      {isPending && <p className={styles.hint}>Loading variants…</p>}

      {variants && variants.length === 0 && (
        <p className={styles.hint}>No variants yet. Nothing can be bought until there is one.</p>
      )}

      {variants && variants.length > 0 && (
        <table className={layout.table}>
          <thead>
            <tr>
              <th scope="col">Colour</th>
              <th scope="col">Size</th>
              <th scope="col">SKU</th>
              <th scope="col">Stock</th>
              <th scope="col">
                <span className="visually-hidden">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {variants.map((variant) => (
              <tr key={variant.id}>
                <td>{variant.color.name}</td>
                <td>{variant.size.name}</td>
                <td className={layout.sku}>{variant.sku}</td>
                <td>
                  <input
                    className={cx(styles.input, layout.stockInput)}
                    type="number"
                    min="0"
                    defaultValue={variant.stock}
                    aria-label={`Stock for ${variant.color.name} ${variant.size.name}`}
                    // saved on blur, so typing 12 isn't three saves on the way there
                    onBlur={(event) => {
                      const stock = Number(event.target.value);
                      if (Number.isInteger(stock) && stock >= 0 && stock !== variant.stock) {
                        update.mutate({ id: variant.id, stock });
                      }
                    }}
                  />
                </td>
                <td>
                  <button
                    type="button"
                    className={styles.danger}
                    disabled={remove.isPending}
                    onClick={() => remove.mutate(variant.id)}
                  >
                    <Icon name="trash" size={16} title={`Delete ${variant.sku}`} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {(create.isError || update.isError || remove.isError) && (
        <p className={styles.formError}>
          {(create.error ?? update.error ?? remove.error)?.message}
        </p>
      )}

      <div className={layout.draft}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="variant-color">
            Colour
          </label>
          <select
            id="variant-color"
            className={cx(styles.select, errors.color && styles.invalid)}
            value={draft.color}
            onChange={(event) => setDraft({ ...draft, color: event.target.value })}
          >
            <option value="">Choose…</option>
            {(taxonomy?.colors ?? []).map((colour) => (
              <option key={colour.id} value={colour.id}>
                {colour.name}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="variant-size">
            Size
          </label>
          <select
            id="variant-size"
            className={cx(styles.select, errors.size && styles.invalid)}
            value={draft.size}
            onChange={(event) => setDraft({ ...draft, size: event.target.value })}
          >
            <option value="">Choose…</option>
            {(taxonomy?.sizes ?? []).map((size) => (
              <option key={size.id} value={size.id}>
                {size.name}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="variant-sku">
            SKU (optional)
          </label>
          <input
            id="variant-sku"
            className={cx(styles.input, errors.sku && styles.invalid)}
            value={draft.sku}
            placeholder="Derived if left empty"
            onChange={(event) => setDraft({ ...draft, sku: event.target.value })}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="variant-stock">
            Stock
          </label>
          <input
            id="variant-stock"
            className={cx(styles.input, errors.stock && styles.invalid)}
            type="number"
            min="0"
            value={draft.stock}
            onChange={(event) => setDraft({ ...draft, stock: event.target.value })}
          />
        </div>

        <button type="button" className={styles.primary} onClick={add} disabled={create.isPending}>
          {create.isPending ? 'Adding…' : 'Add variant'}
        </button>
      </div>
    </section>
  );
}
