import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: ['packages/engine', 'packages/content', 'apps/web'],
    coverage: {
      provider: 'v8',
      include: ['packages/engine/src/**/*.ts'],
      exclude: ['**/*.test.ts', '**/testing/**', '**/index.ts', '**/types.ts', '**/state.ts'],
      reporter: ['text-summary', 'text'],
      thresholds: { statements: 90, branches: 90, functions: 90, lines: 90 },
    },
  },
});
