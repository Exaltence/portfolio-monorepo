'use strict';

const { execSync } = require('child_process');

const branch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
const pattern =
  /^(main|develop|feature\/[a-z0-9._-]+|fix\/[a-z0-9._-]+|hotfix\/[a-z0-9._-]+|release\/[a-z0-9._-]+|chore\/[a-z0-9._-]+|docs\/[a-z0-9._-]+)$/;

if (!pattern.test(branch)) {
  console.error(
    `ERROR: Branch name "${branch}" does not match allowed patterns.`,
  );
  console.error(
    'Allowed: main, develop, feature/<slug>, fix/<slug>, hotfix/<slug>, release/<slug>, chore/<slug>, docs/<slug>',
  );
  console.error('Slug regex: [a-z0-9._-]+');
  process.exit(1);
}
