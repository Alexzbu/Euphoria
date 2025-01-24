import type { Cart, CartLine } from '../../api/types';

// A cart before there's an account to hang it on. The server owns a signed-in
// cart; this is the shape that survives until sign-in, when it gets merged and
// thrown away.
//
// Each line carries a snapshot of what was on screen when it was added, so the
// cart page can render without asking the api about every line. The snapshot is
// display only. Prices and stock are re-read server-side at merge and again when
// the order is placed, so a stale number here can't become a cheap order.

const STORAGE_KEY = 'euphoria_guest_cart';

export const MAX_ITEM_QUANTITY = 99;
export const MAX_CART_LINES = 50;

export interface GuestCartLine {
  variantId: string;
  quantity: number;
  sku: string;
  stock: number;
  unitPriceCents: number;
  productId: string;
  productName: string;
  productImage?: string;
  colorName: string;
  sizeName: string;
}

type Listener = () => void;

const listeners = new Set<Listener>();

// useSyncExternalStore compares snapshots by identity, so the parsed array is
// cached and only replaced when the cart actually changes. returning a fresh
// array each read would re-render forever.
let cache: GuestCartLine[] | null = null;

const EMPTY: GuestCartLine[] = [];

function isLine(value: unknown): value is GuestCartLine {
  if (typeof value !== 'object' || value === null) return false;
  const line = value as Partial<GuestCartLine>;
  return typeof line.variantId === 'string' && typeof line.quantity === 'number';
}

function read(): GuestCartLine[] {
  if (cache) return cache;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    cache = Array.isArray(parsed) ? parsed.filter(isLine) : [];
  } catch {
    // storage can be unreadable (private mode, a quota error, someone editing it
    // by hand). an unusable cart shouldn't take the page down with it.
    cache = [];
  }

  return cache;
}

function write(lines: GuestCartLine[]): void {
  cache = lines;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  } catch {
    // nothing to do, the in-memory copy still works for this tab
  }
  for (const listener of listeners) listener();
}

export function subscribeGuestCart(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getGuestCart(): GuestCartLine[] {
  return read();
}

// rendered on the server during a build, where there is no localStorage
export function getEmptyGuestCart(): GuestCartLine[] {
  return EMPTY;
}

const capFor = (line: Pick<GuestCartLine, 'stock'>): number =>
  Math.min(line.stock, MAX_ITEM_QUANTITY);

export function addGuestLine(line: GuestCartLine): void {
  const lines = read();
  const existing = lines.find((item) => item.variantId === line.variantId);

  if (existing) {
    const quantity = Math.min(existing.quantity + line.quantity, capFor(line));
    write(lines.map((item) => (item === existing ? { ...item, ...line, quantity } : item)));
    return;
  }

  if (lines.length >= MAX_CART_LINES) return;
  write([...lines, { ...line, quantity: Math.min(line.quantity, capFor(line)) }]);
}

export function setGuestQuantity(variantId: string, quantity: number): void {
  write(
    read().map((line) =>
      line.variantId === variantId
        ? { ...line, quantity: Math.max(1, Math.min(quantity, capFor(line))) }
        : line,
    ),
  );
}

export function removeGuestLine(variantId: string): void {
  write(read().filter((line) => line.variantId !== variantId));
}

export function clearGuestCart(): void {
  write([]);
}

// the same view the api answers with, so a page renders one shape whoever is
// looking at it
export function toCartView(lines: GuestCartLine[]): Cart {
  const items: CartLine[] = lines.map((line) => ({
    id: line.variantId,
    variantId: line.variantId,
    sku: line.sku,
    quantity: line.quantity,
    stock: line.stock,
    unitPriceCents: line.unitPriceCents,
    lineTotalCents: line.unitPriceCents * line.quantity,
    product: {
      id: line.productId,
      name: line.productName,
      slug: '',
      images: line.productImage ? [line.productImage] : [],
    },
    color: { id: line.colorName, name: line.colorName, slug: line.colorName.toLowerCase() },
    size: { id: line.sizeName, name: line.sizeName, slug: line.sizeName.toLowerCase() },
  }));

  return {
    items,
    totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotalCents: items.reduce((sum, item) => sum + item.lineTotalCents, 0),
  };
}
