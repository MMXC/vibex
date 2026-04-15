# PRD: VibeX Sprint 2

**项目**: vibex-sprint2-20260415
**日期**: 2026-04-16
**来源**: analysis.md（Analyst 报告） + feature-list.md
**状态**: 有条件通过（E3 待确认）

---

## 1. 执行摘要

### 背景

VibeX Sprint 2 包含 4 个 Epic，均来自 Analyst 调研：

| Epic | 问题 | 现状 |
|------|------|------|
| E1 Tab State | tab 切换时 phase 状态残留，Prototype accordion 不关闭 | 代码存在，未修复 |
| E2 版本历史 | useVersionHistory hook 有 17 tests，API 已实现，UI 未集成 | 部分完成 |
| E3 导入导出 | 无任何实现痕迹，PRD 引用不存在 | 未开始（⚠️ 缺少规格文档） |
| E4 三树持久化 | CanvasSnapshot table 有 schema，前端序列化/UI 待实现 | 部分完成 |

### 目标

| 目标 | 指标 |
|------|------|
| 修复 Tab State 残留 | E1 所有 expect 断言通过 |
| 版本历史 UI 就绪 | E2 VersionHistoryDialog + diff viewer 上线 |
| 导入导出可用 | E3 JSON round-trip 无损，≤5MB |
| 三树跨 session 持久化 | E4 序列化/反序列化 + D1 migration 通过 |
| Sprint 总工时 | 11.5h |

### 成功指标

- E1: Tab 切换后 phase 立即重置，accordion 行为符合预期，回归测试 0 新增失败
- E2: 用户可在 Canvas 内打开 VersionHistoryDialog，查看版本列表和 diff
- E3: 导出文件可通过导入完整恢复（round-trip），不解析外部 URL
- E4: Dashboard 打开项目后，三树状态与上次保存一致
- 总工时: 11.5h（E1:1h + E2:3h + E3:2h + E4:5h）

### ⚠️ E3 风险提示

Analyst 报告指出 E3 引用了不存在的 PRD。**本 PRD 基于以下假设**：
- 导出格式为 JSON（含 contexts/flows/components）
- 5MB 文件大小限制
- 禁止解析外部 URL
- JSON-only（无 YAML，第二阶段）

若上述假设与实际需求不符，需 PM 补充 E3 规格文档后重新评审。

---

## 2. Epic 拆分

### 2.1 Epic 1 — Tab State 残留修复

| ID | Story | 描述 | 工时 | 验收标准 |
|----|-------|------|------|---------|
| E1-S1 | Tab 切换 phase 重置 | CanvasPage.tsx activeTab 变化时 setPhase('input') | 0.5h | 见章节 3 |
| E1-S2 | Tab State 回归测试 | useCanvasRenderer 测试覆盖 + accordion 状态验证 | 0.5h | 见章节 3 |

### 2.2 Epic 2 — 版本历史 UI 集成

| ID | Story | 描述 | 工时 | 验收标准 |
|----|-------|------|------|---------|
| E2-S1 | 版本历史 Dialog | VersionHistoryDialog UI + useVersionHistory hook 集成 | 1.5h | 见章节 3 |
| E2-S2 | 版本 Diff 预览 | 版本对比功能（diff viewer） | 1.5h | 见章节 3 |

### 2.3 Epic 3 — 导入导出

| ID | Story | 描述 | 工时 | 验收标准 |
|----|-------|------|------|---------|
| E3-S1 | 项目 JSON 导出 | 导出 contexts/flows/components 为 JSON，≤5MB 限制 | 1h | 见章节 3 |
| E3-S2 | 项目 JSON 导入 | 导入 JSON 反序列化，round-trip 无损验证 | 1h | 见章节 3 |

### 2.4 Epic 4 — 三树数据持久化

