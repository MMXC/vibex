# Epic 1: BugFix Sprint — 规格说明

**Epic ID**: epic-1-bugfix  
**优先级**: P0 / P1  
**工时估算**: ~3.5h  
**依赖**: 无外部依赖（S1-2 需 OQ-1 澄清后解锁）  
**代码基准**: `79ebe010`

---

## 目标

修复 Canvas 页面已识别的 8 个 bug（3 P0 + 5 P1），全部在 1 个 Sprint 内完成。核心价值：消除功能阻断、稳定版本轮询、修复状态响应式问题。

---

## Stories

### S1-1: handleRegenerateContexts 闭包修复

**文件**: `vibex-fronted/src/components/canvas/CanvasPage.tsx:222-245`  
**优先级**: P0  
**工时**: 0.5h

#### 问题描述
`useCallback([], ...)` 空依赖数组捕获了首次渲染的闭包值，导致：
- `aiThinking` 永远为 false → 防重入检查失效
- `requirementText` 永远是首次渲染值 → 生成内容与用户输入不匹配
- 用户可连续多次点击触发多个并发请求

#### 修复方案
补全依赖数组：
```tsx
const handleRegenerateContexts = useCallback(
  async (options?: { requirementText?: string }) => { ... },
  [aiThinking, isQuickGenerating, requirementText, toast]  // 移除空数组
)
```

#### 验收标准
```ts
// ESLint exhaustive-deps 不再报警
expect(handleRegenerateContexts.toString()).not.toMatch(/\[\]/)

// 连续点击防重入生效
await userEvent.click(screen.getByRole('button', { name: /重新生成/ }))
await userEvent.click(screen.getByRole('button', { name: /重新生成/ }))
expect(generateRequests).toHaveLength(1) // 第二次被阻断

// requirementText 变化后重新生成，内容与当前输入一致
await fillRequirementText('new input')
await userEvent.click(screen.getByRole('button', { name: /重新生成/ }))
expect(lastGenerateCall).toHaveBeenCalledWith(expect.objectContaining({ requirementText: 'new input' }))
```

---

### S1-2: useCanvasRenderer 类型安全化

**文件**: `vibex-fronted/src/hooks/canvas/useCanvasRenderer.ts:178-195`  
**优先级**: P0  
**工时**: 1h（需 OQ-1 澄清）  
**依赖**: OQ-1（isActive 语义澄清）

#### 问题描述
使用 `as unknown as` 绕过类型检查访问不存在的字段，类型定义变更时静默产生运行时错误。

```tsx
confirmed: (n as unknown as { isActive?: boolean }).isActive !== false,
parentId: (n as unknown as { parentId?: string }).parentId,
children: (n as unknown as { children?: string[] }).children ?? [],
```

#### 修复方案
在 `types.ts` 中为 `BusinessFlowNode` 和 `ComponentNode` 添加可选字段：
```tsx
interface BusinessFlowNode {
  id: string
  name: string
  confirmed?: boolean   // 继承 / 新增
  isActive?: boolean   // 新增（P0-2 关键字段）
  parentId?: string    // 新增
  children?: string[]  // 新增
  // ...
}

interface ComponentNode {
  id: string
  name: string
  confirmed?: boolean
  isActive?: boolean   // 新增
  parentId?: string    // 新增
  children?: string[]  // 新增
  // ...
}
```

然后替换断言：
```tsx
// 替换前
confirmed: (n as unknown as { isActive?: boolean }).isActive !== false,

// 替换后
confirmed: n.isActive !== false,
```

#### 验收标准
```ts
expect(tsc --noEmit).toHaveExitCode(0)

expect(file('useCanvasRenderer.ts')).not.toMatch(/as unknown as/)

// 三树节点正确渲染
expect(screen.getAllByRole('treeitem')).toHaveLength(expected)
```

---

### S1-3: isExporting 响应式化

**文件**: `vibex-fronted/src/hooks/canvas/useCanvasExport.ts:321`  
**优先级**: P1  
**工时**: 0.25h

#### 问题描述
`isExporting: isExportingRef.current` 暴露的是 ref 而非 state，导出按钮状态不响应。

#### 修复方案
```tsx
// 改前
const isExportingRef = useRef(false)
const isExporting = isExportingRef.current

// 改后
const [isExporting, setIsExporting] = useState(false)
// 内部防重入仍用 ref
const isExportingRef = useRef(false)
```

#### 验收标准
```ts
await userEvent.click(screen.getByRole('button', { name: /导出/ }))
expect(screen.getByRole('button', { name: /导出/ })).toBeDisabled()

// 导出完成后
expect(screen.getByRole('button', { name: /导出/ })).toBeEnabled()
```

---

### S1-4: searchTimeMs 响应式化

**文件**: `vibex-fronted/src/hooks/canvas/useCanvasSearch.ts:183`  
**优先级**: P1  
**工时**: 0.25h

#### 问题描述
`searchTimeMs: searchTimeRef.current` 同上，搜索耗时显示不更新。

#### 修复方案
```tsx
const [searchTimeMs, setSearchTimeMs] = useState<number | null>(null)
const searchTimeRef = useRef<number | null>(null) // 内部防重入
```

