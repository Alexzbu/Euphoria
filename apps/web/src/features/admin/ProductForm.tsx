import { useMemo, useState, type FormEvent } from 'react';
import { ApiError } from '../../api/ApiError';
import { useTaxonomy } from '../catalog/queries';
import { fieldErrors } from '../auth/schemas';
import { useSaveProduct } from './queries';
import {
  centsToDollars,
  dollarsToCents,
  MAX_IMAGES,
  MAX_IMAGE_BYTES,
  productSchema,
  type ProductValues,
} from './schemas';
import { cx } from '../../lib/cx';
import type { AdminProduct, ProductSummary, TaxonomyRef } from '../../api/types';
import styles from './Admin.module.css';
import layout from './ProductForm.module.css';

interface Props {
  product: ProductSummary | AdminProduct | null;
  onSaved: () => void;
  onCancel: () => void;
}

// 401 and 403 are different answers and get different words. Comparing a status
// against a list means comparing it against each member of the list, one at a
// time, or every error becomes whichever branch was written first.
function messageFor(error: Error): string {
  if (!(error instanceof ApiError)) return error.message;
  if (error.status === 401) return 'Your session has expired. Sign in again to save this.';
  if (error.status === 403) return 'This account is not allowed to change products.';
  if (error.status === 413) return 'One of those images is too large.';
  return error.message;
}

// the api answers a rejected body with the issues that caused it, each naming its
// own field
function apiFieldErrors(error: Error): Partial<Record<keyof ProductValues, string>> {
  if (!(error instanceof ApiError) || !Array.isArray(error.details)) return {};

  const issues = error.details as { path?: unknown[]; message?: string }[];
  const mapped: Record<string, string> = {};

  for (const issue of issues) {
    const [field] = issue.path ?? [];
    if (typeof field === 'string' && issue.message && !(field in mapped)) {
      mapped[field] = issue.message;
    }
  }

  return mapped;
}

