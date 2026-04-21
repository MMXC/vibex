# Spec: E1-S1 PresenceLayer

**文件**: `src/components/canvas/PresenceLayer.tsx`
**状态**: 已交付（origin/main: 0e1b409b）
**涉及页面**: Canvas 画布 `/project`

---

## 组件概述

在 Canvas 画布右上角显示当前在线的用户头像列表，跟随用户光标位置实时移动。

---

## 四态定义

### 1. 理想态（Ideal）

- 彩色圆形头像徽标（直径 32px），按 userId 哈希分配稳定颜色
- 跟随光标位置实时更新（updateCursor）
- 最多显示 10 个用户头像，超出显示 `+N`
- 带有用户名字的 tooltip（悬停显示）
- 边框发光效果，颜色与头像颜色一致

### 2. 空状态（Empty）

- 显示灰色单人图标 + 文案：「只有你」
- **禁止只留白** — 必须有引导插图 + 文案
- 引导文案：「你是唯一在线的人。开始创作吧！」
- 插图：SVG 单人图标（灰色，60x60px）

### 3. 加载态（Loading）

- 骨架屏：3 个圆形占位符（直径 32px，间距 8px）
- **禁止用 Spinner/转圈**
- 颜色：骨架屏用 `var(--color-bg-tertiary)` 填充
- 最大显示时间：500ms 内必须切换到理想态或空状态

### 4. 错误态（Error）

- Firebase/WebSocket 不可达：隐藏 PresenceLayer（不显示错误，避免干扰）
- 降级为单用户模式，不阻断用户操作
- `appCrashed = false`，用户可正常编辑

---

## 设计规范（神技5：原子化）

### 间距
- 头像间距：`var(--space-2)` = 8px（禁止硬编码 `8px`）
- 与画布边距：`var(--space-4)` = 16px

### 颜色
- 头像背景色：`userColor`（按 userId 哈希生成的稳定颜色，HSL 格式）
- 边框发光：`box-shadow: 0 0 8px userColor`
- 禁止硬编码颜色，必须使用 Design Token

### 字体
- Tooltip 文字：`var(--text-xs)` = 12px
- Tooltip 字重：`var(--font-normal)`

### 动画
- 头像出现：`opacity 0→1, translateY 4px→0, 150ms ease-out`
- 头像消失：`opacity 1→0, 200ms ease-out`
- 位置更新：无动画（实时跟随，延迟会导致不同步感）

---

## 响应式规范（神技6：开发同理心）

- 桌面（> 768px）：头像在画布右上角，`position: fixed`
- 移动端（≤ 768px）：隐藏 PresenceLayer（协作功能暂不支持移动端）
- 头像大小不变（不随屏幕缩小）

---

## Props 接口

```typescript
interface PresenceLayerProps {
  canvasId: string;
  currentUserId: string;
  currentUserName: string;
}
```

---

## 依赖

- `usePresence(canvasId, userId)` hook — 来自 `src/lib/firebase/presence.ts`
- Firebase Realtime Database — 实时同步
