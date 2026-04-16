import { defineConfig } from 'vite';
import { resolve } from 'path';
import { recipesPlugin } from './packages/build/src/vite-plugin-recipes.js';

import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: './',
  resolve: {
    alias: {
      '@recipe/domain': resolve(__dirname, 'packages/domain/src'),
      '@recipe/ui': resolve(__dirname, 'packages/ui/src'),
      '@recipe/build': resolve(__dirname, 'packages/build/src'),
      '@recipe/atproto': resolve(__dirname, 'packages/atproto/src'),
    },
  },
  build: {
    outDir: 'site',
    emptyOutDir: true,
  },
  plugins: [
    recipesPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: null, // We import virtual:pwa-register in entry modules
      manifest: {
        name: "Hob",
        short_name: "Hob",
        description: "Step-by-step cooking with timers and parallel task management",
        start_url: "./",
        scope: "./",
        display: "standalone",
        background_color: "#1a1a2e",
        theme_color: "#1a1a2e",
        icons: [
          { src: "icon.svg", sizes: "any", type: "image/svg+xml" },
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icon-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg}'],
        navigateFallback: 'offline.html',
        // OAuth callback and runtime recipe routes must bypass the offline
        // fallback so the SW serves the precached shells for them instead of
        // offline.html. /r/ is the dynamic PDS recipe renderer.
        navigateFallbackDenylist: [/^\/auth\/callback/, /^\/r\//],
      },
      devOptions: {
        enabled: true,
      },
    })
  ],
});