| ID | Story | 描述 | 工时 | 验收标准 |
|----|-------|------|------|---------|
| E4-S1 | 三树数据序列化 | Canvas 三树数据写入 CanvasSnapshot.data JSON | 2h | 见章节 3 |
| E4-S2 | 三树数据反序列化 | 从 CanvasSnapshot.data 恢复三树状态 | 1.5h | 见章节 3 |
| E4-S3 | D1 Migration 验证 | staging 环境 migration 验证 + 回滚脚本 | 1.5h | 见章节 3 |

**总工时: 11.5h | 优先级: E1/E4 P1, E2 P1, E3 P2 | 负责人: Frontend/Backend Dev**

---

## 3. 验收标准（可写 expect() 断言）

### E1-S1 — Tab 切换 phase 重置

```typescript
describe('Tab State Reset', () => {
  it('should reset phase to input when switching tabs', () => {
    act(() => { setPhase('prototype') })
    expect(useCanvasStore.getState().phase).toBe('prototype')
    act(() => { setPhase('input') }) // 模拟 tab 切换
    expect(useCanvasStore.getState().phase).toBe('input')
  })

  it('should close prototype accordion when leaving prototype tab', () => {
    const { getByTestId } = render(<CanvasPage />)
    fireEvent.click(getByTestId('tab-prototype'))
    expect(getByTestId('prototype-accordion')).toBeVisible()
    fireEvent.click(getByTestId('tab-context'))
    expect(getByTestId('prototype-accordion')).not.toBeVisible()
  })
})
```

### E1-S2 — Tab State 回归测试

```typescript
it('should not regress other tab behaviors', () => {
  const { getByTestId } = render(<CanvasPage />)
  fireEvent.click(getByTestId('tab-flow'))
  expect(getByTestId('flow-canvas')).toBeVisible()
  fireEvent.click(getByTestId('tab-context'))
  expect(getByTestId('context-tree')).toBeVisible()
})
```

### E2-S1 — 版本历史 Dialog

```typescript
describe('VersionHistoryDialog', () => {
  it('should display version list from API', async () => {
    const { getByText } = render(
      <VersionHistoryDialog projectId="proj-1" open={true} onClose={() => {}} />
    )
    await waitFor(() => {
      expect(getByText(/v\d+/)).toBeVisible()
    })
  })

  it('should show createdAt timestamp for each version', async () => {
    const { getAllByTestId } = render(<VersionHistoryDialog ... />)
    await waitFor(() => {
      const timestamps = getAllByTestId('version-timestamp')
      expect(timestamps[0]).toHaveTextContent(/\d{4}-\d{2}-\d{2}/)
    })
  })

  it('should show isAutoSave badge', async () => {
    const { getAllByTestId } = render(<VersionHistoryDialog ... />)
    await waitFor(() => {
      expect(getAllByTestId('autosave-badge').length).toBeGreaterThanOrEqual(0)
    })
  })

  it('should call hook with projectId', () => {
    const mockHook = useVersionHistory as jest.Mock
    render(<VersionHistoryDialog projectId="proj-123" ... />)
    expect(mockHook).toHaveBeenCalledWith('proj-123')
  })
})
```

### E2-S2 — 版本 Diff 预览

```typescript
describe('Version Diff', () => {
  it('should compare two versions and show diff stats', () => {
    const diff = diffVersions(version1, version2)
    expect(diff.contexts).toHaveProperty('added')
    expect(diff.contexts).toHaveProperty('removed')
    expect(diff.flows).toHaveProperty('changed')
    expect(diff.components).toHaveProperty('changed')
  })

  it('should highlight changed nodes in UI', async () => {
    const { getByTestId } = render(<DiffViewer v1={v1} v2={v2} />)
    expect(getByTestId('diff-context')).toHaveTextContent(/\+\d+ -\d+/)
  })
})
```

### E3-S1 — 项目 JSON 导出

