# Implementation Plan: Canvas JSON 前后端统一 + 版本化 + 自动保存

**项目**: canvas-json-persistence
**版本**: v1.0
**日期**: 2026-04-02
**状态**: ✅ 设计完成

---

## Sprint 排期

| Sprint | Epic | 工时 | 优先级 |
|--------|------|------|--------|
| Sprint 0 | E1 统一数据模型 | 3-4h | P0 |
| Sprint 1 | E2 后端版本化存储 | 6-8h | P0 |
| Sprint 2 | E3 自动保存 | 4-6h | P0 |
| Sprint 3 | E4 同步协议 | 3-4h | P1 |
| **总计** | | **16-22h** | |

---

## Sprint 0: 统一数据模型（3-4h）

### E1-S1: NodeState 接口统一（1h）

```typescript
// src/lib/canvas/types/NodeState.ts
export interface NodeState {
  nodeId: string;
  name: string;
  type: 'context' | 'flow' | 'component';
  status: 'idle' | 'selected' | 'confirmed' | 'error';
  selected: boolean;
  version: number;
}
```

### E1-S2: Migration 3→4 修复（1h）

```typescript
// src/lib/canvas/migrations.ts
function migrateV3toV4(data: any): NodeState[] {
  return data.nodes.map((n: any) => ({
    ...n,
    status: n.status ?? (n.confirmed ? 'confirmed' : 'idle'),
    selected: n.selected ?? false,
    version: 4,
  }));
}
```

### E1-S3: selected 字段明确（1h）

更新三树组件使用统一 `selected` 字段。

---

## Sprint 1: 后端版本化存储（6-8h）

### E2-S1: Prisma CanvasSnapshot Model（2h）

```bash
npx prisma migrate dev --name add_canvas_snapshot
```

### E2-S2: 快照保存 API（2h）

```typescript
// pages/api/canvas/[projectId]/snapshot.ts
export async function POST(req, res) {
  const { projectId } = req.query;
  const { data, version } = req.body;
  const snapshot = await prisma.canvasSnapshot.create({
    data: { projectId, version, data },
  });
  res.json({ snapshotId: snapshot.id, version: snapshot.version });
}
```

### E2-S3: 版本列表 + 回滚 API（2h）

```typescript
// GET snapshots
// POST rollback
```

### E2-S4: Prisma migration（验证）

---

## Sprint 2: 自动保存（4-6h）

### E3-S1: Debounce 保存（2h）

```typescript
import { useDebouncedCallback } from 'use-debounce';

const debouncedSave = useDebouncedCallback(
  (nodes) => api.saveSnapshot(projectId, nodes),
  2000
);
```

### E3-S2: 视觉反馈（1h）

```tsx
<div className={styles.saveIndicator}>
  {isSaving ? '保存中...' : lastSaved ? `已保存 ${formatRelative(lastSaved)}` : null}
</div>
```

### E3-S3: Beacon 保存（1h）

```typescript
window.addEventListener('beforeunload', () => {
  navigator.sendBeacon(`/api/canvas/${projectId}/snapshot`, JSON.stringify(data));
});
```

---

## Sprint 3: 同步协议（3-4h）

### E4-S1: 冲突检测（1h）

```typescript
if (localVersion < serverVersion) {
  showConflictDialog({ localVersion, serverVersion });
}
```

### E4-S2: 冲突解决 UI（2h）

---

## 验收清单

- [x] E1-S1: NodeState 三树统一（NodeState.ts 类型定义）
- [x] E1-S2: Migration 2→3 修复（status 映射 + version 4 bump）
- [x] E1-S3: selected 字段明确（checkbox-persist-bug commit 512f3fce）
- [x] E2-S1: CanvasSnapshot table migration (0006_canvas_snapshot.sql)
- [x] E2-S2: Snapshot save API (POST /v1/canvas/snapshots)
- [x] E2-S3: Version list + rollback API (GET/POST /v1/canvas/rollback)
- [x] E3-S1: Debounce 2s 保存 (useAutoSave hook, useDebouncedCallback)
- [x] E3-S2: 状态指示器显示 (SaveIndicator component)
- [x] E3-S3: Beacon 保存 (beforeunload handler with sendBeacon)
- [ ] E2: Prisma migration 成功
- [ ] E2: 3 个 API 端点工作
- [ ] E4: 冲突检测 + UI
- [ ] npm test 通过
