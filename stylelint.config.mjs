/** @type {import('stylelint').Config} */
export default {
  extends: ['stylelint-config-standard-scss'],
  rules: {
    'no-empty-source': [true, { severity: 'warning' }],
    /*
     * Motion timing lives in tokens only. `--motion-ease-standard` is byte-identical
     * to the `ease` keyword and `--motion-duration-scene` to `0.3s`, so literals are
     * invisible duplicates that no token change can reach.
     */
    'declaration-property-value-disallowed-list': [
      {
        '/^(transition|animation)(-(duration|delay|timing-function))?$/': [
          /(?<![\w-])\d*\.?\d+m?s(?![\w-])/,
          /(?<![\w-])(ease(-in)?(-out)?|linear|step-(start|end)|steps\()(?![\w-])/,
          /(?<![\w-])cubic-bezier\(/,
        ],
      },
      {
        message: (value) =>
          `Motion timing must come from a token, not the literal in "${value}" (see apps/portfolio/src/styles/_tokens.scss)`,
      },
    ],
    'selector-class-pattern': [
      '^[a-z][a-z0-9]*(-[a-z0-9]+)*(__[a-z0-9]+(-[a-z0-9]+)*)?(--[a-z0-9]+(-[a-z0-9]+)*)?$',
      {
        message: (selector) =>
          `Expected class selector "${selector}" to follow BEM (block__element--modifier, kebab-case)`,
      },
    ],
  },
};
