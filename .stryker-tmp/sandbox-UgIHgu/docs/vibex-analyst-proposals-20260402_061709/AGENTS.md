# AGENTS.md: VibeX 系统性风险治理

**项目**: vibex-analyst-proposals-20260402_061709
**版本**: v1.0
**日期**: 2026-04-02

---

## 优先级约束

| Sprint | Epic | 依赖关系 |
|--------|------|----------|
| Sprint 0 | D-001 + D-002（前置） | 无 |
| Sprint 1 | E1 三树选择模型 | 无 |
| Sprint 2 | E2 canvasStore 拆分 | D-001 + D-002 |
| Sprint 3 | E3 + E4 | Sprint 1（部分） |
| Sprint 4 | E5 + E6 | D-002（E2 完成后） |
| Sprint 5 | E7 | 无 |

---

## Dev 约束

### E1 — 三树选择模型

1. **NodeState 枚举**
   - ✅ 必须创建 `types/NodeState.ts`
   - ❌ 禁止修改现有节点数据结构（向后兼容）
   - ❌ 禁止在三树组件外定义重复的状态枚举

2. **BoundedContextTree**
   - ✅ 删除 selectionCheckbox（绝对定位的那个）
   - ✅ 保留 confirmCheckbox 作为唯一 checkbox
   - ✅ 添加确认反馈 SVG
   - ❌ 禁止修改 `confirmContextNode` 函数签名

3. **ComponentTree**
   - ✅ checkbox 移到 type badge 前
   - ✅ 移除 div 包裹，inline input
   - ❌ 禁止修改 `onToggleSelect` props

4. **canvas.module.css**
   - ✅ 补充 `activeBadge` / `confirmedBadge` CSS
   - ✅ 删除 `nodeUnconfirmed` 黄色边框
   - ❌ 禁止修改 `.nodeConfirmed` / `.nodeError`

### E2 — canvasStore 拆分

1. **Store 文件**
   - ✅ 新建 `contextStore.ts`, `flowStore.ts`, `componentStore.ts`, `uiStore.ts`
   - ✅ 每个 store < 300 行
   - ❌ 禁止在 store 内直接操作 DOM
   - ❌ 禁止 store 之间直接引用（通过事件或回调通信）

2. **迁移策略**
   - Phase 1: 先创建 contextStore，验证 E2E（create-context）通过
   - Phase 2: 再创建 flowStore，验证 E2E（generate-flow）通过
   - Phase 3: 再创建 componentStore，验证 E2E（multi-select）通过
   - Phase 4: 最后降级 canvasStore 为代理层

3. **API 兼容**
   - ✅ canvasStore.ts 必须保持现有导出兼容
   - ✅ 所有 `useCanvasStore()` 调用无需修改
   - ❌ 禁止删除任何现有导出

### E3 — Canvas 布局

1. **z-index**
   - ✅ 使用 CSS Variables（`--z-drawer: 50;` 等）
   - ❌ 禁止硬编码 z-index 数字

2. **scrollTop**
   - ✅ 在 useEffect 中清理 scrollTop
   - ❌ 禁止在渲染过程中设置 scrollTop

### E4 — 交互反馈

1. **window.confirm**
   - ✅ 全部替换为 `useFeedback().show()`
   - ❌ 禁止新增 window.confirm 调用

2. **FeedbackToken**
   - ✅ 所有删除操作必须提供 `undoAction`
   - ❌ 禁止在 FeedbackToken 范围外使用自定义 toast

### E7 — 设计系统

1. **emoji**
   - ✅ canvas 范围内禁止使用 emoji
   - ❌ 禁止新增 emoji（用 SVG 替代）

2. **spacing**
   - ✅ 使用 CSS Variables（`--space-sm: 8px;` 等）
   - ❌ 禁止在 canvas 组件内使用硬编码 spacing

---

## Reviewer 约束

### 审查重点

1. **E2 Store 拆分**
   - [ ] 每个 store < 300 行
   - [ ] canvasStore < 100 行
   - [ ] 无循环引用（store 之间）
   - [ ] 每个 store 有单元测试，覆盖率 ≥ 70%

2. **E1 三树统一**
   - [ ] 三树 checkbox 位置一致（在 type badge 前）
   - [ ] 确认状态反馈一致（绿色 ✓）
   - [ ] 未确认节点无黄色边框
   - [ ] Playwright 测试通过

3. **E4 window.confirm**
   - [ ] 全文搜索 `window.confirm` = 0
   - [ ] 删除操作有 toast + 撤销
   - [ ] FeedbackToken 定义存在

4. **E7 emoji**
   - [ ] canvas 范围 grep emoji = 0
   - [ ] spacing 使用 CSS Variables

### 驳回条件

- ❌ canvasStore 任何子 store > 300 行
- ❌ canvasStore > 100 行（代理层）
- ❌ 存在 window.confirm 调用
- ❌ canvas 范围内使用 emoji
- ❌ 编译或测试失败
- ❌ E2E 通过率 < 95%

---

## Tester 约束

### E2E 测试优先级

1. `journey-create-context.spec.ts` — 最核心，必须优先完成
2. `journey-generate-flow.spec.ts` — 第二优先
3. `journey-multi-select.spec.ts` — 第三优先

### 稳定性要求

- E2E 测试 flaky 率 ≤ 5%
- 失败时必须重试 1 次再判定失败
- 截图保存到 `e2e/screenshots/`

### 截图规范

每个 E2E 测试必须保存：
- [ ] 测试开始前截图（baseline）
- [ ] 每个关键步骤截图
- [ ] 测试失败时截图
- [ ] 测试通过后截图（final）

---

## 文件变更清单

### 新增文件

| 文件 | 说明 |
|------|------|
| `src/components/canvas/types/NodeState.ts` | 统一节点状态枚举 |
| `src/lib/canvas/contextStore.ts` | 限界上下文 store |
| `src/lib/canvas/flowStore.ts` | 流程 store |
| `src/lib/canvas/componentStore.ts` | 组件 store |
| `src/lib/canvas/uiStore.ts` | UI store |
| `src/styles/canvas-z-index.css` | z-index token |
| `src/hooks/useFeedback.ts` | 统一反馈 hook |
| `src/components/canvas/types/FeedbackToken.ts` | FeedbackToken 定义 |
| `e2e/journey-create-context.spec.ts` | E2E 测试 |
| `e2e/journey-generate-flow.spec.ts` | E2E 测试 |
| `e2e/journey-multi-select.spec.ts` | E2E 测试 |

### 修改文件

| 文件 | 说明 |
|------|------|
| `src/lib/canvas/canvasStore.ts` | 降为代理层 |
| `src/components/canvas/BoundedContextTree.tsx` | E1 修复 |
| `src/components/canvas/ComponentTree.tsx` | E1 修复 |
| `src/components/canvas/canvas.module.css` | E1 + E3 修改 |
| `src/components/canvas/CanvasPage.tsx` | E3 scrollTop |

---

## 关键依赖链

```
Sprint 0: D-001 (TS清理) + D-002 (Jest稳定)
     ↓
Sprint 1: E1 (三树统一)
     ↓
Sprint 2: E2 (canvasStore拆分) ← 最大风险点
     ↓
Sprint 4: E5 (E2E覆盖率) ← 依赖 E2 稳定
```
