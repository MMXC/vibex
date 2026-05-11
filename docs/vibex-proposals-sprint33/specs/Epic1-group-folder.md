# Spec — Epic 1: Group/Folder 层级抽象

**文件**: `Epic1-group-folder.md`
**组件**: `DDSFlow.tsx`
**Epic**: Epic 1 (P001-B)
**页面**: DDSFlow 画布
**状态**: 进行中

---

## 1. 理想态（Happy Path）

用户进入 DDSFlow 画布，看到包含多个 Group（带 `parentId` 的父节点）和子节点的视图。用户点击 Group 节点左上角的折叠按钮，所有子节点以 300ms ease-out 动画从画布消失，Group 节点本身变为折叠态（虚线边框 + 子节点数量徽章）。用户再次点击，展开子节点回到原位。

### 折叠操作流程

```
[Group Node 包含 3 个子节点]
         │
         ▼ 点击 [data-testid="collapse-toggle"]
[Group Node 折叠态: 虚线边框 + "3" 徽章]
[3 个子节点从画布消失，不占位]
         │
         ▼ 点击 [data-testid="collapse-toggle"]
[Group Node 恢复展开态]
[3 个子节点 300ms ease-out 动画回到画布]
```

### 折叠态 Group 节点外观

```
┌────────────────────────────────┐
│ ≡  [折叠按钮]      ┌───┐       │  ← 虚线边框，背景透明度降低
│   Group: 支付模块            │
│                     [3]      │  ← 子节点数量徽章（红色圆圈）
└────────────────────────────────┘
```

---

## 2. 空状态（无 Group 节点）

当画布上没有 `parentId` 的节点时（即所有节点都是顶层节点），DDSFlow 表现与 S32 完全一致：

- 无折叠按钮显示（`data-testid="collapse-toggle"` 不存在于任何节点）
- 所有节点正常渲染，无折叠/展开行为
- 不影响现有用户体验

**测试断言**:

```typescript
// 空状态：所有节点都是顶层节点时，无折叠按钮
expect(screen.queryByTestId('collapse-toggle')).not.toBeInTheDocument();
```

---

## 3. 加载态（Loading）

ReactFlow 加载骨架屏期间，不应显示折叠按钮（避免骨架期误触）：

- DDSFlow 外层保持 ReactFlow 的默认加载态（ReactFlow 内置）
- `DDSCanvasStore` 的 `collapsedGroups` 初始为空 Set，不影响加载
- 折叠按钮在所有节点加载完成后才可交互

**测试断言**:

```typescript
// 加载中：折叠按钮不可见
expect(screen.queryByTestId('collapse-toggle')).not.toBeInTheDocument();

// 加载完成：折叠按钮可见
await waitFor(() => {
  expect(screen.getByTestId('collapse-toggle')).toBeVisible();
});
```

---

## 4. 错误态（Error）

### 4.1 折叠操作失败

当折叠操作因 Store 更新失败而未完成时：

- Group 节点保持展开态，不显示错误态样式
- 系统自动重试折叠操作（最多 2 次）
- 2 次失败后显示 toast: "展开/折叠失败，请重试"

### 4.2 子节点加载失败

当部分子节点因网络问题无法加载时：

- 已加载的子节点正常折叠/展开
- 加载失败的子节点显示为 `data-error="true"` 状态（橙色虚线边框）
- 不影响 Group 整体的折叠行为

### 4.3 循环依赖检测

当检测到 `parentId` 形成循环（技术上不应发生，但防御性处理）：

- 拒绝折叠操作，显示 toast: "检测到结构异常，无法折叠"
- 不改变任何节点状态

**测试断言**:

```typescript
// 折叠失败后显示 toast
userEvent.click(toggle);
await waitFor(() => {
  expect(screen.getByText('展开/折叠失败，请重试')).toBeVisible();
});

// 循环依赖拒绝
expect(screen.queryByText('检测到结构异常，无法折叠')).toBeInTheDocument();
```

