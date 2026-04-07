# Tester Proposals — vibex-proposals-20260407

**周期**: 2026-04-07
**作者**: Analyst
**状态**: 已分析

---

## P0-1: Canvas Testing Pyramid Phase 1 — Unit Tests for 6 Untested Hooks

### Problem / Opportunity

Canvas 功能目前有 6 个新增 hooks 缺乏单元测试覆盖，导致以下风险：
- Hook 逻辑 bug 无法被提前发现，只能在 E2E 阶段暴露
- 重构时无安全网，开发者信心不足
- 当前测试覆盖率 79%，但 hooks 层是覆盖率最薄弱的环节

### Solution

在 `packages/canvas/src/hooks/` 下为 6 个 untested hooks 补充单元测试，使用 Vitest + `@testing-library/react`。

**目标 hooks**（具体列表待从 canvas-testing-strategy 分析结果中确认，假设为 `useCanvasViewport`, `useCanvasSelection`, `useCanvasHistory`, `useCanvasSync`, `useCanvasZoom`, `useCanvasTool`）。

### Implementation Sketch

```
packages/canvas/src/hooks/__tests__/
  ├── useCanvasViewport.test.tsx
  ├── useCanvasSelection.test.tsx
  ├── useCanvasHistory.test.tsx
  ├── useCanvasSync.test.tsx
  ├── useCanvasZoom.test.tsx
  └── useCanvasTool.test.tsx
```

- 每个 hook 测试文件包含：happy path、error state、edge case（空数据、并发更新）
- 使用 `vi.mock()` mock Canvas context provider
- 覆盖率目标：每个 hook ≥ 85% 分支覆盖

### Impact

| 项目 | 估算 |
|------|------|
| **工时** | 6–8h |
| **覆盖率提升** | hooks 层 +15–20% |
| **Bug 提前发现率** | 预计减少 30% E2E 阶段 hooks 相关 bug |

### Priority

**P0** — 直接影响代码质量基线，E2E 测试无法有效替代

### Verification Criteria

- [ ] 6 个 hook 测试文件全部存在且 CI 通过
- [ ] `npm run test -- --coverage` hooks 层覆盖率 ≥ 85%
- [ ] 无 `test.only` 或 skipped tests 遗留
- [ ] PR reviewer 可在 coverage report 中看到具体行覆盖率

---

## P0-2: Vitest Coverage Threshold Fix — Live Config, Not Dead Code

### Problem / Opportunity

当前 `vitest.config.ts` 中的 `coverage.thresholds` 配置为硬编码值（79%），但存在两个问题：

1. **配置与实际代码脱节**：部分被计价的文件是已废弃的 legacy 模块，导致阈值无法真实反映有效代码质量
2. **配置是"死"的**：新 PR 降低覆盖率时 CI 不会主动 fail，只有手动检查 coverage report 才能发现

### Solution

1. 清理 `coverage.exclude` 列表，排除所有 legacy/dead code 模块
2. 启用 `coverage.thresholds.perFile` 逐文件阈值，防止单文件覆盖率滑坡
3. 在 CI 中加入 `vitest --coverage --changed` 只对变更文件强制更严格的阈值（≥ 90%）
4. 在 `package.json` 添加 `pre-push` hook 自动运行相关测试

### Implementation Sketch

```ts
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      exclude: [
        'src/**/*.legacy.*',     // 废弃模块
        'src/__mocks__/**',
        'src/types/**',
        '**/*.d.ts',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 70,
        statements: 80,
        perFile: {
          'src/canvas/**': { lines: 85, functions: 85 },
          'src/hooks/**':  { lines: 90, functions: 90 },
        },
      },
    },
  },
})
```

### Impact

| 项目 | 估算 |
|------|------|
| **工时** | 2–3h（配置调整 + CI 集成） |
| **配置有效性** | 消除 dead code 对阈值的虚假稀释 |
| **Bug 预防** | 覆盖率滑坡在 CI 阶段即拦截 |

### Priority

**P0** — 质量门禁基础设施，P0 bug 修复的前提保障

### Verification Criteria

- [ ] `vitest.config.ts` 中 dead code 文件全部在 `coverage.exclude` 中
- [ ] `coverage.thresholds` 包含 `perFile` 配置
- [ ] PR 合入后 coverage report 中 `lines` 指标真实反映有效代码
- [ ] CI 中 coverage check 不再被 dead code 稀释导致误通过

