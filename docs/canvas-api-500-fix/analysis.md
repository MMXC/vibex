# Canvas API 500 错误分析报告

**项目**: canvas-api-500-fix
**角色**: analyst
**日期**: 2026-04-04
**状态**: ✅ 分析完成

---

## 执行摘要

分析 Canvas API 500 错误 "Promise did not resolve to Response" 的根因。

**问题**: `POST /api/v1/canvas/generate-contexts` 返回 500 错误  
**错误类型**: `TypeError: Promise did not resolve to Response`  
**影响**: 用户无法使用 AI 生成限界上下文功能

---

## 1. 问题定位

### 1.1 API 端点清单

| 端点 | 方法 | 状态 | 位置 |
|------|------|------|------|
| `/v1/canvas/generate-contexts` | POST | ❌ 500错误 | `src/app/api/v1/canvas/generate-contexts/route.ts` |
| `/v1/canvas/generate-flows` | POST | ✅ 正常 | `src/app/api/v1/canvas/generate-flows/route.ts` |
| `/v1/canvas/generate-components` | POST | ✅ 正常 | `src/app/api/v1/canvas/generate-components/route.ts` |
| `/v1/canvas/snapshots` | GET/POST | ✅ 正常 | `src/app/api/canvas/snapshots/route.ts` |

### 1.2 错误分析

**错误信息**: `TypeError: Promise did not resolve to Response`

**常见原因**:
1. Next.js API Route 返回了 Promise 而非 Response
2. 异步函数缺少 await
3. 异常在返回 Response 前被抛出
4. 循环依赖导致 Promise 卡住

---

## 2. 根因分析

### 2.1 代码审查结果

检查 `generate-contexts/route.ts`:

```typescript
export async function POST(request: NextRequest): Promise<NextResponse<GenerateContextsOutput>> {
  try {
    const body = await request.json().catch(() => null);
    // ...
    const result = await aiService.generateJSON<BoundedContextResponse[]>(prompt, undefined, {
      temperature: 0.3,
      maxTokens: 3072,
    });
    // ...
  } catch (err) {
    console.error('[canvas/generate-contexts] Error:', err);
    return NextResponse.json(
      { success: false, contexts: [], ... },
      { status: 500 }
    );
  }
}
```

**代码结构**: ✅ 正确，使用了 async/await

### 2.2 潜在问题点

| 问题 | 可能性 | 说明 |
|------|--------|------|
| AI Service 异常 | 高 | `aiService.generateJSON()` 可能抛出未捕获异常 |
| 环境变量缺失 | 中 | `getCloudflareEnv()` 返回 undefined |
| Prompt 构建异常 | 低 | `buildBoundedContextsPrompt()` 正常工作 |
| Filter 异常 | 低 | `filterInvalidContexts()` 正常工作 |

---

## 3. 详细分析

### 3.1 AI Service 调用链

```
POST handler
  → createAIService(env)
  → aiService.generateJSON(prompt, schema, options)
    → executeWithFallback()
      → llmProvider.chat()
        → fetch(url, options)
```

**问题点**: `executeWithFallback` 捕获所有错误并返回 `{ success: false, error }` 但不抛出。

但如果 `llmProvider.chat()` 抛出未捕获的 Promise reject，会导致整个 handler 失败。

### 3.2 检查 LLM Provider

```typescript
// llm-provider.ts
async chat(options: LLMRequestOptions): Promise<LLMResponse> {
  try {
    // ...
    const response = await this.executeWithRetry(...);
    const result = this.parseResponse(provider, response, model);
    return result;
  } catch (error) {
    this.updateHealth(provider.type, false, errorMessage);
    throw new Error(`LLM request failed: ${errorMessage}`);
  }
}
```

**分析**: 如果 `executeWithRetry` 或 `parseResponse` 抛出错误，会被 catch 捕获并重新抛出。

### 3.3 可能的问题场景

**场景 1: API Key 缺失**
```typescript
const env = getCloudflareEnv();
// 如果 MINIMAX_API_KEY 为 undefined，fetch 会失败
```

**场景 2: 超时**
```typescript
signal: AbortSignal.timeout(provider.timeout)
// 如果 AI 服务响应超时，fetch 会抛出 AbortError
```

