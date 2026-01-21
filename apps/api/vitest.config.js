import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    exclude: [
      '**/*.int.test.js',
      '**/node_modules/**'
    ],
  },
});