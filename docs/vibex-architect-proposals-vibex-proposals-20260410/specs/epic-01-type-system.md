# SPEC — Epic 1: 类型系统统一

**项目**: vibex-architect-proposals-vibex-proposals-20260410
**Epic**: Epic 1 — 类型系统统一
**Stories**: ST-01, ST-02
**总工时**: 12h
**状态**: Ready for Development

---

## 1. Overview

建立统一的类型包 `@vibex/types`，以 Zod 作为 Schema 的单一真相来源，消除前后端类型漂移（Schema Drift）。

**根因**: 当前 `packages/types/src/api/` 无 `package.json`，无法被 workspace 依赖；前端后端各自维护类型定义，`sessionId` vs `generationId` 漂移频发。

---

## 2. Story: ST-01 — packages/types 包初始化（4h）

### 2.1 目标
在 `packages/types/` 建立完整的 pnpm workspace 包，定义 exports map，支持从 `@vibex/types/api/canvas` 等路径导入。

### 2.2 实施步骤

1. **创建 `packages/types/package.json`**
   ```json
   {
     "name": "@vibex/types",
     "version": "0.1.0",
     "type": "module",
     "exports": {
       ".": "./src/index.ts",
       "./api/*": "./src/api/*.ts"
     },
     "types": "./src/index.ts"
   }
   ```

2. **创建 `packages/types/tsconfig.json`**（引用根 tsconfig paths）

3. **创建 `packages/types/src/index.ts`** 统一导出入口

4. **创建 `packages/types/src/api/` 目录结构**
   ```
   src/api/
   ├── canvas.ts    ← Canvas 相关 schema
   ├── session.ts   ← Session/Generation 相关
   └── index.ts    ← barrel export
   ```

5. **运行 `pnpm install`** 验证 workspace 解析

6. **验证**: `pnpm --filter @vibex/types build` 成功

### 2.3 验收条件

```typescript
// 在 vibex-fronted 中
import { GenerateContextsResponseSchema } from '@vibex/types/api/canvas';

// 在 vibex-backend 中
import { GenerateContextsResponseSchema } from '@vibex/types/api/canvas';

// 两者导入同一份类型定义
```

### 2.4 验收测试

```typescript
test('packages/types 包可被 workspace 依赖', () => {
  expect(() => require('@vibex/types')).not.toThrow();
});

test('exports map 路径解析正确', () => {
  const schema = require('@vibex/types/api/canvas');
  expect(schema.GenerateContextsResponseSchema).toBeDefined();
});
```

---

## 3. Story: ST-02 — Zod Schema 重构（8h）

### 3.1 目标
以 Zod 为单一 Schema 真相来源，修复 `sessionId` → `generationId` 漂移，并将运行时验证集成到所有 API routes。

### 3.2 实施步骤

#### 3.2.1 Schema 定义迁移

将现有的手写 validator + JSDoc 类型统一为 Zod schema：

```typescript
// packages/types/src/api/canvas.ts
import { z } from 'zod';

export const GenerationIdSchema = z.string().min(1);
export type GenerationId = z.infer<typeof GenerationIdSchema>;

export const GenerateContextsResponseSchema = z.object({
  generationId: GenerationIdSchema,  // ← 统一为 generationId（不是 sessionId）
  contexts: z.array(z.object({
    id: z.string(),
    name: z.string(),
    type: z.enum(['entity', 'value-object', 'service', 'aggregate']),
  })),
  createdAt: z.string().datetime(),
});
export type GenerateContextsResponse = z.infer<typeof GenerateContextsResponseSchema>;
```

#### 3.2.2 修复现有漂移点

```bash
# 搜索并修复所有 sessionId → generationId 漂移
grep -r "sessionId" vibex-fronted/src/lib/api/ --include="*.ts"
grep -r "sessionId" tests/validators/ --include="*.ts"
```

修复点（预期）:
- `vibex-fronted/src/lib/api/generate-contexts.ts` — 改用 `generationId`
- `tests/validators/canvas-validator.ts` — 使用 Zod schema 而非手写 validator

#### 3.2.3 API Route 集成运行时验证

```typescript
// vibex-fronted/src/app/api/generate-contexts/route.ts
import { GenerateContextsResponseSchema } from '@vibex/types/api/canvas';

export async function POST(req: Request) {
  const raw = await req.json();
  const result = GenerateContextsResponseSchema.safeParse(raw);

  if (!result.success) {
    return Response.json(
      { error: 'Invalid response schema', details: result.error },
      { status: 400 }
    );
  }

  return Response.json(result.data);
}
```

#### 3.2.4 CI Schema 检查

在 CI 中添加 schema drift 检查：
```yaml
# .github/workflows/check-schema.yml
- name: Check Schema Drift
  run: |
    # 新增 API 字段时，CI 应拒绝没有对应 Zod schema 更新的 PR
    pnpm --filter @vibex/types build
```

### 3.3 验收条件

| 条件 | 验证方式 |
|------|---------|
| `sessionId` 不再出现在 API 层 | `grep -r "sessionId" vibex-fronted/src/lib/api/` 返回空 |
| Zod schema 运行时验证工作 | API route 接收错误 schema 返回 400 |
| CI 阻止无 schema 更新的 API 字段添加 | PR 检测通过 |

### 3.4 验收测试

```typescript
test('GenerateContextsResponseSchema 正确验证有效响应', () => {
  const valid = {
    generationId: 'gen_abc123',
    contexts: [{ id: 'c1', name: 'User', type: 'entity' }],
    createdAt: '2026-04-10T00:00:00Z',
  };
  const result = GenerateContextsResponseSchema.safeParse(valid);
  expect(result.success).toBe(true);
});

test('GenerateContextsResponseSchema 拒绝 sessionId 字段', () => {
  const invalid = {
    sessionId: 'sess_abc123',  // ← 错误字段名
    contexts: [],
    createdAt: '2026-04-10T00:00:00Z',
  };
  const result = GenerateContextsResponseSchema.safeParse(invalid);
  expect(result.success).toBe(false);
});

test('API route 拒绝非法 schema', async () => {
  const res = await fetch('/api/generate-contexts', {
    method: 'POST',
    body: JSON.stringify({ sessionId: 'bad' }),
  });
  expect(res.status).toBe(400);
});
```

---

## 4. DoD Checklist — Epic 1

- [ ] `packages/types/package.json` 存在且 exports map 正确
- [ ] `pnpm --filter @vibex/types build` 成功，无 TypeScript 错误
- [ ] `@vibex/types/api/canvas` 在前后端均可正常导入
- [ ] `sessionId` 在 `vibex-fronted/src/lib/api/` 和 `tests/` 中不再出现
- [ ] `GenerateContextsResponseSchema` 使用 `generationId` 而非 `sessionId`
- [ ] 所有 API route 集成 Zod schema 运行时验证
- [ ] `pnpm test` 全部通过
- [ ] `pnpm lint` 无 error
- [ ] PR 已合并到 main

---

*Spec 由 PM Agent 基于 architect 分析文档生成 — 2026-04-10*
