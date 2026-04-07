# Epic 5: Polish

**Project**: vibex-dev-security-20260410
**Epic ID**: E5
**Stories**: ST-09, ST-10
**Priority**: P3
**Estimated Effort**: 0.5h

---

## 1. Overview

完成两个 P3 清尾任务：
1. **ST-09**: 清理 `login/route.ts` 中的重复代码（同一文件路径被拼接两次）
2. **ST-10**: 在 `AGENTS.md` 补充 Cloudflare Workers 开发规范

---

## 2. Story ST-09: Remove Duplicate Code in login/route.ts

### 2.1 Problem

`app/api/auth/login/route.ts` 文件中同一路径被拼接两次：

```typescript
// 当前代码（有 bug）
const path1 = normalizePath(inputPath);
const path2 = normalizePath(inputPath);
const content = readFile(path1) + readFile(path2); // path1 === path2，重复读取
```

这导致文件被读取两次，逻辑冗余，可能掩盖实际的路径处理问题。

### 2.2 Solution

```typescript
// app/api/auth/login/route.ts — 修复后
const normalizedPath = normalizePath(inputPath);
const content = readFile(normalizedPath);
```

### 2.3 Files

| File | Change |
|------|--------|
| `vibex-backend/src/app/api/auth/login/route.ts` | 去除重复路径拼接 |

### 2.4 Acceptance Tests

```typescript
// 验证文件长度合理
const content = fs.readFileSync('app/api/auth/login/route.ts', 'utf8');
const lines = content.split('\n');
expect(lines.length).toBeLessThan(200);

// 验证无重复拼接
expect(content).not.toMatch(/(path1|path2).*\1/);
expect(content).not.toMatch(/readFile\(.*\).*readFile\(\)/);
```

### 2.5 Rollback

```bash
git checkout HEAD~1 -- src/app/api/auth/login/route.ts
```

---

## 3. Story ST-10: Add Workers Development Guide to AGENTS.md

### 3.1 Problem

`vibex-backend/AGENTS.md` 缺少 Cloudflare Workers 特定开发规范：
- D1 vs Prisma 区分
- `isWorkers` 守卫模式
- 缓存策略（禁止内存 Map）
- Auth 认证规范

### 3.2 Solution

在 `vibex-backend/AGENTS.md` 末尾追加：

```markdown
## Cloudflare Workers 开发规范

### DB 访问
- 始终使用 `getDBClient()` 而非直接实例化 `PrismaClient()`
- Workers 环境使用 D1 binding (`env.D1_DB`)，本地使用 Prisma SQLite
- `getDBClient(env, isWorkers)` 第二个参数由构建时环境检测决定

### 缓存策略
- 禁止使用内存 `Map()` 做持久化缓存，使用 `env.CACHE_KV` (D1 KV)
- 冷启动后内存清空，缓存需重新预热
- 缓存 key 格式：`{scope}:{id}:{hash}`，设置 TTL

### Auth 认证
- 所有 `/api/v1/*` 路由必须使用 `withAuth()` 包装
- 公开路由仅：`/api/v1/auth/login`、`/api/v1/auth/register`、`/api/v1/health`
- JWT secret 从 `env.JWT_SECRET` 读取，绝不硬编码

### 输入校验
- 所有用户输入必须经过 Zod schema 验证
- 拒绝非法输入并返回 400 + 具体错误信息
- 验证在 auth 之后、业务逻辑之前执行

### 日志规范
- 禁止 `console.log` 生产敏感信息（entityId、token、usage）
- 使用 `logger.error(ctx, { sanitized: 'meta' })` 记录错误
- 生产构建自动移除 console.* 调用

### 流式响应
- 使用 `ReadableStream` + `TextEncoder` 构造 SSE 流
- 在 `ReadableStream` 构造前提前绑定 `this` 引用
- 始终在 catch 块中调用 `controller.error(e)` 而非静默忽略
```

### 3.3 Files

| File | Change |
|------|--------|
| `vibex-backend/AGENTS.md` | 追加 Workers 开发规范章节 |

### 3.4 Acceptance Tests

```typescript
const content = fs.readFileSync('vibex-backend/AGENTS.md', 'utf8');
expect(content).toMatch(/getDBClient/);
expect(content).toMatch(/CACHE_KV/);
expect(content).toMatch(/withAuth/);
expect(content).toMatch(/isWorkers/);
```

### 3.5 Rollback

```bash
git checkout HEAD~1 -- vibex-backend/AGENTS.md
```