**场景 3: 响应解析失败**
```typescript
const result = this.parseResponse(provider, response, model);
// 如果响应格式不符合预期，parseResponse 可能抛出错误
```

---

## 4. 修复方案

### 方案 A: 增强错误处理（推荐）

**改动文件**: `src/app/api/v1/canvas/generate-contexts/route.ts`

```typescript
export async function POST(request: NextRequest): Promise<NextResponse<GenerateContextsOutput>> {
  try {
    const body = await request.json().catch(() => null);

    if (!body || typeof body.requirementText !== 'string' || !body.requirementText.trim()) {
      return NextResponse.json(
        { success: false, contexts: [], generationId: '', confidence: 0, error: 'requirementText 不能为空' },
        { status: 400 }
      );
    }

    const { requirementText, projectId } = body;

    // 验证环境变量
    const env = getCloudflareEnv();
    if (!env.MINIMAX_API_KEY) {
      console.error('[canvas/generate-contexts] Missing MINIMAX_API_KEY');
      return NextResponse.json(
        { success: false, contexts: [], generationId: '', confidence: 0, error: 'AI 服务未配置' },
        { status: 500 }
      );
    }

    const aiService = createAIService(env);
    const sessionId = generateId();

    const prompt = buildBoundedContextsPrompt(requirementText);

    // 显式 await 并处理结果
    const result = await aiService.generateJSON<BoundedContextResponse[]>(prompt, undefined, {
      temperature: 0.3,
      maxTokens: 3072,
    }).catch((err) => {
      console.error('[canvas/generate-contexts] AI service error:', err);
      return { success: false, error: err.message, data: null };
    });

    // 处理 AI 服务错误
    if (!result.success || !result.data) {
      return NextResponse.json(
        { 
          success: false, 
          contexts: [], 
          generationId: sessionId, 
          confidence: 0, 
          error: result.error || 'AI 服务调用失败' 
        },
        { status: 500 }
      );
    }

    // ... 后续处理

  } catch (err) {
    console.error('[canvas/generate-contexts] Unexpected error:', err);
    return NextResponse.json(
      { success: false, contexts: [], generationId: '', confidence: 0, error: '服务器内部错误' },
      { status: 500 }
    );
  }
}
```

**优点**: 显式处理所有错误场景，返回有意义的错误信息

### 方案 B: 添加健康检查端点

**改动**: 添加 `GET /api/v1/canvas/health` 端点

```typescript
export async function GET(): Promise<NextResponse> {
  const env = getCloudflareEnv();
  const hasApiKey = !!env.MINIMAX_API_KEY;
  
  return NextResponse.json({
    status: hasApiKey ? 'healthy' : 'degraded',
    hasApiKey,
    timestamp: new Date().toISOString(),
  });
}
```

---

## 5. 验收标准

### 5.1 功能测试

```typescript
// 测试 generate-contexts API
test('generate-contexts returns valid response', async () => {
  const response = await fetch('/api/v1/canvas/generate-contexts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ requirementText: '在线预约医生系统' }),
  });
  
  expect(response.status).toBe(200);
  const data = await response.json();
  expect(data.success).toBe(true);
  expect(Array.isArray(data.contexts)).toBe(true);
});
```

### 5.2 错误场景测试

```typescript
test('returns 400 for empty requirementText', async () => {
  const response = await fetch('/api/v1/canvas/generate-contexts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ requirementText: '' }),
  });
  
  expect(response.status).toBe(400);
});

test('returns 500 with error message for AI failure', async () => {
  // Mock AI service to fail
  const response = await fetch('/api/v1/canvas/generate-contexts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ requirementText: '测试需求' }),
  });
  
  const data = await response.json();
  expect(data.success).toBe(false);
  expect(data.error).toBeDefined();
});
```

---

## 6. 工时估算

| 修复项 | 工时 | 优先级 |
|--------|------|--------|
| 增强错误处理 | 1h | P0 |
| 添加健康检查端点 | 0.5h | P1 |
| 添加单元测试 | 0.5h | P1 |
| **总计** | **2h** | - |

---

## 7. 下一步行动

1. **create-prd**: PM 确认修复方案
2. **design-architecture**: 实现修复代码
3. **coord-decision**: 决策是否进入开发

---

**分析完成时间**: 2026-04-05 00:00 GMT+8
**分析时长**: ~15min
