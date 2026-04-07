# Spec: Epic E2 — Snapshot CRUD 端点

## 1. 架构决策

**源后端**: Hono（Hono 作为 v1 API 唯一后端，Next.js route deprecated）

**Schema**（Prisma CanvasSnapshot model）:
```prisma
model CanvasSnapshot {
  id         String   @id @default(cuid())
  projectId  String
  name       String
  data       String   // JSON stringified canvas state
  createdAt  DateTime @default(now())
}
```

## 2. 端点规格

### POST /api/v1/canvas/snapshots
- **Input**: `{ projectId: string, name: string, data: object }`
- **Output**: `201 { id: string, projectId, name, createdAt }`
- **Errors**: `400` (invalid body), `409` (concurrent write — optimistic lock)

### GET /api/v1/canvas/snapshots
- **Input**: `?projectId=xxx`
- **Output**: `200 Array<{ id, projectId, name, createdAt }>` 时间倒序
- **Errors**: `400` (missing projectId)

### GET /api/v1/canvas/snapshots/:id
- **Output**: `200 { id, projectId, name, data, createdAt }`
- **Errors**: `404` (not found)

### POST /api/v1/canvas/snapshots/:id/restore
- **Output**: `200 { success: true, snapshotId }`
- **Errors**: `404` (not found)

### GET /api/v1/canvas/snapshots/latest
- **Input**: `?projectId=xxx`
- **Output**: `200 { id, projectId, name, createdAt }`
- **Errors**: `404` (no snapshots)

### DELETE /api/v1/canvas/snapshots/:id
- **Output**: `204`
- **Errors**: `404` (not found)

## 3. CORS 处理

所有 Snapshot 端点需在 gateway 层注册 OPTIONS handler：
```typescript
// gateway.ts
protected_.options('/api/v1/canvas/snapshots/*', (c) => {
  c.res.headers.set('Access-Control-Allow-Origin', '*');
  return c.text('', 204);
});
```

## 4. 验收标准

```typescript
// create
const r1 = await fetch('/api/v1/canvas/snapshots', {
  method: 'POST',
  body: JSON.stringify({ projectId: 'test', name: 'snap1', data: {} })
});
expect(r1.status).toBe(201);
expect((await r1.json()).id).toMatch(/^cm/);

// list
const r2 = await fetch('/api/v1/canvas/snapshots?projectId=test');
expect(r2.status).toBe(200);
expect(Array.isArray(await r2.json())).toBe(true);

// latest
const r3 = await fetch('/api/v1/canvas/snapshots/latest?projectId=test');
expect([200, 404]).toContain(r3.status); // 200 if exists, 404 if empty

// delete
const r4 = await fetch(`/api/v1/canvas/snapshots/${snapId}`, { method: 'DELETE' });
expect(r4.status).toBe(204);

// CORS
const r5 = await fetch('/api/v1/canvas/snapshots', { method: 'OPTIONS' });
expect(r5.status).toBe(204);
```
