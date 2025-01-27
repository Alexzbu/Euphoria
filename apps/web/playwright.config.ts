import { defineConfig, devices } from '@playwright/test';

const PORT = 5174;
const baseURL = `http://localhost:${String(PORT)}`;

// The api is answered inside the browser (see e2e/fakeApi.ts), so this needs no
// database, no stripe keys and no second process. What it does exercise is the real
// bundle in a real browser: routing, the guest cart in localStorage, the sign-in
// redirect, and the order that comes out the other end.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    // preview, so the flow runs against what would actually be deployed. a port of
    // its own, so a dev server someone left running doesn't get driven by a test.
    command: `npm run build && npm run preview -- --port ${String(PORT)} --strictPort`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    // the page's own origin, so the in-page api needs no cors dance
    env: { VITE_API_URL: `${baseURL}/api` },
  },
});
