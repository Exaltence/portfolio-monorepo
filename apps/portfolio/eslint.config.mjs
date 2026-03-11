import { defineConfig } from 'eslint/config';
import nx from '@nx/eslint-plugin';
import angular from 'angular-eslint';
import ngrx from '@ngrx/eslint-plugin/v9';
import baseConfig from '../../eslint.config.mjs';

export default defineConfig([
  ...baseConfig,
  ...nx.configs['flat/angular'],
  ...nx.configs['flat/angular-template'],
  {
    files: ['**/*.ts'],
    extends: [
      ...ngrx.configs.signals,
      ...ngrx.configs.operators,
    ],
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: 'app',
          style: 'camelCase',
        },
      ],
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: 'app',
          style: 'kebab-case',
        },
      ],
    },
  },
  {
    files: ['**/*.html'],
    // Override or add rules here
    rules: {},
  },
]);
