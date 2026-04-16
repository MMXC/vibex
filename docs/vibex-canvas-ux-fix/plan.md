# VibeX Canvas UX Fix — Technical Plan

**任务**: vibex-canvas-ux-fix/plan
**日期**: 2026-04-17
**阶段**: plan
**依赖**: analysis.md, code-analysis.md, research.md
**执行决策**: 待评审

## 执行状态

| Epic | Unit | 状态 | 提交 |
|------|------|------|------|
| E1 | U1 — handleResponseError async/await | ✅ 已完成 | `2a10b064` |
| E2 | U1 — canGenerateComponents ↔ handler sync | ⬜ 待开始 | — |
| E2 | U2 — componentGenerating cleanup | ⬜ 待开始 | — |
| E3 | U1 — hasAllNodes isActive | ⬜ 待开始 | — |
| E4 | U1 — allConfirmed 语义统一 | ⬜ 待开始 | — |
| E4 | U2 — handleConfirmAll 原子性 | ⬜ 待开始 | — |

---

---

## 背景

VibeX Canvas 3 步流程（Context Tree → Flow Tree → Component Tree）中存在 4 个 UX 问题，按根因分为 4 个 Epic。

> **Note**: Issue 1 已在 commit `68f80aaf` 中部分修复（增加了 `canGenerateComponents` 派生状态 + toast 拦截）。本计划针对**剩余工作**。

---

## Epic E1: API Error Handling Fix

**范围**: Issue 1a — `handleResponseError` async/await 类型不匹配
**优先级**: P0
**前置依赖**: 无

### E1-U1: 修复 handleResponseError async/await

**Goal**: `handleResponseError` 函数正确 await `res.json()`，使后端返回的详细错误信息能够透传到 toast，而非统一抛出 `"API 请求失败: 400"`。

**Files**:
- `vibex-frontend/src/lib/canvas/api/canvasApi.ts`

**Approach**:
1. 将 `handleResponseError` 声明改为 `async function`，返回类型改为 `Promise<never>`
2. `res.json()` 调用前加 `await`
3. 全局搜索所有 `handleResponseError(` 调用点，确认都已加 `await`（预期在 `canvasApi.ts` 内部有 3 处：`generateContexts`、`generateFlows`、`generateComponents`）
4. `try/catch` 包裹 JSON parse，解析失败时 fallback 到 `{ error: \`HTTP ${res.status}\` }`

```typescript
async function handleResponseError(res: Response, defaultMsg: string, returnTo?: string): Promise<never> {
  // 401/404 处理保持不变
  if (res.status === 401) { ... }
  if (res.status === 404) { ... }
  let errData: { error?: string; message?: string; details?: string } = { error: `HTTP ${res.status}` };
  try {
    errData = await res.json();
  } catch {
    // use default
  }
  const message = errData.error ?? errData.message ?? errData.details ?? defaultMsg;
  throw new Error(message);
}
```

**Test Scenarios**:
- 后端返回 400 + `{ "error": "缺少必填字段 contexts" }` → toast 显示完整错误文案
- 后端返回 400 + `{ "message": "..." }` → fallback 到 message 字段
- 后端返回 400 + 空 body → fallback 到 `HTTP 400`
- 所有调用处都有 `await handleResponseError(...)`

**Verification**:
- [ ] 全局 grep `handleResponseError(` 无未 await 的调用
- [ ] 人工测试：模拟 400 响应，toast 文案为后端实际 error 字段

---

## Epic E2: Component Tree Generation UX

**范围**: Issue 1b 剩余 + Issue 4 — 按钮可用性判断与实际发送逻辑不一致 + componentGenerating 状态粘滞
**优先级**: P0
**前置依赖**: E1-U1

### E2-U1: 同步 canGenerateComponents 与 handler 实际发送逻辑

**Goal**: `canGenerateComponents` useMemo 与 `handleContinueToComponents` 内部构建 `contextsToSend`/`flowsToSend` 的逻辑完全一致，消除"按钮可点但 API 收空数组 → 400"的静默失败。

**Files**:
- `vibex-frontend/src/components/canvas/BusinessFlowTree.tsx`

