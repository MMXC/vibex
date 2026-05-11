# Spec E1: 多人协作 MVP

## S1.1 RemoteCursor 挂载

### 实现位置
`vibex-fronted/src/components/presence/RemoteCursor.tsx`
`vibex-fronted/src/pages/DDSCanvasPage.tsx`（修改）

### 四态定义（RemoteCursor）

| 状态 | 触发条件 | UI 表现 | 引导文案 |
|------|----------|--------|----------|
| 理想态 | `isFirebaseConfigured() === true` 且 `remoteCursors.length > 0` | 渲染 N 个 RemoteCursor，CSS absolute 定位在 Canvas overlay 层，显示用户名标签 | — |
| 空状态（单人）| `isFirebaseConfigured() === true` 且 `remoteCursors.length === 0` | RemoteCursor 不渲染（无需 DOM） | 引导：PresenceAvatars 区域显示"邀请协作者"按钮 |
| 加载态 | Firebase 连接中（< 200ms）| RemoteCursor 不渲染（避免连接过程中闪烁）| — |
| 错误态 | `isFirebaseConfigured() === false` | RemoteCursor 不渲染（条件守卫），降级文案在 PresenceAvatars 区域显示 | "实时协作暂时不可用，当前模式可正常编辑" |

### 实现要求

```typescript
// DDSCanvasPage.tsx
import { RemoteCursor } from '@/components/presence/RemoteCursor';

// 条件守卫：仅 Firebase 配置后渲染
{isFirebaseConfigured() && <RemoteCursor />}

// RemoteCursor 从 usePresence 订阅其他用户 cursor
// position: absolute, z-index: canvas-overlay 层
```

### E2E 测试（presence-mvp.spec.ts）

```typescript
test('multi-user sees remote cursor', async ({ browser }) => {
  await firebaseMock.enableMock();

  const context1 = await browser.newContext();
  const page1 = await context1.newPage();
  await page1.goto('/canvas/test-canvas-001');

  const context2 = await browser.newPage();
  const page2 = await context2.newPage();
  await page2.goto('/canvas/test-canvas-001');

  await page2.mouse.move(400, 300);

  // RemoteCursor 可见
  await expect(page1.locator('[data-testid="remote-cursor"]').first())
    .toBeVisible({ timeout: 5000 });

  // PresenceAvatars 显示用户名
  await expect(page1.locator('[data-testid="presence-avatars"]'))
    .toContainText('User 2');
});
```

---

## S1.2 useRealtimeSync 集成

### 实现位置
`vibex-fronted/src/pages/DDSCanvasPage.tsx`（修改）
`vibex-fronted/src/hooks/useRealtimeSync.ts`（现有 hook）

### 四态定义（useRealtimeSync）

| 状态 | 触发条件 | 行为 |
|------|----------|------|
| 理想态 | Firebase connected + remote nodes 存在 | 订阅 RTDB remote nodes，合并到本地 canvasNodes |
| 空状态 | Firebase connected 但无 remote nodes | hook 返回空数组，本地画布正常操作 |
| 加载态 | Firebase connecting | 等待 SSE 连接完成，不阻塞画布渲染 |
| 错误态 | Firebase not configured / RTDB error | 不渲染 RemoteCursor，降级到本地模式 |

### 实现要求

```typescript
// DDSCanvasPage.tsx
import { useRealtimeSync } from '@/hooks/useRealtimeSync';

useRealtimeSync({
  projectId,
  onRemoteNodeChange: (nodes) => {
    // 合并到本地 canvas store
  }
});

// 获取 remoteCursors 用于 RemoteCursor 渲染
const { remoteCursors } = useRealtimeSync();
```

---

## S1.3 Presence E2E 测试

### 实现位置
`vibex-fronted/tests/e2e/presence-mvp.spec.ts`（修改）

### 四态定义（PresenceAvatars）

| 状态 | 触发条件 | UI 表现 | 引导文案 |
|------|----------|--------|----------|
| 理想态 | `connectedUsers.length > 0` | 显示所有在线用户头像 + 名称 | — |
| 空状态 | `connectedUsers.length === 0`（单人）| 显示"邀请协作者"入口 | "邀请协作者，一起实时编辑" |
| 加载态 | Firebase connecting | 头像区域显示骨架屏 | — |
| 错误态 | `isFirebaseConfigured() === false` | PresenceAvatars 不显示（条件守卫）| — |

---

## DoD 检查清单

- [ ] `DDSCanvasPage.tsx` 中 `<RemoteCursor />` 存在于 render 输出
- [ ] `RemoteCursor` 有条件守卫 `isFirebaseConfigured()`
- [ ] `useRealtimeSync` 在 DDSCanvasPage 中被调用（import + JSX 引用）
- [ ] `remoteCursors` 数组非空时渲染 RemoteCursor，空时（单人）不渲染
- [ ] Firebase mock 模式下 E2E 测试通过
- [ ] RemoteCursor 位置更新延迟 < 3s
- [ ] TypeScript 类型检查通过
- [ ] 四态定义完整（RemoteCursor + PresenceAvatars）