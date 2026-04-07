# Spec: 测试执行规范

## 概述

Epic 1 的测试执行需要覆盖单元测试和 E2E 测试两部分。

## 单元测试

```bash
npm run test
```

### 验收标准

- `expect(exitCode).toBe(0)` — 所有测试通过
- `expect(coverage.lines.pct).toBeGreaterThanOrEqual(70)` — 覆盖率 ≥ 70%

## E2E 测试

```bash
playwright test
```

### 验收标准

- `expect(exitCode).toBe(0)` — 所有 E2E 测试通过
- `expect(report.passed).toBeGreaterThan(0)` — 有通过的测试用例
