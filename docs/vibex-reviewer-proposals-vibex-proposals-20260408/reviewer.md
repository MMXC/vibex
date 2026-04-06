# Reviewer Proposals 2026-04-08

## 提案列表
| ID | 类别 | 问题/优化点 | 优先级 |
|----|------|-------------|--------|
| R-P0-1 | Bug | useTreeToolbarActions 无测试，破坏性重构风险高 | P0 |
| R-P0-2 | Bug | useCanvasPreview 无测试，isVisible 硬编码为 false | P0 |
| R-P0-3 | Bug | useDDDStateRestore 使用 `as any` 绕过类型检查 | P0 |
| R-P0-4 | Bug | Snapshot API schema 使用 `z.array(z.any())` 无数据校验 | P0 |
| R-P1-1 | Quality | useAutoSave 缺少边界测试用例（debounce/并发/beacon） | P1 |
| R-P1-2 | Bug | useCanvasExport `isExporting` 返回 ref 而非响应式状态 | P1 |
| R-P1-3 | Quality | DDD 页面 store 访问类型不一致导致 `as any` 传播 | P1 |
| R-P2-1 | Perf | Snapshot API `z.array(z.any())` 可改为 Zod 结构化 schema | P2 |

---

## 详细提案

### R-P0-1: useTreeToolbarActions 完全无测试
**问题描述**: 
`src/hooks/canvas/useTreeToolbarActions.ts` 是一个生产环境使用的 hook，负责根据 `treeType` 返回对应的 canvas store（contextStore / flowStore / componentStore）。该 hook 完全没有测试文件。

**影响范围**: 
- CanvasPage TreeToolbar 组件依赖此 hook 访问 store
- 当 store 结构变化时（如字段重命名），hook 会静默返回错误数据
- 重构时无测试保护，容易引入回归

**根因**: 
Epic canvas-split-hooks 拆分时只添加了单元测试到部分 hooks，遗漏了此 hook。

**建议方案**: 
```typescript
// tests/hooks/canvas/useTreeToolbarActions.test.ts
describe('useTreeToolbarActions', () => {
  it('returns contextStore for treeType=context', () => { ... })
  it('returns flowStore for treeType=flow', () => { ... })
  it('returns componentStore for treeType=component', () => { ... })
})
```

---

### R-P0-2: useCanvasPreview 无测试，isVisible 硬编码
**问题描述**: 
`src/hooks/canvas/useCanvasPreview.ts` 无测试文件，且 `isVisible` 硬编码为 `false`：
```typescript
return {
  nodes: componentNodes,
  canPreview: componentNodes.length > 0,
  isVisible: false, // controlled by UI, not here
};
```
`isVisible` 返回 `false` 使调用方无法通过 hook 获知 preview 实际可见性。

**影响范围**: 
- `JsonRenderPreview` 组件依赖此 hook 渲染组件预览
- 硬编码 `false` 导致 preview 逻辑分散到 UI 层，状态不统一

**建议方案**: 
1. 添加测试覆盖 `canPreview` 和 `nodes` 逻辑
2. 评估 `isVisible` 是否应由 hook 管理（建议迁移到 store 或 props）
3. 若保持硬编码，更名为 `isVisibleControlledByUI` 避免歧义

---

### R-P0-3: useDDDStateRestore 使用 `as any` 绕过类型检查
**问题描述**: 
`src/hooks/ddd/useDDDStateRestore.ts` 第 38 行：
```typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Zustand store accessor type mismatch
checkDDDStateRestore(
  pathname,
  useContextStore as any,
  useModelStore as any,
  useDesignStore as any
);
```
使用 `as any` 将 Zustand store hooks 强制转换为任意类型，绕过了 TypeScript 类型系统。

**影响范围**: 
- 如果 `checkDDDStateRestore` 内部访问了 store 上不存在的字段，运行时才会报错
- 违反 AGENTS.md TypeScript 严格模式规范
- 类型不安全会在未来重构时产生隐性回归

**建议方案**: 
1. 扩展 `checkDDDStateRestore` 的类型签名，接受 Zustand store hooks
2. 或者定义统一的 Store accessor interface：
   ```typescript
   interface DDDRestoreStore {
     getState(): Record<string, unknown>
     setState(state: Record<string, unknown>): void
   }
   ```

---

