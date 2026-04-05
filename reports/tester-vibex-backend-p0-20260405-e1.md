# 测试报告: vibex-backend-p0-20260405 / E1-OPTIONS顺序调整

**Agent**: tester  
**时间**: 2026-04-05 04:26 CST  
**结果**: ❌ REJECTED — Dev 零产出  

---

## 📋 测试范围

根据 AGENTS.md §3.1，E1 必须覆盖：

| 必测文件 | 必测场景 | 实际状态 |
|---------|---------|---------|
| `gateway.ts` | OPTIONS 返回 204 + CORS headers + 无 401 | ❌ 未实现 |
| `gateway-cors.test.ts` | 单元测试文件 | ❌ 文件不存在 |
| `auth.ts` | JWT_SECRET 缺失返回 CONFIG_ERROR | ❌ 仍为 INTERNAL_ERROR |
| `auth.test.ts` | CONFIG_ERROR 测试用例 | ❌ 不存在 |
| `index.ts` | 全局 OPTIONS + NODE_ENV optional chaining | ❌ 两者均未修复 |

---

## 🔴 严重问题清单

### Issue #1: `protected_.options` 注册顺序错误（核心 Bug）
**文件**: `src/routes/v1/gateway.ts:116, 119`
```typescript
// 当前错误顺序
protected_.use('*', authMiddleware);          // ← 第116行：auth 先注册
protected_.options('/*', (c) => {            // ← 第119行：OPTIONS 后注册
  return c.text('', 204);                    // ← 无 CORS headers！
});
```
**问题**: OPTIONS 预检请求先被 `authMiddleware` 拦截，返回 401，preflight 失败。  
**正确顺序**: `protected_.options('/*')` 必须在 `protected_.use('*', authMiddleware)` **之前**。  
**影响**: 所有 `/v1/*` 受保护路由的 CORS preflight 均失败 → 浏览器请求被阻止

### Issue #2: `protected_.options` 缺少 CORS headers
**文件**: `src/routes/v1/gateway.ts:119-121`
```typescript
protected_.options('/*', (c) => {
  return c.text('', 204);  // ← 缺少 Access-Control-Allow-* headers
});
```
**规范要求** (AGENTS.md §2.1): 必须设置：
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type, Authorization`
- `Access-Control-Max-Age: 86400`

### Issue #3: JWT_SECRET 缺失仍返回 INTERNAL_ERROR
**文件**: `src/lib/auth.ts:106`
```typescript
return c.json(
  { success: false, error: 'Server configuration error', code: 'INTERNAL_ERROR' },  // ← 错误
  500
);
```
**规范要求**: 返回 `code: 'CONFIG_ERROR'` + 消息包含 `wrangler secret put JWT_SECRET` 提示。

### Issue #4: `gateway-cors.test.ts` 测试文件不存在
**规范要求** (AGENTS.md §3.1): 必须创建 `src/routes/v1/__tests__/gateway-cors.test.ts`  
**实际**: `src/routes/v1/__tests__/` 目录不存在，无任何测试文件

### Issue #5: `auth.test.ts` 缺少 CONFIG_ERROR 测试用例
**当前 auth.test.ts**: 仅测试 hashPassword/verifyPassword/generateToken/verifyToken  
**缺失**: JWT_SECRET 缺失场景 → CONFIG_ERROR 断言

### Issue #6: 全局 `app.options('/*')` 缺失
**文件**: `src/index.ts`  
**规范要求** (IMPLEMENTATION_PLAN.md §2.1): 在 `app.use('*', cors(...))` 之后添加全局 `app.options('/*')`  
**实际**: 无 `app.options('/*')` handler

### Issue #7: NODE_ENV 未使用 optional chaining
**文件**: `src/index.ts:149`
```typescript
if (process.env.NODE_ENV !== 'production') {  // ← 无 optional chaining
```
**规范要求**: 使用 `process.env?.NODE_ENV` + `isWorkers` 检测

---

## 🧪 验收命令（供 Dev 自检）

```bash
# 本地验证 OPTIONS（修复后应返回 204 + CORS headers，无 401）
curl -X OPTIONS http://localhost:8787/v1/projects \
  -H 'Origin: https://example.com' \
  -H 'Access-Control-Request-Method: POST' \
  -H 'Access-Control-Request-Headers: Authorization' -v

# 预期结果：
# HTTP/1.1 204 No Content
# Access-Control-Allow-Origin: *
# Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
# Access-Control-Allow-Headers: Content-Type, Authorization
# （无 WWW-Authenticate 或 401 响应）
```

---

## 📊 驳回标准检查

| 驳回条件 | 状态 |
|---------|------|
| dev 无 commit | ✅ **是** — 零提交 |
| 测试失败 | ✅ — 无测试文件 |
| 缺少关键测试用例 | ✅ — gateway-cors.test.ts + CONFIG_ERROR 测试均缺失 |
| 前端代码变动未用 /qa | N/A（纯后端修复） |

---

## ✅ 修复清单（Dev 必须完成）

1. [ ] `gateway.ts`: 将 `protected_.options('/*')` 移到 `protected_.use('*', authMiddleware)` **之前**，并添加完整 CORS headers
2. [ ] `gateway.ts`: 创建 `src/routes/v1/__tests__/gateway-cors.test.ts`，覆盖 OPTIONS 204 + CORS headers + 无 401 场景
3. [ ] `auth.ts`: 将 `code: 'INTERNAL_ERROR'` 改为 `code: 'CONFIG_ERROR'`，消息加 `wrangler secret put JWT_SECRET`
4. [ ] `auth.ts`: 在 `auth.test.ts` 中添加 JWT_SECRET 缺失 → CONFIG_ERROR 测试
5. [ ] `index.ts`: 添加全局 `app.options('/*')` handler，设置 CORS headers
6. [ ] `index.ts`: NODE_ENV 检测改用 `process.env?.NODE_ENV` + `isWorkers` optional chaining
7. [ ] 运行 `vitest run` 确保全部通过
8. [ ] 运行 `pnpm lint` 确保无错误
9. [ ] `curl -X OPTIONS /v1/projects` 本地验证返回 204 + CORS headers

---

**结论**: Dev 零产出，代码完全未改动。驳回并打回重做。
