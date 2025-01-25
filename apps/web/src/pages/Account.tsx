import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Pagination } from '../components/Pagination';
import { useAuth } from '../features/auth/useAuth';
import { useCancelOrder, useOrder, useOrders } from '../features/orders/queries';
import {
  CANCELLABLE,
  STATUS_LABELS,
  type OrderStatus,
  type OrderSummary,
} from '../features/orders/types';
import { cx } from '../lib/cx';
import { formatCents } from '../lib/money';
import { ROUTES } from '../routes/paths';
import styles from './Account.module.css';

const BADGE_CLASS: Record<OrderStatus, keyof typeof styles> = {
  PENDING_PAYMENT: 'badgePending',
  PAID: 'badgePaid',
  FULFILLED: 'badgeFulfilled',
  CANCELLED: 'badgeCancelled',
  REFUNDED: 'badgeRefunded',
};

const formatDate = (iso: string): string =>
  new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

function OrderDetail({ id }: { id: string }) {
  const { data: order, isPending, isError, error } = useOrder(id);
  const cancel = useCancelOrder();

  if (isPending) return <div className={styles.detail}>Loading the order…</div>;
  if (isError) return <div className={styles.detail}>{error.message}</div>;

  return (
    <div className={styles.detail}>
      <div className={styles.lines}>
        {order.items.map((item) => (
          <p key={item.id} className={styles.line}>
            <span className={styles.lineName}>
              {item.productName} · {item.colorName} · {item.sizeName} × {item.quantity}
            </span>
            <span>{formatCents(item.lineTotalCents, order.currency)}</span>
          </p>
        ))}
      </div>

      <div className={styles.columns}>
        <div>
          <h4 className={styles.sectionTitle}>Shipping to</h4>
          <address className={styles.address}>
            {order.shippingAddress.fullName}
            <br />
            {order.shippingAddress.line1}
            {order.shippingAddress.line2 && (
              <>
                <br />
                {order.shippingAddress.line2}
              </>
            )}
            <br />
            {order.shippingAddress.postalCode} {order.shippingAddress.city}
            <br />
            {order.shippingAddress.country}
          </address>
        </div>

        <div className={styles.totals}>
          <p className={styles.totalRow}>
            <span>Subtotal</span>
            <span>{formatCents(order.subtotalCents, order.currency)}</span>
          </p>
          <p className={styles.totalRow}>
            <span>Shipping</span>
            <span>
              {order.shippingCents === 0
                ? 'Free'
                : formatCents(order.shippingCents, order.currency)}
            </span>
          </p>
          <p className={cx(styles.totalRow, styles.grand)}>
            <span>Total</span>
            <span>{formatCents(order.totalCents, order.currency)}</span>
          </p>
        </div>
      </div>

      {CANCELLABLE.includes(order.status) && (
        <>
          <button
            type="button"
            className={styles.cancel}
            disabled={cancel.isPending}
            onClick={() => cancel.mutate(order.id)}
          >
            {cancel.isPending ? 'Cancelling…' : 'Cancel this order'}
          </button>
          {cancel.isError && <p className={styles.error}>{cancel.error.message}</p>}
        </>
      )}
    </div>
  );
}

function OrderRow({ order }: { order: OrderSummary }) {
  const [open, setOpen] = useState(false);

  return (
    <article className={styles.order}>
      <div className={styles.summary}>
        <div>
          <p className={styles.number}>{order.orderNumber}</p>
          <p className={styles.placed}>
            {formatDate(order.placedAt)} · {order.totalItems}{' '}
            {order.totalItems === 1 ? 'item' : 'items'}
          </p>
        </div>
        <span className={cx(styles.badge, styles[BADGE_CLASS[order.status]])}>
          {STATUS_LABELS[order.status]}
        </span>
        <p className={styles.total}>{formatCents(order.totalCents, order.currency)}</p>
        <button
          type="button"
          className={styles.toggle}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? 'Hide' : 'View details'}
        </button>
      </div>

      {open && <OrderDetail id={order.id} />}
    </article>
  );
}

export function Account() {
  const { user, logout } = useAuth();
  const [page, setPage] = useState(1);
  const { data, isPending, isError, error } = useOrders(page);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Your account</h1>
          <p className={styles.email}>
            {user?.email}
            {user?.role === 'ADMIN' && <span className={styles.role}>Admin</span>}
          </p>
        </div>
        <button type="button" className={styles.signOut} onClick={() => void logout()}>
          Sign out
        </button>
      </div>

      <h2 className={styles.sectionTitle}>Order history</h2>

      {isPending && (
        <>
          <div className={styles.skeleton} />
          <div className={styles.skeleton} />
        </>
      )}

      {isError && <p className={styles.error}>{error.message}</p>}

      {data && data.items.length === 0 && (
        <div className={styles.empty}>
          <p className={styles.emptyText}>No orders yet.</p>
          <Link className={styles.button} to={ROUTES.catalog}>
            Start shopping
          </Link>
        </div>
      )}

      {data && data.items.length > 0 && (
        <>
          {data.items.map((order) => (
            <OrderRow key={order.id} order={order} />
          ))}
          <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} />
        </>
      )}
    </div>
  );
}
