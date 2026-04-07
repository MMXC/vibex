# Analysis: backend-api-routes-ambiguous — Next.js Route Conflict

**Project**: backend-api-routes-ambiguous
**Stage**: analyze-requirements
**Analyst**: analyst
**Date**: 2026-04-07
**Status**: Research Complete

---

## 1. Problem Statement

**Bug**: Next.js 路由冲突 — `[id]` 和 `[projectId]` 目录共存，同一路径匹配两个处理器。

```
/api/projects/[id]/route.ts      ← GET/PUT/DELETE，无 auth，基础响应
/api/projects/[projectId]/route.ts ← GET，有 auth，richer 响应 + deprecation headers
```

**Next.js 行为**: 两个目录都匹配 `/api/projects/xxx`，导致 build 时冲突或运行时不可预测的行为。

---

## 2. Research Findings

### 2.1 Git History

| 文件 | 最近提交 | 说明 |
|------|----------|------|
| `[id]/route.ts` | `b85f3ac7` (2026-04-05) | console.* 清理，早于 `[projectId]` |
| `[projectId]/route.ts` | `391ac6eb` (2026-04-05) | E-P0-4 P0-13 keyword detector + search API |

**根因**: `[projectId]` 是后加的，没有检查是否与已有 `[id]` 冲突。

### 2.2 功能差异分析

| 特性 | `[id]` | `[projectId]` |
|------|--------|---------------|
| HTTP 方法 | GET/PUT/DELETE | GET |
| Auth | ❌ 无 | ✅ `getAuthUserFromRequest` |
| 响应字段 | `{project, pages}` | `{project, user, _count: {pages, messages, flows}}` |
| Deprecation headers | ❌ 无 | ✅ Sunset/Deprecation |
| Soft delete 过滤 | ❌ 无 (`findUnique`) | ✅ `deletedAt: null` |
| 访问控制 | ❌ 无 | ✅ userId OR isPublic |
| 错误处理 | `safeError` | 无 |

### 2.3 前端使用情况

- `mocks/handlers.ts` — 使用 `/api/projects/:id`（mock 层面，不影响后端路由冲突）

### 2.4 依赖项目

- `[projectId]/route.ts` 被 E-P0-4 (keyword detector + project search) 依赖

---

## 3. 根因分析

```
[projectId]/route.ts 是 later 添加的（391ac6eb）
添加时未检查 [id]/route.ts 是否存在
→ Next.js 运行时选择其中一个（不确定哪个）
→ [id] 的无 auth CRUD 和 [projectId] 的有 auth GET 同时存在
→ 安全漏洞：原本需要 auth 的接口实际上可能走无 auth 版本
```

---

## 4. 方案对比

### 方案 A: 合并到 `[id]`（推荐）

**思路**: 将 `[projectId]` 的功能合并到 `[id]`，删除 `[projectId]` 目录。

```
[projectId] GET → [id] GET（增强）
[projectId] 其他方法 → 不存在（[id] 已有）
```

**合并后的 `[id]/route.ts`**:
- 保留 auth（来自 `[projectId]`）
- 保留 richer 响应 + `_count`
- 保留 deprecation headers
- 保留 soft delete 过滤
- 保留 PUT/DELETE（来自 `[id]`）
- 保留 `safeError` 错误处理

**优点**:
1. 单一路由，零冲突
2. 所有方法都在同一文件，维护简单
3. 保留所有功能的超集
4. 删除 `[projectId]` 后端文件即可，前端 mock 不变

**工作量**: ~0.5h

### 方案 B: 删除 `[id]`

**思路**: 保留 `[projectId]`，删除 `[id]`。

- 损失 PUT/DELETE 方法
- 需要前端重构为使用其他端点

**工作量**: ~1h + 前端改动

### 方案 C: 重命名路由

**思路**: 将 `[id]` 改为 `[id]/items`，或使用 API versioning。

- 破坏 API 兼容性
- 前端和外部消费者都需要更新

**工作量**: ~2h + 全量测试

---

## 5. 推荐方案

**推荐**: 方案 A — 合并到 `[id]`

**理由**:
1. 最少代码变更（0.5h vs 1h vs 2h）
2. 功能超集（auth + soft delete + richer response）
3. API 兼容性保持（仍然是 `/api/projects/:id`）
4. 无需前端改动

---

## 6. 实现步骤

### 步骤 1: 合并 GET 处理器

将 `[projectId]/route.ts` 的 GET 逻辑合并到 `[id]/route.ts`：

```typescript
// GET /api/projects/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const env = getLocalEnv();
  const auth = getAuthUserFromRequest(request, env.JWT_SECRET);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const project = await prisma.project.findFirst({
    where: {
      id,
      deletedAt: null,
      OR: [{ userId: auth.userId }, { isPublic: true }],
    },
    include: {
      user: { select: { id: true, email: true } },
      _count: { select: { pages: true, messages: true, flows: true } },
    },
  });

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  return NextResponse.json({ project }, { status: 200, headers: DEPRECATION_HEADERS });
}
```

### 步骤 2: 合并 PUT 处理器（添加 auth）

```typescript
// PUT /api/projects/[id]
export async function PUT(...) {
  // 添加 auth 检查
  const env = getLocalEnv();
  const auth = getAuthUserFromRequest(request, env.JWT_SECRET);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  // 添加 soft delete 过滤 + ownership check
  const project = await prisma.project.findFirst({
    where: { id, deletedAt: null, userId: auth.userId },
  });
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  
  // ... update logic
}
```

### 步骤 3: 合并 DELETE 处理器（添加 auth）

同上，添加 auth + ownership 检查。

### 步骤 4: 删除 `[projectId]` 目录

```bash
rm -rf src/app/api/projects/[projectId]
```

### 步骤 5: 验证

- `npm run build` 无冲突警告
- `npm test` 全部通过
- API 测试覆盖 GET/PUT/DELETE

---

## 7. 验收标准

- [ ] **AC1**: `npm run build` 无 "duplicate route" 或 "conflicting routes" 警告
- [ ] **AC2**: `[projectId]` 目录已删除，`ls src/app/api/projects/` 中无 `[projectId]`
- [ ] **AC3**: `GET /api/projects/:id` 需要 auth（401 无 auth）
- [ ] **AC4**: `PUT /api/projects/:id` 需要 auth + ownership（401 无 auth，403 非 owner）
- [ ] **AC5**: `DELETE /api/projects/:id` 需要 auth + ownership
- [ ] **AC6**: 响应包含 `_count: {pages, messages, flows}` 字段
- [ ] **AC7**: `[id]/route.test.ts` 和 `[projectId]/route.test.ts` 中的测试迁移到 `[id]/route.test.ts`
- [ ] **AC8**: `npm test` in vibex-backend → Test Suites: 全部通过

---

## 8. 风险评估

| # | 风险 | 影响 | 缓解 |
|---|------|------|------|
| R1 | 合并后测试覆盖不完整 | 中 | 迁移所有 `[projectId]` 测试到 `[id]` |
| R2 | 破坏已有 API 消费者 | 低 | API 路径不变（仍是 `/api/projects/:id`） |
| R3 | PUT/DELETE 原来无 auth，突然加 auth 可能破坏现有调用方 | 中 | 前端所有 PUT/DELETE 已带 auth header；先通知再合并 |

---

## 9. 附注

**发现**: `[id]/route.ts` 的 PUT 使用 `Name`（大写）而非 `name`（小写），疑似 typo：
```typescript
// [id]/route.ts line 54
...(Name && { name: Name }),  // Name 引用错误，应为 name
```
合并时需修复此 typo。

---

*Research 完成。分析完成。*
