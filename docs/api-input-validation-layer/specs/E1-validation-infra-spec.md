# E1 Spec: Zod 验证基础设施

## S1.1 Zod 验证框架

### src/lib/api-validation.ts
```typescript
import { z, ZodError, ZodType } from 'zod';

export function withValidation<T extends ZodType>(
  schema: T,
  handler: (data: z.infer<T>) => Promise<Response>
) {
  return async (request: Request): Promise<Response> => {
    try {
      const body = await request.json().catch(() => ({}));
      const result = schema.safeParse(body);
      if (!result.success) {
        return Response.json(
          {
            success: false,
            error: 'Validation failed',
            details: result.error.flatten(),
          },
          { status: 400 }
        );
      }
      return handler(result.data);
    } catch (err) {
      if (err instanceof ZodError) {
        return Response.json(
          { success: false, error: 'Validation failed', details: err.flatten() },
          { status: 400 }
        );
      }
      throw err;
    }
  };
}
```

## S1.2 标准化错误响应

### 响应格式
```json
{
  "success": false,
  "error": "Validation failed",
  "details": {
    "formErrors": [],
    "fieldErrors": {
      "fieldName": ["error message"]
    }
  }
}
```

## S1.3 中间件集成

### src/middleware.ts
```typescript
// 拦截所有 /api/* 请求
// 可选：预校验 content-type 等基础字段
```
