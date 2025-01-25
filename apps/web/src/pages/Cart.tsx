import { Link } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { useAuth } from '../features/auth/useAuth';
import { useCart, useRemoveCartItem, useUpdateCartQuantity } from '../features/cart/useCart';
import { MAX_ITEM_QUANTITY } from '../features/cart/guestCart';
import { formatCents } from '../lib/money';
import { productPath, ROUTES } from '../routes/paths';
import type { CartLine } from '../api/types';
import styles from './Cart.module.css';

const FREE_SHIPPING_FROM_CENTS = 10_000;

function Line({ line }: { line: CartLine }) {
  const update = useUpdateCartQuantity();
  const remove = useRemoveCartItem();
  const busy = update.isPending || remove.isPending;
  const cap = Math.min(line.stock, MAX_ITEM_QUANTITY);

  return (
    <div className={styles.line}>
      <img className={styles.image} src={line.product.images[0] ?? ''} alt="" />

      <div>
        <Link className={styles.name} to={productPath(line.product.id)}>
          {line.product.name}
        </Link>
        <p className={styles.variant}>
          {line.color.name} · Size {line.size.name}
        </p>
      </div>

      <p className={styles.unit}>{formatCents(line.unitPriceCents)}</p>

      <div className={styles.stepper}>
        <button
          type="button"
          className={styles.stepperButton}
          disabled={busy || line.quantity <= 1}
          onClick={() => update.mutate({ itemId: line.id, quantity: line.quantity - 1 })}
          aria-label={`Decrease quantity of ${line.product.name}`}
        >
          −
        </button>
        <span className={styles.quantity}>{line.quantity}</span>
        <button
          type="button"
          className={styles.stepperButton}
          disabled={busy || line.quantity >= cap}
          onClick={() => update.mutate({ itemId: line.id, quantity: line.quantity + 1 })}
          aria-label={`Increase quantity of ${line.product.name}`}
        >
          +
        </button>
      </div>

      <p className={styles.total}>{formatCents(line.lineTotalCents)}</p>

      <button
        type="button"
        className={styles.remove}
        disabled={busy}
        onClick={() => remove.mutate(line.id)}
      >
        <Icon name="trash" size={18} title={`Remove ${line.product.name}`} />
      </button>
    </div>
  );
}

export function Cart() {
  const { cart, isPending, isGuest } = useCart();
  const { status } = useAuth();

  if (isPending) {
    return (
      <div className={styles.page}>
        <h1 className={styles.title}>Your cart</h1>
        <div className={styles.skeleton} />
        <div className={styles.skeleton} />
      </div>
    );
  }

  if (cart.items.length === 0) {
    return (
      <div className={styles.page}>
        <div className={styles.empty}>
          <h1 className={styles.emptyTitle}>Your cart is empty</h1>
          <p className={styles.emptyText}>
            Nothing in here yet. The catalog is a good place to start.
          </p>
          <Link className={styles.button} to={ROUTES.catalog}>
            Continue shopping
          </Link>
        </div>
      </div>
    );
  }

  const missingForFreeShipping = FREE_SHIPPING_FROM_CENTS - cart.subtotalCents;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Your cart</h1>
        <p className={styles.count}>
          {cart.totalItems} {cart.totalItems === 1 ? 'item' : 'items'}
        </p>
      </div>

      <div className={styles.layout}>
        <div className={styles.lines}>
          {cart.items.map((line) => (
            <Line key={line.id} line={line} />
          ))}
        </div>

        <aside className={styles.summary}>
          <h2 className={styles.summaryTitle}>Summary</h2>

          <p className={styles.row}>
            <span>Items</span>
            <span>{cart.totalItems}</span>
          </p>
          <p className={styles.row}>
            <span>Shipping</span>
            <span>{missingForFreeShipping > 0 ? 'Calculated at checkout' : 'Free'}</span>
          </p>

          <p className={styles.subtotal}>
            <span>Subtotal</span>
            <span>{formatCents(cart.subtotalCents)}</span>
          </p>

          {missingForFreeShipping > 0 && (
            <p className={styles.note}>
              {formatCents(missingForFreeShipping)} away from free shipping.
            </p>
          )}

          {status === 'authenticated' ? (
            <Link className={styles.checkout} to={ROUTES.checkout}>
              Proceed to checkout
            </Link>
          ) : (
            <>
              <Link className={styles.checkout} to={ROUTES.login} state={{ from: ROUTES.checkout }}>
                Sign in to check out
              </Link>
              {isGuest && <p className={styles.note}>Your cart comes with you when you sign in.</p>}
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
