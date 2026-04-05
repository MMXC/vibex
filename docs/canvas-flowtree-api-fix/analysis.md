# 分析报告: canvas-flowtree-api-fix

**项目**: canvas-flowtree-api-fix  
**阶段**: analyze-requirements  
**日期**: 2026-04-05  
**分析师**: analyst subagent

---

## 1. 当前状态

### 问题定位

`autoGenerateFlows` 函数位于 `flowStore.ts`，作用是当用户在 Canvas 画布确认限界上下文后，自动为每个已确认的上下文生成业务流程树节点。

**当前实现（mock）**：

```typescript
// flowStore.ts, line 55-80
autoGenerateFlows: async (contextNodes) => {
  const confirmedCtxs = contextNodes.filter((c) => c.status === 'confirmed' || c.isActive !== false);
  if (confirmedCtxs.length === 0) return;

  set({ flowGenerating: true });

  // Mock AI generation: simulate API delay
  await new Promise((r) => setTimeout(r, 1500));

  // 硬编码的默认流程（每个上下文都是同一个模板）
  const newFlows: BusinessFlowNode[] = confirmedCtxs.map((ctx) => {
    const defaultSteps: FlowStep[] = [
      { stepId: generateId(), name: '需求收集', actor: '用户', description: '', order: 0, ... },
      { stepId: generateId(), name: '信息录入', actor: '用户', description: '', order: 1, ... },
      { stepId: generateId(), name: '提交确认', actor: '用户', description: '', order: 2, ... },
    ];
    return { nodeId: generateId(), contextId: ctx.nodeId, name: `${ctx.name}业务流程`, steps: defaultSteps, ... };
  });
  // ...
}
```

**确认事实**：
- ✅ 使用了 `setTimeout(1500)` 模拟延迟，而非真实 API 调用
- ✅ 每个上下文节点生成的是**同一套硬编码模板**（需求收集→信息录入→提交确认）
- ✅ 未使用 `canvasApi.generateFlows`（尽管该 API 已定义在 `canvasApi.ts`）
- ✅ 调用入口在 `BusinessFlowTree.tsx` line 753：`autoGenerateFlows(contextNodes)`

### 调用链路

```
BusinessFlowTree.tsx:753
  └─> flowStore.autoGenerateFlows(contextNodes)
        └─> setTimeout(1500) + hardcoded template  ❌ 应该是 canvasApi.generateFlows
```

### 已有 API 支持

`canvasApi.generateFlows` 已定义在 `canvasApi.ts`：

```typescript
generateFlows: async (data: {
  contexts: Array<{ id: string; name: string; description: string; type: string }>;
  sessionId: string;
}): Promise<GenerateFlowsOutput>  // 返回 flows[] + confidence
```

Zod 响应 schema `GenerateFlowsResponseSchema` 已定义，API endpoint 为 `POST /api/v1/canvas/generate-flows`。

---

## 2. 根本原因

| 维度 | 分析 |
|------|------|
| **历史原因** | `autoGenerateFlows` 是 Epic 3 早期阶段实现的前端占位逻辑，用于快速验证 UI 交互流程（拖拽、确认、删除） |
| **架构断层** | `canvasApi.generateFlows` 是后端已实现的 API，但前端 store 未接入——典型的并行开发断层 |
| **数据空洞** | mock 实现无法基于限界上下文的语义内容生成有意义的业务流程，用户看到的永远是"需求收集→信息录入→提交确认"三个占位步骤 |
| **影响范围** | 所有通过 Canvas 画布生成流程树的用户均受影响——这是一个**核心功能的退化** |

---

## 3. 修复方案

### 方案 A：直接替换（推荐）

**思路**：将 `autoGenerateFlows` 中的 mock 逻辑直接替换为 `canvasApi.generateFlows` 调用。

**实现步骤**：

1. 在 `autoGenerateFlows` 中调用 `canvasApi.generateFlows({ contexts, sessionId })`
2. 将 API 返回的 flows 数组映射为 `BusinessFlowNode[]`
3. 保留 `flowGenerating` 状态控制和历史快照记录
4. 保留 `addMessage` 用户提示

**改动范围**：
- `flowStore.ts` 的 `autoGenerateFlows` 方法（约 25 行）
- 无需新增文件或组件

**预计工时**：2-3 小时

**优点**：最小改动，精准修复，直接利用已有 API 和 Zod schema  
**缺点**：sessionId 获取路径需确认（依赖 `useSessionStore` 或 `projectId`）

---

### 方案 B：封装 AI Flow 生成 Hook

**思路**：新建 `useFlowGenerator` hook，封装 API 调用、加载状态、错误处理，作为 `autoGenerateFlows` 的底层实现。

**实现步骤**：

1. 创建 `hooks/canvas/useFlowGenerator.ts`，暴露 `generateFlows(contextNodes)` 方法
2. hook 内部调用 `canvasApi.generateFlows`，处理 loading/error 状态
3. 将 `autoGenerateFlows` 改为调用该 hook
4. 考虑增加缓存：相同 contextNodes 不重复调用

**改动范围**：
- 新建 `useFlowGenerator.ts`（约 60 行）
- 修改 `flowStore.ts` 中的 `autoGenerateFlows`

**预计工时**：4-5 小时

**优点**：关注点分离，hook 可复用，测试友好  
**缺点**：改动面更大，引入额外抽象层

---

## 4. 推荐方案

**推荐方案 A（直接替换）**，理由：
1. `canvasApi.generateFlows` 已完整实现（含 Zod schema 验证），不存在 API 设计风险
2. 修复目标明确：替换 mock → 真实 API，无需引入新抽象
3. 工时短（2-3h），ROI 高
4. 后续如果需要缓存/重试等能力，可以在方案 A 基础上逐步增强

---

## 5. 验收标准

| # | 标准 | 验证方式 |
|---|------|---------|
| AC1 | `autoGenerateFlows` 调用 `canvasApi.generateFlows`，无 mock setTimeout | 代码审查 |
| AC2 | API 返回的 flows 正确映射为 BusinessFlowNode，步骤数/名称/描述来自 API 响应 | 单元测试（mock fetch） |
| AC3 | API 调用失败时 flowGenerating 状态正确重置，不阻塞 UI | 错误路径测试 |
| AC4 | sessionId 正确传递（从 sessionStore 或 projectId） | 集成测试或手动测试 |
| AC5 | 历史快照记录仍正常工作（`getHistoryStore().recordSnapshot`） | 回归测试 |
| AC6 | 用户提示消息正常显示（`addMessage`） | 回归测试 |

---

## 6. 附加说明

### 潜在风险

1. **后端 API 尚未上线**：需确认 `POST /api/v1/canvas/generate-flows` 是否已在后端部署。如果是新功能，需要和 backend 协调。
2. **sessionId 来源**：当前实现中 sessionId 可能来自 `projectId` 或 `sessionStore`，需在接入时确认。
3. **AI 生成耗时**：真实 API 调用可能需要数秒，应确保 loading 状态覆盖全流程（而非 1.5s 后就消失）。

### 扩展建议（非本次修复范围）

- 增加生成失败重试机制
- 相同上下文 ID 不重复调用（幂等性保护）
- 生成进度条（非单纯 loading 状态）
