# AGENTS.md: VibeX 系统性风险治理路线图

**项目**: vibex-proposals-summary-20260402_061709
**版本**: v1.0
**日期**: 2026-04-02

---

## Dev 约束

### Sprint 0: CI 基线

1. **TypeScript 错误**
   - ✅ 优先修复 runtime-critical 文件
   - ❌ 禁止引入新的 TS 错误

2. **DOMPurify**
   - ✅ 使用 `overrides` 而非 `resolutions`

3. **Jest 配置**
   - ✅ 使用 `maxWorkers: 2` 防止 OOM
   - ❌ 禁止修改 jest.config.js 的 testMatch 覆盖现有测试

### Sprint 1: 用户体验

1. **三树 checkbox**
   - ✅ 统一使用 `confirmCheckbox` class
   - ✅ checkbox 在 type badge 前
   - ❌ 禁止在 ContextTree 中保留多个 checkbox

2. **FeedbackToken**
   - ✅ 所有删除操作使用 `useFeedback().show()`
   - ❌ 禁止新增 `window.confirm` 调用

### Sprint 2-3: Store 拆分

1. **Store 文件**
   - ✅ 每个子 store < 300 行
   - ✅ 使用 Zustand persist + devtools middleware
   - ❌ 禁止在 store 内直接操作 DOM

2. **迁移策略**
   - ✅ Phase 1: contextStore → 验证 → Phase 2
   - ✅ 每个 phase 后立即运行对应 E2E
   - ❌ 禁止一次性大量迁移

3. **API 兼容**
   - ✅ canvasStore 保持现有导出
   - ❌ 禁止删除任何现有 `useCanvasStore()` 调用

---

## Reviewer 约束

### 审查重点

1. **Sprint 0**
   - [ ] npm run build 退出码 0
   - [ ] 无 `error TS` 输出
   - [ ] DOMPurify 版本检查通过

2. **Sprint 1**
   - [ ] 三树 checkbox 数量一致（各 1 个）
   - [ ] window.confirm = 0（全文搜索）
   - [ ] nodeUnconfirmed 无 `var(--color-warning)`

3. **Sprint 2-3**
   - [ ] 子 store < 300 行
   - [ ] canvasStore < 200 行
   - [ ] 无循环依赖（ESLint no-cycle）

4. **Sprint 4**
   - [ ] E2E 通过率 ≥ 90%
   - [ ] 拖拽帧率 ≥ 55fps

### 驳回条件

- ❌ npm run build 失败
- ❌ 新增 `window.confirm`
- ❌ 子 store > 300 行
- ❌ E2E 通过率 < 90%

---

## Tester 约束

### E2E 测试优先级

1. `journey-create-context.spec.ts` — 最核心
2. `journey-generate-flow.spec.ts`
3. `journey-multi-select.spec.ts`

### 性能测试

| 测试 | 目标 |
|------|------|
| vitest 单元 | < 60s |
| 拖拽帧率 | ≥ 55fps |
| E2E 通过率 | ≥ 90% |

---

## 文件变更清单

### Sprint 0

| 文件 | 操作 |
|------|------|
| `package.json` | 添加 overrides.dompurify |
| `jest.config.js` | maxWorkers + testTimeout |
| `tsconfig.json` | 修复 include 路径 |

### Sprint 1

| 文件 | 操作 |
|------|------|
| `BoundedContextTree.tsx` | 删除多 checkbox，添加确认反馈 |
| `ComponentTree.tsx` | 修复 checkbox 位置 |
| `canvas.module.css` | 移除 nodeUnconfirmed 黄色边框 |
| `CONTRIBUTING.md` | 添加 UI 变更清单 |

### Sprint 2-3

| 文件 | 操作 |
|------|------|
| `contextStore.ts` | 新增 |
| `flowStore.ts` | 新增 |
| `componentStore.ts` | 新增 |
| `uiStore.ts` | 新增 |
| `canvasStore.ts` | 降为代理层 |

### Sprint 4

| 文件 | 操作 |
|------|------|
| `e2e/journey-*.spec.ts` | 新增 |
| `CanvasPage.tsx` | rAF 拖拽优化 |
