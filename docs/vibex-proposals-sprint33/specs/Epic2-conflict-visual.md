# Spec — Epic 2: 冲突可视化（高亮）

**文件**: `Epic2-conflict-visual.md`
**组件**: `ConflictBubble.tsx`, `ConflictResolutionDialog.tsx`
**Epic**: Epic 2 (P003-A)
**页面**: DDSFlow 画布
**状态**: 进行中

---

## 1. 理想态（Happy Path）

协作者 A 和协作者 B 同时编辑 DDSFlow 画布上的同一张卡片。协作者 A 先保存修改，协作者 B 稍后尝试保存时触发冲突检测。

系统流程：

```
[协作者 B 触发保存]
         │
         ▼
[Firebase RTDB 写入冲突事件 → conflicts/{canvasId}/{nodeId}]
         │
         ▼
[ConflictBubble.tsx 监听器接收冲突事件]
         │
         ▼
[冲突节点高亮: 红色脉冲边框 + data-conflict="true"]
[ConflictDialog 弹窗从 ConflictBubble 渲染]
         │
         ▼ 用户点击 [保留我的修改] 或 [使用他人修改]
[冲突解决: conflictStore.resolveKeepLocal / resolveUseRemote]
[高亮消失，Dialog 关闭]
```

### 冲突节点高亮外观

```
┌──────────────────────────────────┐
│  ┌──────────────────────────────┐│
│  │ ● data-conflict="true"       ││  ← 红色 2px 边框，pulse 动画
│  │                              ││
│  │ [用户故事卡片内容]            ││
│  │                              ││
│  └──────────────────────────────┘│
└──────────────────────────────────┘

@keyframes conflict-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
  50%       { box-shadow: 0 0 0 8px rgba(239, 68, 68, 0); }
}
// animation: conflict-pulse 1.5s infinite ease-in-out
```

### ConflictDialog 弹窗外观

```
┌──────────────────────────────────────────────┐
│  ⚠️  检测到编辑冲突                            │
│                                              │
│  其他协作者修改了此卡片。你的修改和他人的修改  │
│  存在冲突，请选择保留哪一版。                  │
│                                              │
│  ┌────────────────┐  ┌────────────────┐    │
│  │  保留我的修改   │  │  使用他人修改   │    │
│  └────────────────┘  └────────────────┘    │
│                                              │
│  ⏱ 30 秒后自动保留本地修改                   │
└──────────────────────────────────────────────┘
```

---

## 2. 空状态（无冲突）

当没有任何冲突事件时：

- `ConflictBubble` 组件渲染 `null`（不挂载任何 DOM 节点）
- 不影响 DDSFlow 渲染性能
- Firebase 冲突监听器保持活动，但不触发任何 UI

**测试断言**:

```typescript
// 空状态：无任何冲突节点高亮
expect(screen.queryByAttribute('data-conflict', 'true')).not.toBeInTheDocument();

// 空状态：ConflictDialog 不存在
expect(screen.queryByTestId('conflict-dialog')).not.toBeInTheDocument();
```

---

## 3. 加载态（Loading）

### 3.1 ConflictBubble 组件初始化

- 组件在 DDSFlow 外层挂载后立即订阅 `conflictStore.activeConflict`
- Store 订阅本身无异步操作，但 Firebase 监听器建立需要时间

### 3.2 冲突解决加载态

当用户点击仲裁按钮后到冲突解决的中间状态：

- 两个按钮显示 `loading` 态（`disabled`, spinner 图标）
- 高亮保持显示（不消失，避免用户困惑）
- 超时 5s 未解决: 按钮恢复可点击状态，显示 toast "操作超时，请重试"

**测试断言**:

```typescript
// 加载态：按钮 disabled
fireEvent.click(screen.getByText('保留我的修改'));
expect(screen.getByText('保留我的修改')).toBeDisabled();
```

---

## 4. 错误态（Error）

### 4.1 Firebase 监听失败

当 Firebase RTDB 连接异常导致冲突监听中断时：

- 组件降级到本地轮询（每 5s 检查一次 `conflictStore`）
- 屏幕右上角显示 toast: "实时冲突监听中断，正在重连..."
- 重连成功: toast 自动消失
- 重连失败 3 次: 保持轮询，不阻塞用户操作

