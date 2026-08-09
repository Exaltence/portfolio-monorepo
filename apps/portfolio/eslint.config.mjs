import { defineConfig } from 'eslint/config';
import ngrx from '@ngrx/eslint-plugin/v9';
import baseConfig from '../../eslint.config.mjs';

export default defineConfig([
  ...baseConfig,
  {
    files: ['**/*.ts'],
    extends: [...ngrx.configs.signals, ...ngrx.configs.operators],
  },
]);
