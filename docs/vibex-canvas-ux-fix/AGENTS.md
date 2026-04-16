# AGENTS.md — vibex-canvas-ux-fix

**项目**: vibex-canvas-ux-fix
**版本**: v1.0
**日期**: 2026-04-17

---

## 开发约束

### D1: 禁止事项

- ❌ **禁止引入新依赖** — 本项目仅修改已有代码，无新增 npm 包
- ❌ **禁止修改 API 接口** — 仅修复前端处理逻辑
- ❌ **禁止修改后端代码** — 纯前端修复
- ❌ **禁止在 E4-U1 修复前不做全量 `isActive` 审计** — 语义变更可能影响其他组件
- ❌ **禁止 computeTreePayload 逻辑与 handler 内逻辑不一致** — 引入新 bug
- ❌ **禁止 F4.2 修复时只设置 `status` 而不设置 `isActive`** — 两者必须同步

### D2: 代码规范

- ✅ `computeTreePayload` 为纯函数，无副作用，可在多处调用
- ✅ `handleResponseError` 保持 `async function`，返回类型 `Promise<never>`
- ✅ `hasAllNodes` 使用 `every()` 链式调用，逻辑清晰
- ✅ `allConfirmed` 使用 `every()` 检查 `status === 'confirmed'`
- ✅ `handleConfirmAll` 中 `forEach` + `advancePhase()` 在同一函数内依次执行（原子性）
- ✅ 新增代码风格与文件现有风格一致
- ✅ 单元测试使用 `vi.mock` / `vi.spyOn`，与现有测试风格一致

### D3: 测试规范

- ✅ 每个 AC 对应独立 `it` 块，命名描述场景而非实现
- ✅ Mock 层：只 mock `canvasApi` 方法，不 mock 内部实现
- ✅ 回归测试必须覆盖：正常路径（有效 contexts + flows + components）
- ✅ `handleResponseError` 单元测试需 mock `Response` 对象
- ✅ E4-U1 修复后必须运行 `grep -rn "isActive" vibex-fronted/src/components/canvas/` 全量审计

### D4: 提交规范

按 Epic 分次提交：

```
fix(canvas): E1 — 修复 handleResponseError async/await bug

fix(canvas): E2 — 同步 canGenerateComponents 与 handler 逻辑
- 新增 computeTreePayload 纯函数
- componentGenerating unmount cleanup

fix(canvas): E3 — hasAllNodes 增加 isActive 检查

fix(canvas): E4 — 统一 allConfirmed 语义，修复 handleConfirmAll 原子性
```

---

## ADR（日志架构决策）

### ADR-001: 状态语义统一策略

**决策**: E4 中选择 `status === 'confirmed'` 作为 `allConfirmed` 的判断依据，而非 `isActive !== false`。

**理由**:
1. `status === 'confirmed'` 是用户通过 checkbox 明确设置的状态，语义更直接
2. `isActive` 是 AI 生成/cascade 的自动标记，可能被后台操作独立修改
3. 点击"确认"应立即产生用户可见的 UI 反馈（面板解锁）

**Trade-off**: 已有代码引用 `isActive !== false` 的地方需要全部迁移。若后续 AI 操作也需要修改 `status`，需同步更新。

**⚠️ 审查发现（plan-eng-review）**: E4 grep 审计必须对每个找到的 `isActive` 用法分类为：
- （A）改为 `status === 'confirmed'` — `BusinessFlowTree.tsx:728`（`allContextsActive`）、`733`（`inactiveCtx`）必须同步更新
- （B）保留为面板可见性门控 — 仅保留不依赖完成状态的可见性判断
- （C）需独立 Epic — 过于复杂的引用链单独处理

### ADR-002: computeTreePayload 纯函数位置

**决策**: 将 `computeTreePayload` 作为纯函数导出到独立文件或置于 `BusinessFlowTree.tsx` 底部（非 store），供 UI 层（useMemo）和 handler 层共用。

**理由**:
1. 消除重复逻辑：避免 `canGenerateComponents` 和 `handleContinueToComponents` 各写一套相同的过滤逻辑
2. 可测试性：纯函数可独立单元测试，无需渲染组件
3. 单一数据源：`canGenerateComponents` 和 handler 使用完全相同的计算逻辑，消除 bug