### R-P0-4: Snapshot API schema 使用 z.array(z.any()) 无数据校验
**问题描述**: 
`vibex-backend/src/routes/v1/canvas/snapshots.ts` 第 34-36 行：
```typescript
contextNodes: z.array(z.any()).optional().default([]),
flowNodes: z.array(z.any()).optional().default([]),
componentNodes: z.array(z.any()).optional().default([]),
```
将任意数据直接存入数据库，无结构校验。恶意或错误的 payload 可以写入无效数据。

**影响范围**: 
- 前端 canvas 读取快照时可能因数据格式错误崩溃
- 无法保证 `contextNodes[i].name` 等字段存在
- 无 schema 版本控制，字段变更后历史快照无法解析

**建议方案**: 
```typescript
// 定义节点 Zod schemas
const BoundedContextNodeSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['core', 'supporting', 'generic', 'external']),
  // ...其他必填字段
})

contextNodes: z.array(BoundedContextNodeSchema).optional().default([]),
```

---

### R-P1-1: useAutoSave 缺少关键边界测试用例
**问题描述**: 
`useAutoSave.test.ts` 现有测试仅覆盖基础状态和冲突检测，缺少以下关键测试：

| 缺失测试用例 | 重要性 |
|-------------|--------|
| debounce 2s 后才触发保存 | P1 |
| 连续快速变更只触发一次保存 | P1 |
| 保存进行中再次触发不重复请求 | P1 |
| `saveBeacon` 在 beforeunload 时正确序列化 payload | P1 |
| 网络错误后重试逻辑 | P1 |
| 组件 unmount 后不调用 setState | P1 |
| `onSaveSuccess` 回调被正确调用 | P2 |

**影响范围**: 
- `useAutoSave` 是 canvas 数据持久化的核心，边界条件 bug 会导致数据丢失
- 最近的 E4 版本冲突检测已添加但测试覆盖不完整

**建议方案**: 
参照 `canvas-testing-strategy.md` learnings 中的 TDD 方法，新增：
```
tests/unit/hooks/canvas/useAutoSave.boundary.test.ts
```

---

### R-P1-2: useCanvasExport isExporting 返回 ref 而非响应式状态
**问题描述**: 
`src/hooks/canvas/useCanvasExport.ts` 第 220 行：
```typescript
return {
  exportCanvas,
  isExporting: isExportingRef.current,  // ❌ 静态值，非响应式
  error: null,
  cancelExport,
};
```
`isExporting` 直接返回 ref 的当前值，不是 React 响应式状态。调用方用 `const { isExporting } = useCanvasExport()` 无法感知导出状态变化。

**影响范围**: 
- 导出按钮无法正确显示"导出中"状态
- UI 依赖 `isExporting` 做 loading 状态判断会失效

**建议方案**: 
```typescript
// 将 isExporting 改为 useState
const [isExporting, setIsExporting] = useState(false)
// 在 exportCanvas 开始时 setIsExporting(true)
// 在 finally 块中 setIsExporting(false)
return { exportCanvas, isExporting, error: null, cancelExport }
```

---

### R-P1-3: DDD 页面 store 访问类型不一致导致 any 传播
**问题描述**: 
`checkDDDStateRestore` 函数接收 Zustand store hooks 作为参数，但函数类型签名与实际 store hooks 不匹配，导致 `useDDDStateRestore` 中需要 `as any`。

**根因**: 
`@/stores/ddd/index.ts` 导出的 store hooks 类型定义不完整，`checkDDDStateRestore` 的参数类型定义使用了宽泛的 `any` 类型，导致整个链路上推类型安全失效。

**建议方案**: 
统一 DDD store hooks 的类型导出，确保 `checkDDDStateRestore` 正确接收：
```typescript
// stores/ddd/index.ts — 添加类型导出
export type { DDDContextStore } from './contextSlice'
export type { DDDModelStore } from './modelSlice'
export type { DDDDesignStore } from './designStore'
```

---

### R-P2-1: Snapshot schema 升级为结构化 Zod schemas（可选优化）
**问题描述**: 
当前 `CreateSnapshotSchema` 使用 `z.array(z.any())` 接受节点数据。虽然 P0 已要求加基本校验，但完整升级需要：
- 定义 `BoundedContextNodeSchema`、`FlowNodeSchema`、`ComponentNodeSchema`
- 支持 schema 版本化（`schemaVersion` 字段）
- 在 API 层和数据库层同时校验

**建议方案**: 
- 参考 `@/lib/schemas/canvas` 中的 domain schemas
- 复用前端 types 定义，共享同一 schema 来源
- 评估实现成本（估计 4-6h）
