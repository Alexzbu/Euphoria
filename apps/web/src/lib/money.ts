// prices are integer cents everywhere, right up to here. this is the last moment
// before a person reads it, and the only place a decimal point appears.
const formatters = new Map<string, Intl.NumberFormat>();

function formatterFor(currency: string): Intl.NumberFormat {
  const key = currency.toUpperCase();
  let formatter = formatters.get(key);

  if (!formatter) {
    formatter = new Intl.NumberFormat(undefined, { style: 'currency', currency: key });
    formatters.set(key, formatter);
  }

  return formatter;
}

export function formatCents(cents: number, currency = 'USD'): string {
  return formatterFor(currency).format(cents / 100);
}