**Approach**:
1. 重构 `handleContinueToComponents` 中 `contextsToSend`/`flowsToSend` 构建逻辑为独立 pure function（供 useMemo 复用）
2. `canGenerateComponents` useMemo 调用同一 pure function，以相同条件判断按钮是否可用
3. 函数签名：
```typescript
// utils/canvasReadiness.ts
export function computeTreePayload(
  contextNodes: ContextNode[],
  flowNodes: FlowNode[],
  selectedNodeIds: { context: string[]; flow: string[] }
): { contextsToSend: ContextNode[]; flowsToSend: FlowNode[] } {
  const activeContexts = contextNodes.filter((ctx) => ctx.isActive !== false);
  const selectedContextSet = new Set(selectedNodeIds.context);
  const contextsToSend = selectedContextSet.size > 0
    ? activeContexts.filter((ctx) => selectedContextSet.has(ctx.nodeId))
    : activeContexts;

  const activeFlows = flowNodes.filter((f) => f.isActive !== false);
  const selectedFlowSet = new Set(selectedNodeIds.flow);
  const flowsToSend = selectedFlowSet.size > 0
    ? activeFlows.filter((f) => selectedFlowSet.has(f.nodeId))
    : activeFlows;

  return { contextsToSend, flowsToSend };
}
```
4. `canGenerateComponents` useMemo 改为：
```typescript
const { contextsToSend, flowsToSend } = useMemo(
  () => computeTreePayload(contextNodes, flowNodes, selectedNodeIds),
  [contextNodes, flowNodes, selectedNodeIds]
);
const canGenerateComponents = contextsToSend.length > 0 && flowsToSend.length > 0;
```
5. handler 内同样调用 `computeTreePayload`，复用结果

**Test Scenarios**:
- 有 active 上下文和 flow，但选择了已 deactive 的节点 → 按钮 disabled（之前 enabled → 400）
- 所有上下文 isActive === false → 按钮 disabled
- 有 active 上下文和 flow，无选择 → 按钮 enabled
- 有 active 上下文和 flow，精确选择部分 active → 按钮 enabled

**Verification**:
- [ ] `canGenerateComponents` 和 handler 内部复用同一 `computeTreePayload`
- [ ] 上述 4 个边界场景均已覆盖（手动测试 + 新增单元测试）

---

### E2-U2: 防止 componentGenerating 状态粘滞

**Goal**: 组件 unmount 后 `componentGenerating` 状态被重置，防止下次 mount 时按钮仍然 dead。

**Files**:
- `vibex-frontend/src/components/canvas/BusinessFlowTree.tsx`

**Approach**:
在 `BusinessFlowTree` 组件中添加 useEffect cleanup：

```typescript
useEffect(() => {
  return () => setComponentGenerating(false);
}, []);
```

**Test Scenarios**:
- API 调用中切换 Tab → 组件 unmount → `componentGenerating` 在 unmount 时重置为 false
- 再次切回 Canvas Tab → 按钮恢复正常可点击状态

**Verification**:
- [ ] 手动：切换 Tab 中断生成流程 → 切回后按钮可点击

---

## Epic E3: Project Creation Button

**范围**: Issue 2 — hasAllNodes 只检查 nodes.length > 0，未检查 isActive !== false
**优先级**: P0
**前置依赖**: 无（独立 Epic，但与 E2 有逻辑关联）

### E3-U1: hasAllNodes 增加 isActive 检查

**Goal**: "创建项目并开始生成原型"按钮在三树节点全部 isActive !== false 时解锁，而非仅在数组非空时解锁。

**Files**:
- `vibex-frontend/src/components/project/ProjectBar.tsx`

**Approach**:
1. 将 `hasAllNodes` 从简单长度检查改为 `every` 检查 isActive：
```typescript
const allContextReady = contextNodes.length > 0 && contextNodes.every((n) => n.isActive !== false);
const allFlowReady = flowNodes.length > 0 && flowNodes.every((n) => n.isActive !== false);
const allComponentReady = componentNodes.length > 0 && componentNodes.every((n) => n.isActive !== false);
const hasAllNodes = allContextReady && allFlowReady && allComponentReady;
```
2. 同时更新按钮 tooltip，使其与实际状态一致（"请先确认所有三树节点"仅在条件不满足时显示）
3. 检查 `handleCreateProject` 内联守卫逻辑（ProjectBar.tsx:165-198），确保与 disabled 条件一致

**Test Scenarios**:
- 三树各有 1 个节点，全部 isActive === false → 按钮 disabled
- 三树各有 1 个节点，全部 isActive !== false → 按钮 enabled
- 组件树为空（未生成）→ 按钮 disabled（即使其他两树已就绪）
- 组件树已生成但有节点 isActive === false → 按钮 disabled

**Verification**:
- [ ] 上述 4 个场景按钮状态与预期一致
- [ ] `hasAllNodes` 计算路径覆盖 `isActive !== false` 分支

---

## Epic E4: Confirm/Complete State Unification

