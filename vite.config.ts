import { defineConfig } from 'vite';
import { resolve } from 'path';
import { recipesPlugin } from './src/build/vite-plugin-recipes.js';

export default defineConfig({
  resolve: {
    alias: {
      '@domain': resolve(__dirname, 'src/domain'),
      '@ui': resolve(__dirname, 'src/ui'),
      '@build': resolve(__dirname, 'src/build'),
    },
  },
  build: {
    outDir: 'site',
    emptyOutDir: true,
  },
  plugins: [recipesPlugin()],
});
