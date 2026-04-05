# Canvas Testing Strategy — Requirements Analysis

**项目**: canvas-testing-strategy | **角色**: Analyst | **日期**: 2026-04-05

---

## 1. Problem Statement

**canvas-split-hooks 重构存在重大回归风险。**

`CanvasPage.tsx`（1120 行）正在被拆分为 6 个独立 hooks：
- `useCanvasState` ✅ 已完成（551 行测试）
- `useCanvasRenderer` ⬜ 待拆分（无测试）
- `useCanvasSearch` ⬜ 待拆分（无测试）
- `useDndSortable` ⬜ 待拆分（无测试）
- `useDragSelection` ⬜ 待拆分（无测试）
- `useTreeToolbarActions` ⬜ 待拆分（无测试）
- `useVersionHistory` ⬜ 待拆分（无测试）

7 个新 hook 中 6 个无任何测试覆盖。重构过程中任何边界条件遗漏（如 null 检查、store 不存在时的降级、竞态条件）都不会被自动发现，直到人工 QA 阶段才能暴露——成本极高。

---

## 2. Current State Analysis

### 2.1 现有测试资产清点

| 类别 | 文件数 | 测试行数 | 覆盖情况 |
|------|--------|---------|---------|
| `__tests__/canvas/` 集成测试 | 4 | 1079 | ✅ 覆盖 panning/zoom/drag/grouping |
| `hooks/canvas/` 单元测试 | 3 | 986 | ✅ useCanvasState/useCanvasEvents/useAIController |
| `hooks/canvas/__tests__/` | 2 | 412 | ✅ useAutoSave/useCanvasExport |
| `lib/canvas/stores/` 单元测试 | 5 | 1012 | ✅ 所有 Zustand stores |
| `lib/canvas/api/` 单元测试 | 3 | 363 | ✅ API 层 |
| `components/canvas/` 组件测试 | 10+ | ~600 | ✅ 左侧栏/树/选择/导出/面板等 |
| **总计** | **~30** | **~4477** | **覆盖约 60% 的 canvas 代码** |

### 2.2 Hook 测试覆盖矩阵

| Hook | 测试状态 | 行数 | 优先级 | 说明 |
|------|---------|------|--------|------|
| `useCanvasState` | ✅ 完整 | 551 | - | 覆盖 90%+ 分支 |
| `useCanvasEvents` | ✅ 完整 | 358 | - | 覆盖主要事件流 |
| `useAIController` | ✅ 基础 | 77 | - | 基础覆盖 |
| `useAutoSave` | ✅ 完整 | 294 | - | 覆盖 debounce/save |
| `useCanvasExport` | ✅ 基础 | 118 | - | 基础覆盖 |
| **`useCanvasRenderer`** | ❌ 无 | **~200** | **P0** | memoized 渲染计算，边界计算 |
| **`useCanvasSearch`** | ❌ 无 | **~150** | **P1** | 搜索过滤逻辑 |
| **`useDndSortable`** | ❌ 无 | **~200** | **P0** | 拖拽排序，竞态风险高 |
| **`useDragSelection`** | ❌ 无 | **~150** | **P0** | 框选逻辑 |
| **`useTreeToolbarActions`** | ❌ 无 | **~200** | **P1** | 工具栏操作 |
| **`useVersionHistory`** | ❌ 无 | **~150** | **P2** | 历史版本 |
| `useCanvasStore` | ❌ 无 | - | P2 | Zustand store wrapper |

### 2.3 关键风险 Hook 分析

**P0 无测试 Hook（必须优先覆盖）:**

1. **`useCanvasRenderer`** — 所有渲染计算（node rects、edges、TreeNode 数组）均为 `useMemo`。重构时如果计算顺序改变或引用丢失，会静默产生错误的边或节点。**风险：静默数据损坏**。

2. **`useDndSortable`** — 涉及 React DnD 的 drag source / drop target 注册，store 写入有竞态窗口。**风险：拖拽时数据不一致**。

3. **`useDragSelection`** — 已有 `dragSelection.test.tsx` 组件测试（329 行），但组件级测试不覆盖 hook 的 `handleMouseDown/Move/Up` 边界条件（如跨组件拖出、多选重叠）。**风险：边界情况回归**。

---

## 3. Solution Options

### 3.1 Option A: 3层测试金字塔（推荐）

```
        ┌──────────────────────────┐
        │   Layer 3: E2E (Playwright) │  ~4h — 用户完整流程
        └────────────┬─────────────┘
                     │ 2-3个关键路径
        ┌────────────▼─────────────┐
        │  Layer 2: Integration    │  ~8h — CanvasPage + mock stores
        └────────────┬─────────────┘
                     │ 每个hook的集成点
        ┌────────────▼─────────────┐
        │  Layer 1: Unit (renderHook)│  ~15h — 纯逻辑 + 边界
        └──────────────────────────┘
Total: ~27h
```

