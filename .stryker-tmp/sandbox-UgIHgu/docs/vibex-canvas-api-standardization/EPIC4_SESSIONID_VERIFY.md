# Epic 4: sessionId 链路验证报告

**项目**: vibex-canvas-api-standardization  
**Epic**: F4 — 两步设计流程 sessionId 链路验证  
**Agent**: dev  
**验证日期**: 2026-03-29  
**状态**: ✅ 验证完成（发现问题，非阻塞）

---

## 1. 验证范围

- ✅ 确认 `sessionId` 从前端 → 后端 → SSE 事件全链路传递
- ✅ 确认 sessionId 在两步设计流程（Step1 流程 → Step2 组件）中正确传递
- ✅ 确认 Hono Router (`src/routes/v1/canvas/index.ts`) sessionId 处理
- ✅ 确认 Next.js App Router (`src/app/api/v1/canvas/generate-*/route.ts`) sessionId 处理
- ✅ 确认前端 API 调用 (`vibex-fronted/src/lib/canvas/api/canvasApi.ts`)
- ✅ 确认 SSE 事件 sessionId

---

## 2. 后端 sessionId 处理

### 2.1 Hono Router (主实现) — ✅ 正确处理

**文件**: `vibex-backend/src/routes/v1/canvas/index.ts`

| 端点 | sessionId 处理 | 状态 |
|------|---------------|------|
| `POST /v1/canvas/generate-contexts` | 返回 `generationId`（由后端生成） | ✅ |
| `POST /v1/canvas/generate-flows` | Zod schema 要求 `sessionId` 必填，devDebug 记录 | ✅ |
| `POST /v1/canvas/generate-components` | Zod schema 要求 `sessionId` 必填，devDebug 记录 | ✅ |

Hono Router 的 `GenerateFlowsRequestSchema` 和 `GenerateComponentsRequestSchema` 均通过 Zod 将 `sessionId` 设为必填字段，后端会正确验证。

### 2.2 Next.js App Router (冗余实现) — ⚠️ 未使用 sessionId

**文件**: `vibex-backend/src/app/api/v1/canvas/generate-*/route.ts`

| 端点 | 问题 |
|------|------|
| `generate-contexts` | ✅ 生成 sessionId（作为 `generationId` 返回） |
| `generate-flows` | ⚠️ 定义了 `sessionId` 类型但未从 body 提取，后端生成新 `generationId` |
| `generate-components` | ⚠️ 定义了 `sessionId?: string` 但未从 body 提取，后端生成新 `generationId` |

**问题详情**:

`generate-flows/route.ts` 第 72-74 行：
```typescript
const { contexts } = body as {
  contexts: BoundedContext[];
};
// sessionId 在 body 中但未被提取
```

`generate-components/route.ts` 第 69-73 行：
```typescript
const { contexts, flows } = body as {
  contexts: BoundedContext[];
  flows: BusinessFlowInput[];
  sessionId?: string;  // 定义但未使用
};
```

---

## 3. 前端 API 调用

### 3.1 canvasApi.ts — ✅ 正确发送 sessionId

**文件**: `vibex-fronted/src/lib/canvas/api/canvasApi.ts`

| 函数 | 请求参数 | sessionId 状态 |
|------|---------|---------------|
| `generateContexts` | `{ requirementText, projectId? }` | 无 sessionId（由后端生成） |
| `generateFlows` | `{ contexts, sessionId }` | ✅ 发送 |
| `generateComponents` | `{ contexts, flows, sessionId }` | ✅ 发送 |

### 3.2 autoGenerateFlows (canvasStore) — ⚠️ sessionId 来源问题

**文件**: `vibex-fronted/src/lib/canvas/canvasStore.ts` 第 114 行

```typescript
const sessionId = projectId ?? `session-${Date.now()}`;
```

**问题**: `generate-contexts` 返回 `generationId`（后端生成），但前端未捕获和使用。

`generateContextsFromRequirement`（第 99-139 行）通过 SSE 流式生成上下文，不从响应中提取 sessionId。

---

