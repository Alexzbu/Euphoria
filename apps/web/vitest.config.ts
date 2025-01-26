import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// separate from vite.config.ts on purpose: the dev server's fixed port and the
// build output have nothing to say about how tests run, and a shared file makes
// both harder to read.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}'],
    restoreMocks: true,
    // no jsdom leaking between files. each one gets a fresh document.
    isolate: true,
  },
});
