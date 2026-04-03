# Spec: Canvas JSON Persistence — E1-E4 Summary

## 1. 概述

**工时**: 16-22h | **优先级**: P0-P1
**依赖**: E1 → E2 → E3 → E4

## 2. E1 详细规格

### NodeState 统一接口
```ts
interface NodeState {
  nodeId: string;
  name: string;
  status: 'idle' | 'selected' | 'confirmed' | 'error';
  selected?: boolean;  // 明确语义
  isActive?: boolean;
  version: number;
}
```

### Migration 3→4 修复
```ts
if (version < 4) {
  return {
    ...rest,
    status: rest.status ?? (confirmed ? 'confirmed' : 'idle'),
    version: 4,
  };
}
```

## 3. E2 详细规格

### Prisma CanvasSnapshot Model
```prisma
model CanvasSnapshot {
  id        String   @id @default(uuid())
  projectId String
  version   Int
  data      Json
  createdAt DateTime @default(now())
  
  @@unique([projectId, version])
}
```

### API 端点
```
GET  /api/canvas/{projectId}/snapshots
POST /api/canvas/{projectId}/rollback
POST /api/canvas/{projectId}/snapshot
```

## 4. E3 详细规格

### 自动保存 Debounce
```ts
const debouncedSave = useDebouncedCallback(
  () => api.saveSnapshot(projectId, data),
  2000
);
```

### 状态指示器
```tsx
{isSaving && <span>保存中...</span>}
{lastSaved && <span>已保存 {formatRelativeTime(lastSaved)}</span>}
```

### Beacon 保存
```ts
window.addEventListener('beforeunload', () => {
  navigator.sendBeacon('/api/canvas/snapshot', JSON.stringify(data));
});
```

## 5. E4 详细规格

### 冲突检测
```ts
const checkConflict = async () => {
  const serverVersion = await api.getVersion(projectId);
  if (serverVersion > localVersion) {
    setHasConflict(true);
  }
};
```

### 冲突 UI
```tsx
{hasConflict && (
  <ConflictDialog>
    <p>检测到服务器有新版本</p>
    <Button onClick={keepLocal}>保留本地</Button>
    <Button onClick={keepServer}>使用服务器</Button>
  </ConflictDialog>
)}
```

## 6. DoD

- [ ] E1: NodeState 统一，Migration 3→4 通过
- [ ] E2: CanvasSnapshot Model，GET/POST API 工作
- [ ] E3: Debounce 2s，保存指示器，beacon 保存
- [ ] E4: 冲突检测，冲突 UI
