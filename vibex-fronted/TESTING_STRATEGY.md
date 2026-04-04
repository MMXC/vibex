# VibeX Testing Strategy

> Last updated: 2026-04-04 (E5 naming & directory standards)

## 测试框架职责边界

| 框架 | 测试范围 | 文件命名 | 目录 |
|------|---------|---------|------|
| Jest | 单元测试 + 集成测试 | `*.test.ts` | `src/__tests__/` 或同目录 `__tests__/` |
| Playwright | E2E 测试 | `*.spec.ts` | `tests/e2e/` |
| Playwright | 可访问性测试 | `*.spec.ts` | `tests/a11y/` |
| Playwright | 性能测试 | `*.spec.ts` | `tests/performance/` |
| Playwright | 合约测试 | `*.spec.ts` | `tests/contract/` |

## 文件命名规范

### ✅ 正确命名

```bash
# Jest 测试
src/lib/canvas/stores/historySlice.test.ts    # ✅ .test.ts 后缀
src/__tests__/useAutoSave.test.ts             # ✅
src/components/Button.test.tsx               # ✅

# Playwright E2E 测试
tests/e2e/canvas-api.spec.ts                 # ✅ .spec.ts 后缀
tests/e2e/auth-flow.spec.ts                   # ✅
tests/a11y/navigation.spec.ts                # ✅
tests/performance/load.spec.ts                # ✅
```

### ❌ 错误命名

```bash
# 错误后缀
src/components/Button.spec.tsx               # ❌ Playwright 文件放在 src/
tests/e2e/canvas-api.test.ts                 # ❌ Jest 后缀用于 Playwright 文件
tests/unit/canvas.test.ts                    # ❌ Playwright 文件放在 unit/

# 错误目录
src/components/Button.test.tsx               # ✅ OK (同目录)
tests/basic.spec.ts                          # ❌ 应该在 tests/e2e/
src/__tests__/canvas.spec.ts                 # ❌ Playwright 文件不应在 src/
```

## ESLint 强制执行

`eslint.config.mjs` 中的命名规范规则：

```javascript
{
  rules: {
    // E5: 强制测试文件命名约定
    // Jest: *.test.ts | Playwright: *.spec.ts
    'no-restricted-syntax': [
      'error',
      {
        selector: 'Literal[value=/\\.spec\\.(ts|tsx)$/]',
        message: 'Playwright spec files must be in tests/e2e/, tests/a11y/, or tests/performance/. Use .test.ts for Jest tests.',
      },
    ],
  },
}
```

## 目录结构规范

```
vibex-fronted/
├── src/
│   ├── __tests__/           # Jest 单元测试（可选）
│   │   └── *.test.ts
│   ├── lib/
│   │   └── canvas/
│   │       └── stores/
│   │           └── __tests__/   # 同模块目录 Jest 测试
│   │               └── *.test.ts
│   └── components/
│       └── __tests__/
│           └── *.test.ts
│
├── tests/
│   ├── unit/                # Jest 单元测试（可选）
│   │   └── *.test.ts
│   ├── e2e/                 # Playwright E2E 测试
│   │   └── *.spec.ts
│   ├── a11y/                # Playwright 可访问性测试
│   │   └── *.spec.ts
│   ├── performance/         # Playwright 性能测试
│   │   └── *.spec.ts
│   ├── contract/            # Playwright 合约测试
│   │   └── *.spec.ts
│   ├── fixtures/            # 共享测试数据
│   │   └── *.json
│   ├── flaky-helpers.ts     # Flaky 测试治理工具
│   ├── basic.spec.ts        # ❌ 已在 e2e/basic.spec.ts 合并
│   └── e2e.spec.ts         # 入口文件
│
├── playwright.config.ts     # 开发配置
├── playwright.ci.config.ts # CI 配置
├── playwright.a11y.config.ts
├── jest.config.ts
└── flaky-tests.json         # Flaky 测试注册表
```

## Jest 规范

```typescript
// jest.config.ts — 使用 testMatch 规范
export default {
  testMatch: ['**/*.test.ts'],
  // 禁止使用 testPathIgnorePatterns 排除路径依赖
  testPathIgnorePatterns: ['/node_modules/'],
  // 覆盖率阈值（E3 已达标）
  coverageThreshold: {
    global: {
      lines: 65,
      branches: 50,
      functions: 80,
    },
  },
};
```

## Playwright 规范

```typescript
// playwright.config.ts — 开发配置
export default defineConfig({
  retries: 3, // E4: Flaky governance
  workers: 1,  // 消除并行不确定性
  timeout: 60000,
  testMatch: ['**/*.spec.ts'], // E5: 命名规范
});

// playwright.ci.config.ts — CI 配置
export default defineConfig({
  retries: 3,
  workers: 1,
  setup: './playwright.setup.ts', // E4: Auto-skip flaky tests
});
```

## Flaky 测试治理（E4）

详见 `flaky-tests.json` 和 `scripts/flaky-detector.sh`。

**核心规则**：
- Flaky 测试：skip，从不删除
- pass rate < 80% → 写入 `flaky-tests.json`
- 连续 5 次 CI 无 flaky 失败 → 可移除 skip

## CI 质量门禁

- 行覆盖率 < 65% → CI 阻断
- 分支覆盖率 < 50% → CI 阻断
- E2E 测试失败 → Slack 告警 < 5min
