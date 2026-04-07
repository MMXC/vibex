# Canvas Phase0 清理 — 需求分析

**项目**: canvas-phase0-cleanup
**角色**: analyst
**日期**: 2026-04-03
**状态**: ✅ 分析完成

---

## 1. 业务场景分析

Canvas 模块经过多轮迭代，代码中存在以下代码质量债务：

| 债务类型 | 严重程度 | 影响 |
|----------|----------|------|
| `as any` 类型断言 | 中 | 类型安全失效，无法被 TS 编译器保护 |
| `console.log/error` | 低 | 生产日志泄漏，用户体验差 |
| `generateId()` 重复定义 | 低 | DRY 原则违反，维护成本高 |
| 废弃函数未清理 | 低 | 代码可读性下降，误导开发者 |
| `recordSnapshot` 逻辑 bug | **高** | 撤销/重做历史记录错误，用户操作不可逆 |

这些问题不影响功能可用性，但积累会造成：
- **类型系统失守**：生产环境潜在的运行时类型错误
- **撤销历史错误**：用户重排序步骤后，undo 可能恢复到错误的中间态
- **维护成本增加**：重复代码散布多文件，修改时需同步多处

---

## 2. 各任务详细分析

### Epic 1: 消除 `as any` 类型断言

**现状**: `CanvasPage.tsx` 中共 9 处 `as any`，分布在两处：

**Group A — 冲突处理器中的 serverData（L362/L365/L368）**
```typescript
// handleConflictUseServer 中
canvasSetContextNodes(serverData.contexts as any)   // L362
canvasSetFlowNodes(serverData.flows as any)         // L365
setComponentNodes(serverData.components as any)      // L368
```
`serverData` 来自 `conflictData.serverSnapshot.data`，类型为 `unknown`。将未知结构数据塞入三树 setter 前，应做运行时类型守卫（`Array.isArray` + 结构验证）。

**Group B — 历史撤销/重做的 undo stack 类型（L528-L553）**
```typescript
// handleKeyboardUndo 中
const prev = historyStore.undo('context')
if (prev) { canvasSetContextNodes(prev as any) }   // L528

// handleKeyboardRedo 中
const next = historyStore.redo('context')
if (next) { canvasSetContextNodes(next as any) }  // L545
```
`historyStore.undo/redo` 返回 `unknown`，需要断言为 `BoundedContextNode[]`/`BusinessFlowNode[]`/`ComponentNode[]`。

**影响**:
- `serverData.contexts` 可能是任意结构，直接存入 store 会导致运行时错误
- 撤销/重做链路上类型丢失，TS 编译器无法保护三树数据一致性

**方案**:
1. 为 `serverData` 添加 `isValidContextNodes(data)` 等类型守卫函数（检查 `Array.isArray` + 必填字段存在）
2. 定义 `HistorySnapshot = BoundedContextNode[] | BusinessFlowNode[] | ComponentNode[]` 联合类型，替换 `unknown`
3. 在 undo/redo 返回处使用类型守卫而非断言

---

### Epic 2: 清理调试语句

**现状**: 4 处 `console.log/error`，分布在 3 个文件：

| 文件 | 行号 | 内容 |
|------|------|------|
| `CanvasPage.tsx` | L773 | `console.error('[CanvasPage] handleContinueToComponents error:', err)` |
| `uiStore.ts` | L166 | `console.log('[Command] /submit triggered')` |
| `canvasApi.ts` | L135 | `console.error('[canvasApi] Response validation failed for:', ...)` |
| `canvasApi.ts` | L412 | `console.error('[canvasApi] polling error:', err)` |

**影响**:
- 生产环境控制台日志污染
- L166 的 `submitCanvas` 是空操作（只有 console.log），属于废弃函数

**方案**:
- 直接删除所有 4 处调试语句
- `uiStore.submitCanvas` 是死代码，应同时删除该函数（见 Epic 4）

---

### Epic 3: 提取 `generateId()` 为公共函数

**现状**: `generateId()` 在 canvas 模块重复定义了 6 次：

| 文件 | 用途 |
|------|------|
| `flowStore.ts` | 生成 nodeId / stepId |
| `contextStore.ts` | 生成 nodeId |
| `componentStore.ts` | 生成 nodeId |
| `leftDrawer/requirementHistoryStore.ts` | 生成 history id |
| `hooks/useCanvasSnapshot.ts` | 生成 snapshot id |
| `hooks/useHomeState.ts` | 生成 id |