**范围**: Issue 3 — allConfirmed 检查 isActive !== false 但 handleConfirmAll 不设置 isActive，checkbox 设置 status === 'confirmed'
**优先级**: Medium
**前置依赖**: 无（独立 Epic）

### E4-U1: 统一 isActive / status 语义

**Goal**: `allConfirmed` 判断与 checkbox 实际操作保持一致，消除"已确认但面板仍锁定"的矛盾状态。

**Files**:
- `vibex-frontend/src/components/canvas/BoundedContextTree.tsx`
- `vibex-frontend/src/components/canvas/BusinessFlowTree.tsx`（面板锁定逻辑审计）

**Approach**:

**Step 1 — 确定规范**：通过分析确认，`isActive` 是 AI 生成/cascade 的自动标记，`status === 'confirmed'` 是用户手动确认的标记。两者应保持同步，以 `status === 'confirmed'` 为用户可见的"确认"信号。

**Step 2 — 统一 allConfirmed**（BoundedContextTree.tsx:463）：
```typescript
// 从
const allConfirmed = contextNodes.length > 0 && contextNodes.every((n) => n.isActive !== false);
// 改为
const allConfirmed = contextNodes.length > 0 && contextNodes.every((n) => n.status === 'confirmed');
```

**Step 3 — 审计面板锁定逻辑**（BusinessFlowTree.tsx）：找到所有使用 `isActive !== false` 作为解锁条件的代码点，确认是否应改为 `status === 'confirmed'`。记录所有变更点。

**Step 4 — 记录发现**：在代码中增加注释说明 `isActive` 与 `status` 的关系，防止后续回归。

**Test Scenarios**:
- 点击"确认所有节点"→ `status` 全为 'confirmed' → `allConfirmed` 为 true → 面板解锁
- 直接修改节点 `isActive === false`（不通过 checkbox）→ `status` 仍为 'confirmed' → `allConfirmed` 仍为 true（符合预期，确认操作保留）

**Verification**:
- [ ] 点击"确认所有节点"后，`allConfirmed` 立即变为 true
- [ ] 面板锁定逻辑与 `allConfirmed` 使用相同的字段检查
- [ ] 无其他组件的 `isActive` 检查与 `allConfirmed` 判断不一致（需代码审计）

---

### E4-U2: 修复 handleConfirmAll 原子性

**Goal**: `handleConfirmAll` 在设置 phase 之前，先将所有节点的 `status` 原子性更新为 `'confirmed'`。

**Files**:
- `vibex-frontend/src/components/canvas/BoundedContextTree.tsx`

**Approach**:
```typescript
const handleConfirmAll = useCallback(() => {
  // 原子性设置所有节点为 confirmed 状态
  contextNodes.forEach((node) => {
    updateContextNode(node.nodeId, { status: 'confirmed' });
  });
  advancePhase();
}, [contextNodes, advancePhase]);
```

**Note**: `updateContextNode` 调用需确认 store API 支持批量更新，或改为单次 dispatch。

**Test Scenarios**:
- 调用 `handleConfirmAll` → 所有 contextNodes 的 `status` 变为 'confirmed'
- 调用后立即读取 `allConfirmed` → 返回 true

**Verification**:
- [ ] `handleConfirmAll` 后 `allConfirmed` 为 true
- [ ] 无其他副作用（phase 推进行为不变）

---

## 实施顺序

| # | Epic | Unit | 预计工时 | 依赖 |
|---|------|------|----------|------|
| 1 | E1 | U1 — handleResponseError async/await | 1h | 无 |
| 2 | E2 | U1 — canGenerateComponents ↔ handler sync | 1.5h | 无 |
| 3 | E2 | U2 — componentGenerating cleanup | 0.5h | E2-U1 |
| 4 | E3 | U1 — hasAllNodes isActive | 1h | 无 |
| 5 | E4 | U1 — allConfirmed 语义统一 | 1.5h | 无 |
| 6 | E4 | U2 — handleConfirmAll 原子性 | 0.5h | E4-U1 |

**合计**: ~6h（1 人天）

---

## 回归验收

- [ ] 正常路径（三树已完成确认）不受任何修复影响
- [ ] 无新增 TypeScript 类型错误
- [ ] 新增场景测试：
  - `all contexts inactive` → toast + button disabled
  - `all nodes confirmed` → button enabled + panel unlocked
  - API 400 → toast 显示后端 error 字段
- [ ] `componentGenerating` unmount 后重置

---

## 执行决策

- **决策**: 待评审
- **执行项目**: 无
- **执行日期**: 待定
- **建议**: 采纳本计划，E1/E2/E3 可并行开发，E4-U2 依赖 E4-U1。按实施顺序 1→6 依次 code review。
