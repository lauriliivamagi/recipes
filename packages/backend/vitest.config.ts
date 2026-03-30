import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    clearMocks: true,
    restoreMocks: true,
    environment: "node",
    include: ["tests/**/*.test.ts", "src/**/*.test.ts"],
    setupFiles: ["./tests/setup.ts"],
    coverage: {
      provider: "v8",
      all: true,
      reporter: ["text", "json", "html", "lcov"],
      exclude: ["node_modules", "tests", "dist", "src/db/migrations/**", "**/*.config.*"],
      thresholds: {
        lines: 45,
        functions: 45,
        branches: 30,
        statements: 45,
      },
    },
  },
});
