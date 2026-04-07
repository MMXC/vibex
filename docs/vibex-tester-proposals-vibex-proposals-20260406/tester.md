---
agent: tester
date: 2026-04-06
score: 8
---

# Tester Proposals — vibex-proposals-20260406

**周期**: 2026-04-06 Sprint
**作者**: Analyst
**状态**: ✅ 分析完成

---

## 0. Context Summary (2026-04-05 来源)

| 来源 | 关键发现 |
|------|----------|
| `test-coverage-gate` | Vitest 配置是死代码（jest.config.ts），Lines 79.06% / Branches 62.11% |
| `canvas-testing-strategy` | 6 个新 hook 覆盖率 0%，重构风险高 |
| `test-notify-fix` | `--notify` flag 存在重复通知问题 |
| `tester-test-commands` | npm scripts 碎片化，需统一 |
| `vibex-proposals-20260405-2` | 11 个 Canvas API 端点缺失，91.7% 覆盖率空白 |

---

## P0-1: 复活 Vitest Coverage Gate — 消除 Dead Code 配置

### Problem

`vitest.config.ts` 不存在，测试实际运行器 Vitest 读取的是 `jest.config.ts`（已废弃），导致：
- 覆盖率阈值 85% 永远无法触发（Vitest 不读 Jest 配置）
- `jest.config.ts` 是死代码，修改它不产生任何效果
- CI 覆盖率门控形同虚设，代码质量无保障

**影响**: Lines 79.06% / Branches 62.11% 的真实覆盖率被无效配置掩盖，降低 5% 也不会触发 CI 失败。

### Solution

1. 创建 `vitest.config.ts`，配置 `@vitest/coverage-v8` + 渐进式阈值
2. 将 `jest.config.ts` 标记为 `@deprecated`，避免团队继续维护
3. 初始化基线: `node scripts/coverage-diff.js --update-baseline`
4. 修复 CI: fork PR 也能触发 coverage check

**渐进式阈值**:
```
Phase 1 (立即):   Lines 75%, Branches 60%
Phase 2 (2周后): Lines 78%, Branches 63%
Phase 3 (4周后): Lines 80%, Branches 66%
Phase 4 (目标):  Lines 85%, Branches 70%
```

### Estimate

**2h**

### Acceptance Criteria

- [ ] `vitest.config.ts` 存在且 `vitest run --coverage` 正常输出
- [ ] `jest.config.ts` 已标记 `@deprecated`
- [ ] `coverage/baseline.json` 在 main 分支存在
- [ ] 本地运行 `vitest run` 低于阈值时 exit code != 0
- [ ] Fork PR 的 CI workflow 能触发 coverage check job

---

## P0-2: Canvas Hooks 零覆盖补测 — 6 Hooks 测试补写

### Problem

`canvas-testing-strategy` 分析确认 6 个新 hook 完全无测试覆盖：
- `useCanvasRenderer` (P0): 渲染计算 useMemo，边界错误静默损坏数据
- `useDndSortable` (P0): DnD 注册/解除有竞态窗口，拖拽数据不一致
- `useDragSelection` (P0): 框选状态机边界条件无覆盖
- `useCanvasSearch` (P1): 搜索过滤逻辑 debounce 无验证
- `useTreeToolbarActions` (P1): 工具栏操作 store 同步无验证
- `useVersionHistory` (P2): 历史版本回滚无测试

**影响**: 重构时任何边界条件遗漏（null 检查、竞态）只在 E2E/QA 阶段暴露，成本极高。

### Solution

使用 Option A 3层测试金字塔策略，按优先级分阶段实施：

```
Layer 1 (Unit, ~15h):  6 个 hook 单元测试
Layer 2 (Integration, ~8h): CanvasPage 集成测试
Layer 3 (E2E, ~4h): Playwright 扩展测试
```

**Phase 1 优先交付 (P0 hooks, ~8h)**:
- `useCanvasRenderer.test.tsx` (3h): node rects/edges computation, zoom factor
- `useDndSortable.test.tsx` (3h): DnD registration/cancel, sort/revert
- `useDragSelection.test.tsx` (2h): selection state machine, bounding box

### Estimate

**Phase 1 (P0 hooks)**: 8h  
**Phase 2 (P1 hooks)**: 5h  
**Phase 3 (P2 + Integration + E2E)**: 12h  
**Total**: 25h

### Acceptance Criteria

- [ ] 6 个 hook 测试文件全部存在且 CI PASS
- [ ] P0 hooks 分支覆盖率 ≥ 80%，关键分支（null/竞态）≥ 90%
- [ ] `pnpm test -- --coverage` hooks 层覆盖率提升 ≥ 15%
- [ ] CanvasPage 拆分前后集成测试行为一致
- [ ] 无 `test.only` 或 skipped tests 遗留

---

## P1-1: E2E 测试稳定性修复 — 消除 Flaky Tests

### Problem

