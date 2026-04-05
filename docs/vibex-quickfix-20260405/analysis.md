# Bug Analysis: vibex-quickfix-20260405

**Project**: vibex-quickfix-20260405  
**Author**: Analyst  
**Date**: 2026-04-05  
**Status**: Draft → Ready for Dev

---

## Bug 1: OPTIONS CORS 500 错误 — 预检请求失败

### 问题描述
浏览器对所有 Canvas API 发起 `OPTIONS` 预检请求时，服务端返回 **HTTP 500**，导致前端无法调用任何受保护的 Canvas API。

```
OPTIONS https://api.vibex.top/api/v1/canvas/generate-contexts
  → 500 Internal Server Error
控制台: TypeError: Incorrect type for Promise
```

**影响**: 所有 Canvas 受保护 API 的 CORS 预检全部失败，前端功能不可用。

---

### 根因分析

请求链路：

```
Browser → Cloudflare Worker (Hono)
            ↓
OPTIONS /api/v1/canvas/generate-contexts
            ↓
v1.options('/*')   ← 只匹配 /api/v1/xxx，但 Canvas 路由在 protected_ 子 app 下
            ↓
protected_ 子 app
            ↓
authMiddleware     ← OPTIONS 请求无 Authorization header
            ↓
401 Unauthorized   ← 被当作内部错误处理 → 500
```

**三个层次的问题**：
1. **v1 gateway 层**：`v1.options('/*')` 只在 `/api/v1/xxx` 顶层匹配，Canvas 路由挂载在 `protected_` 子 app 下，OPTIONS 落入子 app 层级
2. **protected_ 子 app 层**：没有处理 OPTIONS，请求落入 `authMiddleware`
3. **authMiddleware**：OPTIONS 请求无 Authorization → 401 → 被 Cloudflare Worker 错误处理为 500

**关键误解**：`cors()` 中间件的 `allowMethods` 只影响响应头中的 `Access-Control-Allow-Methods`，**不处理 OPTIONS 请求本身**。

---

### 修复方案

#### 选项 A: Gateway 层统一拦截（推荐）⭐

```typescript
// src/routes/v1/gateway.ts
// 在 protected_ 路由注册之前，拦截所有 OPTIONS 请求
v1.options('/*', (c) => {
  c.res.headers.set('Access-Control-Allow-Origin', '*');
  c.res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  c.res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  c.res.headers.set('Access-Control-Max-Age', '86400');
  return c.text('', 204);
});
v1.route('/', protected_);
```

#### 选项 B: authMiddleware 放行 OPTIONS

```typescript
// src/routes/v1/auth.ts
protected_.use('*', async (c, next) => {
  if (c.req.method === 'OPTIONS') {
    return next(); // 放行预检请求
  }
  // ... 原有认证逻辑
});
```

**选项 A vs B**：选项 A 在更上层拦截，更彻底；选项 B 修改认证逻辑，有副作用风险。**推荐选项 A**。

---

### 工作量估算
- **开发**: 0.5h（添加 OPTIONS handler + 防御性加到 canvas 子路由）
- **测试**: 0.5h（curl 验证 + jest 测试）
- **总计**: **1h**

---

### 验收标准
- [ ] `curl -X OPTIONS https://api.vibex.top/api/v1/canvas/generate-contexts` 返回 `204` + CORS headers
- [ ] `curl -X OPTIONS https://api.vibex.top/api/v1/flow/generate-flows` 返回 `204` + CORS headers
- [ ] 浏览器控制台无 `500` / `TypeError: Incorrect type for Promise` 错误
- [ ] 响应头包含 `Access-Control-Allow-Origin: *`
- [ ] jest 测试全部通过

---

## Bug 2: Canvas Context 上下文选择不生效

### 问题描述
用户在前端选择（toggle）Bounded Context 节点时，UI 复选框状态不更新，导致无法确认哪些上下文节点被选中参与后续流程生成。

**现象**：
- 点击 Context 节点复选框 → 复选框状态不变
- `advancePhase` 无法从 `context` 阶段推进到 `flow` 阶段

---

### 根因分析

**两套 selection 状态冲突**：

