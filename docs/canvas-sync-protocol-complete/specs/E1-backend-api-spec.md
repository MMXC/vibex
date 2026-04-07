# E1 Spec: 后端 Snapshots API

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /v1/canvas/snapshots | 创建快照（含乐观锁） |
| GET | /v1/canvas/snapshots?projectId=xxx | 获取快照列表 |
| GET | /v1/canvas/snapshots/latest?projectId=xxx | 获取最新版本号 |
| GET | /v1/canvas/snapshots/:id | 获取快照详情 |
| POST | /v1/canvas/snapshots/:id/restore | 恢复快照 |

## POST /v1/canvas/snapshots

```typescript
// POST body
{
  projectId: string;   // UUID
  data: CanvasData;      // 三树完整数据
  version: number;      // 客户端持有的版本号
}

// Success 200
{
  id: string;
  projectId: string;
  version: number;      // serverVersion = version + 1
  createdAt: number;
}

// Conflict 409
{
  conflict: true;
  serverVersion: number;
  serverSnapshot: {
    id: string;
    data: CanvasData;
    version: number;
  };
}
```

## 乐观锁逻辑
```typescript
const latest = await db.canvasSnapshots.findFirst({
  where: { projectId, isAutoSave: true },
  orderBy: { version: 'desc' },
});

if (version <= (latest?.version ?? 0)) {
  return Response.json(
    { conflict: true, serverVersion: latest.version, serverSnapshot: latest },
    { status: 409 }
  );
}
// 插入新快照，version = latest.version + 1
```
