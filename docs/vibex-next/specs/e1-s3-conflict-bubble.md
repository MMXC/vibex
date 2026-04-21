# Spec: E1-S3 ConflictBubble

**文件**: `src/components/canvas/ConflictBubble.tsx`
**状态**: 已交付（origin/main: 2675a813）
**涉及页面**: Canvas 画布 `/project`

---

## 组件概述

当两个用户同时编辑同一节点时，显示绝对定位的气泡提示，告知用户发生了冲突，并提供「了解」按钮关闭提示。

---

## 四态定义

### 1. 理想态（Ideal）

- 绝对定位气泡，出现在被冲突节点的旁边（右侧偏移 16px，垂直居中）
- 内容：
  - 图标：⚠️ 或警告图标（使用 Design Token `--color-warning`）
  - 文案：「[用户名 A] 和 [用户名 B] 同时编辑了此节点」
  - 时间：冲突发生时间（如"2 分钟前"）
  - 按钮：「了解」— 点击关闭气泡
- 背景：`var(--color-bg-elevated)`
- 边框：`1px solid var(--color-warning)`（左侧 3px 强调线）
- 宽度：最大 240px，超长文字截断并显示省略号
- 圆角：`var(--radius-lg)` = 12px

### 2. 空状态（Empty）

- 无冲突时不渲染此组件（`null`）
- **禁止留白或显示占位元素**

### 3. 加载态（Loading）

- 此组件无加载态（冲突检测是即时的，无需异步）
- 有冲突时直接显示理想态

### 4. 错误态（Error）

- 检测逻辑异常：静默消失，不显示任何提示
- 不阻断用户操作
- console.warn 输出错误信息（供开发者调试）

---

## 交互规范

### 显示条件

- 检测到 `remoteUpdate.nodeId === localEditingNodeId && remoteUpdate.userId !== currentUserId`
- 触发后 100ms 内显示（检测到冲突立即展示）

### 消失条件

- 用户点击「了解」按钮
- 同一冲突 5 分钟内不重复显示（存储在 localStorage，key = `${nodeId}-${timestamp}`）
- 新冲突（不同节点或不同用户）可重新显示

### 动画

- 淡入：`opacity 0→1, translateX 8px→0, 200ms ease-out`
- 淡出（点击了解）：`opacity 1→0, 150ms ease-in`
- **禁止动画时长超过 200ms**（用户等待成本）

---

## 设计规范（神技5：原子化）

### 间距
- 气泡内边距：`var(--space-3)` = 12px
- 元素间距（图标/文案/按钮）：`var(--space-2)` = 8px
- 左侧强调线宽度：3px

### 颜色
- 背景：`var(--color-bg-elevated)` = `#22222e`
- 强调线：`var(--color-warning)` = `#ffaa00`
- 图标：`var(--color-warning)` = `#ffaa00`
- 文案文字：`var(--color-text-primary)` = `#f0f0f5`
- 时间文字：`var(--color-text-muted)` = `#606070`
- 按钮文字：`var(--color-primary)` = `#00ffff`

### 字体
- 文案：`var(--text-sm)` = 14px，`var(--font-normal)`
- 时间：`var(--text-xs)` = 12px，`var(--color-text-muted)`
- 按钮：`var(--text-sm)` = 14px

### 按钮样式
- 无背景，文字色 `var(--color-primary)`
- Hover：`background: var(--color-primary-muted)`, `border-radius: var(--radius-sm)`

---

## Props 接口

```typescript
interface ConflictBubbleProps {
  nodeId: string;
  userA: string; // 本地用户名
  userB: string; // 远程用户名
  timestamp: number; // 冲突时间戳
  onDismiss: () => void; // 点击了解后回调
}
```

---

## 集成位置

- 挂载在 Canvas Container 内
- 通过 React Context 接收冲突事件
- 多个 ConflictBubble 可以同时显示（不同节点冲突）

---

## 依赖

- `conflictEventBus` — 冲突事件总线，来自 canvasStore 或独立 eventBus