Playwright E2E 测试存在 flaky tests（不稳定），表现为：
- 同一套件偶发失败，开发者对 CI 失去信心
- Flaky tests 掩盖真实 bug，降低测试套件价值
- Timing 依赖硬编码 `waitForTimeout`，跨环境不稳定

**典型根因**:
1. 硬编码 sleep 不适应不同网速/CI 环境
2. 并行测试间共享状态污染
3. 外部 API 调用无 retry 策略

### Solution

1. **Audit**: 运行测试套件 3-5 次，收集 flaky 测试清单
2. **分类修复**:
   - Timing: 替换 `waitForTimeout()` → `waitForSelector()` / `waitForResponse()`
   - 状态隔离: 每个测试 `test.beforeEach()` fresh state，禁止全局 singleton
   - 网络不稳定: API 调用加 retry + timeout
3. **Flaky 追踪**: 超过 2 次 flaky 的测试标记 `@flaky`，CI 超阈值报警

### Estimate

**8-10h** (Audit 2h + 修复 6-8h)

### Acceptance Criteria

- [ ] 连续 5 次 CI run flaky failure rate < 2%
- [ ] 所有硬编码 `waitForTimeout` 已替换为智能等待
- [ ] 并行 workers > 1 时无状态污染失败
- [ ] CI 中 flaky test 超阈值自动 Slack 报警

---

## P1-2: npm Test Scripts 统一 — 消除碎片化

### Problem

`package.json` 中的 npm scripts 存在碎片化和重复定义：
- 测试命令分散在 `test`, `test:watch`, `test:coverage`, `test:ci` 等多处
- `--notify` flag 在多个命令中重复出现（`test-notify-fix` 确认的 bug）
- 无统一的测试入口，开发者不清楚该用哪个命令

**影响**: 命令不一致导致 CI 配置混乱，`--notify` 重复导致通知轰炸。

### Solution

1. 审计 `package.json` 所有 test 相关 scripts
2. 统一为清晰的分层结构：
   ```
   test        — 快速本地测试（无 coverage）
   test:full   — 完整测试 + coverage
   test:ci     — CI 环境（reporter + coverage）
   test:watch  — watch 模式
   ```
3. 修复 `--notify` 重复：只在 `test:ci` 中启用，避免本地多次触发
4. 添加 `pre-push` hook: `vitest run --changed` 只测变更文件

### Estimate

**3h**

### Acceptance Criteria

- [ ] `package.json` 中 test scripts ≤ 5 个，职责清晰
- [ ] `--notify` 只在 `test:ci` 中出现，本地命令无重复通知
- [ ] `pnpm test` 和 `pnpm test:ci` 输出差异明确
- [ ] 新开发者阅读 `package.json` 能立即理解该用哪个命令

---

## P2-1: Canvas API E2E 测试覆盖 — 23 端点 Smoke Tests

### Problem

Canvas API 端点实现正在进行（91.7% 端点缺失需补充），但当前没有对应的 E2E 测试套件：
- API 行为变更只能手动发现
- 集成风险高：新端点可能破坏现有端点契约
- 无 regression suite，每次变更需完整手动回归

### Solution

基于 `vibex-proposals-20260405-2` 分析的 23 个缺失端点，建立 Playwright API smoke 测试：

```
tests/api/
  ├── smoke/          (5 min) 每个端点 1 个 happy path
  ├── contract/       (15 min) request/response schema 验证
  └── integration/    (30 min) 端点间数据流（create→update→delete）
```

使用 `playwright/test` 的 `request` API，环境变量驱动（`BASE_URL`, `API_TOKEN`）。

### Estimate

**12-16h** (smoke + contract + 关键 integration)

### Acceptance Criteria

- [ ] 23 个端点每个至少有 1 个 smoke test
- [ ] Smoke tests 在 CI 中 100% 通过（连续 3 次）
- [ ] Contract tests 对所有端点 request/response 有断言
- [ ] 测试报告在每次 PR 中可见

---

## Summary

| # | Proposal | Priority | Estimate | Key Dependencies |
|---|----------|----------|----------|-----------------|
| 1 | Vitest Coverage Gate 复活 | **P0** | 2h | vitest.config.ts 创建 |
| 2 | 6 Hooks 零覆盖补测 (P0) | **P0** | 8h | canvas-testing-strategy 分析结果 |
| 3 | E2E Flaky Tests 修复 | **P1** | 8-10h | 当前测试套件 audit |
| 4 | npm Test Scripts 统一 | **P1** | 3h | package.json audit |
| 5 | Canvas API 23 端点 E2E | **P2** | 12-16h | canvas-api-completion 端点清单 |

**本周期总工时估算**: P0 10h + P1 11-13h + P2 12-16h = **33-39h**

**建议执行**: P0 全量 + P1 并行（scripts 统一 + flaky 修复可并行） + P2 视资源决定

---

*Generated by Analyst — 2026-04-06 03:00 GMT+8*
