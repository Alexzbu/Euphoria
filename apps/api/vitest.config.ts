import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.ts'],
    // one in-memory mongod per worker, and suites share collections through the
    // per-test wipe in setup.ts. running files in parallel would have them
    // clearing each other's data mid-request.
    fileParallelism: false,
    testTimeout: 20_000,
    hookTimeout: 60_000,
  },
});
