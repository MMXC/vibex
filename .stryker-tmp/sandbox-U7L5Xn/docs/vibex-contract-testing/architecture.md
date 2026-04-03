# Architecture: vibex-contract-testing

**Project**: A-P001 前后端契约测试体系
**Agent**: architect
**Date**: 2026-03-31
**PRD**: docs/vibex-contract-testing/prd.md
**Analysis**: docs/vibex-contract-testing/analysis.md

---

## 1. 执行摘要

本项目建立前后端 API 契约测试体系，防止 canvas-selection-filter 类静默错误再次发生。核心机制：Zod schema 定义契约 → 后端中间件校验输入 → 前端校验响应 → CI 契约测试 blocking merge。

**技术决策**：
- Zod 用于 schema 定义（支持 runtime 校验 + TypeScript 类型生成）
- Middleware 层统一注入，不修改业务代码
- MSW (Mock Service Worker) 用于 CI 契约测试

---

## 2. 系统架构图

```mermaid
graph LR
    subgraph Frontend["Frontend (Next.js)"]
        CT["TanStack Query<br/>canvasApi.ts"]
        RV["Response Validator<br/>(parseResponse)"]
    end

    subgraph Backend["Backend (Cloudflare Workers)"]
        MW["Validation Middleware<br/>(validate.ts)"]
        RT["Route Handlers<br/>(generateFlows etc)"]
        DB["D1 / KV"]
    end

    subgraph Packages["packages/types"]
        SC["Zod Schemas<br/>api/canvas.ts"]
        TS["TypeScript Types"]
    end

    subgraph CI["CI Pipeline"]
        MSW["MSW Mock Server"]
        CT["Contract Tests<br/>(Jest)"]
    end

    CT -->|"request<br/>contexts[]", MSW
    CT -->|"POST /api/canvas/generateFlows"
    MW -->|"校验通过"
    RT
    MSW -->|"contract test"
    CT -->|"blocking"
    SC -->|"schema"
    MW
    RV -->|"response validation"
    CT
    TS -->|"zod-to-ts"
    CT

    style MW fill:#fff3e0
    style SC fill:#e3f2fd
    style CT fill:#f3e5f5
    style MSW fill:#e8f5e9
```

---

## 3. 目录结构

```
packages/types/
├── api/
│   ├── canvas.ts          # 【新增】Canvas API Zod schemas
│   └── index.ts           # 统一导出
├── domain/
│   └── index.ts           # 已有 domain types
└── index.ts

vibex-backend/src/
├── lib/
│   ├── validate.ts        # 【新增】校验中间件
│   └── errors.ts          # 【新增】统一错误格式
├── routes/
│   ├── flows.ts           # 【修改】集成校验
│   ├── components.ts      # 【修改】集成校验
│   └── canvas/
│       ├── generateFlows.ts
│       ├── generateComponents.ts
│       └── autoSave.ts
└── __tests__/
    └── contract/          # 【新增】契约测试
        ├── generateFlows.test.ts
        └── generateComponents.test.ts

vibex-fronted/src/lib/
├── canvasApi.ts           # 【修改】集成 response 校验
└── __tests__/
    └── canvasApi.test.ts  # 【新增】response 校验测试
```

---

## 4. API 契约 Schema 定义

**文件**: `packages/types/api/canvas.ts`

```typescript
import { z } from 'zod';

// --- Context Schema ---
export const ContextSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  confirmed: z.boolean(),
  // 关键字段：confirmed 必须明确
});

// --- Request Schemas ---
export const GenerateFlowsRequestSchema = z.object({
  contexts: z.array(ContextSchema).min(1),
  sessionId: z.string().optional(),
});

export const GenerateComponentsRequestSchema = z.object({
  contexts: z.array(ContextSchema),
  flows: z.array(z.object({
    id: z.string(),
    confirmed: z.boolean(),
  })),
  sessionId: z.string().optional(),
});

// --- Response Schemas ---
export const GenerateFlowsResponseSchema = z.object({
  flows: z.array(z.object({
    id: z.string(),
    name: z.string(),
    nodes: z.array(z.any()),
    edges: z.array(z.any()),
  })),
  sessionId: z.string().optional(),
});

// --- Type exports ---
export type Context = z.infer<typeof ContextSchema>;
export type GenerateFlowsRequest = z.infer<typeof GenerateFlowsRequestSchema>;
export type GenerateComponentsRequest = z.infer<typeof GenerateComponentsRequestSchema>;
export type GenerateFlowsResponse = z.infer<typeof GenerateFlowsResponseSchema>;
```

