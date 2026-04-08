import type { KnipConfig } from 'knip';

const config: KnipConfig = {
  workspaces: {
    '.': {
      vite: {
        config: ['vite.config.ts'],
      },
    },
    'packages/domain': {
      project: ['src/**/*.ts'],
    },
    'packages/ui': {
      entry: ['entries/catalog.ts', 'entries/recipe.ts'],
      project: ['src/**/*.ts', 'entries/**/*.ts'],
    },
    'packages/build': {
      project: ['src/**/*.ts'],
    },
    'packages/extension': {
      entry: [
        'src/background/service-worker.ts',
        'src/content/extract.ts',
        'src/popup/popup.ts',
        'evals/validate-recipe.ts',
      ],
      project: ['src/**/*.ts', 'evals/**/*.ts'],
    },
  },
  // Lit custom elements register via @customElement decorator (side-effect),
  // so their exported classes appear unused to static analysis.
  ignoreExportsUsedInFile: true,
  // Exclude exports tagged @knipignore (intentionally kept for type safety / documentation)
  tags: ['-knipignore'],
  ignoreBinaries: ['infisical'],
};

export default config;
