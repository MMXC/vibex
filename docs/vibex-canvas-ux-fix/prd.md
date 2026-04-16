# PRD — VibeX Canvas UX Fix

**项目**: vibex-canvas-ux-fix
**日期**: 2026-04-17
**阶段**: pm-review
**状态**: Draft

---

## 执行摘要

### 背景
VibeX Canvas 三步流程（上下文树 → 业务流程树 → 组件树）存在 4 个 UX 问题，均为静默失败或状态不一致导致用户操作链路断裂。其中 Issue #1 在 commit `68f80aaf` 中已部分修复（增加了 `canGenerateComponents` 派生状态 + toast 拦截），其余问题仍待修复。

### 目标
修复 4 个 Epic 级别的 UX 问题：
1. API 400 静默失败 → 后端错误信息必须通过 toast 暴露给用户
2. 组件树生成按钮 disabled 逻辑与实际校验不一致
3. 创建项目按钮永久 disabled
4. 确认操作与完成状态字段语义不同步

### 成功指标

| 指标 | 当前值 | 目标值 |
|------|--------|--------|
| 组件树生成 400 错误 toast 显示率 | 0%（静默） | 100%（toast 暴露后端错误详情） |
| 创建项目按钮在正常流程后可点击率 | ~0%（因 Issue 1/4 链式失败） | 100%（三树全部 `isActive !== false` 时解锁） |
| 确认后面板立即解锁率 | ~0%（`isActive` 未同步） | 100%（确认后 `inactivePanel` 立即消失） |
| 组件生成按钮点击有效率 | <100%（stale state 导致无响应） | 100%（每次点击必有反馈） |
| 回归: 正常路径不受影响 | — | 现有正常流程 100% 保持 |
| 回归: TypeScript 类型错误 | 0 | 0 |

---

## Epic 拆分

| Epic ID | 描述 | 工时 | 验收标准数 | 依赖 | 状态 |
|---------|------|------|-----------|------|------|
| E1 | API Error Handling Fix | 2h | 4 | — | 待开发 |
| E2 | Component Tree Generation UX | 2h | 4 | E1（部分） | 待开发 |
| E3 | Project Creation Button | 1.5h | 3 | E1+E2（链式） | 待开发 |
| E4 | Confirm/Complete State Unification | 2h | 4 | — | 待开发 |

**工期合计**: 7.5h（1 人天）

---

## Story 拆分与验收标准

### E1: API Error Handling Fix

#### F1.1 — handleResponseError async/await 修复 【需页面集成】
**文件**: `vibex-fronted/src/lib/canvas/api/canvasApi.ts` 行 145–166
**当前 Bug**:
```typescript
function handleResponseError(res: Response, defaultMsg: string, returnTo?: string): never {
  // ... 401/404 handling ...
  const err = res.json().catch(() => ({ error: `HTTP ${res.status}` }));
  throw new Error((err as { error?: string }).error ?? defaultMsg);
}
```
`res.json()` 是异步方法，`err` 永远是 Promise，`(err as {...}).error` 永远是 `undefined`，后端详细错误被吞掉，统一 throw `defaultMsg`。

**验收标准**:

| # | 场景 | 预期结果 | 测试断言 |
|---|------|----------|----------|
| AC-F1.1-1 | 后端返回 400 + `{ "error": "缺少必填字段 contexts" }` | toast 显示 "缺少必填字段 contexts" | `expect(toast.showToast).toHaveBeenCalledWith("缺少必填字段 contexts", "error")` |
| AC-F1.1-2 | 后端返回 400 + `{ "message": "session 已过期" }` | toast 显示 "session 已过期" | `expect(toast.showToast).toHaveBeenCalledWith("session 已过期", "error")` |
| AC-F1.1-3 | 后端返回 400 + 无 JSON body | toast 显示 `"API 请求失败: 400"` (defaultMsg) | `expect(toast.showToast).toHaveBeenCalledWith("API 请求失败: 400", "error")` |
| AC-F1.1-4 | 所有调用方已改 `await handleResponseError(...)` | 无 TypeScript 类型错误 | `expect(compilationResult.errors).toHaveLength(0)` |

#### F1.2 — 全局 res.json() 调用安全审计 【无】
**范围**: `vibex-fronted/src/lib/canvas/api/canvasApi.ts` 内所有非 async 函数调用 `res.json()` 处
**当前状态**: 已有安全调用均为 `await res.json()` 或在 `handleResponseError` 之后。

**验收标准**:

| # | 场景 | 预期结果 | 测试断言 |
|---|------|----------|----------|
| AC-F1.2-1 | 扫描 `canvasApi.ts` 内所有 `res.json()` 调用 | 所有调用均在 `async` 函数内或 `handleResponseError` 之后 | `expect(allResJsonCallsAreSafe).toBe(true)` |

