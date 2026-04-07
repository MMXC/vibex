# PRD: backend-api-routes-ambiguous

**Project**: backend-api-routes-ambiguous  
**Stage**: create-prd  
**PM**: PM  
**Date**: 2026-04-07  
**Status**: Draft

---

## 1. 执行摘要

### 背景

Next.js 路由冲突 — `[id]` 和 `[projectId]` 目录共存，同一路径 `/api/projects/:id` 匹配两个处理器。导致 build 冲突或运行时不可预测行为，且存在安全漏洞（原本需要 auth 的接口可能走无 auth 版本）。

### 目标

| 目标 | 描述 |
|------|------|
| 消除路由冲突 | `npm run build` 无冲突警告 |
| 统一 auth | 所有方法（GET/PUT/DELETE）都需要 auth |
| 保留功能超集 | 合并后 `[id]` 包含所有功能 |

### 成功指标

| 指标 | 目标值 |
|------|--------|
| 构建警告 | 0 conflict warnings |
| API 测试通过率 | 100% |
| Auth 覆盖率 | 100%（GET/PUT/DELETE） |

---

## 2. Epic 拆分

### Epic 总览

| Epic | 描述 | 工时 | 优先级 | Stories |
|------|------|------|--------|---------|
| E1 | 路由合并 | 0.5h | P0 | S1.1, S1.2 |
| E2 | 测试迁移 | 0.5h | P0 | S2.1, S2.2 |
| E3 | 验证与清理 | 0.5h | P0 | S3.1, S3.2 |

**总工时**: 1.5h

---

### Epic 1: 路由合并

**目标**: 将 `[projectId]` 功能合并到 `[id]`，删除 `[projectId]` 目录。

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S1.1 | 合并 `[id]/route.ts` | 0.5h | 合并后文件功能完整 |
| S1.2 | 删除 `[projectId]` 目录 | 0.1h | 目录已删除 |

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.1 | `[id]` GET 增强 | 合并 auth + richer 响应 + deprecation headers | `expect(response).toHaveProperty('_count')` | 否 |
| F1.2 | `[id]` PUT 保留 | 保留原有 PUT 方法 + auth + ownership | `expect(method).toBe('PUT')` | 否 |
| F1.3 | `[id]` DELETE 保留 | 保留原有 DELETE 方法 + auth + ownership | `expect(method).toBe('DELETE')` | 否 |
| F1.4 | Name typo 修复 | `Name` → `name` | `expect(typoFixed).toBe(true)` | 否 |
| F1.5 | `[projectId]` 删除 | `rm -rf [projectId]` | `expect(dirExists).toBe(false)` | 否 |

---

### Epic 2: 测试迁移

**目标**: 将 `[projectId]` 的测试迁移到 `[id]`，合并测试文件。

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S2.1 | 测试迁移 | 0.3h | 所有测试迁移到 `[id]/route.test.ts` |
| S2.2 | 测试通过 | 0.2h | `npm test` 全部 pass |

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F2.1 | `[projectId]` 测试迁移 | `[projectId]/route.test.ts` → `[id]/route.test.ts` | `expect(testFile).toExist('[id]/route.test.ts')` | 否 |
| F2.2 | 测试覆盖 auth | GET/PUT/DELETE 都有 auth 测试 | `expect(authTests).toBe(3)` | 否 |
| F2.3 | 测试覆盖 ownership | PUT/DELETE 有 ownership 测试 | `expect(ownershipTests).toBe(2)` | 否 |

---

### Epic 3: 验证与清理

**目标**: 验证构建无冲突，确保功能正常。

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S3.1 | 构建验证 | 0.2h | `npm run build` 无冲突警告 |
| S3.2 | API 集成测试 | 0.3h | GET/PUT/DELETE 全部正常 |

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F3.1 | 构建无冲突 | `npm run build` 无 duplicate/conflicting routes | `expect(buildWarnings).toBe(0)` | 否 |
| F3.2 | soft delete 过滤 | `GET /api/projects/:id` 过滤 `deletedAt: null` | `expect(softDelete).toBeFiltered()` | 否 |
| F3.3 | deprecation headers | 响应包含 Sunset + Deprecation | `expect(headers).toContain('Sunset')` | 否 |

---

## 3. 验收标准汇总

| ID | Given | When | Then | 优先级 |
|----|-------|------|------|--------|
| AC1 | 构建项目 | `npm run build` | 0 conflict warnings | P0 |
| AC2 | 目录检查 | `ls src/app/api/projects/` | 无 `[projectId]` | P0 |
| AC3 | GET 请求 | 无 auth | 401 Unauthorized | P0 |
| AC4 | PUT 请求 | 无 auth | 401 Unauthorized | P0 |
| AC5 | PUT 请求 | 非 owner | 403 Forbidden | P0 |
| AC6 | DELETE 请求 | 无 auth | 401 Unauthorized | P0 |
| AC7 | GET 响应 | 请求成功 | 包含 `_count: {pages, messages, flows}` | P0 |
| AC8 | 测试运行 | `npm test` | 全部 pass | P0 |
| AC9 | 错误处理 | 请求失败 | `safeError` 格式响应 | P0 |

---

## 4. DoD (Definition of Done)

### 代码完成标准

- [ ] `[id]/route.ts` 合并了 `[projectId]` 的 auth + richer 响应
- [ ] `[id]/route.ts` 保留 PUT/DELETE + ownership 检查
- [ ] `Name` typo 修复为 `name`
- [ ] `[projectId]` 目录已删除
- [ ] `[projectId]/route.ts` 已删除

### 测试完成标准

- [ ] `[id]/route.test.ts` 包含所有测试
- [ ] `[projectId]/route.test.ts` 已删除
- [ ] Auth 测试覆盖 GET/PUT/DELETE
- [ ] Ownership 测试覆盖 PUT/DELETE
- [ ] `npm test` 全部 pass

### 验证完成标准

- [ ] `npm run build` 无冲突警告
- [ ] GET 响应包含 `_count` 字段
- [ ] GET 响应包含 deprecation headers
- [ ] soft delete 过滤生效

---

## 5. 技术约束

| 约束 | 说明 |
|------|------|
| API 路径 | `/api/projects/:id` 不变 |
| Auth | 所有方法都需要 auth |
| Ownership | PUT/DELETE 需要 owner |
| 错误处理 | 使用 `safeError` |

---

## 6. 风险缓解

| 风险 | 缓解措施 |
|------|----------|
| R1: 破坏 API 消费者 | API 路径不变，仅合并后端逻辑 |
| R2: PUT/DELETE 加 auth | 前端所有调用已带 auth header |

---

## 7. 实施计划

| 阶段 | 内容 | 工时 | 输出 |
|------|------|------|------|
| Phase 1 | 合并 `[id]/route.ts` | 0.5h | 合并后文件 |
| Phase 2 | 迁移测试 | 0.5h | `[id]/route.test.ts` |
| Phase 3 | 删除 + 验证 | 0.5h | build pass |
| **Total** | | **1.5h** | |

---

*PRD Version: 1.0*  
*Created by: PM Agent*  
*Last Updated: 2026-04-07*
