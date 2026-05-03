# Spec: Epic 2 — 版本历史 UI 集成

**Epic ID**: E2
**优先级**: P1
**工时**: 3h
**负责人**: Frontend Dev

---

## 1. Overview

`useVersionHistory` hook 有 17 个测试，Snapshot API 已实现，但 UI 未集成。用户无法查看/回滚历史版本。

## 2. Scope

### In Scope
- VersionHistoryDialog 组件
- useVersionHistory hook 集成
- GET `/api/v1/canvas/snapshots?projectId=X` API 集成
- 版本 diff viewer

### Out of Scope
- 自动快照触发逻辑（已有）
- Snapshot cleanup / 过期策略

## 3. Technical Approach

### 3.1 VersionHistoryDialog

```typescript
// vibex-frontend/src/components/VersionHistoryDialog.tsx
import { useVersionHistory } from '@/hooks/useVersionHistory'

export function VersionHistoryDialog({ projectId, open, onClose }: Props) {
  const { versions, loading, error, refetch } = useVersionHistory(projectId)

  return (
    <Dialog open={open} onClose={onClose} title="版本历史">
      {loading && <Spinner />}
      {error && <Alert severity="error">{error.message}</Alert>}
      {!loading && !error && (
        <VersionList versions={versions} />
      )}
    </Dialog>
  )
}
```

### 3.2 Version List Item

```typescript
interface VersionItem {
  id: string
  createdAt: string      // ISO timestamp
  isAutoSave: boolean
  label: string          // 手动版本可自定义 label
}
```

### 3.3 Diff Viewer

```typescript
// 两个版本对比，返回 diff 视图
// 使用 diff 算法（如 diff-match-patch）展示变更
function diffVersions(v1: Version, v2: Version): DiffResult {
  // 返回 contexts/flows/components 各自的变化统计
}
```

## 4. Acceptance Criteria

```typescript
// E2-S1
describe('VersionHistoryDialog', () => {
  it('should display version list from API', async () => {
    const { getByText } = render(
      <VersionHistoryDialog projectId="proj-1" open={true} onClose={() => {}} />
    )
    await waitFor(() => {
      expect(getByText('v3')).toBeVisible() // 最新版本
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
      expect(getAllByTestId('autosave-badge').length).toBeGreaterThan(0)
    })
  })

  it('should call hook with projectId', () => {
    const hook = useVersionHistory as jest.Mock
    render(<VersionHistoryDialog projectId="proj-123" ... />)
    expect(hook).toHaveBeenCalledWith('proj-123')
  })
})

// E2-S2
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
    expect(getByTestId('diff-context')).toHaveTextContent('+3 -1')
    expect(getByTestId('diff-flow')).toHaveTextContent('+1 -2')
  })
})
```

## 5. File Changes

```
Added:
  vibex-frontend/src/components/VersionHistoryDialog.tsx   (新建)
  vibex-frontend/src/components/DiffViewer.tsx              (新建)
  vibex-frontend/src/__tests__/VersionHistoryDialog.test.tsx

Modified:
  vibex-frontend/src/pages/CanvasPage.tsx  (添加打开 dialog 按钮)
```

## 6. DoD

- [ ] VersionHistoryDialog 显示版本列表
- [ ] 每个版本显示 createdAt 和 isAutoSave 标记
- [ ] useVersionHistory hook 与 API 接口匹配验证通过
- [ ] Diff viewer 显示 contexts/flows/components 各自的变化
- [ ] E2-S1 / E2-S2 所有 expect 断言通过
- [ ] Code review 通过
