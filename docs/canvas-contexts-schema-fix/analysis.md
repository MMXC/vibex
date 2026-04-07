# Canvas Contexts Schema Fix 分析报告

**项目**: canvas-contexts-schema-fix
**角色**: analyst
**日期**: 2026-04-05
**状态**: ✅ 分析完成

---

## 执行摘要

分析 `generate-contexts` API 响应中的 `generationId` vs `sessionId` schema 不匹配问题。

**根因**: 后端 JSDoc 与代码不一致，测试文件使用了错误的字段名。

---

## 1. 问题定位

### 1.1 Schema 定义位置

| 位置 | 文件 | 字段名 | 状态 |
|------|------|--------|------|
| 后端 JSDoc | `route.ts` | `sessionId` | ❌ 文档错误 |
| 后端 Interface | `route.ts` | `generationId` | ✅ 正确 |
| 后端代码 | `route.ts` | `generationId` | ✅ 正确 |
| 前端 Zod Schema | `canvasApi.ts` | `generationId` | ✅ 正确 |
| 测试 Validator | `canvasApiValidation.test.ts` | `sessionId` | ❌ 测试错误 |

### 1.2 详细分析

**Backend `route.ts`**:
```typescript
/**
 * 输出: { success: boolean, contexts: BoundedContext[], sessionId: string, confidence: number }
 *                        ↑ 文档错误！应该是 generationId
 */

interface GenerateContextsOutput {
  generationId: string;  // ✅ 正确
}

return NextResponse.json({ 
  success: true, 
  contexts, 
  generationId: sessionId,  // ✅ 代码正确，使用 sessionId 变量赋值给 generationId
  confidence 
});
```

**Frontend `canvasApi.ts`**:
```typescript
const GenerateContextsResponseSchema = z.object({
  success: z.boolean(),
  contexts: z.array(...),
  generationId: z.string(),  // ✅ Zod schema 正确
  confidence: z.number(),
});
```

**Test `canvasApiValidation.test.ts`**:
```typescript
function isValidGenerateContextsResponse(value: unknown): value is GenerateContextsOutput {
  // ...
  typeof obj.sessionId === 'string'  // ❌ 测试错误！应该是 generationId
}
```

---

## 2. 问题影响

### 2.1 潜在问题

| 影响 | 严重程度 | 说明 |
|------|----------|------|
| 测试失败 | 高 | validator 函数使用 `sessionId`，API 返回 `generationId` |
| 类型不一致 | 中 | JSDoc 文档与实际代码不符 |
| 维护困惑 | 低 | 开发者可能误用字段名 |

### 2.2 根因

1. **文档不同步**: JSDoc 注释未更新为 `generationId`
2. **测试未同步**: validator 测试未更新为使用 Zod schema

---

## 3. 修复方案

### 方案 A: 统一使用 `generationId`（推荐）

**修复后端 JSDoc**:
```typescript
/**
 * 输出: { success: boolean, contexts: BoundedContext[], generationId: string, confidence: number }
 */
```

**修复测试 Validator**:
```typescript
function isValidGenerateContextsResponse(value: unknown): value is GenerateContextsOutput {
  if (!value || typeof value !== 'object') return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.success === 'boolean' &&
    Array.isArray(obj.contexts) &&
    typeof obj.generationId === 'string' &&  // ✅ 修改
    typeof obj.confidence === 'number'
  );
}
```

**优点**: 与前端 Zod schema 保持一致

### 方案 B: 统一使用 `sessionId`

**改动范围**:
- 修改后端 interface 和代码
- 修改前端 Zod schema
- 修改测试 validator

**缺点**: 改动范围大，可能影响其他依赖方

---

## 4. 验收标准

### 4.1 单元测试

```typescript
test('isValidGenerateContextsResponse accepts generationId', () => {
  const response = {
    success: true,
    contexts: [...],
    generationId: 'gen_123',  // ✅ 使用正确字段名
    confidence: 0.85,
  };
  expect(isValidGenerateContextsResponse(response)).toBe(true);
});
```

### 4.2 集成测试

```typescript
test('API returns generationId field', async () => {
  const response = await fetch('/api/v1/canvas/generate-contexts', {
    method: 'POST',
    body: JSON.stringify({ requirementText: '测试需求' }),
  });
  
  const data = await response.json();
  expect(data).toHaveProperty('generationId');
  expect(typeof data.generationId).toBe('string');
});
```

---

## 5. 工时估算

| 修复项 | 工时 | 优先级 |
|--------|------|--------|
| 修复后端 JSDoc | 0.1h | P0 |
| 修复测试 Validator | 0.2h | P0 |
| **总计** | **0.3h** | - |

---

## 6. 下一步行动

1. **create-prd**: PM 确认方案
2. **design-architecture**: 确认字段命名规范
3. **coord-decision**: 快速修复

---

**分析完成时间**: 2026-04-05 01:05 GMT+8
**分析时长**: ~5min
