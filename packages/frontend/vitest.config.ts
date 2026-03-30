import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    globals: true,
    clearMocks: true,
    restoreMocks: true,
    environment: "happy-dom",
    setupFiles: ["./src/test/setup.ts"],
    css: true,
    exclude: ["**/tests/**", "**/node_modules/**"],
    coverage: {
      provider: "v8",
      all: true,
      reporter: ["text", "json", "html", "lcov"],
      exclude: ["node_modules", "tests", "dist", "**/*.config.*"],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70,
      },
    },
  },
});
