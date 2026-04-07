# 需求分析报告: component-api-response-fix

**任务**: 修复 generate-components API 返回值与前端 Zod schema 不匹配
**分析师**: analyst
**日期**: 2026-04-02

---

## 问题分析

### 问题 1: component type 收到非法值

**API Schema** (`canvasApi.ts` line 80-100):
```ts
const COMPONENT_TYPE_ENUM = z.enum(['page', 'form', 'list', 'detail', 'modal']);
type: COMPONENT_TYPE_ENUM,  // Zod 严格验证
```

**store 映射** (`canvasStore.ts` line 1062):
```ts
type: c.type,  // 直接使用，无 fallback
```

**根因**: Zod 验证时若 `type` 不匹配枚举，抛出 ZodError 导致整个请求失败。但当前代码已有 `transform` 后置 cast（line 99: `c.type as ComponentType`），说明 API 曾返回非法值被 TypeScript 绕过。**若 Zod 严格模式生效则请求失败，若不生效则非法 type 存入 store**。

### 问题 2: api.method 收到非法值

**API Schema**:
```ts
api: z.object({
  method: HTTP_METHOD_ENUM,  // 只接受 GET | POST
  path: z.string(),
  params: z.array(z.string()),
}).optional()
```

**store 映射** (`canvasStore.ts` line 1064):
```ts
api: c.api ? { ...c.api, params: c.api.params ?? [] } : { method: 'GET', path: '/api', params: [] }
```

**根因**: `fetchComponentTree` 有 fallback（`comp.api ?? {...}`），但 `generateComponentFromFlow` **无 fallback**（line 1064）：若 `c.api` 存在但 `method` 非法，Zod 验证失败。若 `c.api` 不存在，则用默认 GET 正常。

### 问题 3: confidence 为 undefined

**API Schema** (`canvasApi.ts` line 96):
```ts
confidence: z.number()  // 必需，无 undefined 兜底
```

**根因**: `confidence` 在 store 映射中完全未使用（`generateComponentFromFlow` lines 1059-1068 不引用 `c.confidence`）。若 API 返回 `confidence: undefined`，`z.number()` 验证失败。

### 问题 4: flowId 显示 unknown

**API Schema** (`canvasApi.ts` line 87):
```ts
flowId: z.string()  // 无默认值
```

**store 映射**:
- `generateComponentFromFlow` (line 1061): `flowId: c.flowId ?? ''` — 正确
- `fetchComponentTree` (line 270): `flowId: comp.flowId ?? 'mock'` — 正确

**根因**: 根因在**后端** — API 返回 `flowId: 'unknown'` 而非 `null/undefined`。前端只能做 `fallback ?? 'unknown'` 时显示 unknown。需检查后端 `flowId` 映射逻辑。

---

## 技术方案

### 方案 A: 前端防御性解析（推荐）

不依赖 Zod 的严格验证失败，在 `fetchComponentTree` 中逐字段验证 + fallback：

```ts
// 修复后
return result.components.map((comp) => {
  const validTypes = ['page', 'form', 'list', 'detail', 'modal'];
  const validMethods = ['GET', 'POST'];
  
  let type: ComponentType = 'page';
  if (comp.type && validTypes.includes(comp.type)) {
    type = comp.type as ComponentType;
  }

  let method: 'GET' | 'POST' = 'GET';
  if (comp.api?.method && validMethods.includes(comp.api.method)) {
    method = comp.api.method;
  }

  return {
    nodeId: `comp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    flowId: comp.flowId && comp.flowId !== 'unknown' ? comp.flowId : '',
    name: comp.name ?? '未命名组件',
    type,
    props: {},
    api: {
      method,
      path: comp.api?.path ?? '/api/' + (comp.name ?? 'component').toLowerCase().replace(/\s+/g, '-'),
      params: comp.api?.params ?? [],
    },
    status: 'pending' as const,
    children: [],
  };
});
```

### 方案 B: 迁移 fetchComponentTree 到 generateComponentFromFlow

废弃 `fetchComponentTree`，统一使用 `generateComponentFromFlow`，受益于后者已有部分 fallback。

---

## 工作量估算

| 任务 | 估算 |
|------|------|
| 前端防御性解析 | 1h |
| 验收测试 | 0.5h |
| 后端修复 flowId 映射 | 需要后端介入 |
| **总计** | **1.5h + 后端** |

---

## 验收标准

1. [ ] API 返回非法 type → store 中 type 默认为 'page'（不崩溃）
2. [ ] API 返回非法 method → store 中 method 默认为 'GET'
3. [ ] API confidence 为 undefined → 不导致请求失败（可记录 0）
4. [ ] API flowId 为 'unknown' → store 中显示为空字符串（显示空而非 unknown）
5. [ ] Zod 验证失败时显示友好错误，不白屏

---

## 协作建议

| 问题 | 需要后端配合 |
|------|------------|
| flowId 显示 unknown | ✅ 需后端检查 generate-components API 的 flowId 映射逻辑 |
| type 非法值 | ⚠️ 若 API 已修复可移除前端 fallback |
| method 非法值 | ⚠️ 若 API 已修复可移除前端 fallback |
