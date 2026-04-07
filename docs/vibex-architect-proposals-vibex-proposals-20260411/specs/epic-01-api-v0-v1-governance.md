# Spec: Epic 1 — API v0/v1 双路由治理

**Epic ID**: E1
**提案**: A-P0-1
**优先级**: P0
**工时**: 4h
**负责人**: Backend Dev

---

## 1. Overview

消除 `/api/` 和 `/api/v1/` 两套并行路由，通过渐进式废弃策略，在不影响现有用户的前提下，合并到统一的 v1 路由体系。

## 2. Scope

### In Scope
- 所有现有 v0 业务端点（agents, canvas/generate, chat, flows, messages, pages, projects 等）
- Contract test runner 配置
- CI/CD pipeline 中的 API 测试目标

### Out of Scope
- 路由 handler 逻辑重构（仅处理路由/版本层面）
- Breaking change 迁移指南（作为独立文档处理）

## 3. Technical Approach

采用**方案一：渐进式废弃**。

### Phase 1: 标记 v0 为 deprecated
在所有 v0 route handler 响应中添加：
```
Deprecation: true
Sunset: Sat, 01 Nov 2025 00:00:00 GMT
Link: <https://api.vibex.top/v1>; rel="successor-version"
```

### Phase 2: 新功能仅在 v1 实现
所有新 endpoint 只能在 `/api/v1/` 下创建，禁止在 v0 目录添加新文件。

### Phase 3: 使用率监控
在 CI 中添加 v0 流量报告（通过 middleware 统计），使用率 <5% 后触发归档 PR。

## 4. File Changes

```
Modified:
  vibex-backend/src/app/api/agents/route.ts       (v0 路由添加 header)
  vibex-backend/src/app/api/canvas/generate/route.ts
  vibex-backend/src/app/api/chat/route.ts
  vibex-backend/src/app/api/flows/route.ts
  vibex-backend/src/app/api/messages/route.ts
  vibex-backend/src/app/api/pages/route.ts
  vibex-backend/src/app/api/projects/route.ts
  vibex-backend/src/lib/contract/runner.ts        (仅测试 v1)

Deleted (Phase 3):
  vibex-backend/src/app/api/agents/_deprecated/  (v0 完整目录)
  ... 同上所有 v0 路由
```

## 5. Stories

| Story ID | 描述 | 工时 | 验收条件 |
|----------|------|------|---------|
| E1-S1 | 添加 v0 Deprecation header | 2h | 所有 v0 响应包含 Deprecation+Sunset header |
| E1-S2 | v1 路由覆盖完整性验证 | 1h | v1 端点集合 = v0 端点集合 |
| E1-S3 | Contract test 仅在 v1 运行 | 1h | contract test runner 移除 v0 目标 |

## 6. Acceptance Criteria

```typescript
// E1-S1
for (const route of v0Routes) {
  const res = await fetch(route.url)
  expect(res.headers.get('Deprecation')).toBeTruthy()
  expect(res.headers.get('Sunset')).toBeTruthy()
}

// E1-S2
const v0Keys = extractRouteKeys('src/app/api/')
const v1Keys = extractRouteKeys('src/app/api/v1/')
expect(v1Keys).toIncludeAllValues(v0Keys)

// E1-S3
const config = loadContractConfig()
expect(config.targets).not.toContain('v0')
```

## 7. Test Cases

| ID | 输入 | 预期输出 |
|----|------|---------|
| TC01 | GET /api/agents | 200 + Deprecation header |
| TC02 | GET /api/v1/agents | 200（无 Deprecation） |
| TC03 | v0 使用率 = 3% | Phase 3 触发归档脚本 |
| TC04 | Contract test 运行 | 仅执行 v1 测试 |

## 8. Edge Cases

- **第三方集成方仍使用 v0**：Sunset date 前不删除，但通过 header 告知迁移截止
- **v0/v1 返回不一致**：以 v1 为准，v0 同步对齐（不影响本 Epic 范围，记录为 Tech Debt）
- **CI v0 测试失败**：降级为 warning，不阻塞 CI（作为迁移期容忍）

## 9. Definition of Done

- [ ] 所有 v0 路由响应包含 Deprecation header
- [ ] v1 端点覆盖所有 v0 业务端点
- [ ] Contract test runner 配置更新完成
- [ ] 代码通过 lint + type-check
- [ ] Code review 通过（≥1 reviewer）
