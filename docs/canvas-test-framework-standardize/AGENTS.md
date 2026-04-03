# AGENTS.md: canvas-test-framework-standardize

**项目**: canvas-test-framework-standardize
**日期**: 2026-04-03

---

## 开发约束

### 测试框架边界（强制）

| 框架 | 测试类型 | 文件命名 | 目录 |
|------|---------|---------|------|
| Jest | 单元 + 集成 | `*.test.ts` | `src/__tests__/` 或同目录 |
| Playwright | E2E | `*.spec.ts` | `tests/e2e/` |
| Playwright | 可访问性 | `*.spec.ts` | `tests/a11y/` |

**禁止**:
- ❌ 在 `tests/e2e/` 下创建 `.test.ts` 文件
- ❌ 在 `src/__tests__/` 下创建 `.spec.ts` 文件
- ❌ 使用 Playwright 测试单元逻辑（应该用 Jest）
- ❌ 使用 Jest 测试真实 DOM 交互（应该用 Playwright）

### Jest 规范

```typescript
// jest.config.ts — 必须使用 testMatch
testMatch: ['**/*.test.ts'],
// 禁止使用 testPathIgnorePatterns 排除路径
testPathIgnorePatterns: ['/node_modules/'],
```

### Playwright 规范

```typescript
// playwright.config.ts — 基础配置（开发用）
// playwright.ci.config.ts — CI 专用（retries: 3）
// playwright.a11y.config.ts — 可访问性测试（独立）
```

### 覆盖率要求

| 指标 | 阈值 |
|------|------|
| 行覆盖 | ≥ 65% |
| 分支覆盖 | ≥ 50% |
| 函数覆盖 | ≥ 80% |

**分阶段阈值**:
1. Phase 1: 行 55% / 分支 40% / 函数 80%
2. Phase 2: 行 60% / 分支 45% / 函数 85%
3. Phase 3: 行 65% / 分支 50% / 函数 90%

### Flaky 测试约束

- retries = 3（在 CI 配置中强制）
- pass rate < 80% 的测试写入 `flaky-tests.json`
- Flaky 测试不得删除，必须保留并 skip
- 连续 5 次 CI 无 flaky 失败才移除 skip 标记

### 文件删除约束

**删除前必须对比**:
```bash
# 对比 tests/basic.spec.ts 和 tests/e2e/basic.spec.ts
diff tests/basic.spec.ts tests/e2e/basic.spec.ts
# 确保合并后的测试覆盖不减少
```

---

## 文件路径约定

```
vibex-fronted/
  playwright.config.ts              ← 保留（开发配置）
  playwright.ci.config.ts          ← 保留（CI 配置，retries=3）
  playwright.a11y.config.ts        ← 保留（可访问性配置）
  playwright.test.config.ts        ← 删除
  playwright-canvas-phase2.config.ts ← 删除
  playwright-canvas-crash-test.config.cjs ← 删除
  playwright.perf.config.ts        ← 删除

  jest.config.ts                   ← 修改（testMatch 规范化）

  tests/
    basic.spec.ts                  ← 删除（合并至 tests/e2e/basic.spec.ts）

  TESTING_STRATEGY.md             ← 新建

vibex-fronted/scripts/
  slack-alert.sh                  ← 新建
  daily-test-report.sh            ← 新建
  flaky-detector.sh               ← 新建
  flaky-tests.json                ← 新建（输出）
  coverage-report.sh              ← 新建
```

---

## CI 配置约定

```yaml
# .github/workflows/test.yml
npm脚本:
  jest: "jest --coverage --coverage-threshold.line=65 --coverage-threshold.branches=50"
  e2e: "playwright test --config=playwright.ci.config.ts"
  flaky: "bash scripts/flaky-detector.sh"
  daily: "bash scripts/daily-test-report.sh"
```

---

## 协作接口

### Dev ← Architect

| 约束项 | 内容 |
|--------|------|
| Jest 命名 | `*.test.ts`，禁止 `.spec.ts` |
| Playwright 命名 | `*.spec.ts`，禁止 `.test.ts` |
| 覆盖率 gate | 行 65% / 分支 50% |
| Flaky 策略 | skip 不删除 |

### Coord → Dev

- 覆盖率提升任务派发
- Flaky 测试分析
- CI 配置调整
