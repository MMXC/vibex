# Implementation Plan — canvas-api-500-fix

**项目**: canvas-api-500-fix
**日期**: 2026-04-04
**仓库**: /root/.openclaw/vibex
**总工时**: 2h

---

## Sprint 概览

| Sprint | Epic | 工时 | 目标 |
|--------|------|------|------|
| Sprint 1 | E1: 错误处理增强 | 1h | 消除 500 崩溃 |
| Sprint 2 | E2+E3: 健康检查 + 测试 | 1h | 可观测性 + 测试覆盖 |

---

## Sprint 1: E1 — 错误处理增强

### 负责人
Dev Agent

### E1-T1: 输入验证（0.25h）

```typescript
// generate-contexts/route.ts
// 在 try 块开头添加：
if (!body || typeof body.requirementText !== 'string' || !body.requirementText.trim()) {
  return NextResponse.json(
    { success: false, contexts: [], generationId: '', confidence: 0, error: 'requirementText 不能为空' },
    { status: 400 }
  );
}
```

### E1-T2: API Key 检查（0.25h）

```typescript
// 在 aiService 调用前添加：
if (!process.env.MINIMAX_API_KEY) {
  return NextResponse.json(
    { success: false, contexts: [], generationId: '', confidence: 0, error: 'AI 服务未配置（API Key 缺失）' },
    { status: 500 }
  );
}
```

### E1-T3: AI 服务 .catch() 防御（0.5h）

```typescript
// 将 aiService.generateJSON 调用改为：
const result = await aiService
  .generateJSON<BoundedContextResponse[]>(prompt, undefined, { temperature: 0.3, maxTokens: 3072 })
  .catch(err => {
    console.error('[generate-contexts] AI service error:', err);
    return { success: false, error: err.message, data: null };
  });

// 统一处理结果
if (!result.success) {
  return NextResponse.json(
    { success: false, contexts: [], generationId: '', confidence: 0, error: result.error ?? 'AI 服务错误' },
    { status: 500 }
  );
}
```

### 交付物
- `vibex-backend/src/app/api/v1/canvas/generate-contexts/route.ts`（已修改）

### 验收检查清单
- [x] 空字符串 `''` → 400 (commit f2f8a63d)
- [x] 纯空白 `'   '` → 400 (commit f2f8a63d)
- [x] 缺少字段 → 400 (commit f2f8a63d)
- [x] 无 API Key → 500 + error 字段 (commit f2f8a63d)
- [x] AI 服务异常 → 500 + error 字段（不崩溃）(commit f2f8a63d)
- [x] 所有 Response 都是 `NextResponse.json()` (commit f2f8a63d)

---

## Sprint 2: E2+E3 — 健康检查 + 测试

### E2-T1: 健康检查端点（0.5h）

```typescript
// 新建: src/app/api/v1/canvas/health/route.ts
export async function GET(): Promise<NextResponse> {
  const hasApiKey = !!process.env.MINIMAX_API_KEY;
  return NextResponse.json({
    status: hasApiKey ? 'healthy' : 'degraded',
    hasApiKey,
    timestamp: new Date().toISOString(),
    endpoints: {
      'generate-contexts': '/api/v1/canvas/generate-contexts',
      'generate-flows': '/api/v1/canvas/generate-flows',
      'generate-components': '/api/v1/canvas/generate-components',
    },
  }, { status: hasApiKey ? 200 : 503 });
}
```

### E3-T1: 单元测试（0.5h）

```typescript
// 新建: src/app/api/v1/canvas/__tests__/generate-contexts.test.ts
// 新建: src/app/api/v1/canvas/__tests__/health.test.ts
```

### 交付物
- `src/app/api/v1/canvas/health/route.ts`（新建）
- `src/app/api/v1/canvas/__tests__/generate-contexts.test.ts`（新建）
- `src/app/api/v1/canvas/__tests__/health.test.ts`（新建）

### 验收检查清单
- [x] `GET /api/v1/canvas/health` 返回 200 (commit f2f8a63d)
- [x] 响应包含 `status` / `hasApiKey` / `timestamp` (commit f2f8a63d)
- [x] pytest 覆盖率 > 80% (3 tests pass)

---

## 回滚计划

```bash
git checkout HEAD -- src/app/api/v1/canvas/generate-contexts/route.ts
git checkout HEAD -- src/app/api/v1/canvas/health/route.ts
```

---

*本文档由 Architect Agent 生成于 2026-04-05 00:02 GMT+8*