**Trade-off**: 需要注意函数签名稳定性。若将来 `contextsToSend` 构建逻辑变化，需同步更新此函数。

### ADR-003: E3 修复后 hasAllNodes 语义

**决策**: `hasAllNodes` 要求三树所有节点的 `isActive !== false`。

**理由**:
1. "创建项目"是三树流程的最终产出，若节点未确认（`isActive === false`），产出的原型质量无法保证
2. 与产品意图一致：PM 的 PRD 明确要求"所有节点已确认"
3. 配合 E1/E2 修复后，用户能够通过前置校验感知哪些节点需要确认

**Trade-off**: 存在节点但未激活时，按钮会保持 disabled。用户必须逐一确认每个节点。这可能增加操作步骤，但提高了质量保证。

### ADR-004: F4.2 handleConfirmAll 原子性策略

**决策**: `handleConfirmAll` 在同一个函数调用中依次设置所有节点的 `status: 'confirmed'` 和 `isActive: true`，然后调用 `advancePhase()`。

**理由**:
1. 原子性：避免中间状态导致 UI 闪烁（先 advancePhase 再 confirm 的旧顺序会导致短暂面板解锁再锁定）
2. 同步性：`status` 和 `isActive` 在同一批次操作中更新，用户感知到"一键完成"
3. 可预测性：`allConfirmed` 立即变为 `true`，触发后续 UI 变化

**Trade-off**: `forEach` 批量更新在节点数量多时可能有轻微延迟，但当前 contextNodes 数量有限（通常 < 20），无性能问题。

---

## 技术约束

### 约束 1: E4-U1 全量审计（强制）

E4-U1 修复前必须执行：
```bash
grep -rn "isActive" vibex-fronted/src/components/canvas/
```

审计要点：
- 所有 `isActive !== false` 的使用点
- 所有 `isActive === true` 的使用点
- 确认 `BoundedContextTree` / `BusinessFlowTree` / `ComponentTree` 外的组件是否依赖 `isActive` 作为完成标志

### 约束 2: computeTreePayload 函数签名

```typescript
function computeTreePayload(
  contextNodes: BoundedContextNode[],
  flowNodes: BusinessFlowNode[],
  selectedNodeIds: { context: string[]; flow: string[] }
): { contextsToSend: BoundedContextNode[]; flowsToSend: BusinessFlowNode[] }
```

禁止修改此函数签名。`canGenerateComponents` 和 `handleContinueToComponents` 必须使用完全相同的调用参数。

### 约束 3: hasAllNodes 计算条件

```typescript
const hasAllNodes =
  contextNodes.length > 0 && contextNodes.every((n) => n.isActive !== false)
  && flowNodes.length > 0 && flowNodes.every((n) => n.isActive !== false)
  && componentNodes.length > 0 && componentNodes.every((n) => n.isActive !== false);
```

### 约束 4: handleConfirmAll 执行顺序

```
1. forEach(node => confirmContextNode(node.nodeId))  // 设置 status: 'confirmed'
2. advancePhase()  // 推进 phase
```

禁止调换顺序或分离到不同函数中。

---

## 文件变更清单

| 文件 | 变更类型 | 主要内容 |
|------|---------|---------|
| `vibex-fronted/src/lib/canvas/api/canvasApi.ts` | 修改 | handleResponseError async 化 |
| `vibex-fronted/src/components/canvas/BusinessFlowTree.tsx` | 修改 | computeTreePayload + useMemo + unmount cleanup |
| `vibex-fronted/src/components/canvas/ProjectBar.tsx` | 修改 | hasAllNodes 条件更新 |
| `vibex-fronted/src/components/canvas/BoundedContextTree.tsx` | 修改 | allConfirmed + handleConfirmAll |
| `vibex-fronted/src/lib/canvas/api/canvasApi.test.ts` | 新增测试 | handleResponseError AC |
| `vibex-fronted/src/components/canvas/BusinessFlowTree.test.tsx` | 新增测试 | canGenerateComponents + cleanup AC |
| `vibex-fronted/src/components/canvas/ProjectBar.test.tsx` | 新增测试 | hasAllNodes AC |
| `vibex-fronted/src/components/canvas/BoundedContextTree.test.tsx` | 新增测试 | allConfirmed + handleConfirmAll AC |