#### 验收标准
```ts
await performSearch()
expect(screen.getByTestId('search-time')).toHaveTextContent(/\d+ms$/)

await performSearch() // 第二次搜索
expect(screen.getByTestId('search-time')).not.toHaveTextContent(firstTime) // 值已更新
```

---

### S1-5: 版本轮询稳定性修复

**文件**: `vibex-fronted/src/hooks/canvas/useAutoSave.ts:343`  
**优先级**: P1  
**工时**: 0.5h

#### 问题描述
版本轮询 `useEffect` 依赖 `[projectId, saveStatus]`，`saveStatus` 频繁变化导致 30s 定时器不断被重建，永远无法执行。

```tsx
}, [projectId, saveStatus]) // eslint-disable-line react-hooks/exhaustive-deps
```

#### 修复方案
```tsx
// 改前
}, [projectId, saveStatus])

// 改后
}, [projectId])
```

#### 验收标准
```ts
expect(file('useAutoSave.ts')).toMatch(/\}, \[projectId\]\)/)
expect(file('useAutoSave.ts')).not.toMatch(/saveStatus/)

// 多次保存后轮询仍稳定执行
for (let i = 0; i < 5; i++) {
  await saveCanvas()
  await waitForStablePolling(30000) // 30s 内可见 polling 日志
}
```

---

### S1-6: lastSnapshotVersionRef 实例隔离

**文件**: `vibex-fronted/src/hooks/canvas/useAutoSave.ts:29`  
**优先级**: P1  
**工时**: 0.25h

#### 问题描述
模块级单例 `const lastSnapshotVersionRef = { current: 0 }` 在多 Canvas 实例时互相覆盖。

#### 修复方案
```tsx
// 改前
const lastSnapshotVersionRef = { current: 0 }

// 改后
const lastSnapshotVersionRef = useRef(0)
```

#### 验收标准
```ts
// 独立渲染两个 Canvas 实例
expect(canvasInstance1.getSnapshotVersion()).not.toBe(canvasInstance2.getSnapshotVersion())

// 标签页 A 创建 snapshot 不影响标签页 B 的轮询
await tabA.createSnapshot()
await waitFor(1000)
expect(tabB.getLastPolledVersion()).toBe(originalVersion) // 未变
```

---

### S1-7: renderContextTreeToolbar 记忆化

**文件**: `vibex-fronted/src/components/canvas/CanvasPage.tsx:342-363`  
**优先级**: P1  
**工时**: 0.25h

#### 问题描述
`renderContextTreeToolbar` 函数在组件内定义未用 `useCallback`，导致消费它的子组件不必要重渲染。

#### 修复方案
```tsx
// 改前
const renderContextTreeToolbar = (type: ContextTreeType) => { ... }

// 改后
const renderContextTreeToolbar = useCallback((type: ContextTreeType) => { ... }, [dependencies])
```

#### 验收标准
```ts
expect(file('CanvasPage.tsx')).toMatch(/renderContextTreeToolbar = useCallback/)

// 无关状态变化不触发 TreeToolbar 重渲染
const toolbarRenderCount = getComponentRenderCount('TreeToolbar')
await changeUnrelatedState() // 如面板折叠
expect(getComponentRenderCount('TreeToolbar')).toBe(toolbarRenderCount)
```

---

### S1-8: projectName 从 store 初始化

**文件**: `vibex-fronted/src/hooks/canvas/useCanvasPanels.ts:29`  
**优先级**: P1  
**工时**: 0.25h

#### 问题描述
`useState('我的项目')` 硬编码，每次挂载重置为"我的项目"，丢失服务器加载的项目名。

#### 修复方案
```tsx
// 改前
const [projectName, setProjectName] = useState('我的项目')

// 改后
const session = useSessionStore()
const [projectName, setProjectName] = useState(session.projectName || '我的项目')
```

#### 验收标准
```ts
// 加载已有项目（非新建）
await openExistingProject('my-project')
expect(screen.getByTestId('project-name')).toHaveTextContent('My Existing Project')
expect(screen.getByTestId('project-name')).not.toHaveTextContent('我的项目')
```

---

### S1-9: Store 循环依赖修复

**文件**: `vibex-fronted/src/lib/canvas/stores/contextStore.ts:20`  
**优先级**: P1  
**工时**: 0.5h

#### 问题描述
`contextStore.ts` 直接 import `useFlowStore`，模块加载顺序可能导致未定义行为。

#### 修复方案
```tsx
// 改前
import { useFlowStore } from './flowStore'

// 改后
const getFlowStore = () => require('./flowStore').useFlowStore
// 使用处
const flowStore = getFlowStore().getState()
```

#### 验收标准
```ts
expect(file('contextStore.ts')).not.toMatch(/import.*useFlowStore/)
expect(file('contextStore.ts')).toMatch(/getFlowStore\(\)\.getState\(\)/)

// 启动时无循环依赖警告
expect(browserConsole).not.toContain('Circular dependency')
expect(browserConsole).not.toContain('undefined is not a function')
```

---

## DoD Checklist

- [ ] `tsc --noEmit` 零错误
- [ ] 每个 Story 独立 commit（可单独回滚）
- [ ] 手动测试覆盖全部 9 个 Story
- [ ] ESLint 无新增 warning
- [ ] S1-2: OQ-1 已澄清，`isActive` 语义已 PM 确认
