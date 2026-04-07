# Analysis: Canvas ScrollTop Reset Bug

**Agent**: analyst
**日期**: 2026-04-01
**项目**: canvas-scrolltop-reset

---

## 1. 问题定义

**问题描述**: Canvas 中的三个树面板（BoundedContextTree、BusinessFlowTree、ComponentTree）在用户滚动后，切换 Phase 或切换 Tab 时，滚动位置（scrollTop）没有重置，导致用户体验问题。

**Bug 1：折叠→展开时 scrollTop 未重置**

**触发场景**:
1. 用户在 Context 面板滚动浏览大量节点
2. 用户切换到 Flow 面板 → Flow 面板保持 Context 的滚动位置
3. 用户切换回 Context → 滚动位置仍是之前的偏移量

**Bug 2：初次进入 canvas 页时 scrollTop = 946（不是 0）**

**触发场景**:
1. 用户进入 canvas 页
2. 面板初始 scrollTop = 946（错误值），导致内容从中间开始显示
3. 用户需要手动向上滚动才能看到顶部内容

**用户痛点**: 「作为用户，我切换面板后希望看到内容顶部，而不是保留之前的滚动位置」

---

## 2. 现状分析

### 2.1 代码结构

Canvas 页面有三个树面板组件：

```
CanvasPage
├── TabBar (切换 context/flow/component)
├── BoundedContextTree (containerRef → 树节点容器)
├── BusinessFlowTree (containerRef → 树节点容器)
└── ComponentTree (containerRef → 树节点容器)
```

每个 Tree 组件使用 `containerRef` 管理 DOM 容器：

```typescript
// BoundedContextTree.tsx (line 358)
const containerRef = useRef<HTMLDivElement>(null);

// line 435: 容器 ref
<div className={styles.boundedContextTree} ... ref={containerRef} ...>
```

### 2.2 当前实现

**无 scrollTop 重置逻辑**。三个树面板的 containerRef 仅用于：
- ResizeObserver 节点位置计算（line 366-390）
- Drag selection 坐标获取（line 446）

### 2.3 相关代码位置

| 文件 | 作用 | scrollTop 处理 |
|------|------|----------------|
| `BoundedContextTree.tsx` | 限界上下文树 | 无 |
| `BusinessFlowTree.tsx` | 业务流程树 | 无 |
| `ComponentTree.tsx` | 组件树 | 无 |
| `TreePanel.tsx` | 面板容器 | 有 MiniMap scrollIntoView（line 89-97） |
| `TabBar.tsx` | Tab 切换器 | 无 |
| `canvasStore.ts` | 状态管理 | 有 clear* 方法但无 scroll 重置 |

---

## 3. 修复方案

### 3.1 方案 A：在 TreePanel 中添加 scrollTop 重置（推荐）

**原理**: 
- Bug 1：当面板从折叠状态展开时，重置 scrollTop
- Bug 2：组件挂载时初始化 scrollTop = 0

**修改文件**:
- `TreePanel.tsx`: 添加 `useEffect` 监听 `collapsed` 状态变化 + 挂载时初始化

```typescript
// TreePanel.tsx - 在组件内添加
const panelBodyRef = useRef<HTMLDivElement>(null);

// Bug 1: 折叠→展开时重置
useEffect(() => {
  if (!collapsed && panelBodyRef.current) {
    panelBodyRef.current.scrollTop = 0;
  }
}, [collapsed]);

// Bug 2: 挂载时初始化
useEffect(() => {
  if (panelBodyRef.current && panelBodyRef.current.scrollTop !== 0) {
    panelBodyRef.current.scrollTop = 0;
  }
}, []);
```

**优点**:
- 改动最小，仅修改 TreePanel
- 同时覆盖两个 bug
- 不影响其他逻辑

**工时**: 1h

---

### 3.2 方案 B：在 TabBar 切换时重置所有面板

**原理**: TabBar 切换时，重置所有三个树面板的 scrollTop。

**修改文件**:
- `TabBar.tsx`: 传递 onTabChange 回调
- 各 Tree 组件: 接收并响应重置信号

```typescript
// TabBar.tsx
const handleTabChange = (tree: TreeType) => {
  onTabChange?.(tree);
  // 同时重置所有面板 scrollTop
  document.querySelectorAll('[class*="treePanelBody"]').forEach(el => {
    (el as HTMLElement).scrollTop = 0;
  });
};
```

**优点**:
- 明确覆盖 Tab 切换场景

**缺点**:
- 需要修改多个组件的接口
- DOM 查询不够 React

**工时**: 2h

---

### 3.3 方案 C：在 CanvasStore 中添加 scrollTop 状态

**原理**: 将 scrollTop 作为 Zustand store 的一部分，在状态切换时自动重置。

```typescript
// canvasStore.ts
interface CanvasState {
  contextTreeScrollTop: number;
  flowTreeScrollTop: number;
  componentTreeScrollTop: number;
  // ...
  resetTreeScroll: (tree: TreeType) => void;
}
```

**优点**:
- 状态可追踪
- 便于测试

**缺点**:
- 改动较大，需要修改 store
- 需要在各组件中监听并同步 DOM

**工时**: 3h

---

### 3.4 推荐方案

**方案 A**（TreePanel scrollTop 重置）作为 P0，优先实现。

**理由**:
1. 改动最小（仅 1 个文件）
2. 覆盖核心场景（折叠→展开）
3. 无需修改接口
4. 1h 可完成

**未来扩展**（如需覆盖 Tab 切换）:
- 可在 CanvasPage 中监听 `activeTree` 变化，调用 TreePanel 的 reset 方法
- 或在 TabBar 中添加 resetAllPanels 方法

---

## 4. 验收标准

| 场景 | 预期行为 |
|------|----------|
| Bug 1: 折叠面板后展开 | scrollTop 重置为 0 |
| Bug 2: 初次进入 canvas 页 | scrollTop = 0，内容从顶部开始 |
| 切换 Tab | Tab 切换本身不触发（由折叠展开触发） |
| 加载新数据 | 无需特殊处理（组件卸载后重新挂载会自动从 0 开始） |

**测试用例**:
1. Bug 1: 展开 Context 面板 → 滚动到中间位置 → 折叠 → 再次展开 → 验证 scrollTop = 0
2. Bug 1: 展开 Flow 面板 → 折叠 → 展开 → 验证 scrollTop = 0
3. Bug 2: 刷新 canvas 页 → 打开任意面板 → 验证 scrollTop = 0（内容从顶部可见）

---

## 5. 风险评估

| 风险 | 概率 | 影响 | 缓解 |
|------|------|------|------|
| scrollTop 重置时机过早 | 低 | 展开动画期间重置可能导致闪烁 | 在 `setTimeout` 或动画完成后重置 |
| 移动端 touch 冲突 | 低 | touch scroll 与重置冲突 | 仅在桌面端重置（通过 media query） |

---

## 6. 下一步

1. **确认方案**: 如无异议，采用方案 A（TreePanel scrollTop 重置）
2. **派发开发**: `dev-canvas-scrolltop-reset` → 实现 TreePanel 修改
3. **测试验证**: tester 验证折叠→展开 scrollTop = 0