# E1: 后端 TypeScript 债务清理 — 实施文档

## 背景

E1 针对 IMPLEMENTATION_PLAN.md 中定义的 3 个 Unit 进行 TS 债务清理。

## E1-U1: auth 签名不匹配

### 问题
- `getAuthUserFromRequest(request, jwtSecret)` 当前签名需要 2 参数，但调用方只传 1 参数
- 当前返回 `AuthUser | null`，但调用方期望 `{ success, user }` 结构

### 方案
修改 `src/lib/authFromGateway.ts` — 函数重载，单参数版本返回新结构：
- `getAuthUserFromRequest(request)` → `{ success: boolean; user?: AuthUser }`
- `getAuthUserFromRequest(request, jwtSecret)` → `AuthUser | null`（兼容旧路径）

### 变更文件
1. `src/lib/authFromGateway.ts` — 重载签名
2. `src/app/api/agents/route.ts` — 更新 2 处调用
3. `src/app/api/ai-ui-generation/route.ts` — 更新 2 处调用
4. `src/app/api/pages/route.ts` — 更新 2 处调用
5. `src/app/api/prototype-snapshots/route.ts` — 更新 2 处调用
6. `src/app/api/v1/templates/route.ts` — 更新 1 处调用

### 验证
```bash
pnpm exec tsc --noEmit 2>&1 | grep -E "(authFromGateway|agents/route|ai-ui-generation/route|pages/route|prototype-snapshots/route|v1/templates/route)" | wc -l
```
目标：相关错误归零。

## E1-U2: lib/db.ts Function 类型约束

### 问题
`ReturnType<typeof import('@prisma/client')['PrismaClient']['prototype']['constructor']>` 被 TS 解析为 `Function`，不满足 `(...args: any) => any` 约束。

### 方案
定义 `PrismaClientType` 类型别名替代 `ReturnType<...>`：
```typescript
type PrismaClientType = {
  $queryRawUnsafe: (sql: string, ...params: unknown[]) => Promise<unknown>;
  $executeRawUnsafe: (sql: string, ...params: unknown[]) => Promise<number>;
  $transaction: any;
  $disconnect: () => Promise<unknown>;
};
```
替换 `as ReturnType<...>` 为 `as PrismaClientType`。

### 变更文件
- `src/lib/db.ts` — 添加类型别名，替换 3 处 cast

### 验证
```bash
pnpm exec tsc --noEmit 2>&1 | grep "db\.ts" | wc -l
```
目标：`db.ts` 相关错误归零。

## E1-U3: CloudflareEnv 类型

### 问题
`env as unknown as Record<string, unknown>` — 缺少 index signature。

### 方案
双重 cast：`env as unknown as Record<string, unknown>`

### 变更文件
- `src/index.ts` (第96行附近)

### 验证
```bash
pnpm exec tsc --noEmit 2>&1 | grep "index.ts" | grep CloudflareEnv
```
目标：相关错误归零。