---

## P1-1: Canvas API E2E Tests — 23 Endpoints Coverage

### Problem / Opportunity

Canvas API completion epic 预计实现 23 个新端点，当前没有对应的 API E2E 测试套件。这导致：
- API 行为变更只能在手动测试中发现
- 集成风险高：新增端点可能破坏现有端点契约
- 没有 regression suite，每次 API 变更都需要完整回归测试

### Solution

建立 Playwright API 测试套件，覆盖所有 23 个 Canvas API 端点。

**测试分层**：
- **Smoke tests** (5 min): 每个端点 1 个 happy path，CI 每次 push 执行
- **Contract tests** (15 min): 请求/响应 schema 验证，使用 OpenAPI schema auto-generation
- **Integration tests** (30 min): 端点间数据流验证（如 create → update → delete）

### Implementation Sketch

```
tests/
  ├── api/
  │   ├── smoke/
  │   │   ├── canvas-node.test.ts
  │   │   ├── canvas-layer.test.ts
  │   │   └── ...
  │   ├── contract/
  │   │   └── canvas-schema.test.ts
  │   └── integration/
  │       └── canvas-crud-flow.test.ts
  └── playwright.config.ts
```

- 使用 `playwright/test` 的 `request` API 发送 HTTP 请求
- 环境变量驱动：`BASE_URL`, `API_TOKEN`
- 端点列表按 canvas-api-completion 的 23 个端点清单（待确认具体端点列表）

### Impact

| 项目 | 估算 |
|------|------|
| **工时** | 12–16h（smoke + contract + 关键 integration） |
| **覆盖率** | 23 个端点 × 3 层 = 69 个测试用例 |
| **自动化价值** | 每次 API 变更自动拦截 breaking changes |

### Priority

**P1** — API 是 canvas 核心依赖，测试覆盖率是发布质量的必要条件

### Verification Criteria

- [ ] 23 个端点每个至少有 1 个 smoke test
- [ ] Smoke tests 在 CI 中 100% 通过（无 flaky）
- [ ] Contract tests 对所有端点的 request/response schema 有断言
- [ ] 测试报告在每次 PR 中可见（不只藏在 CI logs）

---

## P1-2: Playwright Test Stabilization — Flaky Tests Fix

### Problem / Opportunity

当前 Playwright E2E 测试存在 flaky tests（不稳定测试），表现为：
- 同一套件在不同 CI runs 中偶发失败
- 测试结果不可靠导致开发者对 CI 失去信心
- Flaky tests 掩盖真实 bug，降低整个测试套件的价值

典型原因：
- 页面加载等待不足（硬编码 sleep vs. 智能 wait）
- 并行测试间共享状态污染
- 网络不稳定场景未做 retry 策略

### Solution

1. **Audit 当前测试**：运行测试套件 5 次，收集 flaky 测试清单（目标文件：`tests/flaky-report.json`）
2. **分类修复**：
   - **Timing 问题**：替换 `page.waitForTimeout()` 为 `page.waitForSelector()` 或 `page.waitForResponse()`
   - **状态污染**：每个测试使用独立 `test.beforeEach()` 初始化 fresh state，禁用全局 singleton
   - **Network instability**：对外部 API 调用添加 `page.waitForResponse()` 带 timeout，并配置 retry
3. **建立 flaky test 追踪**：超过 2 次 flaky 的测试标记 `@flaky`，并设置最大重试次数
4. **CI 改进**：CI 中 flaky test 超阈值自动报警，阻止合入

### Implementation Sketch

```typescript
// 修复示例：Timing
// Before (flaky)
await page.waitForTimeout(1000);
await page.click('#save-btn');

// After (stable)
await page.waitForResponse('**/api/save');
await page.click('#save-btn');

// 并行测试隔离
test.beforeEach(async ({ page }) => {
  await page.goto('/reset'); // 每个测试前重置状态
  await createFreshCanvas(page); // 隔离的数据环境
});
```

### Impact

| 项目 | 估算 |
|------|------|
| **工时** | 8–12h（audit 2h + 修复 6–10h） |
| **CI 可靠性** | 目标：连续 5 次 run 无 flaky failure |
| **开发者效率** | 减少因 flaky CI 导致的重复调试时间 |

