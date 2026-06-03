import baseConfig from '../../../eslint.config.mjs';

export default [
  ...baseConfig,
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.mts', '**/*.cts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: ['@angular/*', '@ngrx/*'],
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Decorator',
          message:
            'Decorators are not allowed in util libraries. Keep util code framework-agnostic.',
        },
        {
          selector: "CallExpression[callee.name='inject']",
          message:
            'inject() is not allowed in util libraries. Keep util code framework-agnostic.',
        },
      ],
    },
  },
];
