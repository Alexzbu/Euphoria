import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ApiError } from '../api/ApiError';
import { useAddToCart } from '../features/cart/useCart';
import { useProduct } from '../features/catalog/queries';
import { cx } from '../lib/cx';
import { formatCents } from '../lib/money';
import { ROUTES } from '../routes/paths';
import type { ProductDetail, VariantOption } from '../api/types';
import styles from './Product.module.css';

const MAX_PER_ORDER = 99;
const LOW_STOCK = 5;

// colours in the order the api sent them, each one appearing once
function coloursOf(variants: VariantOption[]): VariantOption['color'][] {
  const seen = new Map<string, VariantOption['color']>();
  for (const variant of variants) seen.set(variant.color.id, variant.color);
  return [...seen.values()];
}

function ProductView({ product }: { product: ProductDetail }) {
  const colours = useMemo(() => coloursOf(product.variants), [product.variants]);
  const [colourId, setColourId] = useState(() => colours[0]?.id ?? '');
  const [variantId, setVariantId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [imageIndex, setImageIndex] = useState(0);
  const addToCart = useAddToCart();

  const sizes = product.variants.filter((variant) => variant.color.id === colourId);
  const selected = sizes.find((variant) => variant.id === variantId);
  const cap = selected ? Math.min(selected.stock, MAX_PER_ORDER) : MAX_PER_ORDER;
  const image = product.images[imageIndex] ?? product.images[0];
  const hasThumbs = product.images.length > 1;

  const chooseColour = (id: string) => {
    setColourId(id);
    // sizes are per colour, so a size picked for the old one means nothing here
    setVariantId('');
    setQuantity(1);
    addToCart.reset();
  };

  const submit = () => {
    if (!selected) return;

    addToCart.mutate({
      quantity,
      line: {
        variantId: selected.id,
        sku: selected.sku,
        stock: selected.stock,
        unitPriceCents: product.priceCents,
        productId: product.id,
        productName: product.name,
        ...(image ? { productImage: image } : {}),
        colorName: selected.color.name,
        sizeName: selected.size.name,
      },
    });
  };

  return (
    <>
      <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
        <Link className={styles.crumbLink} to={ROUTES.home}>
          Home
        </Link>
        <span aria-hidden>/</span>
        <Link className={styles.crumbLink} to={ROUTES.catalog}>
          Catalog
        </Link>
        <span aria-hidden>/</span>
        <Link
          className={styles.crumbLink}
          to={`${ROUTES.catalog}?category=${product.category.slug}`}
        >
          {product.category.name}
        </Link>
        <span aria-hidden>/</span>
        <span aria-current="page">{product.name}</span>
      </nav>

      <div className={styles.layout}>
        <div className={cx(styles.gallery, hasThumbs && styles.galleryWithThumbs)}>
          {hasThumbs && (
            <div className={styles.thumbs}>
              {product.images.map((source, index) => (
                <button
                  key={source}
                  type="button"
                  className={cx(styles.thumb, index === imageIndex && styles.thumbActive)}
                  onClick={() => setImageIndex(index)}
                  aria-label={`Show image ${String(index + 1)}`}
                >
                  <img className={styles.thumbImage} src={source} alt="" loading="lazy" />
                </button>
              ))}
            </div>
          )}
          {image ? (
            <img className={styles.mainImage} src={image} alt={product.name} />
          ) : (
            <div className={styles.mainImage} />
          )}
        </div>

        <div>
          <h1 className={styles.title}>{product.name}</h1>
          <p className={styles.brand}>
            {product.brand.name} · {product.sex.name}
          </p>
          <p className={styles.price}>{formatCents(product.priceCents)}</p>
          {product.description && <p className={styles.description}>{product.description}</p>}

          {colours.length > 0 && (
            <div className={styles.group}>
              <h2 className={styles.groupTitle}>Colour</h2>
              <div className={styles.options}>
                {colours.map((colour) => (
                  <button
                    key={colour.id}
                    type="button"
                    className={cx(styles.swatch, colour.id === colourId && styles.swatchActive)}
                    style={{ ['--swatch-color' as string]: colour.slug }}
                    onClick={() => chooseColour(colour.id)}
                    aria-pressed={colour.id === colourId}
                  >
                    <span className="visually-hidden">{colour.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className={styles.group}>
            <h2 className={styles.groupTitle}>Size</h2>
            <div className={styles.options}>
              {sizes.map((variant) => (
                <button
                  key={variant.id}
                  type="button"
                  className={cx(
                    styles.size,
                    variant.id === variantId && styles.sizeActive,
                    !variant.inStock && styles.sizeOut,
                  )}
                  disabled={!variant.inStock}
                  aria-pressed={variant.id === variantId}
                  onClick={() => {
                    setVariantId(variant.id);
                    setQuantity(1);
                    addToCart.reset();
                  }}
                >
                  {variant.size.name}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.actions}>
            <div className={styles.stepper}>
              <button
                type="button"
                className={styles.stepperButton}
                onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                disabled={quantity <= 1}
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span className={styles.stepperValue} aria-live="polite">
                {quantity}
              </span>
              <button
                type="button"
                className={styles.stepperButton}
                onClick={() => setQuantity((value) => Math.min(cap, value + 1))}
                disabled={quantity >= cap}
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>

            <button
              type="button"
              className={styles.addButton}
              onClick={submit}
              disabled={!selected || addToCart.isPending}
            >
              {addToCart.isPending ? 'Adding…' : 'Add to cart'}
            </button>
          </div>

          {!selected && <p className={styles.status}>Pick a size to add this to your cart.</p>}

          {selected && selected.stock <= LOW_STOCK && (
            <p className={cx(styles.status, styles.statusStrong)}>
              Only {selected.stock} left in this size.
            </p>
          )}

          {addToCart.isSuccess && (
            <p className={styles.added}>
              Added to your cart.{' '}
              <Link className={styles.addedLink} to={ROUTES.cart}>
                View cart
              </Link>
            </p>
          )}

          {addToCart.isError && (
            <p className={cx(styles.status, styles.statusStrong)}>{addToCart.error.message}</p>
          )}

          <p className={styles.meta}>
            Free shipping on orders over $100. SKU {selected?.sku ?? '—'}
          </p>
        </div>
      </div>
    </>
  );
}

export function Product() {
  const { id = '' } = useParams();
  const { data, isPending, isError, error } = useProduct(id);

  if (isPending) {
    return (
      <div className={styles.page}>
        <div className={styles.layout}>
          <div className={cx(styles.skeleton, styles.skeletonImage)} />
          <div>
            <div className={cx(styles.skeleton, styles.skeletonLine)} />
            <div className={cx(styles.skeleton, styles.skeletonLine)} />
            <div className={cx(styles.skeleton, styles.skeletonLine)} />
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    const missing = error instanceof ApiError && error.status === 404;

    return (
      <div className={styles.page}>
        <div className={styles.missing}>
          <h1 className={styles.title}>
            {missing ? 'This product is no longer here' : 'Something went wrong'}
          </h1>
          <p className={styles.status}>
            {missing ? 'It may have sold out and left the catalog.' : error.message}
          </p>
          <p className={styles.status}>
            <Link className={styles.addedLink} to={ROUTES.catalog}>
              Back to the catalog
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <ProductView product={data} />
    </div>
  );
}
