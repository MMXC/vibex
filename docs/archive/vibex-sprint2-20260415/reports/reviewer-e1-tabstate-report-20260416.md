# Review Report: vibex-sprint2-20260415 / reviewer-e1-tabstate

**Agent:** REVIEWER | **Time:** 2026-04-16 04:18 GMT+8
**Commit:** `4dbe738e` — feat(E1): reset phase on tab switch for E1-U1 Tab State

---

## INV 检查
- [x] INV-0: 读取了实际文件内容
- [x] INV-1: 检查了 `setPhase` 来源（contextStore）和 `resetPanelState` 来源（useCanvasPanels）
- [x] INV-2: 确认 `activeTab` 类型为 `TreeType` ✅
- [x] INV-4: 变更集中在 CanvasPage.tsx 一处 ✅
- [x] INV-5: `resetPanelState` 是新函数，检查了 useCallback 包装 ✅
- [x] INV-6: 测试覆盖 AC3（resetPanelState），AC1 由浏览器测试验证
- [x] INV-7: CanvasPage.tsx 内部变更，无跨模块边界

---

## 代码审查结果

### 🔴 Blocker — useEffect 依赖错误，修复无效

**位置:** `vibex-fronted/src/components/canvas/CanvasPage.tsx:215-219`

```typescript
// CanvasPage.tsx
const {
  activeTab, setActiveTab,  // ← 来自 useCanvasPanels（本地 state）
} = panels;

// useCanvasPanels.ts:
// const [activeTab, setActiveTab] = useState<TreeType>('context');
// activeTab 初始化为 'context'，之后从未更新

// TabBar.tsx（真实 tab 切换逻辑）:
// const activeTree = useContextStore((s) => s.activeTree);  // ← 真正反映 tab 状态
// const setActiveTree = useContextStore((s) => s.setActiveTree);
// handleTabClick → setActiveTree(tabId)  // ← 修改的是 contextStore.activeTree

// CanvasPage 中的 useEffect：
useEffect(() => {
  resetPanelState();
  setPhase('input');
}, [activeTab, resetPanelState, setPhase]);  // ← activeTab 永远不变！
```

**根因分析:**
1. `useCanvasPanels.activeTab` 是独立的本地 `useState`，初始化为 `'context'`，**没有人在任何地方调用 `setActiveTab`**（整个 CanvasPage 中 `setActiveTab` 仅出现在 destructuring 中）
2. TabBar 的 `handleTabClick` 直接调用 `contextStore.setActiveTree()`，修改的是 `contextStore.activeTree`，**与 useCanvasPanels 的 `activeTab` 完全无关**
3. 因此 `useEffect([activeTab])` 永远不会被触发，**修复实际上不生效**

**浏览器验证:**
- 测试了 TabBar 点击 prototype → 点击 context 切换
- `activeTree` 在 contextStore 中正常切换（TabBar 工作正常）
- 但 `activeTab` 从 useCanvasPanels 从未变化 → useEffect 不触发 → phase 未重置

**正确修复:**
```typescript
// 将 activeTab 替换为 activeTree
const activeTree = useContextStore((s) => s.activeTree);

useEffect(() => {
  resetPanelState();
  setPhase('input');
}, [activeTree, resetPanelState, setPhase]);
```

---

## 其他检查项

### 🟡 建议 — 测试覆盖 AC1 缺失

`CanvasPage.test.tsx` 只测试了 `resetPanelState` 的 `queuePanelExpanded` 重置，没有测试 `setPhase('input')` 的行为。建议补充 AC1 测试。

### ✅ `resetPanelState` 实现正确

```typescript
const resetPanelState = useCallback(() => {
  setQueuePanelExpanded(false);
}, []);
```
幂等、使用 useCallback 包装 ✅

### ✅ 单元测试通过
```
CanvasPage.test.tsx — 3/3 passing ✅
```

### ✅ ESLint 无新增错误
仅有 4 个 pre-existing `@ts-ignore` 警告（行 670, 685, 687, 695），与本次修改无关。

---

## 结论

| 类别 | 结果 |
|------|------|
| 功能正确性 | ❌ FAILED — useEffect 依赖错误，修复不生效 |
| 测试覆盖 | 🟡 部分通过 — AC3 覆盖，AC1 缺失 |
| 代码质量 | ✅ 语法正确 |
| 安全 | ✅ 无安全问题 |

**审查结论:** ❌ **REJECTED — 功能逻辑错误，修复无效**

