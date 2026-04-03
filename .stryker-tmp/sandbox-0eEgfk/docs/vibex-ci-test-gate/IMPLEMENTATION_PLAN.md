# IMPLEMENTATION_PLAN: vibex-ci-test-gate

## 实施步骤

### Epic 1: CI Quality Gate
1. jest.config.ts 调整 coverageThreshold
2. package.json test script 增加 --json 输出
3. .github/workflows/test.yml 增加 Quality Gate step
4. 验证：测试失败时 CI blocking merge

## 验收
测试通过率 < 85% 时 CI 阻止 merge

## 实现记录

### Epic 1: CI Quality Gate ✅
- [x] jest.config.ts global threshold: 0 → 85 (lines/branches/functions/statements)
- [x] package.json 新增 test:json script
- [x] coverage-check.yml 新增 Quality Gate step (node scripts/check-coverage.js)
- [x] check-coverage.js threshold: 70 → 85
- 验收：测试通过率 < 85% 时 CI 阻止 merge

### 验证
- npm test -- --coverage: 覆盖率报告生成
- node scripts/check-coverage.js: 覆盖率低于 85% 时 exit(1)
