import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@recipe/domain': resolve(__dirname, 'packages/domain/src'),
      '@recipe/ui': resolve(__dirname, 'packages/ui/src'),
      '@recipe/build': resolve(__dirname, 'packages/build/src'),
    },
  },
  test: {
    include: ['packages/*/src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['packages/domain/src/**/*.ts'],
      exclude: ['packages/*/src/**/*.test.ts', 'packages/*/src/**/*.d.ts', 'packages/*/src/**/types.ts'],
      thresholds: {
        branches: 70,
        functions: 90,
        lines: 85,
        statements: 85,
      },
    },
  },
});
