# Spec: Epic1 + Epic2 + Epic3 — Canvas API 500 修复

## 影响文件

- `vibex-fronted/src/app/api/v1/canvas/generate-contexts/route.ts`
- `vibex-fronted/src/app/api/v1/canvas/health/route.ts`（新建）
- `vibex-fronted/src/app/api/v1/canvas/__tests__/generate-contexts.test.ts`（新建）
- `vibex-fronted/src/app/api/v1/canvas/__tests__/health.test.ts`（新建）

---

## Spec E1-F1: 输入验证

### 修改位置
`src/app/api/v1/canvas/generate-contexts/route.ts`

### 修改代码

```typescript
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json().catch(() => null);

    // ===== E1-F1: 输入验证 =====
    if (!body || typeof body.requirementText !== 'string' || !body.requirementText.trim()) {
      return NextResponse.json(
        {
          success: false,
          contexts: [],
          generationId: '',
          confidence: 0,
          error: 'requirementText 不能为空',
        },
        { status: 400 }
      );
    }
    // ================================

    const { requirementText, projectId } = body;
    // ... rest of the handler
  } catch (err) {
    // 不再抛出异常，统一返回 JSON Response
    return NextResponse.json(
      {
        success: false,
        contexts: [],
        generationId: '',
        confidence: 0,
        error: '服务器内部错误',
      },
      { status: 500 }
    );
  }
}
```

### 验收测试

```typescript
// generate-contexts.test.ts
import { POST } from '../route';

async function testGenerateContexts(body: object) {
  const req = new NextRequest('http://localhost/api/v1/canvas/generate-contexts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return POST(req);
}

describe('E1-F1: 输入验证', () => {
  it('空字符串返回 400', async () => {
    const res = await testGenerateContexts({ requirementText: '' });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toContain('不能为空');
  });

  it('纯空白字符串返回 400', async () => {
    const res = await testGenerateContexts({ requirementText: '   ' });
    expect(res.status).toBe(400);
  });

  it('缺少字段返回 400', async () => {
    const res = await testGenerateContexts({});
    expect(res.status).toBe(400);
  });
});
```

---

## Spec E1-F2: 环境变量验证

### 修改位置
`src/app/api/v1/canvas/generate-contexts/route.ts`

### 修改代码

```typescript
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json().catch(() => null);

    if (!body || typeof body.requirementText !== 'string' || !body.requirementText.trim()) {
      return NextResponse.json({ success: false, contexts: [], error: 'requirementText 不能为空' }, { status: 400 });
    }

    const { requirementText, projectId } = body;

    // ===== E1-F2: 环境变量验证 =====
    const env = getCloudflareEnv();
    if (!env.MINIMAX_API_KEY) {
      console.error('[canvas/generate-contexts] Missing MINIMAX_API_KEY');
      return NextResponse.json(
        { success: false, contexts: [], generationId: '', confidence: 0, error: 'AI 服务未配置' },
        { status: 500 }
      );
    }
    // ================================

    const aiService = createAIService(env);
    // ... rest
  } catch (err) {
    return NextResponse.json(
      { success: false, contexts: [], generationId: '', confidence: 0, error: '服务器内部错误' },
      { status: 500 }
    );
  }
}
```

---

## Spec E1-F3: AI 服务错误捕获

### 修改位置
`src/app/api/v1/canvas/generate-contexts/route.ts`

### 修改代码

```typescript
// ===== E1-F3: AI 服务错误捕获 =====
const result = await aiService
  .generateJSON<BoundedContextResponse[]>(prompt, undefined, {
    temperature: 0.3,
    maxTokens: 3072,
  })
  .catch((err) => {
    console.error('[canvas/generate-contexts] AI service error:', err);
    return { success: false, error: err?.message || '未知错误', data: null };
  });

// 处理 AI 服务错误
if (!result.success || !result.data) {
  return NextResponse.json(
    {
      success: false,
      contexts: [],
      generationId: sessionId,
      confidence: 0,
      error: result.error || 'AI 服务调用失败',
    },
    { status: 500 }
  );
}
// ====================================
```

### 关键原则

**Promise 必须 resolve 到 Response**：
- 所有 async 操作必须 `.catch()` 捕获
- catch 返回 `{ success: false, ... }` 而非抛出异常
- 最终统一返回 `NextResponse.json()`

---

## Spec E2-F1: 健康检查端点

### 新建文件
`src/app/api/v1/canvas/health/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { getCloudflareEnv } from '@/lib/env';

export async function GET(): Promise<NextResponse> {
  const env = getCloudflareEnv();
  const hasApiKey = !!env.MINIMAX_API_KEY;

  return NextResponse.json({
    status: hasApiKey ? 'healthy' : 'degraded',
    hasApiKey,
    timestamp: new Date().toISOString(),
  }, { status: 200 });
}
```

### 验收测试

```typescript
// health.test.ts
import { GET } from '../route';

describe('E2-F1: 健康检查端点', () => {
  it('返回 200', async () => {
    const res = await GET();
    expect(res.status).toBe(200);
  });

  it('包含 status/hasApiKey/timestamp', async () => {
    const res = await GET();
    const body = await res.json();
    expect(body).toHaveProperty('status');
    expect(body).toHaveProperty('hasApiKey');
    expect(body).toHaveProperty('timestamp');
    expect(['healthy', 'degraded']).toContain(body.status);
    expect(typeof body.hasApiKey).toBe('boolean');
  });
});
```

---

## Spec E3-F1: 单元测试覆盖

### 测试文件清单

| 文件 | 覆盖场景 |
|------|----------|
| `generate-contexts.test.ts` | 400 空输入、500 AI失败、200 成功路径 |
| `health.test.ts` | healthy/degraded 两种状态 |

### 关键断言

```typescript
// 所有响应结构一致
expect(body).toHaveProperty('success');    // boolean
expect(body).toHaveProperty('contexts');   // BoundedContext[]
expect(body).toHaveProperty('error');       // string | undefined
expect(body).toHaveProperty('generationId'); // string
expect(body).toHaveProperty('confidence');   // number
```

---

## 工时汇总

| 功能 | 工时 | 风险 |
|------|------|------|
| E1-F1 输入验证 | 0.25h | 低 |
| E1-F2 环境检查 | 0.25h | 低 |
| E1-F3 AI错误捕获 | 0.5h | 低 |
| E2-F1 健康检查端点 | 0.5h | 极低 |
| E3-F1 单元测试 | 0.5h | 低 |
| **总计** | **2h** | — |

---

## API 响应结构（统一）

```typescript
interface GenerateContextsResponse {
  success: boolean;      // always present
  contexts: BoundedContext[];
  generationId: string;
  confidence: number;
  error?: string;        // present when success=false
}
```

### 状态码约定

| 状态码 | 含义 |
|--------|------|
| 200 | AI 调用成功 |
| 400 | 输入参数无效（空 requirementText 等）|
| 500 | 服务器错误（AI 服务失败等）|

**注意**: 500 不再是崩溃（Promise reject），而是有 body.error 的正常响应。
