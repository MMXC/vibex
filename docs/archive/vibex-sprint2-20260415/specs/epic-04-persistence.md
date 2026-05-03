# Spec: Epic 4 — 三树数据持久化

**Epic ID**: E4
**优先级**: P1
**工时**: 5h
**负责人**: Frontend + Backend Dev

---

## 1. Overview

CanvasSnapshot table 的 `data` 字段已设计存储 `{contexts, flows, components}`。前端需实现序列化逻辑，将三树数据写入 D1，跨 session 保持工作状态。

## 2. Scope

### In Scope
- 三树数据序列化 → CanvasSnapshot.data JSON
- CanvasSnapshot.data → 三树状态恢复
- D1 migration 在 staging 验证

### Out of Scope
- 自动快照策略（已有）
- Snapshot cleanup / 过期策略

## 3. Technical Approach

### 3.1 Serialization

```typescript
// 三棵树合并为单个 JSON payload
interface CanvasSnapshotData {
  version: '1.0'
  contexts: ContextTreeNode[]
  flows: FlowNode[]
  components: ComponentNode[]
  ui?: {
    activeTab?: string
    phase?: string
  }
}

function serializeCanvasState(): CanvasSnapshotData {
  return {
    version: '1.0',
    contexts: useContextTreeStore.getState().serialize(),
    flows: useFlowStore.getState().serialize(),
    components: useComponentStore.getState().serialize(),
  }
}
```

### 3.2 Deserialization

```typescript
function restoreCanvasState(data: CanvasSnapshotData): void {
  if (data.version !== '1.0') {
    console.warn('Unknown snapshot version:', data.version)
  }
  useContextTreeStore.getState().hydrate(data.contexts)
  useFlowStore.getState().hydrate(data.flows)
  useComponentStore.getState().hydrate(data.components)
}
```

### 3.3 Integration

```typescript
// CanvasPage.tsx — 打开项目时恢复
useEffect(() => {
  if (projectId) {
    fetchSnapshot(projectId).then(snapshot => {
      if (snapshot?.data) {
        restoreCanvasState(snapshot.data)
      }
    })
  }
}, [projectId])

// 自动保存时序列化
function autoSave() {
  const data = serializeCanvasState()
  upsertSnapshot(projectId, { data })
}
```

## 4. Acceptance Criteria

```typescript
// E4-S1: 序列化
describe('CanvasState Serialization', () => {
  it('should serialize contexts, flows, components to JSON', () => {
    const data = serializeCanvasState()
    expect(data.version).toBe('1.0')
    expect(Array.isArray(data.contexts)).toBe(true)
    expect(Array.isArray(data.flows)).toBe(true)
    expect(Array.isArray(data.components)).toBe(true)
  })

  it('should persist to CanvasSnapshot.data', async () => {
    await autoSave('proj-1')
    const snapshot = await fetchSnapshot('proj-1')
    expect(snapshot.data.contexts).toBeDefined()
    expect(snapshot.data.flows).toBeDefined()
    expect(snapshot.data.components).toBeDefined()
  })
})

// E4-S2: 反序列化
describe('CanvasState Restoration', () => {
  it('should restore contexts tree from snapshot data', () => {
    const data = loadTestSnapshot('proj-1')
    restoreCanvasState(data)
    expect(useContextTreeStore.getState().nodes).toHaveLength(data.contexts.length)
  })

  it('should restore flows from snapshot data', () => {
    const data = loadTestSnapshot('proj-1')
    restoreCanvasState(data)
    expect(useFlowStore.getState().nodes).toHaveLength(data.flows.length)
  })

  it('should restore components from snapshot data', () => {
    const data = loadTestSnapshot('proj-1')
    restoreCanvasState(data)
    expect(useComponentStore.getState().nodes).toHaveLength(data.components.length)
  })

  it('should handle unknown version gracefully', () => {
    const badData = { ...validData, version: '99.0' }
    expect(() => restoreCanvasState(badData as CanvasSnapshotData)).not.toThrow()
  })
})

// E4-S3: D1 Migration
describe('D1 Migration', () => {
  it('should apply migration in staging without error', async () => {
    const result = await runMigration('staging')
    expect(result.ok).toBe(true)
    expect(result.migrations).toHaveLength(7) // 0000-0006
  })

  it('should rollback on failure', async () => {
    const result = await runMigration('staging', { rollback: true })
    expect(result.ok).toBe(true)
  })
})
```

## 5. File Changes

```
Added:
  vibex-frontend/src/lib/canvasSerializer.ts
  vibex-frontend/src/__tests__/canvasSerializer.test.ts

Modified:
  vibex-frontend/src/pages/CanvasPage.tsx       (添加 restore on load)
  vibex-frontend/src/hooks/useAutoSave.ts      (添加 serialize on save)

d1/migrations/
  0007_canvas_snapshot_data.sql  (如需 schema 调整)
```

## 6. DoD

- [ ] E4-S1 序列化所有 expect 断言通过
- [ ] E4-S2 反序列化所有 expect 断言通过
- [ ] E4-S3 D1 migration staging 验证通过
- [ ] Dashboard 打开项目正确恢复三树状态
- [ ] Code review 通过