### 4.2 仲裁操作失败

当 keep-local 或 use-remote 操作因网络原因失败时：

- 按钮恢复可点击状态
- 高亮保持（不消失）
- 显示 toast: "保存失败，请重试"
- 不自动重试（用户需手动再次点击）

### 4.3 超时未仲裁（30s）

用户 30s 未做任何选择：

- 默认执行 keep-local（保留本地修改）
- Dialog 关闭，高亮消失
- 显示 toast: "已自动保留本地修改"

### 4.4 无 activeConflict 但存在 stale 高亮

防御性场景：Store 状态异常（高亮存在但 activeConflict 为 null）：

- 自动清除所有 `data-conflict="true"` 标记
- 刷新节点状态

**测试断言**:

```typescript
// 4.1: Firebase 断开 toast
expect(screen.getByText('实时冲突监听中断，正在重连...')).toBeVisible();

// 4.2: 仲裁失败 toast
expect(screen.getByText('保存失败，请重试')).toBeVisible();

// 4.3: 30s 超时
await act(async () => { vi.clock.tick(30000); });
expect(screen.queryByTestId('conflict-dialog')).not.toBeInTheDocument();
expect(screen.getByText('已自动保留本地修改')).toBeVisible();
```

---

## 5. 交互规格

### 冲突节点高亮

| 规格 | 值 |
|------|---|
| 边框 | `2px solid #ef4444` |
| 背景 | 无变化（保持原节点背景） |
| 动画 | `conflict-pulse` keyframes，duration 1.5s，infinite |
| 动画类型 | `box-shadow` 扩散脉冲 |
| `data-conflict` | `"true"` |
| 点击事件 | 不拦截（允许用户继续操作节点） |

### ConflictDialog 弹窗

| 规格 | 值 |
|------|------|
| 位置 | 屏幕中央（固定定位） |
| 遮罩层 | `rgba(0,0,0,0.5)`，点击不关闭 |
| 宽度 | `max-width: 420px` |
| 圆角 | `12px` |
| 背景 | `var(--bg-surface, #1e1e2e)` |
| 按钮: 主按钮 | "保留我的修改" — `bg: #3b82f6` |
| 按钮: 次按钮 | "使用他人修改" — `border: 1px solid #6b7280` |
| 超时提示 | 30s 倒计时，小字显示在按钮下方 |
| `data-testid` | `conflict-dialog` |

### 气泡内容规范

| 内容 | 场景 |
|------|------|
| 主文案 | "检测到编辑冲突" |
| 副文案 | "其他协作者修改了此卡片。你的修改和他人的修改存在冲突，请选择保留哪一版。" |
| 按钮 A | "保留我的修改" |
| 按钮 B | "使用他人修改" |

---

## 6. RTDB 数据模型（待 architect 确认）

> ⚠️ **前置条件**: Epic 2 需要 architect 在 Sprint 33 启动时先输出 RTDB 数据模型方案。

预期结构（待 architect 确认）:

```json
{
  "conflicts": {
    "{canvasId}": {
      "{nodeId}": {
        "localData": { ... },
        "remoteData": { ... },
        "remoteVersion": 2,
        "timestamp": 1746754800000,
        "resolved": false
      }
    }
  }
}
```

ConflictBubble 监听 `conflicts/{canvasId}` 的 `child_added` 和 `child_changed` 事件。

---

## 7. 验收标准汇总

| 状态 | 验收断言 | 文件 |
|------|----------|------|
| 理想态 | `expect(screen.queryByTestId('conflict-dialog')).not.toBeInTheDocument()` (无冲突) | sprint33.spec.ts |
| 理想态 | `expect(node).toHaveAttribute('data-conflict', 'true')` | sprint33.spec.ts |
| 理想态 | `expect(screen.getByTestId('conflict-dialog')).toBeVisible()` | sprint33.spec.ts |
| 理想态 | keep-local 后高亮消失 | sprint33.spec.ts |
| 加载态 | 仲裁按钮 loading 态 | sprint33.spec.ts |
| 错误态 | Firebase 断开 toast | sprint33.spec.ts |
| 错误态 | 仲裁失败 toast | sprint33.spec.ts |
| 错误态 | 30s 超时默认 keep-local | sprint33.spec.ts |

---

_PM Agent | 2026-05-09_