### Priority

**P1** — 测试基础设施健康度，直接影响开发效率和 CI 可靠性

### Verification Criteria

- [ ] 运行完整测试套件 5 次，flaky failure rate < 2%
- [ ] 所有 `waitForTimeout` 硬编码 sleep 已替换为智能等待
- [ ] 并行测试（`workers > 1`）无状态污染失败
- [ ] CI 中 flaky tests 超过阈值自动发送 Slack 报警

---

## P2-1: Test Data Factory — Fixtures for Canvas Component Tests

### Problem / Opportunity

Canvas 组件测试中，测试数据（canvas nodes, layers, viewport states）目前在每个测试文件中重复手工构造，导致：
- **数据不一致**：同一类型的数据在不同测试中格式不统一
- **维护成本高**：数据 schema 变更时需要修改大量测试文件
- **测试可读性差**：setup 代码膨胀，测试意图被淹没

### Solution

建立 `tests/factories/` 目录，提供类型安全的测试数据工厂函数。

**核心工厂**：

| 工厂 | 用途 |
|------|------|
| `canvasNodeFactory()` | 生成各类 CanvasNode（rect, ellipse, path, group） |
| `canvasLayerFactory()` | 生成 CanvasLayer 及嵌套结构 |
| `viewportStateFactory()` | 生成 viewport 配置（zoom, pan, bounds） |
| `canvasProjectFactory()` | 生成完整 CanvasProject（含 nodes, layers, metadata） |

**工厂特性**：
- 支持 override 参数：默认生成 valid 数据，测试特定场景时只 override 必要字段
- 类型推断：基于 TypeScript 泛型，IDE autocomplete 支持
- 可复现：使用 seeded random 保证同一输入产生相同输出（利于 debug）

### Implementation Sketch

```typescript
// tests/factories/canvasNodeFactory.ts
export interface CanvasNodeOverrides {
  id?: string;
  type?: 'rect' | 'ellipse' | 'path' | 'group';
  bounds?: { x: number; y: number; width: number; height: number };
  style?: Partial<NodeStyle>;
}

export function canvasNodeFactory(overrides: CanvasNodeOverrides = {}): CanvasNode {
  const seed = overrides.id ?? nanoid();
  const rng = seedrandom(seed);

  return {
    id: seed,
    type: 'rect',
    bounds: { x: 0, y: 0, width: 100, height: 100 },
    style: defaultStyle,
    ...overrides, // 支持部分覆盖
  };
}

// 使用示例
test('renders node with custom style', () => {
  const node = canvasNodeFactory({ type: 'ellipse', style: { fill: '#FF0000' } });
  render(<CanvasNode node={node} />);
  expect(screen.getByTestId('canvas-node')).toHaveAttribute('data-type', 'ellipse');
});
```

### Impact

| 项目 | 估算 |
|------|------|
| **工时** | 6–8h（工厂定义 + 在现有测试中迁移） |
| **维护效率** | 数据 schema 变更只需修改工厂函数 |
| **测试质量** | 数据一致性和覆盖率将显著提升 |

### Priority

**P2** — 长期效率提升，非阻塞性改进

### Verification Criteria

- [ ] `tests/factories/` 包含所有 4 个核心工厂
- [ ] 所有工厂有 TypeScript 类型覆盖
- [ ] 现有测试中重复数据构造代码已迁移至工厂（≥ 50%）
- [ ] 工厂生成的测试数据可通过 visual snapshot 验证合理性

---

## Summary

| # | Proposal | Priority | 工时 | 关键依赖 |
|---|----------|----------|------|----------|
| 1 | Canvas Testing Pyramid Phase1 — 6 Hooks 单元测试 | **P0** | 6–8h | canvas-testing-strategy 分析结果 |
| 2 | Vitest Coverage Threshold Fix | **P0** | 2–3h | 确认 dead code 边界 |
| 3 | Canvas API E2E Tests — 23 Endpoints | **P1** | 12–16h | canvas-api-completion 端点清单 |
| 4 | Playwright Test Stabilization | **P1** | 8–12h | 当前测试套件 audit |
| 5 | Test Data Factory | **P2** | 6–8h | 无外部依赖 |

**本周期总工时估算**：P0 8–11h + P1 20–28h + P2 6–8h = **34–47h**

---

*Generated by Analyst — 2026-04-05*