---

### E2: Component Tree Generation UX

#### F2.1 — canGenerateComponents 与 handler 逻辑同步 【需页面集成】
**文件**: `vibex-fronted/src/components/canvas/BusinessFlowTree.tsx` 行 825–832
**当前 Bug**: `canGenerateComponents` 计算 `validContexts`（selected active OR all active），但不校验 `flowsToSend` 是否为空（用户可能只有 active contexts 但无 active flows）。

**当前代码**:
```typescript
const canGenerateComponents = useMemo(() => {
  const activeContexts = contextNodes.filter((ctx) => ctx.isActive !== false);
  const selectedContextSet = new Set(selectedNodeIds.context);
  const validContexts = selectedContextSet.size > 0
    ? activeContexts.filter((ctx) => selectedContextSet.has(ctx.nodeId))
    : activeContexts;
  return validContexts.length > 0 && flowNodes.length > 0;
}, [contextNodes, selectedNodeIds.context, flowNodes.length]);
```

**问题**: 
1. 未检查 `flowsToSend` 是否为空（`activeFlows` 可能全被 deactive）
2. `canGenerateComponents` 的 `selectedNodeIds.context` 只依赖数组引用（Set 比较每次都是新引用），但这个 useMemo 只依赖 `selectedNodeIds.context`（数组），不是 `selectedNodeIds`（对象），可能存在不必要重算

**验收标准**:

| # | 场景 | 预期结果 | 测试断言 |
|---|------|----------|----------|
| AC-F2.1-1 | `contextNodes` 全 deactive，`flowNodes` 有 active | 按钮 disabled | `expect(screen.queryByRole('button', { name: /继续·组件树/ })).toBeDisabled()` |
| AC-F2.1-2 | `flowNodes` 全 deactive，`contextNodes` 有 active | 按钮 disabled | `expect(screen.queryByRole('button', { name: /继续·组件树/ })).toBeDisabled()` |
| AC-F2.1-3 | `contextNodes` 和 `flowNodes` 均有 active 但 selection 选中了 deactive 节点 | 按钮 disabled | `expect(screen.queryByRole('button', { name: /继续·组件树/ })).toBeDisabled()` |
| AC-F2.1-4 | `contextNodes` 和 `flowNodes` 均有 active（无 selection） | 按钮 enabled | `expect(screen.queryByRole('button', { name: /继续·组件树/ })).toBeEnabled()` |

#### F2.2 — componentGenerating unmount cleanup 【需页面集成】
**文件**: `vibex-fronted/src/components/canvas/BusinessFlowTree.tsx` 行 758
**当前 Bug**: `handleContinueToComponents` 开头有 `if (componentGenerating) return`。若 API 调用未完成组件就 unmount，`componentGenerating` 状态可能粘滞，导致按钮永久失效。

**验收标准**:

| # | 场景 | 预期结果 | 测试断言 |
|---|------|----------|----------|
| AC-F2.2-1 | 组件 unmount 时 `componentGenerating === true` | `componentGenerating` 重置为 `false` | `expect(screen.queryByRole('button', { name: /继续·组件树/ })).toBeEnabled()` after unmount |
| AC-F2.2-2 | 组件 remount 后 | 按钮初始状态正确（enabled/disabled 取决于节点状态） | `expect(screen.queryByRole('button', { name: /继续·组件树/ })).toBeDisabled()` when no valid nodes |

---

### E3: Project Creation Button

#### F3.1 — hasAllNodes 要求所有节点 isActive !== false 【需页面集成】
**文件**: `vibex-fronted/src/components/canvas/ProjectBar.tsx` 行 160–161
**当前 Bug**: `hasAllNodes` 只检查 `nodes.length > 0`，不检查 `isActive !== false`。

**当前代码**:
```typescript
const hasAllNodes = hasNodes(contextNodes) && hasNodes(flowNodes) && hasNodes(componentNodes)
  && contextNodes.length > 0 && flowNodes.length > 0 && componentNodes.length > 0;
```

**问题**: 当组件树 API 调用因 Issue #1 静默失败时，`componentNodes` 为空 → `hasAllNodes` 永远 `false` → 按钮永久 disabled。即便 Issue #1 修复后，若节点存在但 `isActive === false`，按钮也会误导用户（显示可以创建但实际不可用）。

**验收标准**:

