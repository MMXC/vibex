# AGENTS.md: vibex-eslint-perf-fix

## dev (impl-eslint-fix)
- 执行: 修改 package.json lint 脚本添加 `--cache --ignore-pattern 'tests/**'`
- 验证: `npm run lint` 耗时 < 30s
- 提交: git add + commit

## tester (test-eslint-fix)
- 执行: `npm run lint` + `npm test`
- 验证: lint < 30s, test 通过

## reviewer (review-eslint-fix)
- 检查: git diff --stat
- 检查: npm audit
- 更新: CHANGELOG.md
- 提交: git push
