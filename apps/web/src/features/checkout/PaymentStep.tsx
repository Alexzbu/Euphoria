import { useState, type FormEvent } from 'react';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { getStripe } from './stripe';
import { formatCents } from '../../lib/money';
import styles from './PaymentStep.module.css';

interface Props {
  clientSecret: string;
  amountCents: number;
  currency: string;
  returnUrl: string;
}

// Stripe collects the card details inside its own iframe, so nothing here ever
// touches a card number. The amount is the one the intent was created with, which
// came from the stored order, not from this page.
function PaymentForm({ amountCents, currency, returnUrl }: Omit<Props, 'clientSecret'>) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!stripe || !elements) return;

    setSubmitting(true);
    setError(null);

    // some payment methods leave the page and come back to return_url. cards
    // usually resolve right here, and then this promise carries the outcome.
    const result = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: returnUrl },
    });

    setSubmitting(false);
    if (result.error) setError(result.error.message ?? 'That payment could not be completed');
  };

  return (
    <form className={styles.wrapper} onSubmit={(event) => void submit(event)}>
      <PaymentElement />
      {error && <p className={styles.error}>{error}</p>}
      <button type="submit" className={styles.pay} disabled={!stripe || submitting}>
        {submitting ? 'Confirming…' : `Pay ${formatCents(amountCents, currency)}`}
      </button>
    </form>
  );
}

export function PaymentStep({ clientSecret, ...rest }: Props) {
  return (
    <Elements stripe={getStripe()} options={{ clientSecret }}>
      <PaymentForm {...rest} />
    </Elements>
  );
}