function Select({
  id,
  label,
  value,
  options,
  error,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  options: TaxonomyRef[];
  error?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>
      {/* value comes from state and nowhere else. binding it to an option would
          pin the control to that option and undo every change the moment it's made,
          and an empty list would take the form down on the way there. */}
      <select
        id={id}
        className={cx(styles.select, error && styles.invalid)}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">Choose {label.toLowerCase()}…</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
      </select>
      {options.length === 0 && (
        <p className={styles.hint}>Nothing to choose from yet. Add one under Taxonomy.</p>
      )}
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}

export function ProductForm({ product, onSaved, onCancel }: Props) {
  const { data: taxonomy } = useTaxonomy();
  const save = useSaveProduct();

  const [values, setValues] = useState({
    name: product?.name ?? '',
    description: product?.description ?? '',
    price: product ? centsToDollars(product.priceCents) : '',
    brand: product?.brand.id ?? '',
    category: product?.category.id ?? '',
    sex: product?.sex.id ?? '',
  });
  const [files, setFiles] = useState<File[]>([]);
  const [removed, setRemoved] = useState<string[]>([]);
  const [errors, setErrors] = useState<Partial<Record<keyof ProductValues, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const previews = useMemo(() => files.map((file) => URL.createObjectURL(file)), [files]);
  const existing = product?.images ?? [];
  const imageCount = existing.length - removed.length + files.length;

  const chooseFiles = (list: FileList | null) => {
    const chosen = [...(list ?? [])];
    const tooBig = chosen.find((file) => file.size > MAX_IMAGE_BYTES);

    if (tooBig) {
      setFormError(`${tooBig.name} is larger than 5 MB.`);
      return;
    }
    if (existing.length - removed.length + chosen.length > MAX_IMAGES) {
      setFormError(`A product holds at most ${String(MAX_IMAGES)} images.`);
      return;
    }

    setFormError(null);
    setFiles(chosen);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);

    const parsed = productSchema.safeParse({
      name: values.name,
      description: values.description,
      priceCents: values.price.trim() === '' ? Number.NaN : dollarsToCents(values.price),
      brand: values.brand,
      category: values.category,
      sex: values.sex,
    });

    if (!parsed.success) {
      setErrors(fieldErrors<ProductValues>(parsed.error));
      return;
    }

    setErrors({});

    const form = new FormData();
    form.set('name', parsed.data.name);
    form.set('description', parsed.data.description);
    form.set('priceCents', String(parsed.data.priceCents));
    form.set('brand', parsed.data.brand);
    form.set('category', parsed.data.category);
    form.set('sex', parsed.data.sex);
    for (const file of files) form.append('images', file);
    for (const url of removed) form.append('removeImages', url);

    save.mutate(
      { ...(product ? { id: product.id } : {}), form },
      {
        onSuccess: onSaved,
        onError: (error) => {
          setErrors(apiFieldErrors(error));
          setFormError(messageFor(error));
        },
      },
    );
  };

  return (
    <form className={layout.form} onSubmit={submit} noValidate>
      {formError && <p className={styles.formError}>{formError}</p>}

      <div className={styles.field}>
        <label className={styles.label} htmlFor="name">
          Name
        </label>
        <input
          id="name"
          className={cx(styles.input, errors.name && styles.invalid)}
          value={values.name}
          onChange={(event) => setValues({ ...values, name: event.target.value })}
        />
        {errors.name && <p className={styles.error}>{errors.name}</p>}
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="description">
          Description
        </label>
        <textarea
          id="description"
          className={cx(styles.textarea, errors.description && styles.invalid)}
          value={values.description}
          onChange={(event) => setValues({ ...values, description: event.target.value })}
        />
        {errors.description && <p className={styles.error}>{errors.description}</p>}
      </div>

      <div className={layout.row}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="price">
            Price
          </label>
          <input
            id="price"
            className={cx(styles.input, errors.priceCents && styles.invalid)}
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            value={values.price}
            onChange={(event) => setValues({ ...values, price: event.target.value })}
          />
          {errors.priceCents && <p className={styles.error}>{errors.priceCents}</p>}
        </div>

        <Select
          id="brand"
          label="Brand"
          value={values.brand}
          options={taxonomy?.brands ?? []}
          error={errors.brand}
          onChange={(brand) => setValues({ ...values, brand })}
        />
      </div>

      <div className={layout.row}>
        <Select
          id="category"
          label="Category"
          value={values.category}
          options={taxonomy?.categories ?? []}
          error={errors.category}
          onChange={(category) => setValues({ ...values, category })}
        />
        <Select
          id="sex"
          label="Department"
          value={values.sex}
          options={taxonomy?.sexes ?? []}
          error={errors.sex}
          onChange={(sex) => setValues({ ...values, sex })}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="images">
          Images ({imageCount} of {MAX_IMAGES})
        </label>
        <input
          id="images"
          className={styles.input}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple
          onChange={(event) => chooseFiles(event.target.files)}
        />

        {(existing.length > 0 || previews.length > 0) && (
          <div className={layout.images}>
            {existing.map((url) => (
              <div key={url} className={layout.image}>
                <img
                  src={url}
                  alt=""
                  className={cx(layout.thumb, removed.includes(url) && layout.removed)}
                />
                <button
                  type="button"
                  className={layout.imageButton}
                  onClick={() =>
                    setRemoved((current) =>
                      current.includes(url)
                        ? current.filter((entry) => entry !== url)
                        : [...current, url],
                    )
                  }
                >
                  {removed.includes(url) ? 'Keep' : 'Remove'}
                </button>
              </div>
            ))}
            {previews.map((url, index) => (
              <div key={url} className={layout.image}>
                <img src={url} alt="" className={layout.thumb} />
                <span className={layout.imageButton}>New {index + 1}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={layout.actions}>
        <button type="submit" className={styles.primary} disabled={save.isPending}>
          {save.isPending ? 'Saving…' : product ? 'Save changes' : 'Create product'}
        </button>
        <button type="button" className={styles.secondary} onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
