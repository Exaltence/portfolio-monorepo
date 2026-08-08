import playwright from 'eslint-plugin-playwright';
import baseConfig from '../../eslint.config.mjs';

export default [
  ...baseConfig,
  // Playwright recommended rules apply after base so test-specific rules take precedence
  playwright.configs['flat/recommended'],
  {
    files: ['**/*.ts', '**/*.js'],
    // Override or add rules here
    rules: {
      // Shared helpers that wrap `expect` still count as assertions
      'playwright/expect-expect': [
        'warn',
        { assertFunctionNames: ['expectFocusRing', 'expectScale'] },
      ],
    },
  },
];
