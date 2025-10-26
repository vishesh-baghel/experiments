import { defineConfig } from 'vitest/config';
import { config } from 'dotenv';

// Load .env file before running tests
config();

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    env: {
      // Ensure env vars are available in tests
      OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || '',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/demo/**',
        '**/examples/**',
      ],
    },
  },
});
