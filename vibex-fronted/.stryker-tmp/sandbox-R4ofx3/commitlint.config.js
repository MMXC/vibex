// @ts-nocheck
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [2, 'always', ['feat', 'fix', 'docs', 'test', 'chore', 'refactor', 'perf', 'ci']],
    'subject-empty': [2, 'never'],
    'type-empty': [2, 'never'],
  },
};
