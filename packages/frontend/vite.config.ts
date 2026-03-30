import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { readFileSync } from "node:fs";

const pkg = JSON.parse(readFileSync(path.resolve(__dirname, "package.json"), "utf-8"));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, path.resolve(__dirname, "../.."), "");
  const frontendPort = parseInt(env.FRONTEND_PORT || "3000", 10);

  return {
    envDir: "../..",
    define: {
      __APP_VERSION__: JSON.stringify(pkg.version),
    },
    plugins: [
      react({
        babel: {
          plugins: [["babel-plugin-react-compiler", { target: "19" }]],
        },
      }),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      port: frontendPort,
      host: true,
      proxy: {
        "/api": {
          target: `http://localhost:${env.API_PORT || "8888"}`,
          changeOrigin: true,
        },
        "/v1/traces": {
          target: `http://localhost:${env.OTEL_COLLECTOR_PORT || "4318"}`,
          changeOrigin: true,
        },
      },
    },
    preview: {
      port: frontendPort,
      host: true,
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            "vendor-react": ["react", "react-dom", "react/jsx-runtime"],
            "vendor-mui-core": ["@mui/material"],
            "vendor-mui-icons": ["@mui/icons-material"],
            "vendor-xstate": ["xstate", "@xstate/react"],
          },
        },
      },
      chunkSizeWarningLimit: 600,
    },
  };
});