所有实现完全一致：
```typescript
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
```

**影响**:
- 重复代码维护成本高
- 如果未来需要修改 ID 格式（如加入前缀），需同步 6 处
- 无法被统一测试

**方案**:
1. 创建 `src/lib/canvas/utils/id.ts`：
```typescript
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
export function generateNodeId(): string {
  return `node-${generateId()}`;
}
```
2. 在 6 个文件中，将本地 `function generateId()` 替换为 `import { generateId } from '@/lib/canvas/utils/id'`
3. 注意：`CanvasPage.tsx` 内的内联 mock 数据生成中也用了 `ctx-gen-${Date.now()}-${i}` 模式，这些不需要提取（带前缀的临时 ID）

---

### Epic 4: 删除废弃函数

**现状**: 以下函数/常量已标记 `@deprecated` 或未被生产代码使用：

| 函数/常量 | 文件 | 状态 |
|----------|------|------|
| `cascadeContextChange` | `cascade/CascadeUpdateManager.ts` | ✅ 已在 cascade/index.ts 导出，测试中有引用 |
| `cascadeFlowChange` | `cascade/CascadeUpdateManager.ts` | ✅ 同上 |
| `areAllConfirmed` | `cascade/CascadeUpdateManager.ts` | ✅ 同上，标注 `@deprecated use hasNodes instead` |
| `submitCanvas` | `uiStore.ts` L166 | ❌ 死代码，只含 console.log |
| `flowDraft` | `flowStore.ts` | ⚠️ state 定义存在但未在业务逻辑中被消费（只有 setter） |

**分析**:
- `cascadeContextChange/cascadeFlowChange/areAllConfirmed`：测试文件有引用，但生产代码**未导入**（grep 结果显示仅在 `CascadeUpdateManager.test.ts` 和 `exampleData.test.ts` 中使用）。这些测试本身就是测试废弃函数的单元测试，删除函数后测试文件应同步删除。
- `submitCanvas`：空操作函数，应删除
- `flowDraft`：`flowStore.ts` 保留 state 和 setter，暂不删除（后续 Epic 可能会用到）

**方案**:
1. 删除 `uiStore.submitCanvas` 函数（L166）
2. 从 `cascade/index.ts` 移除 `cascadeContextChange`、`cascadeFlowChange`、`areAllConfirmed` 的导出
3. 删除 `cascade/CascadeUpdateManager.ts` 中的这三个函数实现
4. 删除 `CascadeUpdateManager.test.ts` 中相关测试块（`describe('areAllConfirmed')`, `describe('cascadeContextChange')`, `describe('cascadeFlowChange')`）
5. 删除 `exampleData.test.ts` 中引用 `areAllConfirmed` 的测试块（L137-186）

---

### Epic 5: 修复 flowStore recordSnapshot bug

**现状**: `flowStore.ts` 的 `reorderSteps` 方法（L244-262）中存在逻辑错误：

```typescript
reorderSteps: (flowNodeId, fromIndex, toIndex) => {
  set((s) => {
    const newNodes = s.flowNodes.map((n) => {
      if (n.nodeId !== flowNodeId) return n;
      const steps = [...n.steps];
      const [moved] = steps.splice(fromIndex, 1);
      const insertAt = fromIndex < toIndex ? toIndex - 1 : toIndex;
      steps.splice(insertAt, 0, moved);
      getHistoryStore().recordSnapshot('flow', [...s.flowNodes]);  // ← BUG: 传入的是旧值
      return {
        ...n,
        steps: steps.map((st, i) => ({ ...st, order: i })),
        status: 'pending' as const,
      };
    });
    return { flowNodes: newNodes };
  }),
},
```

**Bug 描述**: `recordSnapshot` 在 `map` 回调内调用，传入 `[...s.flowNodes]`，这是**变更前的旧值**。正确的做法是在 `map` 外传入计算后的 `newNodes`。

**影响**:
- 用户拖拽重排步骤后，undo 历史记录的是重排**之前**的状态（正常）
- 但 redo 历史也是重排之前的状态，**无法 redo 到重排后的正确状态**
- 等同于重排操作永久覆盖了中间态，用户无法撤销重排操作