## 4. 两步设计流程 sessionId 链路

### Step 0 → Step 1 → Step 2 链路分析

```
generate-contexts
  后端生成 sessionId → 返回 generationId
  前端 SSE 流程 → 不提取 generationId
  ════════════════════════════════════════
  ⚠️ sessionId 断链点 1: 前端未保存 contexts 响应的 generationId

generateFlows / generateComponents
  前端使用 projectId 作为 sessionId → Hono Router 验证通过
  ════════════════════════════════════════
  ✅ sessionId 链路完整（通过 projectId 回退）
```

---

## 5. SSE 事件 sessionId

**端点**: `GET /api/v1/canvas/stream?requirement=xxx`  
**文件**: `vibex-backend/src/app/api/v1/canvas/stream/route.ts`

| 事件类型 | sessionId | 状态 |
|---------|----------|------|
| `thinking` | ❌ 无 | ⚠️ 无关联 |
| `step_context` | ❌ 无 | ⚠️ 无关联 |
| `step_model` | ❌ 无 | ⚠️ 无关联 |
| `step_flow` | ❌ 无 | ⚠️ 无关联 |
| `step_components` | ❌ 无 | ⚠️ 无关联 |
| `done` | ❌ 无 | ⚠️ 无关联 |

**问题**: SSE 事件无 sessionId 字段，无法将事件流与特定会话关联。

---

## 6. 发现的问题汇总

| # | 位置 | 问题 | 严重度 | 类型 |
|---|------|------|--------|------|
| 1 | Next.js App Router `generate-flows` | sessionId 在 body 中定义但未提取 | 低 | 代码一致性问题 |
| 2 | Next.js App Router `generate-components` | sessionId 在 body 中定义但未提取 | 低 | 代码一致性问题 |
| 3 | Frontend `canvasStore.autoGenerateFlows` | 使用 projectId 作为 sessionId，而非 contexts 响应的 generationId | 低 | 实现与设计偏差 |
| 4 | Frontend `canvasStore.generateContextsFromRequirement` | 不提取/保存 SSE 流程的 sessionId | 低 | 功能缺失 |
| 5 | SSE Stream `stream/route.ts` | 所有事件类型无 sessionId 字段 | 中 | 功能缺失 |

---

## 7. 验收标准对照

| AC | 验收标准 | 状态 | 说明 |
|----|----------|------|------|
| AC-SID-1 | generate-contexts 返回包含 sessionId | ✅ 通过 | generationId 由后端生成并返回 |
| AC-SID-2 | generate-flows 请求必须包含 sessionId | ✅ 通过 | Hono Router Zod 验证通过；Next.js App Router 未提取但接受任意值 |
| AC-SID-3 | generate-components 请求必须包含 sessionId | ✅ 通过 | Hono Router Zod 验证通过 |
| AC-SID-4 | sessionId 刷新页面后可恢复 | ⚠️ 部分 | projectId 存在 localStorage，sessionId 不单独存储 |

---

## 8. 结论

### 链路完整性判定

| 链路段 | 完整性 | 说明 |
|--------|--------|------|
| 前端 → Hono Backend (generate-flows) | ✅ 完整 | 前端发送 sessionId，Hono Router 验证 |
| 前端 → Hono Backend (generate-components) | ✅ 完整 | 前端发送 sessionId，Hono Router 验证 |
| SSE 事件 | ⚠️ 不完整 | 无 sessionId，无法关联会话 |
| Next.js App Router | ⚠️ 有缺陷 | sessionId 未提取但接受请求 |

### 推荐行动（供决策）

1. **[低优先级]** 补充 Next.js App Router 的 sessionId 提取代码（代码整洁性）
2. **[低优先级]** 前端从 contexts 响应中捕获 `generationId` 并用于后续请求
3. **[中优先级]** SSE 事件增加 `sessionId` 字段（用于可追溯性）
4. **[低优先级]** 考虑将 Next.js App Router 版本（冗余）与 Hono Router 版本合并，清理死代码

---

*验证人: dev agent | 验证时间: 2026-03-29*