| # | 场景 | 预期结果 | 测试断言 |
|---|------|----------|----------|
| AC-F3.1-1 | 三树均有节点且所有节点 `isActive !== false` | `hasAllNodes === true`，按钮 enabled | `expect(screen.queryByRole('button', { name: /创建项目并开始生成原型/ })).toBeEnabled()` |
| AC-F3.1-2 | 三树均有节点但任意一个树存在 `isActive === false` 节点 | `hasAllNodes === false`，按钮 disabled | `expect(screen.queryByRole('button', { name: /创建项目并开始生成原型/ })).toBeDisabled()` |
| AC-F3.1-3 | 组件树为空（三树缺一） | `hasAllNodes === false`，按钮 disabled | `expect(screen.queryByRole('button', { name: /创建项目并开始生成原型/ })).toBeDisabled()` |

#### F3.2 — 按钮 tooltip 与实际 disabled 条件一致 【需页面集成】
**文件**: `vibex-fronted/src/components/canvas/ProjectBar.tsx` 行 350
**当前 Bug**: tooltip 显示 `"请先确认所有三树节点"`，但实际条件只检查 `nodes.length > 0`，不检查 `isActive`。

**验收标准**:

| # | 场景 | 预期结果 | 测试断言 |
|---|------|----------|----------|
| AC-F3.2-1 | 有节点但存在 `isActive === false` | tooltip 显示 `hasAllNodes` 失败的具体原因 | `expect(screen.getByTitle(/请先确认/)).toBeTruthy()` — 逻辑应与 hasAllNodes 条件一致 |
| AC-F3.2-2 | 无节点 | tooltip 显示节点缺失原因 | `expect(tooltip.textContent).toMatch(/请先生成/)` |

---

### E4: Confirm/Complete State Unification

#### F4.1 — allConfirmed 检查 status === 'confirmed' 【需页面集成】
**文件**: `vibex-fronted/src/components/canvas/BoundedContextTree.tsx` 行 463
**当前 Bug**: `allConfirmed` 检查 `isActive !== false`，但 checkbox 操作设置的是 `status === 'confirmed'`。

**当前代码**:
```typescript
const allConfirmed = contextNodes.length > 0 && contextNodes.every((n) => n.isActive !== false);
```

**问题**: `isActive` 和 `status` 是两个独立字段。AI 生成/cascade 可能单独修改 `isActive`，导致节点显示"已确认"（checkbox 勾选）但 `allConfirmed` 仍为 `false`。

**验收标准**:

| # | 场景 | 预期结果 | 测试断言 |
|---|------|----------|----------|
| AC-F4.1-1 | 所有节点 `status === 'confirmed'`，`isActive` 任意 | `allConfirmed === true`，按钮文案变为 "✓ 已确认 → 继续到流程树" | `expect(screen.queryByText('✓ 已确认 → 继续到流程树')).toBeTruthy()` |
| AC-F4.1-2 | 所有节点 `isActive !== false`，但 `status !== 'confirmed'`（非 checkbox 触发） | `allConfirmed === false`（按新逻辑） | `expect(screen.queryByText('确认所有 → 继续到流程树')).toBeTruthy()` |
| AC-F4.1-3 | 部分节点 `status === 'confirmed'` | `allConfirmed === false` | `expect(screen.queryByRole('button', { name: /确认所有/ })).toBeEnabled()` |

#### F4.2 — handleConfirmAll 原子设置 status 和 isActive 【需页面集成】
**文件**: `vibex-fronted/src/components/canvas/BoundedContextTree.tsx` 行 458–462
**当前 Bug**: `handleConfirmAll` 只调用 `advancePhase()`，不设置 `status` 或 `isActive`。

**当前代码**:
```typescript
const handleConfirmAll = useCallback(() => {
  // Advance phase (no confirm gating in Epic 3)
  advancePhase();
}, [contextNodes, advancePhase]);
```

**验收标准**:

| # | 场景 | 预期结果 | 测试断言 |
|---|------|----------|----------|
| AC-F4.2-1 | 点击"确认所有"后 | 所有 `contextNodes` 的 `status` 变为 `'confirmed'` | `expect(store.getState().contextNodes.every(n => n.status === 'confirmed')).toBe(true)` |
| AC-F4.2-2 | 点击"确认所有"后 | 所有 `contextNodes` 的 `isActive !== false` | `expect(store.getState().contextNodes.every(n => n.isActive !== false)).toBe(true)` |
| AC-F4.2-3 | 点击"确认所有"后 | `allConfirmed` 立即为 `true` | `expect(screen.queryByText('✓ 已确认 → 继续到流程树')).toBeTruthy()` after click |

#### F4.3 — Panel lock 与 allConfirmed 读取同一标志 【需页面集成】
**文件**: `vibex-fronted/src/components/canvas/BusinessFlowTree.tsx` 行 843
**当前 Bug**: `inactivePanel` 读取 `isActive` prop，而 `allConfirmed` 也读 `isActive`（旧逻辑）。修复 F4.1 后需要确认两者一致。

**验收标准**:

