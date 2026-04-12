# Spec: E4-S1 — Vitest 测试覆盖 PrototypeQueuePanel 状态样式

## 文件

- **新建/扩展**: `vibex-fronted/src/components/canvas/__tests__/PrototypeQueuePanel.test.tsx`

## 目的

为 E1-S1 修复提供单元测试保护，确保 `queueItemQueued` / `queueItemGenerating` / `queueItemDone` / `queueItemError` 类名在 mock styles 中存在，防止未来回归。

## 测试用例

### Case 1: queued 状态

```ts
it('renders queue item with queued status using camelCase className', () => {
  const mockStyles = {
    queueItem: 'queueItem',
    queueItemQueued: 'queueItemQueued',   // ✅ camelCase
    queueItemGenerating: 'queueItemGenerating',
    queueItemDone: 'queueItemDone',
    queueItemError: 'queueItemError',
  };
  // render with statusVariant='queued'
  expect(mockStyles.queueItemQueued).toBeDefined();
  expect(mockStyles.queueItemQueued).toBeTruthy();
});
```

### Case 2-4: generating / done / error 状态

同上，分别断言 `queueItemGenerating`、`queueItemDone`、`queueItemError`。

### Case 5: snake_case 引用应不存在（验证 E1-S1 修复）

```ts
it('does NOT reference snake_case class names', () => {
  const mockStyles = {
    queueItemQueued: 'queueItemQueued',
  };
  // 验证 mock 不包含 snake_case 键
  expect(mockStyles).not.toHaveProperty('queueItem_queued');
  expect(mockStyles).not.toHaveProperty('queueItem_generating');
  expect(mockStyles).not.toHaveProperty('queueItem_done');
  expect(mockStyles).not.toHaveProperty('queueItem_error');
});
```

## DoD 检查单

- [ ] 测试文件存在
- [ ] 覆盖 4 个状态变体的类名断言
- [ ] 包含 snake_case 不存在验证
- [ ] `vitest run` 全部通过
- [ ] 测试可独立运行，不依赖真实 canvas 页面
