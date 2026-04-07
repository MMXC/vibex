# E3 Spec: 轮询检测与集成

## useAutoSave 轮询逻辑

```typescript
// useAutoSave.ts
const POLL_INTERVAL = 30000; // 30s

useEffect(() => {
  const poll = async () => {
    const { version: serverVersion } = await canvasApi.getLatestVersion(projectId);
    if (serverVersion > localVersion) {
      setSaveStatus('conflict');
      const { serverSnapshot } = await canvasApi.getConflictData(projectId);
      openConflictDialog(serverSnapshot);
    }
  };

  const interval = setInterval(poll, POLL_INTERVAL);
  return () => clearInterval(interval);
}, [projectId, localVersion]);
```

## canvasApi 轻量端点
```typescript
// GET /v1/canvas/snapshots/latest?projectId=xxx
// 返回: { version: number }
// 用于轮询，不返回全量 data，overhead 最小
```
