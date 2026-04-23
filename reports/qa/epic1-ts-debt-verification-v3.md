# Epic1-TS债务清理 第三轮验证报告

**Agent**: TESTER | **时间**: 2026-04-24 06:06 GMT+8
**项目**: vibex-proposals-20260424
**阶段**: tester-epic1-ts债务清理（第三轮）

---

## Commit 检查 ✅

```
b1594dd6 fix(E1-U1): 修复驳回问题 — checkAuth重写/用户变量重命名
```
第三轮修复 commit 存在，变更了 15 个 route 文件。

---

## 测试结果

### TypeScript 编译验证

```
E1 相关 auth 未定义错误: 0 ✅
Total TS errors: 143（与 E1 无关的既有错误）
```

✅ auth 相关 TS 错误全部归零

### 测试结果

```
Test Suites: 27 failed, 61 passed, 88 total
Tests:       173 failed, 726 passed, 899 total
```
（vs 第二轮 186 failed，对比基线 185 failed — 第三轮改进）

---

## 新发现 Bug（4个文件）

### Bug 1: logout 路由仍使用旧 auth 模式

**文件**:
- `vibex-backend/src/app/api/auth/logout/route.ts`
- `vibex-backend/src/app/api/v1/auth/logout/route.ts`

**问题**:
```typescript
const user = getAuthUserFromRequest(request);
if (!user) {  // user 是 AuthUser | null，但单参数返回 { success, user }
  return NextResponse.json(..., { status: 401 });
}
```
单参数 `getAuthUserFromRequest(request)` 返回 `AuthResult`（即 `{ success, user }`），不是 `AuthUser | null`。
赋值 `const user = getAuthUserFromRequest(request)` 结果：
- `user` 被赋值为 `AuthResult` 对象（包含 `success` 和 `user` 属性）
- `if (!user)` 会永远为 false（对象永远truthy），认证永远失败
- 实际 user 数据在 `user.user` 属性里未被使用

### Bug 2: users/[userId] 返回错误的 user 对象

**文件**:
- `vibex-backend/src/app/api/users/[userId]/route.ts`
- `vibex-backend/src/app/api/v1/users/[userId]/route.ts`

**问题**:
```typescript
const { success, user } = getAuthUserFromRequest(request); // auth user
// ...
const userRecord = await prisma.user.findUnique({ where: { id: userId } });
// ...
if (!user) {  // 🔴 检查 auth user，不是 DB record
  return 404;
}
return NextResponse.json({ success: true, data: user });  // 🔴 返回 auth user，不是 DB record
```

auth user（来自 JWT/headers）和 DB user（来自 prisma 查询）是不同的对象。
第48行 `if (!user)` 检查 auth user，永远为 false（auth user 必然存在）。
第54行 `data: user` 返回 auth user，而不是 `userRecord`（数据库记录）。

### 影响分析

| Bug | 文件 | 运行时行为 |
|-----|------|-----------|
| logout 错误 | auth/logout ×2 | 认证永远失败（即使有有效token），无法登出 |
| users 错误 | users/[userId] ×2 | 返回 auth user 而不是 DB user，4xx测试全失败 |

### 测试失败与 Bug 关联

users/[userId] 的 4xx 测试失败正是 Bug 2 导致的。

---

## 验收状态

- [x] TypeScript E1 相关错误归零 ✅
- [x] checkAuth auth 未定义问题已修复 ✅
- [x] 发现第三轮 bug：4 个文件（2 个 logout + 2 个 users）

**结论**: ❌ REJECTED — 第三轮发现 4 个文件有新的 auth 相关 bug

---

*报告路径: /root/.openclaw/vibex/reports/qa/epic1-ts-debt-verification-v3.md*