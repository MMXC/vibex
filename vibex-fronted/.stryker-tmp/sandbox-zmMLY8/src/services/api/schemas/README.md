# API 类型定义文档

**生成时间**: 2026-03-11
**版本**: 1.0.0

---

## 概述

本项目的 API 响应类型使用 Zod schema 定义，提供：
- 运行时类型验证
- TypeScript 类型推断
- 自动生成文档

---

## 类型层次

```
schemas/
├── index.ts          # 所有 schema 定义
├── __tests__/        # schema 测试
└── README.md         # 本文档
```

---

## 模块覆盖

| 模块 | Schema 数量 | 状态 |
|------|------------|------|
| Auth | 3 | ✅ |
| Agent | 4 | ✅ |
| Project | 4 | ✅ |
| Page | 4 | ✅ |
| Message | 2 | ✅ |
| User | 2 | ✅ |
| Flow | 3 | ✅ |
| DDD | 3 | ✅ |
| Requirement | 3 | ✅ |
| Prototype | 1 | ✅ |
| **总计** | **29** | ✅ |

---

## 使用示例

### 1. 导入类型

```typescript
import { Agent, AgentListResponseSchema, validateResponse } from '@/services/api/schemas';
```

### 2. API 调用（旧方式）

```typescript
// ❌ 旧方式：使用 as any
const agents: Agent[] = (response as any).agents || response;
```

### 3. API 调用（新方式）

```typescript
// ✅ 新方式：使用 Zod 验证
const validated = validateResponse(AgentListResponseSchema, response);
if ('error' in validated) {
  throw new Error(`Validation failed: ${validated.error.message}`);
}
const agents = validated.data.agents;
```

### 4. 类型推断

```typescript
// 类型自动推断
const response = await httpClient.get('/agents');
const agents = validateResponse(AgentListResponseSchema, response).data.agents;
//    ^? Agent[]
```

---

## Schema 定义规范

### 命名约定

| 类型 | 命名 | 示例 |
|------|------|------|
| Entity Schema | `<Entity>Schema` | `AgentSchema` |
| Create Schema | `<Entity>CreateSchema` | `AgentCreateSchema` |
| Update Schema | `<Entity>UpdateSchema` | `AgentUpdateSchema` |
| Response Schema | `<Entity>ResponseSchema` | `AgentResponseSchema` |
| List Response | `<Entity>ListResponseSchema` | `AgentListResponseSchema` |

### 类型导出

```typescript
export type Agent = z.infer<typeof AgentSchema>;
```

---

## 验证函数

### `validateResponse`

严格验证，失败抛出异常。

```typescript
function validateResponse<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown
): z.infer<T>;
```

### `safeValidateResponse`

安全验证，返回结果对象。

```typescript
function safeValidateResponse<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown
): { success: true; data: z.infer<T> } | { success: false; error: z.ZodError };
```

---

## 迁移指南

### Step 1: 识别 `as any`

```bash
grep -rn "as any" src/services/api/modules/
```

### Step 2: 定义 Schema

```typescript
// 在 schemas/index.ts 添加
export const MyEntitySchema = z.object({
  id: z.string(),
  name: z.string(),
});
```

### Step 3: 替换 `as any`

```typescript
// 旧代码
const entity: MyEntity = (response as any).entity || response;

// 新代码
const result = safeValidateResponse(MyEntityResponseSchema, response);
if (!result.success) {
  console.error('Validation error:', result.error);
  throw new Error('Invalid response format');
}
const entity = result.data.entity;
```

---

## 测试覆盖

所有 schema 应有单元测试：

```typescript
describe('AgentSchema', () => {
  it('should validate valid agent', () => {
    const result = AgentSchema.safeParse({
      id: '1',
      name: 'Test Agent',
      type: 'assistant',
      status: 'active',
      userId: 'user1',
    });
    expect(result.success).toBe(true);
  });

  it('should reject invalid type', () => {
    const result = AgentSchema.safeParse({
      id: '1',
      name: 'Test',
      type: 'invalid', // ❌
      status: 'active',
      userId: 'user1',
    });
    expect(result.success).toBe(false);
  });
});
```

---

## 与后端同步

### 自动化方案

1. 从后端 OpenAPI spec 生成 TypeScript 类型
2. 转换为 Zod schema
3. 保持前后端类型一致

### 手动同步

- API 变更时同步更新 schema
- 添加变更日志记录

---

**维护者**: reviewer agent
**日期**: 2026-03-11