**Layer 1 Unit Tests (每个新 hook):**
- `useCanvasRenderer.test.tsx` — 覆盖所有 useMemo 计算分支
- `useCanvasSearch.test.tsx` — 搜索/过滤逻辑
- `useDndSortable.test.tsx` — DnD 注册/解除/排序
- `useDragSelection.test.tsx` — 框选状态机
- `useTreeToolbarActions.test.tsx` — 工具栏操作
- `useVersionHistory.test.tsx` — 历史记录

**Layer 2 Integration Tests:**
- CanvasPage 集成测试（mock 所有 stores + hooks），验证拆分后组件仍正常渲染
- 新增 `CanvasPage-split-hooks.integration.test.tsx` 覆盖主要用户路径

**Layer 3 E2E:**
- 扩展现有 Playwright canvas 测试，增加 panning/zoom/拖拽路径

**优点**: 完整覆盖，层间互相验证，可持续维护  
**缺点**: 工作量大（27h），需要维护 mock store fixtures

---

### 3.2 Option B: 快照测试 + 关键路径集成

```
Phase 1 (8h): 每个新 hook 的快照测试
  └─ 渲染 hook，记录输出 shape，提取后对比快照 diff

Phase 2 (6h): CanvasPage 关键路径集成测试  
  └─ 3-5个核心用户路径（pan+zoom、拖拽、搜索）

Phase 3 (4h): 回归套件（复用现有 ~30 个测试文件）
  └─ 确保拆分后现有测试全部通过
Total: ~18h
```

**优点**: 快速建立安全网，snapshot diff 直观  
**缺点**: 快照脆弱（UI 变化触发大量 diff），无法测试内部状态机行为

---

### 3.3 Option C: 契约测试优先

```
Phase 1 (4h): 定义 hook 契约（输入/输出 TypeScript 类型 + 行为接口）
Phase 2 (12h): 每个 hook 按契约实现测试（property-based + example-based）
Phase 3 (6h): CanvasPage 集成验证契约实现
Total: ~22h
```

**优点**: 契约即文档，重构时契约不变则测试不变  
**缺点**: 引入契约定义层，前期开销大；需要团队统一契约格式

---

## 4. Recommended Solution: Option A (3层测试金字塔)

### 理由

1. **风险覆盖最完整**: canvas-split-hooks 的风险来自静默回归（边计算错误、拖拽竞态），只有单元测试能精确捕获这些边界条件。快照和 E2E 无法覆盖。
2. **现有基础设施支撑**: 项目已有完善的 Jest + renderHook + MSW + Playwright 体系，可以直接复用 mock 模式（参考 `useCanvasState.test.tsx`）。
3. **长期价值**: 6 个新 hook 未来会持续演进，完整的测试金字塔是最低维护成本的保障。
4. **增量可行**: 可以按 Epic 拆分阶段（E2→E6）逐个 hook 补充测试，不阻塞开发。

**不选 B 的原因**: CanvasRenderer 的 useMemo 计算不产生可见 UI 差异，快照无法验证计算正确性。  
**不选 C 的原因**: 契约测试引入额外抽象层，在时间压力下 ROI 不足。

---

## 5. Test Pyramid — Detailed Plan

### Layer 1: Unit Tests (~15h)

#### E2: useCanvasRenderer (P0, 3h)
```typescript
// useCanvasRenderer.test.tsx
// 覆盖:
describe('node rects computation', () => {
  it('returns empty arrays when store is empty')
  it('computes correct rect for bounded context nodes')
  it('computes correct rect for flow nodes (with step card offset)')
  it('handles duplicate node IDs (deduplication)')
  it('memo key stability across re-renders')
})
describe('edge computation', () => {
  it('boundedEdges filters by currentPageId')
  it('flowEdges connects correct step IDs')
  it('handles orphan nodes (no edges)')
})
describe('tree node arrays', () => {
  it('unifies contextTree from contextStore')
  it('unifies flowTree from flowStore')
  it('unifies componentTree from componentStore')
})
describe('zoom factor application', () => {
  it('card dimensions scale with zoomFactor')
  it('gap adjusts with zoomFactor')
})
```

#### E3: useDndSortable (P0, 3h)
```typescript
// useDndSortable.test.tsx
describe('DnD registration', () => {
  it('registers drag source on mount')
  it('unregisters on unmount (no memory leak)')
  it('calls useDndBackend with correct item type')
})
describe('sort operation', () => {
  it('calls componentStore.reorder with correct indices')
  it('debounces rapid reorder calls')
  it('reverts on drag cancel')
})
describe('drop target', () => {
  it('accepts drops from same tree type')
  it('rejects drops from different tree type')
})
```

#### E3: useDragSelection (P0, 2h)
```typescript
// useDragSelection.test.tsx
// 基于现有 __tests__/canvas/dragSelection.test.tsx (329行) 补充
describe('selection state machine', () => {
  it('starts selection on mousedown (no modifier)')
  it('expands selection on shift+click')
  it('clears selection on escape')
  it('does not start selection on draggable elements')
})
describe('bounding box', () => {
  it('updates rect during mousemove')
  it('selects nodes within bounding box')
  it('handles selection crossing tree boundaries')
})
```