```typescript
describe('Export', () => {
  it('should export project as JSON with contexts, flows, components', async () => {
    const blob = await exportProject('proj-1')
    const data = JSON.parse(await blob.text())
    expect(data.version).toBe('1.0')
    expect(data.data.contexts).toBeDefined()
    expect(data.data.flows).toBeDefined()
    expect(data.data.components).toBeDefined()
  })

  it('should throw error when file > 5MB', async () => {
    await expect(exportProject('proj-1')).rejects.toThrow('FILE_TOO_LARGE')
  })

  it('should include metadata', async () => {
    const data = JSON.parse(await (await exportProject('proj-1')).text())
    expect(data.exportedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    expect(data.project.id).toBe('proj-1')
  })
})
```

### E3-S2 — 项目 JSON 导入

```typescript
describe('Import', () => {
  it('should parse exported JSON and restore data', async () => {
    const file = new File([JSON.stringify(validPayload)], 'export.json', { type: 'application/json' })
    const result = await importProject(file)
    expect(result.contexts.length).toBe(validPayload.data.contexts.length)
    expect(result.flows.length).toBe(validPayload.data.flows.length)
    expect(result.components.length).toBe(validPayload.data.components.length)
  })

  it('should reject invalid JSON', async () => {
    const file = new File(['not valid json'], 'bad.json', { type: 'application/json' })
    await expect(importProject(file)).rejects.toThrow('INVALID_FORMAT')
  })

  it('should reject missing required fields', async () => {
    const incomplete = { version: '1.0', data: { contexts: [], flows: [] } }
    const file = new File([JSON.stringify(incomplete)], 'bad.json', { type: 'application/json' })
    await expect(importProject(file)).rejects.toThrow('INVALID_FORMAT')
  })

  it('should not fetch any URLs during import', async () => {
    const dataWithUrl = { ...validPayload, note: 'https://example.com' }
    const file = new File([JSON.stringify(dataWithUrl)], 'export.json', { type: 'application/json' })
    await importProject(file)
    expect(fetch).not.toHaveBeenCalled()
  })

  it('should pass round-trip: export -> import -> data equals', async () => {
    const original = serializeCanvasState()
    const blob = await exportProject('proj-1')
    const imported = await importProject(new File([await blob.text()], 'export.json'))
    expect(imported.contexts).toEqual(original.contexts)
    expect(imported.flows).toEqual(original.flows)
    expect(imported.components).toEqual(original.components)
  })
})
```

### E4-S1 — 三树数据序列化

```typescript
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
```

### E4-S2 — 三树数据反序列化

```typescript
describe('CanvasState Restoration', () => {
  it('should restore contexts tree from snapshot data', () => {
    const data = loadTestSnapshot('proj-1')
    restoreCanvasState(data)
    expect(useContextTreeStore.getState().nodes.length).toBe(data.contexts.length)
  })

  it('should restore flows from snapshot data', () => {
    const data = loadTestSnapshot('proj-1')
    restoreCanvasState(data)
    expect(useFlowStore.getState().nodes.length).toBe(data.flows.length)
  })

  it('should restore components from snapshot data', () => {
    const data = loadTestSnapshot('proj-1')
    restoreCanvasState(data)
    expect(useComponentStore.getState().nodes.length).toBe(data.components.length)
  })

  it('should handle unknown version gracefully', () => {
    const badData = { ...data, version: '99.0' }
    expect(() => restoreCanvasState(badData as CanvasSnapshotData)).not.toThrow()
  })
})
```

### E4-S3 — D1 Migration 验证

```typescript
describe('D1 Migration', () => {
  it('should apply all migrations in staging without error', async () => {
    const result = await runMigration('staging')
    expect(result.ok).toBe(true)
  })

  it('should rollback on failure', async () => {
    const result = await runMigration('staging', { rollback: true })
    expect(result.ok).toBe(true)
  })
})
```

---

