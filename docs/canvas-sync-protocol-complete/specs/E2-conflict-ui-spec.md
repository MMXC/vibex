# E2 Spec: 前端冲突 UI

## ConflictDialog 组件

```tsx
// ConflictDialog.tsx
interface Props {
  serverSnapshot: CanvasData;
  localSnapshot: CanvasData;
  onResolve: (action: 'keep-local' | 'keep-server' | 'cancel') => void;
}

// 三个按钮
<Button onClick={() => onResolve('keep-local')}>保留本地修改</Button>
<Button onClick={() => onResolve('keep-server')}>使用服务器版本</Button>
<Button variant="ghost" onClick={() => onResolve('cancel')}>取消</Button>
```

## 解决逻辑

### keep-local
```typescript
// 强制覆盖：version = serverVersion + 1
await POST('/v1/canvas/snapshots', {
  projectId,
  data: localSnapshot,
  version: serverVersion + 1,  // 强制
});
```

### keep-server
```typescript
// 恢复服务器版本
await POST(`/v1/canvas/snapshots/${serverSnapshot.id}/restore`);
canvasStore.setBoundedContexts(serverSnapshot.data.boundedContexts);
canvasStore.setBusinessFlows(serverSnapshot.data.businessFlows);
canvasStore.setComponents(serverSnapshot.data.components);
```

## SaveIndicator 集成
```tsx
// SaveIndicator.tsx
{saveStatus === 'conflict' && (
  <Button onClick={() => openConflictDialog()}>
    🔄 解决冲突
  </Button>
)}
```