#### E4: useCanvasSearch (P1, 2h)
```typescript
// useCanvasSearch.test.tsx
describe('search filtering', () => {
  it('filters nodes by label (case-insensitive)')
  it('returns all trees when query is empty')
  it('debounces rapid keystrokes')
})
describe('search results', () => {
  it('returns highlighted node IDs')
  it('limits results to MAX_SEARCH_RESULTS')
})
```

#### E5: useTreeToolbarActions (P1, 3h)
```typescript
// useTreeToolbarActions.test.tsx
describe('toolbar actions', () => {
  it('createNode calls correct store method')
  it('deleteNode removes from correct store')
  it('bulkDelete handles empty selection')
  it('syncs state after API operations')
})
```

#### E6: useVersionHistory (P2, 2h)
```typescript
// useVersionHistory.test.tsx
describe('history management', () => {
  it('loads history on mount')
  it('restores version correctly')
  it('handles empty history gracefully')
})
```

### Layer 2: Integration Tests (~8h)

**新增 `CanvasPage-split.integration.test.tsx`:**
- Mock 所有 Zustand stores（contextStore/flowStore/componentStore/uiStore）
- Mock AI controller（SSE 不走真实网络）
- 测试路径: CanvasPage 渲染 → panning → zoom → search → drag select → toolbar action
- 验证拆分后 CanvasPage 不崩溃，输出与拆分前行为一致

### Layer 3: E2E Playwright Tests (~4h)

**扩展 `e2e/canvas.spec.ts`:**
- 已有基础测试覆盖登录+加载
- 新增: pan/zoom 交互、跨树拖拽、搜索过滤、历史版本回滚

---

## 6. Acceptance Criteria

### AC-1: 测试覆盖率
- [ ] 6 个新 hook 全部有单元测试（行覆盖率 ≥ 80%）
- [ ] 关键分支（null 检查、边界计算、竞态窗口）覆盖率达到 90%+
- [ ] 验收命令: `pnpm test --coverage --coverageReporters=text-summary`

### AC-2: 现有测试零回归
- [ ] `pnpm test` 运行所有 ~30 个现有 canvas 测试文件，全部 PASS
- [ ] 验收命令: `pnpm test --testPathPattern="canvas"`（预期 100% PASS）

### AC-3: 拆分行为一致性
- [ ] CanvasPage 拆分前后，单元测试输出 shape 一致（通过 snapshot 或显式断言）
- [ ] 集成测试验证: 相同用户输入 → 相同渲染输出

### AC-4: 防回归检查点
- [ ] CI pipeline 包含 canvas hooks 测试套件（fail-fast）
- [ ] 每个 hook 提取时，对应测试同步提交（不允许无测试的 hook 进入 main）

### AC-5: 性能不退化
- [ ] useCanvasRenderer 的 useMemo 在 store 数据不变时不重新计算（通过测试中的 render count 断言验证）

---

## 7. Risk Assessment

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|---------|
| 拆分后 useCanvasRenderer 静默产生错误边/节点 | 高 | 高 | E2 优先写 useMemo 分支覆盖测试 |
| useDndSortable 拖拽竞态导致数据不一致 | 中 | 高 | E3 优先写 DnD 竞态测试 |
| 测试 mock 过于宽松，无法发现真实问题 | 中 | 中 | 使用真实 store 实例（`jest.requireActual`）而非全 mock |
| 现有组件测试因 hook 接口变化而失败 | 高 | 中 | 每次拆分同步更新测试（AC-2 强制要求） |
| 测试套件运行时间过长（>5min）拖慢 CI | 低 | 低 | 按 Epic 拆分测试文件，按需运行 |
| 快照测试在 UI 调整时大量误报 | 中 | 低 | 优先行为断言，避免依赖实现细节快照 |

---

## 8. Work Estimate Summary

| Phase | 内容 | 预计工时 | 交付物 |
|-------|------|---------|--------|
| E2 | useCanvasRenderer 单元测试 | 3h | `useCanvasRenderer.test.tsx` |
| E3 | useDndSortable + useDragSelection 单元测试 | 5h | 2个测试文件 |
| E4 | useCanvasSearch 单元测试 | 2h | `useCanvasSearch.test.tsx` |
| E5 | useTreeToolbarActions 单元测试 | 3h | `useTreeToolbarActions.test.tsx` |
| E6 | useVersionHistory 单元测试 | 2h | `useVersionHistory.test.tsx` |
| 集成 | CanvasPage 集成测试 | 8h | `CanvasPage-split.integration.test.tsx` |
| E2E | Playwright 扩展测试 | 4h | `e2e/canvas-split.spec.ts` |
| **总计** | | **27h** | **8 个新测试文件** |