1. `useContextStore.contextNodes[].selected` — 存储在节点数组中
2. `useContextStore.selectedNodeIds.context` — 独立的 selection ID 数组

**问题代码链**：

```typescript
// BoundedContextStep.tsx
<input
  type="checkbox"
  checked={
    state.context.boundedContexts.find(bc => bc.id === ctx.id)?.selected
    ?? false
  }
  onChange={() => handleToggle(ctx.id)}  // → flowMachine.send(TOGGLE_CONTEXT)
```

```typescript
// flowMachine.ts — handleToggle
// TOGGLE_CONTEXT 事件: 更新 flowMachine 状态中的 boundedContexts
// 但这个 boundedContexts 和 contextStore 是不同步的！
```

同时：

```typescript
// contextStore.ts — toggleContextNode (这个方法名有误导性)
toggleContextNode: (nodeId) => {
  // 实际上更新的是 contextNodes[].selected
  // 但 UI 用的是 state.context.boundedContexts (flowMachine 状态)
}
```

**核心问题**：`flowMachine` 和 `contextStore` 是两套独立状态，`TOGGLE_CONTEXT` 事件更新了 flowMachine，但没有同步到 contextStore 的 `contextNodes`。

---

### 修复方案

#### 选项 A: 统一使用 contextStore.selectedNodeIds（推荐）⭐

让 `BoundedContextStep` 使用 `useContextStore` 而非 `flowMachine` 管理选择状态：

```typescript
// BoundedContextStep.tsx
const contextNodes = useContextStore((s) => s.contextNodes);
const selectedNodeIds = useContextStore((s) => s.selectedNodeIds.context);

const handleToggle = (nodeId: string) => {
  useContextStore.getState().toggleNodeSelect('context', nodeId);
};

<input
  checked={selectedNodeIds.includes(ctx.id)}
  onChange={() => handleToggle(ctx.id)}
/>
```

#### 选项 B: 同步 flowMachine 和 contextStore

在 `flowMachine` 的 `TOGGLE_CONTEXT` handler 中，同时更新 contextStore：

```typescript
// flowMachine context update
TOGGLE_CONTEXT: {
  actions: assign({
    boundedContexts: ({ context, event }) => {
      const id = (event as any).id;
      // 更新 flowMachine 状态
      const updated = context.boundedContexts.map(c =>
        c.id === id ? { ...c, selected: !c.selected } : c
      );
      // 同步到 contextStore
      useContextStore.getState().setContextNodes(updated);
      return updated;
    }
  })
}
```

#### 选项 C: 移除 flowMachine 中的 boundedContexts，依赖 contextStore

更大的重构：把 `boundedContexts` 状态完全迁移到 `contextStore`，flowMachine 只引用。

---

### 工作量估算
- **开发**: 选项A 1h / 选项B 1.5h / 选项C 3h
- **测试**: 0.5h
- **总计**: **1.5h**（选项A）

---

### 验收标准
- [ ] 点击 Bounded Context 节点复选框 → 状态正确切换（选中/取消）
- [ ] 选中节点数量正确显示：`{n} / {total} contexts selected`
- [ ] 循环依赖检测（hasCircularDeps）正确触发警告
- [ ] 阶段推进按钮在有选中项时可用
- [ ] jest / 单元测试通过

---

## Bug 3: flowId undefined — 组件生成缺少流程 ID

### 问题描述
AI 生成组件节点时，`flowId` 字段未传递，导致组件树分组功能失效，所有组件都显示为 "通用组件" 或 "❓ unknown"。

**现象**：
- 组件树中，所有组件被错误归入 `🔧 通用组件` 分组
- `getPageLabel` 返回 `❓ <shortId>` 而非 `📄 流程名称`
- 组件与流程的关联关系丢失

---

### 根因分析

**问题代码**：

```typescript
// ComponentNode type (types.ts:125)
export interface ComponentNode {
  nodeId: string;
  flowId: string;  // ← 必填字段
  name: string;
  type: ComponentType;
  // ...
}
```

`flowId` 在类型定义中是 `string`（非 `string | undefined`），但实际 AI 生成组件时没有传入：