## 4. 功能点汇总

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.1 | Tab phase 重置 | activeTab 变化时 setPhase('input') | E1-S1 expect | 【需页面集成】CanvasPage.tsx |
| F1.2 | Accordion 状态 | phase !== 'prototype' 时 accordion 关闭 | E1-S1 expect | 【需页面集成】CanvasPage prototype accordion |
| F2.1 | VersionHistoryDialog | 版本列表 dialog，show createdAt + isAutoSave | E2-S1 expect | 【需页面集成】CanvasPage |
| F2.2 | DiffViewer | 两版本 diff 对比，显示变化统计 | E2-S2 expect | 【需页面集成】VersionHistoryDialog |
| F3.1 | exportProject | 导出 JSON ≤5MB，含 metadata | E3-S1 expect | 【需页面集成】ExportButton |
| F3.2 | importProject | 导入 JSON，round-trip 无损 | E3-S2 expect | 【需页面集成】ImportButton |
| F4.1 | serializeCanvasState | 三树序列化 → JSON | E4-S1 expect | 【需集成】useAutoSave.ts |
| F4.2 | restoreCanvasState | JSON → 三树状态恢复 | E4-S2 expect | 【需集成】CanvasPage.tsx (load) |
| F4.3 | D1 migration | staging migration + rollback | E4-S3 expect | 无（DBA 独立部署验证） |

---

## 5. DoD (Definition of Done)

### E1 — Tab State 残留修复
- [ ] E1-S1 所有 expect 断言通过
- [ ] E1-S2 回归测试通过
- [ ] useCanvasRenderer 测试套件全通过（0 新增失败）
- [ ] Code review 通过

### E2 — 版本历史 UI 集成
- [ ] VersionHistoryDialog 显示版本列表（时间戳 + isAutoSave 标记）
- [ ] useVersionHistory hook 与实际 API 接口匹配验证通过（无 TypeScript 错误）
- [ ] Diff viewer 显示 contexts/flows/components 各自的变化
- [ ] E2-S1 / E2-S2 所有 expect 断言通过
- [ ] Code review 通过

### E3 — 导入导出
- [ ] 导出 JSON ≤5MB，超限给出明确错误提示
- [ ] 导入不解析外部 URL（无 fetch 调用）
- [ ] round-trip 无损验证通过
- [ ] E3-S1 / E3-S2 所有 expect 断言通过
- [ ] ⚠️ **E3 依赖假设**：若 PM 补充的 PRD 与上述假设不符，本 Epic DoD 需重新定义
- [ ] Code review 通过

### E4 — 三树数据持久化
- [ ] serializeCanvasState() 正确序列化三树为 JSON
- [ ] autoSave() 将序列化数据写入 CanvasSnapshot.data
- [ ] restoreCanvasState() 正确恢复三树状态
- [ ] D1 migration 在 staging 环境验证通过
- [ ] E4-S1 / E4-S2 / E4-S3 所有 expect 断言通过
- [ ] Code review 通过

### 全局 DoD
- [ ] 所有 Story 工时在估算范围内（总工时 11.5h ±20%）
- [ ] 不引入新的 high/critical 安全漏洞
- [ ] Lint + type-check 通过

---

## 6. 依赖关系

```
E1-S1 ──→ E1-S2
E2-S1 ──→ E2-S2
E3-S1 ──→ E3-S2

E4-S1 ──→ E4-S2 ──→ E4-S3
  ↑ 并行可与 E1/E2/E3 独立进行
```

建议实施顺序：E1 → E4 → E2 → E3

---

## 7. 技术约束

| 约束 | 说明 |
|------|------|
| E3 5MB 限制 | Blob.size 检查，在内存序列化后验证 |
| E3 禁止 URL 解析 | 导入时不做 fetch/eval，直接 JSON.parse |
| E4 D1 schema | 复用 CanvasSnapshot.data JSON，不新建表 |
| E4 migration | 必须在 staging 验证，准备 rollback 脚本 |
| E2 hook 就绪 | useVersionHistory 已有 17 tests，UI 集成时直接调用 |
