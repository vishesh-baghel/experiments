import 'dotenv/config';
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    root: '.',
    include: ['__tests__/e2e-real.test.ts'],
    // Isolate from other tests to avoid mock contamination
    isolate: true,
    // Longer timeouts for real API calls
    testTimeout: 60000,
    hookTimeout: 30000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