```typescript
// componentStore.addComponentNode — 调用处
addComponentNode: (data) => {
  const newNode: ComponentNode = {
    ...data,
    nodeId: generateId(),
    status: 'pending',
    isActive: false,
    children: [],
  };
  // 如果 data.flowId 是 undefined，这里会静默设置 flowId = undefined
}
```

AI 生成组件的调用链（待确认）：

```
AI 生成 → componentStore.setComponentNodes → nodes[i].flowId = undefined
或者：
autoGenerateComponents → data 中缺少 flowId
```

**防御性代码**（已有但不够）：

```typescript
// ComponentTree.tsx:69
if (COMMON_FLOW_IDS.has(node.flowId) || !node.flowId) {
  return true; // 认为是通用组件
}

// ComponentTree.tsx:112
if (!flowId) return null; // matchFlowNode guard
```

但这只处理了显示问题，**真正的业务问题**是：组件-流程关联数据丢失，无法按流程组织组件树。

---

### 修复方案

#### 选项 A: AI 生成时补充 flowId（推荐）⭐

确保 AI 生成组件时，根据当前选中的 flowNode 自动填充 flowId：

```typescript
// 组件生成调用处
const confirmedFlows = flowNodes.filter(f => f.status === 'confirmed');
const generatedComponents = await aiClient.generateComponents({
  contextId: contextNode.nodeId,
  flowId: confirmedFlows[0]?.nodeId,  // ← 关键：传递 flowId
  // ...
});

componentStore.setComponentNodes(
  generatedComponents.map(c => ({
    ...c,
    flowId: c.flowId ?? confirmedFlows[0]?.nodeId ?? 'manual'  // 兜底
  }))
);
```

#### 选项 B: 组件生成 API 响应中包含 flowId

修改 `ai-client.ts` 的 `generateComponents` 返回值，确保每个组件节点包含正确的 `flowId`：

```typescript
// ai-client.ts 响应
{
  componentStructure: {
    name: 'ProductListPage',
    flowId: 'flow-1',  // ← AI 响应中包含
    children: [
      { name: 'ProductCard', flowId: 'flow-1', type: 'card' }
    ]
  }
}
```

#### 选项 C: 组件 Store 层防御性填充（快速止血）

在 `componentStore.setComponentNodes` 中，对每个组件节点做 flowId 兜底：

```typescript
setComponentNodes: (nodes) => {
  const flowNodes = useFlowStore.getState().flowNodes;
  const validatedNodes = nodes.map(n => ({
    ...n,
    flowId: n.flowId || flowNodes[0]?.nodeId || 'manual'  // 兜底
  }));
  set({ componentNodes: validatedNodes });
},
```

---

### 工作量估算
- **开发**: 选项A 1h（需确认 AI 调用链）/ 选项B 1.5h / 选项C 0.5h
- **测试**: 0.5h
- **总计**: **1.5h**（选项A + C 组合）

---

### 验收标准
- [ ] AI 生成组件后，组件树中组件按流程正确分组（每个 flow 一个分组）
- [ ] 组件 `getPageLabel()` 返回 `📄 流程名称` 而非 `❓ unknown`
- [ ] `inferIsCommon()` 对有 flowId 的组件正确返回 `false`
- [ ] 组件导出（ZipExporter）包含正确的 flowId 关联
- [ ] 相关单元测试通过

---

## 总结

| Bug | 根因 | 推荐方案 | 工时 |
|-----|------|---------|------|
| CORS 500 | OPTIONS 落入 authMiddleware → 401 → 500 | Gateway 层显式 OPTIONS handler | 1h |
| Context 选择 | flowMachine 与 contextStore 状态不同步 | 统一使用 contextStore.selectedNodeIds | 1.5h |
| flowId undefined | AI 生成组件时未传递 flowId | 补传 flowId + Store 层防御填充 | 1.5h |
| **合计** | | | **4h** |

---

## 下一步

1. Dev 领取任务，确认修复方案
2. 按 Bug 顺序修复（Bug1 → Bug2 → Bug3）
3. 每个 Bug 修复后运行对应测试验证
4. 修复完成后更新 PR，通知 Reviewer 审核