| # | 场景 | 预期结果 | 测试断言 |
|---|------|----------|----------|
| AC-F4.3-1 | `BoundedContextTree` 中 `allConfirmed === true` 后 | `BusinessFlowTree` 的 `isActive` prop 为 `true`（父组件透传） | `expect(screen.queryByText('请先完成上下文树后解锁')).not.toBeInTheDocument()` |
| AC-F4.3-2 | `BoundedContextTree` 中 `allConfirmed === false` | `BusinessFlowTree` 显示 `inactivePanel` | `expect(screen.queryByText('请先完成上下文树后解锁')).toBeInTheDocument()` |

---

## Feature 列表（含页面集成标注）

| 功能 ID | Epic | 功能名称 | 文件 | 页面集成 | 测试用例数 |
|---------|------|----------|------|----------|-----------|
| F1.1 | E1 | handleResponseError async/await 修复 | `canvasApi.ts` | ✅ BusinessFlowTree 调用链 | 4 |
| F1.2 | E1 | 全局 res.json() 安全审计 | `canvasApi.ts` | 无 | 1 |
| F2.1 | E2 | canGenerateComponents 与 handler 逻辑同步 | `BusinessFlowTree.tsx` | ✅ BusinessFlowTree | 4 |
| F2.2 | E2 | componentGenerating unmount cleanup | `BusinessFlowTree.tsx` | ✅ BusinessFlowTree | 2 |
| F3.1 | E3 | hasAllNodes 要求 isActive !== false | `ProjectBar.tsx` | ✅ ProjectBar | 3 |
| F3.2 | E3 | 按钮 tooltip 与实际条件一致 | `ProjectBar.tsx` | ✅ ProjectBar | 2 |
| F4.1 | E4 | allConfirmed 检查 status === 'confirmed' | `BoundedContextTree.tsx` | ✅ BoundedContextTree | 3 |
| F4.2 | E4 | handleConfirmAll 原子设置双字段 | `BoundedContextTree.tsx` | ✅ BoundedContextTree | 3 |
| F4.3 | E4 | Panel lock 与 allConfirmed 标志统一 | `BusinessFlowTree.tsx` | ✅ BusinessFlowTree | 2 |

**需页面集成**: 8 个功能
**无需集成（纯内部审计）**: 1 个功能
**测试用例总数**: 24 个

---

## Definition of Done

### Generic DoD
- [ ] 所有 8 个功能 ID 的代码改动已实现
- [ ] 每个功能 ID 至少对应 1 个可运行的测试用例
- [ ] `yarn typecheck` 通过（0 个 TS 错误）
- [ ] `yarn test` 全量通过（无 regression）
- [ ] 代码 diff 已提交至 PR
- [ ] PR 已通过 code review

### Story-specific DoD

| 功能 ID | 特定 DoD |
|---------|----------|
| F1.1 | 所有 `handleResponseError` 调用方已改为 `await handleResponseError(...)`，无 Promise 作为值使用 |
| F1.2 | `canvasApi.ts` 全文扫描通过，无遗漏的未 await `res.json()` |
| F2.1 | `canGenerateComponents` 的判断逻辑与 `handleContinueToComponents` 内部 `contextsToSend`/`flowsToSend` 完全一致（复制粘贴级一致） |
| F2.2 | `componentGenerating` 在 `useEffect` cleanup 中重置 |
| F3.1 | `hasAllNodes` 的条件变化不影响其他依赖该变量的逻辑（需回归验证 ProjectBar 整体功能） |
| F3.2 | tooltip 文案从 `"请先确认所有三树节点"` 改为与实际 `hasAllNodes` 条件一致的具体描述 |
| F4.1 | `allConfirmed` 判断改为 `status === 'confirmed'` 后，checkbox 勾选状态与 `allConfirmed` 一致 |
| F4.2 | `handleConfirmAll` 在同一个函数调用中设置 `status: 'confirmed'` 和 `isActive: true`（原子操作） |
| F4.3 | `inactivePanel` 的 `isActive` prop 与父组件透传的 `allConfirmed` 结果一致 |

---

## 执行决策

- **决策**: 已采纳
- **执行项目**: 待分配
- **执行日期**: 2026-04-18（建议）
- **实施顺序**: E1(F1.1→F1.2) → E2(F2.1→F2.2) → E3(F3.1→F3.2) → E4(F4.1→F4.2→F4.3)
- **注意事项**: 
  - E3 依赖 E1+E2 的链式效果，建议 E1+E2 修完后先验证 Issue #2 的按钮是否解锁，再修 E3 的 tooltip
  - E4 的 F4.1 改动涉及 `allConfirmed` 的语义变化，需注意审查面（`BoundedContextTree` 外的其他组件是否依赖 `isActive !== false` 判断完成状态）
