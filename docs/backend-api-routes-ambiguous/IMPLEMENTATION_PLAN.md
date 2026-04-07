# Implementation Plan: backend-api-routes-ambiguous

**Project**: backend-api-routes-ambiguous
**Stage**: implementation-plan
**Date**: 2026-04-07
**Status**: Proposed

---

## Overview

| 属性 | 值 |
|------|-----|
| 总工时 | 1.5h |
| 优先级 | P0 |
| 风险等级 | 中（影响 API 兼容性） |

---

## Phase 1: 合并路由文件 (0.5h)

### 1.1 备份

```bash
cp src/app/api/projects/\[id\]/route.ts src/app/api/projects/\[id\]/route.ts.backup
cp src/app/api/projects/\[id\]/route.test.ts src/app/api/projects/\[id\]/route.test.ts.backup
```

### 1.2 合并 `[id]/route.ts`

按照 architecture.md 4.1 节的合并代码覆盖 `route.ts`：
- GET: 添加 auth + `_count` + soft delete + deprecation headers
- PUT: 添加 auth + ownership 检查
- DELETE: 添加 auth + ownership 检查 + soft delete
- 所有方法: 添加 `safeError`

### 1.3 验证构建

```bash
cd vibex-backend && pnpm build 2>&1 | grep -i "conflict\|duplicate\|error"
# 期望: 无输出
```

**验收**: `pnpm build` 无 conflict/duplicate 警告

---

## Phase 2: 迁移测试 (0.5h)

### 2.1 迁移 `[projectId]` 测试到 `[id]`

```bash
# 读取 [projectId]/route.test.ts（如有）
cat src/app/api/projects/\[projectId\]/route.test.ts 2>/dev/null
```

### 2.2 更新 `[id]/route.test.ts`

新增测试用例（基于 PRD AC 覆盖）：

```typescript
// src/app/api/projects/[id]/route.test.ts

describe('GET /api/projects/[id] — Auth + _count', () => {
  // AC3: 无 auth → 401
  it('无 auth token → 401', async () => {
    const req = new NextRequest('http://localhost/api/projects/proj1');
    const res = await GET(req, { params: Promise.resolve({ id: 'proj1' }) });
    expect(res.status).toBe(401);
  });

  // AC7: 有效 auth → 200 + _count
  it('有效 auth → 200 + _count.pages + _count.messages + _count.flows', async () => {
    mockAuth.mockReturnValue({ userId: 'user1' });
    mockPrisma.project.findFirst.mockResolvedValue({
      id: 'proj1', name: 'Test', userId: 'user1', pages: [],
      _count: { pages: 2, messages: 5, flows: 1 },
    });
    const req = makeAuthRequest('proj1');
    const res = await GET(req, { params: Promise.resolve({ id: 'proj1' }) });
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.project._count).toEqual({ pages: 2, messages: 5, flows: 1 });
  });
});

describe('PUT /api/projects/[id] — Auth + Ownership', () => {
  // AC4: 无 auth → 401
  // AC5: 非 owner → 403
  // F1.4: name 更新
});

describe('DELETE /api/projects/[id] — Auth + Ownership + Soft Delete', () => {
  // AC6: 无 auth → 401
  // 非 owner → 403
  // 有效 → soft delete (deletedAt = now)
});
```

### 2.3 运行测试

```bash
pnpm test src/app/api/projects/\[id\]/route.test.ts
```

**验收**: 所有测试 pass

---

## Phase 3: 删除 + 验证 (0.5h)

### 3.1 删除 `[projectId]` 目录

```bash
# 确认测试全部通过后再删除
rm -rf src/app/api/projects/\[projectId\]
```

### 3.2 最终验证

```bash
# 构建验证
cd vibex-backend && pnpm build

# 全量测试
pnpm test

# 验证 deprecation headers
curl -I -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/projects/test-id
# 确认: Deprecation: true, Sunset: Sat, 31 Dec 2026...
```

### 3.3 Frontend 调用方检查

```bash
# 检查 frontend 是否在用旧接口
grep -rn "/api/projects/" vibex-fronted/src/ | \
  grep -v "api/v1/" | grep -v "from-template"
```

**验收**:
- [ ] `pnpm build` → 0 conflict warnings
- [ ] `pnpm test` → all pass
- [ ] `[projectId]` 目录已删除
- [ ] GET 响应含 `_count`
- [ ] GET 响应含 Deprecation/Sunset Headers

---



## 实施状态 (dev-e1)

| Epic | 状态 | 完成项 |
|------|------|--------|
| E1: 合并路由文件 | ✅ done | [id]/route.ts 合并 + [projectId]/route.ts 添加 Deprecation header |

**Commit**: 43413e5c — feat(backend): E1 merge [projectId] into [id] route

**变更文件**:
-  — GET/PUT/DELETE 增强
-  — Deprecation header

**验收**:
- [x] GET: auth + ownership + _count + soft delete filter
- [x] PUT: auth + ownership check (403)
- [x] DELETE: auth + ownership + soft delete
- [x] [projectId] deprecated with Deprecation header
- [x] pnpm tsc --noEmit: 0 errors in modified files

## Rollback Plan

```bash
# 如果构建失败
cp src/app/api/projects/\[id\]/route.ts.backup src/app/api/projects/\[id\]/route.ts
cp src/app/api/projects/\[id\]/route.test.ts.backup src/app/api/projects/\[id\]/route.test.ts

# 如果测试失败，逐一修复，不要删除整个功能

# 如果 frontend 收到大量 401
# 立即 grep 扫描 frontend 调用方，添加 auth header
```