---

## 5. 交互规格

### 折叠按钮

| 规格 | 值 |
|------|---|
| 位置 | Group 节点左上角，`top: 4px; left: 4px` |
| 尺寸 | 24x24px |
| 背景 | `rgba(255,255,255,0.1)`，hover 时 `rgba(255,255,255,0.2)` |
| 图标 | 展开态: `▼` / 折叠态: `▶`（纯 CSS 或 SVG inline） |
| `data-testid` | `collapse-toggle` |

### 折叠徽章

| 规格 | 值 |
|------|---|
| 位置 | Group 节点右上角 |
| 尺寸 | 20x20px 圆角 |
| 背景 | `#ef4444`（红色） |
| 文字 | 白色，12px，`bold` |
| 内容 | 子节点数量（大于 99 显示 "99+"） |
| `data-testid` | `collapsed-badge` |

### 折叠动画

| 规格 | 值 |
|------|---|
| 持续时间 | 300ms |
| 缓动函数 | `ease-out` |
| 动画类型 | CSS `transition: opacity + transform: scaleY(0→1)` |
| 动画方向 | 从 `scaleY(1)` 到 `scaleY(0)`（折叠），反向（展开）|

### 折叠态 Group 节点样式

| 规格 | 值 |
|------|---|
| 边框 | `2px dashed var(--border-collapsed, #6b7280)` |
| 背景透明度 | `opacity: 0.6` |
| 子节点徽章 | 右上角红色圆圈 + 数量 |
| `data-collapsed` | `true` |

---

## 6. Store 状态规范

```typescript
// DDSCanvasStore 扩展
interface DDSCanvasStore {
  // ... 现有状态
  collapsedGroups: Set<string>; // 折叠中的 Group ID
  toggleCollapse: (groupId: string) => void;
  isCollapsed: (groupId: string) => boolean;
}
```

```typescript
// 折叠操作对节点可见性的影响
function getVisibleNodes(allNodes: Node[], collapsedGroups: Set<string>): Node[] {
  return allNodes.filter((node) => {
    // 获取节点的 parentId
    const parentId = node.data?.parentId;
    // 如果 parentId 在折叠组中，且该 parentId 的节点本身不是折叠的，则此节点不可见
    if (parentId && collapsedGroups.has(parentId)) {
      return false;
    }
    return true;
  });
}
```

---

## 7. 持久化规范

折叠状态存入 localStorage:

```typescript
// Key: `vibex-dds-collapsed-{canvasId}`
// Value: JSON.stringify<string[]>('group-1', 'group-2', ...)

// 读取
function getCollapsedGroups(canvasId: string): Set<string> {
  try {
    const raw = localStorage.getItem(`vibex-dds-collapsed-${canvasId}`);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

// 写入
function setCollapsedGroups(canvasId: string, groups: Set<string>): void {
  localStorage.setItem(
    `vibex-dds-collapsed-${canvasId}`,
    JSON.stringify([...groups])
  );
}
```

---

## 8. 验收标准汇总

| 状态 | 验收断言 | 文件 |
|------|----------|------|
| 理想态 | `expect(screen.getByTestId('collapse-toggle')).toBeVisible()` | sprint33.spec.ts |
| 理想态 | `expect(groupNode).toHaveClass(/collapsed/)` | sprint33.spec.ts |
| 理想态 | 动画时长 `≤ 300ms` | animation.spec.ts |
| 空状态 | `expect(screen.queryByTestId('collapse-toggle')).not.toBeInTheDocument()` | sprint33.spec.ts |
| 加载态 | 加载期间按钮不可交互 | sprint33.spec.ts |
| 错误态 | 折叠失败显示 toast | sprint33.spec.ts |
| 持久化 | 刷新后折叠状态保持 | sprint33.spec.ts |

---

_PM Agent | 2026-05-09_