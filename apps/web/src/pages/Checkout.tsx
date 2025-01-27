import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiError } from '../api/ApiError';
import { createOrder, createPaymentIntent } from '../api/orders';
import { AddressForm } from '../features/checkout/AddressForm';
import { PaymentStep } from '../features/checkout/PaymentStep';
import { isStripeConfigured } from '../features/checkout/stripe';
import { cartKeys, useCart } from '../features/cart/useCart';
import { formatCents } from '../lib/money';
import { ROUTES } from '../routes/paths';
import type { Order, PaymentIntent, ShippingAddress } from '../api/types';
import styles from './Checkout.module.css';

function Confirmation({ order }: { order: Order | null }) {
  return (
    <div className={styles.confirmation}>
      <h1 className={styles.title}>Thank you</h1>
      <p className={styles.text}>Your order is in. A confirmation is on its way by email.</p>
      {order && <p className={styles.orderNumber}>Order {order.orderNumber}</p>}
      <p>
        <Link className={styles.button} to={ROUTES.catalog}>
          Keep shopping
        </Link>
      </p>
    </div>
  );
}

export function Checkout() {
  const [params] = useSearchParams();
  const { cart, isPending: cartPending } = useCart();
  const queryClient = useQueryClient();

  const [order, setOrder] = useState<Order | null>(null);
  const [intent, setIntent] = useState<PaymentIntent | null>(null);
  // the api only mounts the payment route when it has stripe credentials. a 404
  // here is a deployment without payments, not a bug, and the order still stands.
  const [paymentUnavailable, setPaymentUnavailable] = useState(false);

  const payment = useMutation({
    mutationFn: createPaymentIntent,
    onSuccess: setIntent,
    onError: (error: Error) => {
      if (error instanceof ApiError && error.status === 404) setPaymentUnavailable(true);
    },
  });

  const place = useMutation({
    mutationFn: (address: ShippingAddress) => createOrder(address),
    onSuccess: async (created) => {
      setOrder(created);
      // the server emptied the cart into the order, so the cached copy is stale
      await queryClient.invalidateQueries({ queryKey: cartKeys.cart });

      if (isStripeConfigured) payment.mutate(created.id);
      else setPaymentUnavailable(true);
    },
  });

  // stripe sends the browser back here after a redirect payment method
  if (params.get('redirect_status') === 'succeeded') return <Confirmation order={order} />;

  // the cart may still be arriving, or still merging in from before sign-in. calling
  // it empty now would send someone who has just filled one back to the catalog.
  if (!order && cartPending) {
    return (
      <div className={styles.page}>
        <p className={styles.text} role="status">
          Fetching your cart…
        </p>
      </div>
    );
  }

  if (!order && cart.items.length === 0) {
    return (
      <div className={styles.page}>
        <div className={styles.confirmation}>
          <h1 className={styles.title}>Nothing to check out</h1>
          <p className={styles.text}>Your cart is empty.</p>
          <Link className={styles.button} to={ROUTES.catalog}>
            Browse the catalog
          </Link>
        </div>
      </div>
    );
  }

  const summaryItems = order
    ? order.items.map((item) => ({
        id: item.id,
        name: item.productName,
        quantity: item.quantity,
        totalCents: item.lineTotalCents,
      }))
    : cart.items.map((item) => ({
        id: item.id,
        name: item.product.name,
        quantity: item.quantity,
        totalCents: item.lineTotalCents,
      }));

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Checkout</h1>

      <div className={styles.layout}>
        <div className={styles.panel}>
          {!order && (
            <>
              <h2 className={styles.panelTitle}>Shipping address</h2>
              {place.isError && <p className={styles.error}>{place.error.message}</p>}
              <AddressForm onSubmit={place.mutate} submitting={place.isPending} />
            </>
          )}

          {order && (
            <>
              <h2 className={styles.panelTitle}>Payment</h2>
              {payment.isPending && <p className={styles.text}>Preparing payment…</p>}

              {intent && (
                <PaymentStep
                  clientSecret={intent.clientSecret}
                  amountCents={intent.amountCents}
                  currency={intent.currency}
                  returnUrl={`${window.location.origin}${ROUTES.checkout}?order=${order.id}`}
                />
              )}

              {paymentUnavailable && (
                <p className={styles.notice}>
                  Card payment isn&apos;t switched on for this environment. Order{' '}
                  {order.orderNumber} is saved and waiting for payment.
                </p>
              )}

              {payment.isError && !paymentUnavailable && (
                <p className={styles.error}>{payment.error.message}</p>
              )}
            </>
          )}
        </div>

        <aside className={styles.summary}>
          <h2 className={styles.panelTitle}>Order summary</h2>
          {summaryItems.map((item) => (
            <p key={item.id} className={styles.line}>
              <span className={styles.lineName}>
                {item.name} × {item.quantity}
              </span>
              <span>{formatCents(item.totalCents)}</span>
            </p>
          ))}

          {order && (
            <p className={styles.line}>
              <span className={styles.lineName}>Shipping</span>
              <span>{order.shippingCents === 0 ? 'Free' : formatCents(order.shippingCents)}</span>
            </p>
          )}

          <p className={styles.total}>
            <span>{order ? 'Total' : 'Subtotal'}</span>
            <span>{formatCents(order ? order.totalCents : cart.subtotalCents)}</span>
          </p>
        </aside>
      </div>
    </div>
  );
}
