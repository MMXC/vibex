# Spec E1: 多人协作 MVP

## 概述

在 DDSCanvasPage 中挂载 RemoteCursor 组件并集成 useRealtimeSync hook，实现多用户实时协作的基础体验。

## S1.1 RemoteCursor 挂载

### 现状分析
- `RemoteCursor.tsx` 已存在：`vibex-fronted/src/components/presence/RemoteCursor.tsx`
- `usePresence` 已在 DDSCanvasPage 第 260 行集成，`updateCursor` 每 100ms 节流广播
- `PresenceAvatars` 已挂载（第 673 行）
- **缺失**：RemoteCursor 未在 DDSCanvasPage 中渲染

### 实现要求

1. 在 DDSCanvasPage.tsx 中导入 RemoteCursor：
   ```typescript
   import { RemoteCursor } from '@/components/presence/RemoteCursor';
   ```

2. 在 Canvas overlay 层添加 RemoteCursor：
   ```tsx
   {/* Remote cursors overlay */}
   <RemoteCursor />
   ```

3. 条件守卫：仅在 `isFirebaseConfigured()` 时渲染：
   ```tsx
   {isFirebaseConfigured() && <RemoteCursor />}
   ```

4. RemoteCursor 从 usePresence 订阅其他用户 cursor 数据：
   ```typescript
   // 在 RemoteCursor.tsx 中
   const { remoteCursors } = usePresence.getState();
   // 渲染每个 remoteCursor: { userId, position: {x, y}, userName }
   ```

### 数据结构

```typescript
interface RemoteCursor {
  userId: string;
  position: { x: number; y: number };
  userName: string;
  color: string; // 从用户配置中获取
}
```

---

## S1.2 useRealtimeSync 集成

### 现状分析
- `useRealtimeSync` hook 已存在
- DDSCanvasPage 中**未使用**，仅做节点同步而非光标同步

### 实现要求

1. 在 DDSCanvasPage.tsx 中导入：
   ```typescript
   import { useRealtimeSync } from '@/hooks/useRealtimeSync';
   ```

2. 在 Canvas 组件中调用：
   ```typescript
   useRealtimeSync({
     canvasId,
     onRemoteNodeChange: (nodes) => {
       // 合并到本地 canvas store
     }
   });
   ```

3. 处理远端节点变更：
   - 新增节点：添加到 canvasNodes
   - 删除节点：从 canvasNodes 移除
   - 修改节点：合并属性（保留本地未变更字段）

---

## S1.3 Presence E2E 测试

### 文件位置
`vibex-fronted/tests/e2e/presence-mvp.spec.ts`

### 测试场景

```typescript
// TC1: Firebase mock 模式下 RemoteCursor 可见
test('multi-user sees remote cursor', async ({ browser }) => {
  // Setup: Firebase mock
  await firebaseMock.enableMock();

  // User 1 opens canvas
  const context1 = await browser.newContext();
  const page1 = await context1.newPage();
  await page1.goto('/canvas/test-canvas-001');

  // User 2 opens same canvas
  const context2 = await browser.newContext();
  const page2 = await context2.newPage();
  await page2.goto('/canvas/test-canvas-001');

  // User 2 moves cursor
  await page2.mouse.move(400, 300);

  // User 1 sees User 2's RemoteCursor
  await expect(page1.locator('[data-testid="remote-cursor"]').first())
    .toBeVisible({ timeout: 5000 });

  // User 1 sees User 2's name in PresenceAvatars
  await expect(page1.locator('[data-testid="presence-avatars"]'))
    .toContainText('User 2');

  await context1.close();
  await context2.close();
});
```

---

## DoD 检查清单

- [ ] DDSCanvasPage.tsx 中 `<RemoteCursor />` 存在于 render 输出
- [ ] RemoteCursor 有条件守卫 `isFirebaseConfigured()`
- [ ] useRealtimeSync 在 DDSCanvasPage 中被调用
- [ ] Firebase mock 模式下 E2E 测试通过
- [ ] RemoteCursor position 更新延迟 < 3s
- [ ] TypeScript 类型检查通过
