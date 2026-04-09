import { defineConfig, type UserConfig } from 'vite';
import { resolve } from 'path';
import { copyFileSync, mkdirSync, existsSync, readdirSync } from 'fs';

/**
 * Chrome extension needs different output formats per entry:
 * - content-script: IIFE (injected as classic script via chrome.scripting.executeScript)
 * - service-worker: ES module ("type": "module" in manifest.json)
 * - popup: ES module (<script type="module"> in popup.html)
 *
 * Vite/Rollup can't mix formats in one build, so we use an env var
 * to select which entry to build. The npm scripts run all three.
 */

const sharedResolve = {
  alias: {
    '@recipe/domain': resolve(__dirname, '../domain/src'),
  },
};

const entry = process.env.EXT_ENTRY ?? 'all';

function getConfig(): UserConfig {
  switch (entry) {
    case 'content-script':
      return {
        resolve: sharedResolve,
        build: {
          outDir: 'dist',
          emptyOutDir: false,
          target: 'esnext',
          minify: false,
          lib: {
            entry: resolve(__dirname, 'src/content/extract.ts'),
            formats: ['iife'],
            name: 'RecipeExtract',
            fileName: () => 'content-script.js',
          },
          rollupOptions: {
            output: {
              // Ensure everything is inlined — no external chunks
              inlineDynamicImports: true,
            },
          },
        },
      };

    case 'service-worker':
      return {
        resolve: sharedResolve,
        build: {
          outDir: 'dist',
          emptyOutDir: false,
          target: 'esnext',
          minify: false,
          rollupOptions: {
            input: { 'service-worker': resolve(__dirname, 'src/background/service-worker.ts') },
            output: {
              entryFileNames: '[name].js',
              chunkFileNames: 'chunks/[name].js',
              format: 'es',
              inlineDynamicImports: true,
            },
          },
        },
      };

    case 'popup':
      return {
        resolve: sharedResolve,
        build: {
          outDir: 'dist',
          emptyOutDir: false,
          target: 'esnext',
          minify: false,
          rollupOptions: {
            input: { popup: resolve(__dirname, 'src/popup/popup.ts') },
            output: {
              entryFileNames: '[name].js',
              format: 'es',
              inlineDynamicImports: true,
            },
          },
        },
      };

    default:
      // Fallback: won't be used since npm script runs 3 passes
      return {
        resolve: sharedResolve,
        build: {
          outDir: 'dist',
          emptyOutDir: true,
          target: 'esnext',
          minify: false,
          rollupOptions: {
            input: {
              'content-script': resolve(__dirname, 'src/content/extract.ts'),
              'service-worker': resolve(__dirname, 'src/background/service-worker.ts'),
              popup: resolve(__dirname, 'src/popup/popup.ts'),
            },
            output: {
              entryFileNames: '[name].js',
              chunkFileNames: 'chunks/[name].js',
              format: 'es',
            },
          },
        },
      };
  }
}

export default defineConfig({
  ...getConfig(),
  plugins: [
    {
      name: 'copy-extension-files',
      writeBundle() {
        const dist = resolve(__dirname, 'dist');
        mkdirSync(dist, { recursive: true });
        // Only copy static files if they don't exist yet (avoid overwriting)
        const pairs = [
          ['manifest.json', 'manifest.json'],
          ['src/popup/popup.html', 'popup.html'],
          ['src/popup/popup.css', 'popup.css'],
        ] as const;
        for (const [src, dest] of pairs) {
          const destPath = resolve(dist, dest);
          if (!existsSync(destPath)) {
            copyFileSync(resolve(__dirname, src), destPath);
          }
        }
        // Copy icons directory
        const iconsDir = resolve(dist, 'icons');
        if (!existsSync(iconsDir)) {
          mkdirSync(iconsDir, { recursive: true });
          const srcIcons = resolve(__dirname, 'icons');
          for (const file of readdirSync(srcIcons)) {
            copyFileSync(resolve(srcIcons, file), resolve(iconsDir, file));
          }
        }
      },
    },
  ],
});
