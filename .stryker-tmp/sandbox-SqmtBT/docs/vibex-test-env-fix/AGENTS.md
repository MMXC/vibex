# AGENTS.md: vibex-test-env-fix

## Dev
- 修改 pre-test-check.js ESLint 阈值
- 修复 CardTreeNode.test.tsx mock
- 修改 jest.config.ts 覆盖率阈值

## Tester
- 验证 npm test 正常运行
- 验证 CardTreeNode 15/15 通过
- 验证覆盖率不阻止 CI

## Reviewer
- 检查 pre-test-check.js 修改是否最小化
- 检查 jest.config.ts 是否只对 canvas 设置阈值
- 检查 CardTreeNode mock 是否稳定
