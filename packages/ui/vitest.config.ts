import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@recipe/domain': resolve(__dirname, '../domain/src'),
    },
  },
  test: {
    include: ['src/**/*.test.ts'],
  },
});
