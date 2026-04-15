# Spec: Epic 3 — 导入导出

**Epic ID**: E3
**优先级**: P2
**工时**: 2h
**负责人**: Frontend Dev

---

## 1. Overview

用户需能导出项目为 JSON 格式，并能重新导入，数据完整无损。

## 2. Scope

### In Scope
- JSON 格式导出（contexts + flows + components）
- JSON 导入 + 反序列化验证
- 5MB 文件大小限制
- Round-trip 无损验证

### Out of Scope
- YAML 格式（第二阶段）
- 外部 URL 解析（禁止）
- 增量 diff 导出

## 3. Technical Approach

### 3.1 JSON Schema（导出格式）

```typescript
interface ExportedProject {
  version: '1.0'
  exportedAt: string    // ISO timestamp
  project: {
    id: string
    name: string
  }
  data: {
    contexts: ContextTreeNode[]
    flows: FlowNode[]
    components: ComponentNode[]
  }
}
```

### 3.2 Export

```typescript
async function exportProject(projectId: string): Promise<Blob> {
  const contexts = useContextTreeStore.getState().serialize()
  const flows = useFlowStore.getState().serialize()
  const components = useComponentStore.getState().serialize()

  const payload: ExportedProject = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    project: { id: projectId, name: getProjectName(projectId) },
    data: { contexts, flows, components },
  }

  const json = JSON.stringify(payload)
  if (new Blob([json]).size > 5 * 1024 * 1024) {
    throw new Error('FILE_TOO_LARGE: 导出文件超过 5MB 限制')
  }

  return new Blob([json], { type: 'application/json' })
}
```

### 3.3 Import

```typescript
async function importProject(file: File): Promise<ImportResult> {
  const text = await file.text()

  // 不解析 URL（禁止）
  const data = JSON.parse(text) as ExportedProject

  // Schema 验证
  if (!data.version || !data.data?.contexts || !data.data?.flows || !data.data?.components) {
    throw new Error('INVALID_FORMAT: 文件格式无效')
  }

  return {
    contexts: data.data.contexts,
    flows: data.data.flows,
    components: data.data.components,
    projectName: data.project.name,
  }
}
```

## 4. Acceptance Criteria

```typescript
// E3-S1
describe('Export', () => {
  it('should export project as JSON with contexts, flows, components', async () => {
    const blob = await exportProject('proj-1')
    const text = await blob.text()
    const data = JSON.parse(text)
    expect(data.version).toBe('1.0')
    expect(data.data.contexts).toBeDefined()
    expect(data.data.flows).toBeDefined()
    expect(data.data.components).toBeDefined()
  })

  it('should throw error when file > 5MB', async () => {
    // mock 填充 >5MB 数据
    const largeData = { contexts: generateLargeTree(10000) }
    await expect(exportProject('proj-1')).rejects.toThrow('FILE_TOO_LARGE')
  })

  it('should include metadata (version, exportedAt, project)', async () => {
    const blob = await exportProject('proj-1')
    const data = JSON.parse(await blob.text())
    expect(data.exportedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    expect(data.project.id).toBe('proj-1')
  })
})

// E3-S2
describe('Import', () => {
  it('should parse exported JSON and restore data', async () => {
    const file = new File([JSON.stringify(validExportPayload)], 'export.json', { type: 'application/json' })
    const result = await importProject(file)
    expect(result.contexts).toHaveLength(validExportPayload.data.contexts.length)
    expect(result.flows).toHaveLength(validExportPayload.data.flows.length)
    expect(result.components).toHaveLength(validExportPayload.data.components.length)
  })

  it('should reject invalid JSON', async () => {
    const file = new File(['not valid json'], 'bad.json', { type: 'application/json' })
    await expect(importProject(file)).rejects.toThrow('INVALID_FORMAT')
  })

  it('should reject missing required fields', async () => {
    const incomplete = { version: '1.0', data: { contexts: [], flows: [] } } // 缺 components
    const file = new File([JSON.stringify(incomplete)], 'bad.json', { type: 'application/json' })
    await expect(importProject(file)).rejects.toThrow('INVALID_FORMAT')
  })

  it('should not fetch or parse any URLs in the data', async () => {
    // 验证导入时不发起外部请求
    const dataWithUrl = { ...validExportPayload, data: { contexts: [{ url: 'https://evil.com' }] } }
    const file = new File([JSON.stringify(dataWithUrl)], 'export.json', { type: 'application/json' })
    const result = await importProject(file)
    // 导入成功但不执行 URL 内容
    expect(fetch).not.toHaveBeenCalled()
  })

  it('should pass round-trip: export -> import -> data equals', async () => {
    // 导出 → 导入，数据完全一致
    const originalContexts = useContextTreeStore.getState().serialize()
    const blob = await exportProject('proj-1')
    const file = new File([await blob.text()], 'export.json', { type: 'application/json' })
    const imported = await importProject(file)
    expect(imported.contexts).toEqual(originalContexts)
  })
})
```

## 5. File Changes

```
Added:
  vibex-frontend/src/lib/exportProject.ts
  vibex-frontend/src/lib/importProject.ts
  vibex-frontend/src/__tests__/exportProject.test.ts
  vibex-frontend/src/__tests__/importProject.test.ts

Modified:
  vibex-frontend/src/components/ExportButton.tsx   (新建或修改)
  vibex-frontend/src/components/ImportButton.tsx   (新建或修改)
```

## 6. Edge Cases

- **空树导出**：contexts/flows/components 均为空数组时，允许导出（0 byte 文件）
- **大文件流式读取**：5MB 限制在序列化后检查，使用 Blob.size 而非内存全量加载
- **字符编码**：强制 UTF-8，导入时处理 BOM

## 7. DoD

- [ ] E3-S1 导出功能通过所有 expect 断言
- [ ] E3-S2 导入功能通过所有 expect 断言
- [ ] round-trip 无损验证通过
- [ ] >5MB 文件导出给出明确错误
- [ ] Code review 通过
