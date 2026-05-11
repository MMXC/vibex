# Spec — Epic 3: 协作者意图气泡

**文件**: `Epic3-intention-bubble.md`
**组件**: `RemoteCursor.tsx`, `presence.ts`
**Epic**: Epic 3 (P003-B)
**页面**: DDSFlow 画布（RemoteCursor 叠加层）
**依赖**: Epic 2（presence 扩展需等 Epic 2 数据模型确认）
**状态**: 进行中

---

## 1. 理想态（Happy Path）

协作者 A 的 RemoteCursor 出现在 DDSFlow 画布上。协作者 A 开始编辑某张卡片。3 秒后，协作者 A 的 RemoteCursor 旁出现意图气泡，显示"正在编辑"（编辑图标 + 文字）。当协作者 A 移动光标切换为选择模式时，气泡变为"正在选择"。当协作者 A 停止操作时，气泡在 3 秒 idle 后消失。

### 意图气泡外观

```
         ┌────────────────────────┐
         │  ✏️ 正在编辑           │  ← 气泡（位于 RemoteCursor 上方 8px）
         └────────────────────────┘
              👆 (RemoteCursor)
```

### 意图气泡交互时序

```
[协作者 A 鼠标移动到节点上]
         │
         ▼
[updateCursor 触发，type = 'drag'（移动中）]
         │         │
         │    不显示气泡（移动中不显示意图）
         │
         ▼ 协作者 A 停止移动，停留 > 500ms
[显示气泡 "正在编辑" / "正在选择" / "正在拖拽"]
         │
         ▼ 3s 无操作
[气泡淡出消失（opacity 1→0, 300ms）]
         │
         ▼ 协作者 A 再次移动
[气泡重新显示（opacity 0→1, 300ms）]
```

### 意图类型映射

| 操作 | intention 值 | 气泡文案 | 图标 |
|------|-------------|----------|------|
| 鼠标悬停在节点上 | `edit` | "正在编辑" | ✏️ |
| 鼠标悬停在空白区域 | `select` | "正在选择" | 👆 |
| 鼠标拖拽节点 | `drag` | "正在拖拽" | ✋ |
| 鼠标静止超过 3s | `idle` | 无气泡 | — |

---

## 2. 空状态（无协作者 / 无意图）

### 2.1 无其他协作者在线

当 `others` 数组为空时：

- `RemoteCursor` 组件不渲染任何内容
- 不存在意图气泡

### 2.2 协作者处于 idle 状态

当 `presence.intention === 'idle'` 或用户 3s 无操作时：

- 意图气泡不显示
- `RemoteCursor` 头像正常显示，无气泡附加

**测试断言**:

```typescript
// 空状态：无意图气泡
expect(screen.queryByTestId('intention-bubble')).not.toBeInTheDocument();

// idle 3s 后气泡消失
await act(async () => { vi.clock.tick(3000); });
expect(screen.queryByTestId('intention-bubble')).not.toBeInTheDocument();
```

---

## 3. 加载态（Loading）

### 3.1 presence.ts 初始化

- `usePresence` hook 初始化期间，`isConnected === false`
- RemoteCursor 以半透明态显示（`opacity: 0.5`）
- 不显示意图气泡（等待数据）

### 3.2 意图更新加载

当 `updateCursor` 带 `intention` 参数更新到 RTDB 时：

- 本地气泡 UI 先更新（乐观更新）
- 气泡以 `scale(0.9→1) + opacity(0→1)` 动画出现
- RTDB 写入失败: 本地气泡保持，旁白显示 toast "意图同步失败"（non-blocking）

**测试断言**:

```typescript
// 加载态：RemoteCursor 半透明
expect(screen.getByTestId('remote-cursor-xxx')).toHaveStyle({ opacity: '0.5' });
```

---

## 4. 错误态（Error）

### 4.1 presence.ts 未配置（Firebase 未配置）

开发环境或 Firebase 未配置时：

- 使用 mock presence store（已有基础设施）
- 意图气泡功能降级为"始终显示编辑意图"（不显示真实 intention）
- 气泡显示文案: "协作模式（模拟）"

### 4.2 RTDB 写入失败

当 `updateCursor` 的 intention 更新失败时：

