# Spec: Epic E3 — Snapshot Schema 校验

## 1. Zod schema 结构化

```typescript
// src/routes/v1/canvas/snapshots/schemas.ts
const BoundedContextNodeSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(1),
  type: z.enum(['core', 'supporting', 'generic', 'external']),
  description: z.string().optional(),
  color: z.string().optional(),
});

const FlowNodeSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(1),
  flowId: z.string(),
});

const ComponentNodeSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(1),
  type: z.string(),
  flowId: z.string(),
});

export const CreateSnapshotSchema = z.object({
  projectId: z.string().cuid(),
  name: z.string().min(1),
  data: z.object({
    contextNodes: z.array(BoundedContextNodeSchema).default([]),
    flowNodes: z.array(FlowNodeSchema).default([]),
    componentNodes: z.array(ComponentNodeSchema).default([]),
  }),
});
```

## 2. API 校验集成

```typescript
// snapshots.ts route
app.post('/', async (c) => {
  const parsed = CreateSnapshotSchema.safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json({ error: 'Validation failed', details: parsed.error.flatten() }, 400);
  }
  // proceed...
});
```

## 3. 验收标准

```typescript
// 无效 payload
const invalid = { projectId: '', name: '', data: { contextNodes: null } };
const result = CreateSnapshotSchema.safeParse(invalid);
expect(result.success).toBe(false);

// API 测试
const r = await fetch('/api/v1/canvas/snapshots', {
  method: 'POST',
  body: JSON.stringify(invalid)
});
expect(r.status).toBe(400);
expect(await r.json()).toHaveProperty('details');
```