**关键设计**：`confirmed: z.boolean()` — 明确 required，不允许 undefined。undefined 在 Zod 中会被视为 missing 而非 false。

---

## 5. 后端校验中间件

**文件**: `vibex-backend/src/lib/validate.ts`

```typescript
import { ZodSchema, ZodError } from 'zod';

export interface ValidationResult {
  valid: boolean;
  data?: unknown;
  errors?: Array<{ field: string; message: string }>;
}

export function validateRequest<T>(
  schema: ZodSchema<T>,
  body: unknown
): ValidationResult {
  try {
    const data = schema.parse(body);
    return { valid: true, data };
  } catch (err) {
    if (err instanceof ZodError) {
      return {
        valid: false,
        errors: err.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      };
    }
    throw err;
  }
}

// --- Middleware helper ---
export function withValidation<T>(
  schema: ZodSchema<T>,
  handler: (data: T) => Promise<Response>
) {
  return async (request: Request): Promise<Response> => {
    const body = await request.json();
    const result = validateRequest(schema, body);

    if (!result.valid) {
      return Response.json(
        {
          error: 'Invalid request body',
          details: result.errors,
          code: 'VALIDATION_ERROR',
        },
        { status: 400 }
      );
    }

    return handler(result.data as T);
  };
}
```

**路由集成示例** (`generateFlows.ts`):

```typescript
import { withValidation, validateRequest } from '../lib/validate';
import { GenerateFlowsRequestSchema } from '@vibex/types/api/canvas';

export async function generateFlows(request: Request): Promise<Response> {
  const result = validateRequest(GenerateFlowsRequestSchema, await request.json());

  if (!result.valid) {
    return Response.json({ error: 'Invalid request', details: result.errors }, { status: 400 });
  }

  const { contexts, sessionId } = result.data as GenerateFlowsRequest;

  // 业务逻辑：只处理 confirmed=true 的 contexts
  const confirmedContexts = contexts.filter(c => c.confirmed === true);
  if (confirmedContexts.length === 0) {
    return Response.json(
      { error: 'No confirmed contexts provided', code: 'NO_CONFIRMED_CONTEXTS' },
      { status: 400 }
    );
  }

  // ... 生成 flows
}
```

---

## 6. 前端 Response 校验

**文件**: `vibex-fronted/src/lib/canvasApi.ts`

```typescript
import {
  GenerateFlowsRequestSchema,
  GenerateFlowsResponseSchema,
  type GenerateFlowsRequest,
} from '@vibex/types/api/canvas';

async function parseResponse<T>(
  schema: ZodSchema<T>,
  response: Response
): Promise<T> {
  const data = await response.json();

  try {
    return schema.parse(data);
  } catch (err) {
    console.error('[schema validation failed]', {
      status: response.status,
      errors: err instanceof ZodError ? err.errors : err,
      data,
    });
    // 不 throw，继续使用脏数据（防止校验导致完全不可用）
    return data;
  }
}

export async function generateFlows(
  req: GenerateFlowsRequest
): Promise<GenerateFlowsResponse> {
  const response = await fetch('/api/canvas/generateFlows', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `API error ${response.status}`);
  }

  return parseResponse(GenerateFlowsResponseSchema, response);
}
```

---

## 7. CI 契约测试 (MSW)

**文件**: `vibex-backend/src/__tests__/contract/generateFlows.test.ts`

