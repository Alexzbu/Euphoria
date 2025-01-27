import { CREDENTIALS, expect, test } from './fakeApi';

test('a shopper can browse, fill a cart, sign in and place an order', async ({ page }) => {
  await page.goto('/catalog');

  await expect(page.getByRole('heading', { name: 'Catalog' })).toBeVisible();
  await expect(page.getByText('2 products')).toBeVisible();

  await page.getByRole('link', { name: 'Ribbed Tee' }).click();

  await expect(page.getByRole('heading', { level: 1, name: 'Ribbed Tee' })).toBeVisible();
  // nothing is addable until a size is picked, since the variant is what has stock
  await expect(page.getByRole('button', { name: 'Add to cart' })).toBeDisabled();

  await page.getByRole('button', { name: 'M', exact: true }).click();
  await page.getByRole('button', { name: 'Increase quantity' }).click();
  await page.getByRole('button', { name: 'Add to cart' }).click();

  // the cart is in this browser at this point, no account involved
  await expect(page.getByRole('link', { name: 'Your cart, 2 items' })).toBeVisible();

  await page.getByRole('link', { name: 'Your cart, 2 items' }).click();
  await expect(page.getByRole('heading', { name: 'Your cart' })).toBeVisible();
  await expect(page.getByText('$90.00').first()).toBeVisible();

  await page.getByRole('link', { name: 'Sign in to check out' }).click();

  await page.getByLabel('Email').fill(CREDENTIALS.email);
  await page.getByLabel('Password', { exact: true }).fill(CREDENTIALS.password);
  await page.getByRole('button', { name: 'Sign in' }).click();

  // signing in lands on checkout, and the cart collected as a guest came along
  await expect(page.getByRole('heading', { name: 'Checkout' })).toBeVisible();
  await expect(page.getByText('Ribbed Tee × 2')).toBeVisible();
  await expect(page.getByText('$90.00').first()).toBeVisible();

  await page.getByLabel('Full name').fill('Ada Lovelace');
  await page.getByLabel('Address', { exact: true }).fill('12 Analytical Way');
  await page.getByLabel('City').fill('London');
  await page.getByLabel('Postal code').fill('W1 1AA');
  await page.getByLabel('Country').fill('United Kingdom');
  await page.getByRole('button', { name: 'Continue to payment' }).click();

  await expect(page.getByRole('heading', { name: 'Payment' })).toBeVisible();
  await expect(page.getByText(/EU-2501-0001 is saved and waiting for payment/)).toBeVisible();

  // the order took the cart with it
  await page.getByRole('link', { name: 'Your cart' }).click();
  await expect(page.getByRole('heading', { name: 'Your cart is empty' })).toBeVisible();
});

test('checkout is not reachable without an account', async ({ page }) => {
  await page.goto('/checkout');

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
});
