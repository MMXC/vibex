# Dev 提案 — 2026-04-12

**Agent**: dev
**日期**: 2026-04-12
**仓库**: /root/.openclaw/vibex

---

## P001: 修复 TypeScript 编译错误（P0 阻塞构建）

**优先级**: P0 — 全团队阻塞

### 问题描述

`pnpm tsc --noEmit` 在 frontend 和 backend 均报 TypeScript 错误，导致无法确认代码正确性，阻塞 CI/CD。

**错误汇总**（frontend + backend 共有错误）:

1. **`src/app/api/plan/analyze/route.ts`** — `EntityAttribute.required` 类型冲突
   - 属性 `required?: boolean | undefined` 不能赋值给 `boolean`
   - 根因：实体属性中 `required` 字段允许 `undefined`，但类型定义要求 `boolean`

2. **`src/lib/apiAuth.ts`** — `NextResponse` 用作值但 `import type` 导入
   - 第 70、100 行：`NextResponse` 以值方式使用（`new NextResponse()`），但文件头部 `import type { NextResponse }`
   - 修复：改为 `import { NextResponse } from 'next/server'`

3. **`src/lib/db.ts`** — `Function` 类型参数约束（3 处）
   - 第 257、313、348 行：`Type 'Function' does not satisfy constraint '(...args: any) => any'`
   - 根因：泛型函数参数使用 `Function` 类型，无法指定类型参数
   - 修复：使用 `(args: any) => any` 或具体函数签名

4. **`src/index.ts`** — `CloudflareEnv` 转 `Record<string, unknown>`
   - 第 96 行：类型断言不安全
   - 修复：先转 `unknown` 再转目标类型，或改用 `as any`

### 建议方案

**方案 A（推荐）**: 逐文件修复
- 按上述 4 类错误逐一分层修复
- 修复后运行 `pnpm tsc --noEmit` 确认零错误
- 纳入 CI gate，阻止有 TS 错误的 PR 合入

**工时**: 2h

---

## P002: Plan Analyze API Entity 属性类型一致性

**优先级**: P1 — 数据完整性

### 问题描述

`src/app/api/plan/analyze/route.ts` 第 294 行返回的实体数据中，`EntityAttribute.required` 字段类型为 `boolean | undefined`，但 `EntityAttribute` 类型定义要求 `required: boolean`。

### 建议方案

**方案 A（推荐）**: 在转换函数中补全 `required` 字段
- 找到实体属性映射处，确保 `required` 默认为 `true` 或显式传递
- 或更新 `EntityAttribute` 类型定义允许 `required?: boolean`

**方案 B**: 类型降级
- 将 `EntityAttribute.required` 改为 `required?: boolean`

**工时**: 0.5h

---

## P003: apiAuth.ts 导入类型修复

**优先级**: P1 — 编译阻塞

### 问题描述

`src/lib/apiAuth.ts` 头部使用 `import type { NextResponse }`，但第 70、100 行以值方式调用 `new NextResponse()`，导致 TS1361 错误。

### 建议方案

**方案 A（推荐）**: 改为值导入
```typescript
import { NextResponse } from 'next/server';
```

**工时**: 0.1h（1 行修改）

---

## P004: db.ts 泛型函数类型参数约束修复

**优先级**: P1 — 代码质量

### 问题描述

`src/lib/db.ts` 第 257、313、348 行使用 `Function` 作为泛型参数类型，违反 TypeScript 函数类型约束。

```typescript
// 错误写法
Type 'Function' does not satisfy constraint '(...args: any) => any'

// 出现在泛型上下文中
this.query<T extends Function>(sql, params)
```

### 建议方案

**方案 A（推荐）**: 替换为 `(...args: any) => any`
```typescript
this.query<T extends (...args: any) => any>(sql, params)
```

**工时**: 0.3h

---

## P005: next.config.ts ESLint 配置属性清理

**优先级**: P2 — 配置整洁

### 问题描述

`vibex-fronted/next.config.ts` 第 7 行指定了 `eslint: { ... }` 配置，但 Next.js 14+ 的 `NextConfig` 类型定义中不存在该属性，导致 TS2353 错误。

### 建议方案

**方案 A（推荐）**: 移除 ESLint 配置块
- ESLint 检查应通过 CI/CD 的 `lint` script 执行，不应在 `next.config.ts` 中配置
- 如果需要 eslint 配置，通过 `eslint.config.mjs` 处理

**工时**: 0.1h

---

## P006: CloudflareEnv 类型断言安全化

**优先级**: P2 — 类型安全

### 问题描述

`src/index.ts` 第 96 行将 `CloudflareEnv` 类型强制转换为 `Record<string, unknown>`：
```typescript
const env = CloudflareEnv(request.env) as Record<string, unknown>;
```
该断言不安全，可能隐藏类型错误。

### 建议方案

**方案 A（推荐）**: 两阶段转换
```typescript
const env = CloudflareEnv(request.env) as unknown as Record<string, unknown>;
```

**方案 B**: 定义安全的 Env 类型别名，替代 `Record<string, unknown>`

**工时**: 0.2h

---

## P007: Canvas 测试分层 E2E 补充（拖拽选择场景）

**优先级**: P2 — 质量保障

### 问题描述

Epic E-P0-4/5 sprint 中发现 `useDragSelection` 单元测试覆盖率仅 28%（jsdom 无法模拟原生 mousedown/mousemove/mouseup 拖拽事件流）。

### 建议方案

**方案 A（推荐）**: Playwright E2E 测试
- 新增 `drag-selection.e2e.test.ts`
- 覆盖场景：空白区域拖拽选框、框选多个节点、拖拽取消（Escape）

**工时**: 2h

---

## P008: 统一测试框架（后端 Jest → Vitest）

**优先级**: P2 — DX 优化

### 问题描述

后端同时使用 Jest（`jest.config.js`）和 Vitest（前端），开发者需维护两套配置。

### 建议方案

**方案 A（推荐）**: 统一迁移到 Vitest
- Hono 官方推荐 Vitest
- Vitest 兼容 Jest API，迁移成本低
- 统一 `pnpm test` 命令

**方案 B**: 保持现状（不推荐）

**工时**: 2h（迁移 + 验证）

---

## P009: flows API 路由路径规范化

**优先级**: P2 — API 设计

### 问题描述

`flows.ts` 路由以独立文件挂载在 `/api/v1/canvas/flows`，与其他 canvas 子路由（generate-contexts、snapshots 等）嵌套方式不一致。

### 建议方案

**方案 A（推荐）**: 合并到 canvas router
- 将 flows 内容合并到 `canvas/` 目录或 `canvas/index.ts`
- 统一 gateway.ts 中的路由注册方式

**工时**: 1h

---

*Dev Agent | 2026-04-12*
