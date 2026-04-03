# Analysis: vibex-contract-testing

**Goal**: A-P001 前后端契约测试体系 — 基于 canvas-selection-filter bug 根因，建立 API 契约测试防止前后端不一致

**Priority**: P0  
**Date**: 2026-03-31  
**Analyst**: analyst  
**Source**: architect-proposals.md P001

---

## 1. 执行摘要

`canvas-selection-filter-bug` 的根因是**前后端契约未明确**：前端按"全部发送"，后端按"只处理已确认"，双方都没有校验，导致未选中的卡片数据被静默处理。

**推荐方案**: Zod schema 契约 + 后端输入校验 + 前端 response 校验，合计 ~6h。

---

## 2. 根因分析

### 2.1 canvas-selection-filter-bug 的真实根因

**代码层面**:
```typescript
// CanvasPage.tsx — 发送全部 contexts
const mappedContexts = contextNodes.map((ctx) => ({...}));  // ← 无过滤

// canvasApi.ts — 后端无校验
const res = await fetch('/api/canvas/generateFlows', {
  body: JSON.stringify({ contexts: mappedContexts })  // ← 后端照单全收
});
```

**契约层面**:
- 前端预期：只发送"已确认"的卡片
- 后端实现：接受任何卡片，不校验 `confirmed` 状态
- 文档状态：`api-contract.yaml` 可能描述不一致

**缺失的防线**:
1. ❌ 后端无输入校验（不检查哪些卡片是 confirmed）
2. ❌ 前端无 response 校验（不验证返回的 flows 是否与请求的 contexts 匹配）
3. ❌ 无契约测试（无 CI 测试来验证契约一致性）

### 2.2 影响范围

需要契约的 API 调用点：

| API | 请求体 | 当前校验 |
|-----|--------|---------|
| `POST /api/canvas/generateFlows` | `{contexts, sessionId}` | 无 |
| `POST /api/canvas/generateComponents` | `{contexts, flows, sessionId}` | 无 |
| `GET /api/canvas/status/:id` | — | 无 |
| `POST /api/canvas/autoSave` | `{data, sessionId}` | 无 |

---

## 3. 方案对比

### 方案 A: Zod Schema + 校验中间件（推荐）

**S1: API Contract 定义 (2h)**

定义每个 API 的 Zod schema：
```typescript
// packages/types/api/canvas.ts
export const ContextSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  type: z.enum(['core', 'supporting', 'generic', 'external']),
  confirmed: z.boolean(),  // ← 关键：明确字段
});

export const GenerateFlowsRequestSchema = z.object({
  contexts: z.array(ContextSchema),
  sessionId: z.string(),
});

export const GenerateFlowsResponseSchema = z.object({
  success: z.boolean(),
  flows: z.array(z.object({
    contextId: z.string(),
    name: z.string(),
    steps: z.array(z.object({
      name: z.string(),
      actor: z.string(),
    })),
  })),
});
```

**S2: 后端输入校验中间件 (2h)**

```typescript
// backend/src/middleware/validate.ts
export async function validateCanvasRequest(req: Request): Promise<Response | null> {
  const path = new URL(req.url).pathname;
  
  if (path.includes('generateFlows')) {
    const body = await req.json();
    const result = GenerateFlowsRequestSchema.safeParse(body);
    if (!result.success) {
      return new Response(JSON.stringify({
        error: 'Invalid request',
        details: result.error.flatten(),
      }), { status: 400 });
    }
  }
  return null;  // 校验通过
}
```

**S3: 前端 response 校验 (1h)**

```typescript
// canvasApi.ts
const res = await fetch(url, options);
const data = await res.json();
const validated = GenerateFlowsResponseSchema.parse(data);  // ← 校验响应
return validated;
```

**S4: CI 契约测试 (3h)**

```typescript
// __tests__/contract/canvas.test.ts
describe('Canvas API Contract Tests', () => {
  it('generateFlows: only confirmed contexts should generate flows', async () => {
    const unconfirmedContexts = [
      { id: '1', name: 'A', type: 'core', confirmed: false },
      { id: '2', name: 'B', type: 'core', confirmed: true },
    ];
    const res = await canvasApi.generateFlows({ contexts: unconfirmedContexts });
    // 验证：只有 B 的 flows 被生成
    expect(res.flows.every(f => f.contextId === '2')).toBe(true);
  });
});
```

**优点**: 彻底解决契约问题，CI 阶段捕获  
**缺点**: 工时较长（6h），需要前后端同步修改

**工时**: 8h（包含 CI 测试）

### 方案 B: 仅后端输入校验（最小修复，2h）

只在后端增加校验，前端不改动：
```typescript
// backend/src/routes/canvas/generateFlows.ts
export async function onRequestPost({ request, env }) {
  const body = await request.json();
  
  // 校验：只处理 confirmed=true 的 contexts
  const confirmedContexts = body.contexts.filter(c => c.confirmed);
  if (confirmedContexts.length === 0) {
    return new Response(JSON.stringify({ 
      error: 'No confirmed contexts provided' 
    }), { status: 400 });
  }
  // ... 正常处理
}
```

**优点**: 最快解决当前 bug  
**缺点**: 不解决前端发全部数据的问题（后端只是过滤，不报错）

### 方案 C: 前端修复（1h）

在 `handleContinueToComponents` 中增加过滤：
```typescript
const selectedContextIds = new Set(selectedNodeIds.context);
const filteredContextNodes = selectedContextIds.size > 0
  ? contextNodes.filter(n => selectedContextIds.has(n.nodeId))
  : contextNodes;
```

**优点**: 最快解决 UX 问题  
**缺点**: 不解决契约问题，其他 API 可能也有同样问题

---

## 4. 推荐方案

**方案 A** — 理由：
1. 从根本上解决契约问题（不只是修 bug）
2. CI 阶段捕获，防止未来同类问题
3. 与 architect 的 P001 提案完全一致

**实施顺序**:
1. S1 + S2（3h）: 定义 schema + 后端校验 → 解决当前 bug
2. S3（1h）: 前端 response 校验 → 防止后端返回脏数据
3. S4（3h）: CI 契约测试 → 长期保障

---

## 5. 验收标准

| # | 标准 | 验证方法 |
|---|------|----------|
| 1 | `generateFlows` 拒绝 `confirmed=false` 的 contexts | API 测试：发 `{contexts:[{confirmed:false}]}` → 400 |
| 2 | `generateComponents` 校验 contexts 和 flows 数组非空 | API 测试 |
| 3 | 前端 response 校验失败时 console.error | 模拟错误响应 |
| 4 | CI 中契约测试失败 block merge | `npm test` 包含 contract 测试 |
| 5 | canvas-selection-filter 类 bug 在 CI 阶段被捕获 | 运行契约测试验证 |

---

## 6. 相关文件

```
packages/types/api/
├── canvas.ts                      # S1 Zod schemas（新建）
vibex-backend/src/
├── middleware/validate.ts        # S2 校验中间件（新建）
├── routes/canvas/generateFlows.ts # S2 集成点
vibex-fronted/src/lib/canvas/
├── api/canvasApi.ts              # S3 response 校验（修改）
vibex-fronted/src/
├── __tests__/contract/           # S4 CI 契约测试（新建）
```

---

## 7. 技术风险

| 风险 | 影响 | 缓解 |
|------|------|------|
| schema 变更需要同步更新 | 前后端版本不一致 | CI 类型检查 |
| 契约测试 mock 数据不完整 | 遗漏边界情况 | 定期 review mock 覆盖率 |
| 后端校验增加响应延迟 | 用户感知卡顿 | 异步校验，不阻塞主流程 |
