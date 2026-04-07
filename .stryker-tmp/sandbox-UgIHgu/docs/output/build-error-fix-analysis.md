# TypeScript Build Error Analysis Report

## Problem Statement

**核心问题**: `generateToken` 函数调用参数缺失

**错误详情**:
```
./src/app/api/auth/login/route.ts:38:19
Type error: Expected 2 arguments, but got 1.
generateToken({ userId, email }) // 缺少 jwtSecret 参数
```

## Root Cause Analysis

### 1. 函数签名变化

**旧签名** (vibex-backend-build-fix 修改后):
```typescript
export function generateToken(payload: JWTPayload, jwtSecret: string): string
```

**调用方式** (route.ts):
```typescript
const token = generateToken({
  userId: user.id,
  email: user.email,
}); // ❌ 缺少 jwtSecret 参数
```

### 2. 影响范围

| 文件 | 行号 | 问题 |
|------|------|------|
| src/app/api/auth/login/route.ts | 38 | 缺少 jwtSecret 参数 |
| src/app/api/auth/register/route.ts | 49 | 缺少 jwtSecret 参数 |
| src/routes/auth/login.ts | 54 | 缺少 jwtSecret 参数 |
| src/routes/auth/register.ts | 49 | 缺少 jwtSecret 参数 |
| src/lib/auth.test.ts | 44, 55, 72 | 测试缺少 jwtSecret 参数 |

### 3. 根因

在 `vibex-backend-build-fix` 项目中，为了解决 JWT_SECRET 类型安全问题，修改了 `generateToken` 函数签名，要求显式传入 `jwtSecret` 参数。但调用方未同步更新。

## Proposed Solution

### 方案 A: 从环境变量获取 JWT_SECRET（推荐）

**修改 route.ts**:
```typescript
import { getEnv } from '@/lib/env';

export async function POST(request: NextRequest) {
  const env = getEnv();
  const jwtSecret = env.JWT_SECRET;
  
  if (!jwtSecret) {
    return NextResponse.json(
      { success: false, error: 'Server configuration error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
  
  const token = generateToken({
    userId: user.id,
    email: user.email,
  }, jwtSecret);
  // ...
}
```

**优点**:
- ✅ 类型安全
- ✅ 从环境变量获取
- ✅ 符合 Cloudflare Workers 架构

### 方案 B: 统一使用 getAuthUserFromHono 模式

对于 Hono 路由，使用已封装的 `getAuthUserFromHono` 函数，它会自动从 `c.env.JWT_SECRET` 获取密钥。

## Success Metrics

1. ✅ TypeScript 编译通过
2. ✅ 不恢复硬编码密码
3. ✅ 从环境变量获取 JWT_SECRET
4. ✅ 所有测试通过

## Action Items

| 序号 | 任务 | 文件 | 优先级 |
|------|------|------|--------|
| 1 | 修复 login/route.ts | src/app/api/auth/login/route.ts | P0 |
| 2 | 修复 register/route.ts | src/app/api/auth/register/route.ts | P0 |
| 3 | 修复 routes/auth/login.ts | src/routes/auth/login.ts | P0 |
| 4 | 修复 routes/auth/register.ts | src/routes/auth/register.ts | P0 |
| 5 | 修复测试文件 | src/lib/auth.test.ts | P1 |

---

**分析时间**: 2026-02-28 18:29
**分析师**: analyst agent