```typescript
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { GenerateFlowsRequestSchema } from '@vibex/types/api/canvas';

// MSW server for backend contract testing
const server = setupServer(
  http.post('/api/canvas/generateFlows', async ({ request }) => {
    const body = await request.json();
    const result = GenerateFlowsRequestSchema.safeParse(body);

    if (!result.success) {
      return HttpResponse.json(
        { error: 'Invalid contract', details: result.error.issues },
        { status: 400 }
      );
    }

    // 业务逻辑...
    return HttpResponse.json({ flows: [], sessionId: 'mock' });
  })
);

beforeAll(() => server.listen());
afterAll(() => server.close());

describe('generateFlows contract tests', () => {
  it('rejects contexts with confirmed=false', async () => {
    const invalidBody = {
      contexts: [
        { id: 'c1', name: 'Test', confirmed: false },
      ],
    };

    const res = await fetch('/api/canvas/generateFlows', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidBody),
    });

    // 后端应拒绝 confirmed=false
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.code).toBe('NO_CONFIRMED_CONTEXTS');
  });

  it('accepts contexts with confirmed=true', async () => {
    const validBody = {
      contexts: [
        { id: 'c1', name: 'Test', confirmed: true },
      ],
    };

    const res = await fetch('/api/canvas/generateFlows', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validBody),
    });

    expect(res.ok).toBe(true);
  });

  it('rejects contexts without confirmed field', async () => {
    const invalidBody = {
      contexts: [
        { id: 'c1', name: 'Test' }, // confirmed 缺失
      ],
    };

    const result = GenerateFlowsRequestSchema.safeParse(invalidBody);
    // Zod 校验：confirmed 缺失 → missing → error
    expect(result.success).toBe(false);
  });
});
```

**CI 配置** (jest.config.ts 添加):
```typescript
projects: [
  {
    displayName: 'contract',
    testMatch: ['**/__tests__/contract/**/*.test.ts'],
  },
],
```

**package.json** (CI blocking):
```json
{
  "scripts": {
    "test:contract": "jest --project contract",
    "premerge": "pnpm test:contract && pnpm test"
  }
}
```

---

## 8. 文件变更清单

| 文件 | 操作 | Epic |
|------|------|------|
| `packages/types/api/canvas.ts` | 新增 | Epic 1 |
| `packages/types/api/index.ts` | 修改 | Epic 1 |
| `vibex-backend/src/lib/validate.ts` | 新增 | Epic 2 |
| `vibex-backend/src/lib/errors.ts` | 新增 | Epic 2 |
| `vibex-backend/src/routes/flows.ts` | 修改 | Epic 2 |
| `vibex-backend/src/routes/components.ts` | 修改 | Epic 2 |
| `vibex-backend/src/__tests__/contract/generateFlows.test.ts` | 新增 | Epic 4 |
| `vibex-fronted/src/lib/canvasApi.ts` | 修改 | Epic 3 |
| `vibex-fronted/src/__tests__/canvasApi.test.ts` | 新增 | Epic 3 |
| `jest.config.ts` | 修改 | Epic 4 |
| `package.json` | 修改 | Epic 4 |

---

## 9. 测试策略

| 测试类型 | 工具 | 覆盖范围 |
|---------|------|---------|
| Schema 单元测试 | Jest | 所有 schema |
| 后端中间件测试 | Jest + supertest | validate.ts |
| CI 契约测试 | Jest + MSW | generateFlows / generateComponents |
| 前端 response 校验测试 | Jest | canvasApi.ts |

**覆盖率目标**: validate.ts > 90%, contract tests > 80%

---

## 10. 性能影响

| 指标 | 影响 | 评估 |
|------|------|------|
| API 响应延迟 | +2-5ms | Zod parse 极快 |
| Bundle size | +8 KB | Zod (~7KB) + MSW (~1KB) |
| CI 时间 | +3-5min | MSW tests |

---

## 11. 实施计划

| Epic | Story | 工时 | 顺序 |
|------|-------|------|------|
| Epic 1 | Schema 定义 | 2h | 1 |
| Epic 2 | 后端校验中间件 | 2h | 2 |
| Epic 3 | 前端 response 校验 | 1h | 3 |
| Epic 4 | CI 契约测试 | 2.5h | 4 |

**总工时**: 7.5h | **关键路径**: Epic 1 → 2 → 4 | **可并行**: Epic 3 独立

---

## 12. 风险

| 风险 | 概率 | 影响 | 缓解 |
|------|------|------|------|
| Zod 版本与现有 TS 不兼容 | 低 | 中 | 固定版本号 |
| CI 契约测试误报（网络问题） | 中 | 中 | MSW 使用 mock server，不依赖真实网络 |
| 现有 418 ESLint warnings 影响新代码 | 高 | 低 | 本项目遵循 ESLint 规范，不引入新 warnings |

---

*Architect 产出物 | 2026-03-31*
