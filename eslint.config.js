import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['**/dist/**', '**/coverage/**', '**/dev-dist/**', '**/playwright-report/**'] },
  ...tseslint.configs.recommended,
  {
    // The engine must stay pure: no clock, no randomness, no framework.
    files: ['packages/engine/src/**/*.ts'],
    ignores: ['**/*.test.ts'],
    rules: {
      'no-restricted-globals': ['error', 'Date', 'window', 'document', 'localStorage'],
      'no-restricted-properties': [
        'error',
        { object: 'Math', property: 'random', message: 'Use the seeded Rng.' },
      ],
    },
  },
);
