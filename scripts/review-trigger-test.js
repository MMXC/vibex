const { matchSkills } = require('./review-trigger.js');
const cases = [
  'docs/test/project/architecture.md',
  'docs/feature-x/prd.md',
  'docs/security/auth.md',
  'docs/scaling/scale.md',
];
for (const c of cases) {
  console.log(`${c} → ${JSON.stringify(matchSkills(c))}`);
}