**方案**: 将 `recordSnapshot` 调用移出 map 回调，使用 `newNodes`：
```typescript
reorderSteps: (flowNodeId, fromIndex, toIndex) => {
  set((s) => {
    const newNodes = s.flowNodes.map((n) => {
      if (n.nodeId !== flowNodeId) return n;
      const steps = [...n.steps];
      const [moved] = steps.splice(fromIndex, 1);
      const insertAt = fromIndex < toIndex ? toIndex - 1 : toIndex;
      steps.splice(insertAt, 0, moved);
      return {
        ...n,
        steps: steps.map((st, i) => ({ ...st, order: i })),
        status: 'pending' as const,
      };
    });
    getHistoryStore().recordSnapshot('flow', newNodes);  // 移到这里，传入正确值
    return { flowNodes: newNodes };
  }),
},
```

---

## 3. Epic 拆分与工时估算

| Epic | 改动范围 | 类型 | 估算工时 | 独立可测 |
|------|----------|------|----------|----------|
| **Epic 1** | 消除 CanvasPage.tsx 9处 `as any` | 重构 | 1.5h | ✅ |
| **Epic 2** | 删除 4 处 console.log/error | 清理 | 0.5h | ✅ |
| **Epic 3** | 提取 generateId() 到 utils/id.ts，替换 6 处 | 重构 | 1h | ✅ |
| **Epic 4** | 删除废弃函数 + 关联测试 | 清理 | 1h | ✅ |
| **Epic 5** | 修复 flowStore recordSnapshot bug | Bug 修复 | 0.5h | ✅ |

**总工时: 4.5h（不含 review buffer）**

---

## 4. 验收标准

### Epic 1 — 消除 `as any`
- [ ] `CanvasPage.tsx` 中 `as any` 出现次数从 9 降为 0（`grep -c "as any" CanvasPage.tsx === 0`）
- [ ] `canvasApi.ts` 中的 Zod schema 验证逻辑保持不变（运行 `pnpm test -- --testPathPattern="canvasApi"` 通过）
- [ ] 冲突解决流程（handleConflictUseServer/Merge）功能正常（手动测试覆盖）

### Epic 2 — 清理 console
- [ ] `CanvasPage.tsx`、`uiStore.ts`、`canvasApi.ts` 中 `console.log/error` 出现次数为 0
- [ ] `grep -rn "console\.\(log\|error\)" src/components/canvas/ src/lib/canvas/` 输出为空

### Epic 3 — 提取 generateId
- [ ] `src/lib/canvas/utils/id.ts` 文件存在并导出 `generateId()`
- [ ] `flowStore.ts`、`contextStore.ts`、`componentStore.ts`、`requirementHistoryStore.ts`、`useCanvasSnapshot.ts`、`useHomeState.ts` 均从 `id.ts` import，不再有本地 `function generateId`
- [ ] `pnpm test -- --testPathPattern="flowStore|contextStore|componentStore"` 通过

### Epic 4 — 删除废弃函数
- [ ] `grep -n "submitCanvas" uiStore.ts` 输出为空
- [ ] `grep -n "cascadeContextChange\|cascadeFlowChange\|areAllConfirmed" src/lib/canvas/cascade/index.ts` 输出为空
- [ ] `CascadeUpdateManager.test.ts` 中相关测试块已删除
- [ ] `exampleData.test.ts` 中 `areAllConfirmed` 引用已删除

### Epic 5 — 修复 recordSnapshot bug
- [ ] `reorderSteps` 中 `recordSnapshot` 调用在 `map` 循环外，传入 `newNodes`
- [ ] 添加单元测试：重排步骤后 undo 能恢复到重排前，redo 能恢复到重排后
- [ ] `pnpm test -- --testPathPattern="flowStore"` 通过

---

## 5. 风险识别

| 风险 | 级别 | 缓解措施 |
|------|------|----------|
| Epic 1 类型守卫改动影响冲突解决流程 | 中 | 添加集成测试覆盖冲突解决三路径 |
| Epic 4 删除测试文件后 `areAllConfirmed` 引用遗漏 | 低 | 删除前再次 `grep -rn "areAllConfirmed" src/` 全量扫描 |
| Epic 3 替换 generateId 后 ID 格式变化导致现有数据不兼容 | 极低 | ID 生成格式不变，仅移动位置 |
| Epic 5 修复 recordSnapshot 后 redo 行为变化 | 中 | 添加端到端测试覆盖 undo/redo 步骤重排 |

---

## 6. 依赖关系

5 个 Epic 之间**无依赖关系**，可并行开发：
- Epic 1-5 均在独立文件中改动，互不覆盖
- Epic 4 删除 `cascadeContextChange/cascadeFlowChange/areAllConfirmed` 需先确认无其他生产代码引用（已确认仅测试文件引用）