- 不显示错误 toast（non-blocking）
- 本地 UI 保持当前状态（用户感受不到失败）
- 不重试（避免写入风暴）

### 4.3 协作者突然离线

协作者的 presence 节点被 RTDB 删除时：

- RemoteCursor + 意图气泡立即消失（无渐隐动画）
- 不需要特殊错误处理

**测试断言**:

```typescript
// 4.1: 模拟环境气泡文案
expect(screen.getByTestId('intention-bubble')).toHaveTextContent('协作模式（模拟）');

// 4.3: 离线后 RemoteCursor 消失
await waitFor(() => {
  expect(screen.queryByTestId('remote-cursor-xxx')).not.toBeInTheDocument();
});
```

---

## 5. 交互规格

### 意图气泡

| 规格 | 值 |
|------|---|
| 位置 | RemoteCursor 头像上方 8px，水平居中 |
| 最小宽度 | 80px |
| 最大宽度 | 140px |
| 背景 | `var(--bg-surface, #1e1e2e)` |
| 边框 | `1px solid var(--border, #374151)` |
| 圆角 | `6px` |
| 内边距 | `4px 8px` |
| 阴影 | `0 2px 8px rgba(0,0,0,0.3)` |
| 动画 | `scale(0.9→1) + opacity(0→1)`，duration 200ms，ease-out |
| 消失动画 | `opacity(1→0)`，duration 300ms |
| 图标 | 16px inline SVG |
| 文字 | 12px，`var(--text-primary)` |
| 显示延迟 | 500ms（停留 > 500ms 才显示）|
| 消失延迟 | 3000ms（idle 3s 后消失）|
| `data-testid` | `intention-bubble` |
| `data-intention` | `edit` / `select` / `drag` / `idle` |

### RemoteCursor 组件扩展

现有 `RemoteCursor.tsx` 需要增加:

```typescript
// 扩展 PresenceUser 接口（presence.ts）
interface PresenceUser {
  // ... 现有字段
  intention?: 'edit' | 'select' | 'drag' | 'idle';
}

// RemoteCursor 组件 props 扩展
interface RemoteCursorProps {
  // ... 现有 props
  intention?: string;
}
```

### 气泡内容规范

| intention | 气泡文案 | 图标（inline SVG） |
|-----------|----------|-------------------|
| `edit` | "正在编辑" | pencil |
| `select` | "正在选择" | pointer |
| `drag` | "正在拖拽" | grab |
| `idle` | 无气泡 | — |
| mock/undefined | "协作模式（模拟）" | users |

---

## 6. RTDB 数据模型变更（待 architect 确认）

> ⚠️ **前置条件**: Epic 3 依赖 Epic 2 的数据模型确认。

预期变更（在现有 `presence/{canvasId}/{userId}` 节点上扩展）:

```json
{
  "presence": {
    "{canvasId}": {
      "{userId}": {
        "userId": "xxx",
        "name": "Alice",
        "color": "#FF6B6B",
        "cursor": {
          "x": 123,
          "y": 456,
          "nodeId": "node-123",
          "timestamp": 1746754800000
        },
        "intention": "edit",
        "lastSeen": 1746754800000
      }
    }
  }
}
```

变更范围: 仅扩展 `presence/{canvasId}/{userId}` 节点，不影响项目主数据。

---

## 7. 验收标准汇总

| 状态 | 验收断言 | 文件 |
|------|----------|------|
| 理想态 | `expect(screen.getByTestId('intention-bubble')).toBeVisible()` | sprint33.spec.ts |
| 理想态 | `expect(screen.getByText('正在编辑')).toBeVisible()` | sprint33.spec.ts |
| 理想态 | 停留 500ms 后气泡出现 | sprint33.spec.ts |
| 空状态 | idle 3s 后气泡消失 | sprint33.spec.ts |
| 空状态 | 无协作者时无意图气泡 | sprint33.spec.ts |
| 加载态 | 初始化期间 RemoteCursor 半透明 | sprint33.spec.ts |
| 错误态 | 模拟环境显示"协作模式（模拟）" | sprint33.spec.ts |
| 错误态 | 协作者离线后 RemoteCursor 消失 | sprint33.spec.ts |

---

_PM Agent | 2026-05-09_