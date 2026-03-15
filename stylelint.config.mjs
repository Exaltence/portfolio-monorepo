/** @type {import('stylelint').Config} */
export default {
  extends: ['stylelint-config-standard-scss'],
  rules: {
    'no-empty-source': [true, { severity: 'warning' }],
  },
};
