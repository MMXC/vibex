# Spec: PresenceAvatars

> **组件**: `src/components/canvas/Presence/PresenceAvatars.tsx`
> **关联 Epic**: E2
> **状态机规范（神技4）**

---

## 四态定义

### 理想态（Ideal）

用户进入 canvas，Firebase RTDB 有数据：

```
[头像1(色块+名称)] [头像2(色块+名称)] [头像3(色块+名称)] ...
```

- 头像：圆形色块（`hashUserColor(userId)`），直径 32px
- 名称：悬停 tooltip 显示完整名称
- 最多显示 5 个，超出显示 "+N"
- 头像重叠：左到右依次左移，间隔 -8px

### 空状态（Empty）

Firebase RTDB 无数据或未连接：

- 插图：简笔画（两个人图标），灰色 `#9CA3AF`
- 文案：**"暂无协作者"**
- 布局：水平居中，高度 48px
- 不显示引导去邀请（协作是隐式功能，不需要主动引导）

### 加载态（Loading）

Firebase 连接中（`isConnected === false && isAvailable === false`）：

- **骨架屏**（禁止用转圈）：3 个灰色圆形占位，依次出现动画
- 圆形直径 32px，间距 4px
- 动画：`@keyframes shimmer`，0.6s ease-in-out infinite

```css
.skeleton {
  background: linear-gradient(90deg, #E5E7EB 25%, #F3F4F6 50%, #E5E7EB 75%);
  background-size: 200% 100%;
  animation: shimmer 0.6s ease-in-out infinite;
}
```

### 错误态（Error）

Firebase 不可用（`isAvailable === false`）：

- 图标：WiFi-off 图标，灰色 `#9CA3AF`
- Tooltip：**"实时同步暂不可用"**
- 不显示错误 banner（降级不影响核心功能）
- 不重试（用户刷新页面即可）

---

## Props 接口

```typescript
interface PresenceAvatarsProps {
  canvasId: string;
  maxDisplay?: number; // 默认 5
}
```

---

## 原子化规范（神技5）

- 间距：8px 倍数
- 颜色：使用 CSS 变量，不硬编码
- 头像色：从 `hashUserColor` 函数获取（10 色调色板）
- 字体：`text-sm`（14px）
- 圆角：`rounded-full`

---

## 开发交接（神技6）

- 响应式：固定高度 48px，不随用户数变化
- 定位：canvas 工具栏右侧，`position: absolute; right: 16px; top: 16px`
- 层级：`z-10`（不低于 canvas 工具栏）
