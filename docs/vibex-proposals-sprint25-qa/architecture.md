# QA 架构验证报告 — Sprint 25

**Agent**: ARCHITECT
**日期**: 2026-05-05
**项目**: vibex-proposals-sprint25-qa
**阶段**: design-architecture

---

## 执行摘要

| Epic | 实现状态 | 发现问题数 | 阻塞级别 |
|------|---------|-----------|---------|
| E1 Onboarding | ✅ 基本符合 | 1 低 | 无 |
| E2 Cross-Canvas Diff | ✅ 基本符合 | 1 低 | 无 |
| E4 Dashboard Search | ✅ 完全符合 | 0 | 无 |
| E5 Teams × Canvas | ⚠️ 存在偏差 | 3 高 | 高 |

**总体评估**: E1/E2/E4 实现与 architecture.md 设计一致，E5 存在 3 处关键 RBAC 偏差需修复。

---

## E1: Onboarding + 模板 auto-fill

### 验证结果

#### ✅ E1.1: 模板 auto-fill 符合 architecture

| 检查项 | Architecture 定义 | 实际实现 | 状态 |
|--------|------------------|---------|------|
| 模板选择触发 | Step 5 选择后 auto-fill | `PreviewStep.tsx` 调用 `storePendingTemplateRequirement()` | ✅ |
| localStorage 存储 | 模板 requirement 内容 | `vibex:pending_template_req` key 存入 requirement chapter | ✅ |
| 追加而非替换 | 追加到现有 chapter | 仅存储 requirement，不覆盖已有内容 | ✅ |

**源码**: `PreviewStep.tsx:storePendingTemplateRequirement()` — 选模板后写入 `localStorage.setItem('vibex:pending_template_req', req)`。

#### ✅ E1.2: localStorage 同步逻辑

| 检查项 | Architecture 定义 | 实际实现 | 状态 |
|--------|------------------|---------|------|
| Zustand persist | 使用 localStorage 持久化 | ✅ `onboardingStore.ts` 使用 `createJSONStorage(() => localStorage)` | ✅ |
| 完成标记 | 写入 `onboarding_completed` | ✅ `localStorage.setItem('onboarding_completed', 'true')` | ✅ |
| 完成时间戳 | 写入 `onboarding_completed_at` | ✅ `localStorage.setItem('onboarding_completed_at', ISO8601)` | ✅ |
| 重置清理 | reset() 时清除标记 | ✅ `localStorage.removeItem()` | ✅ |

**注**: auto-fill 机制只存储 requirement chapter，architecture.md 说"auto-fill requirements"但实现只填一个 chapter。属于设计保守（不覆盖其他 chapter），可接受。后续可扩展到其他 chapter。

---

## E2: Cross-Canvas Diff

### 验证结果

#### ✅ E2.1: `compareCanvasProjects()` 返回类型一致

| 字段 | Architecture | 实际实现 (`canvasDiff.ts`) | 状态 |
|------|-------------|--------------------------|------|
| added | `DiffItem[]` | ✅ `result.added: DiffItem[]` | ✅ |
| removed | `DiffItem[]` | ✅ `result.removed: DiffItem[]` | ✅ |
| changed | `DiffItem[]` | ⚠️ 命名为 `modified` | 低 |
| unchanged | `DiffItem[]` | ✅ `result.unchanged: DiffItem[]` | ✅ |
| summary | 计数聚合 | ✅ 含 context/flow/component 三类计数 | ✅ |

**说明**: `changed` vs `modified` 是命名差异，语义相同（都是"内容有变化"）。`modified` 比 `changed` 更精确（changed 可能是位置变化，modified 暗示内容变更）。可接受。

#### ✅ E2.2: diff 算法降级策略

| 检查项 | Architecture 定义 | 实际实现 | 状态 |
|--------|------------------|---------|------|
| JSON 结构 diff | 树节点级别 diff | ✅ `compareCanvasProjects()` 按 `nodeId` 对比三棵树 | ✅ |
| 语义 diff 工时超限 | 不做语义 diff | ✅ 无语义 diff 代码 | ✅ |
| 降级至节点 diff | 节点增删改判断 | ✅ `deepEqual()` 逐字段比较（排除 nodeId） | ✅ |

**测试覆盖**: `canvasDiff.test.ts` 存在，覆盖 added/removed/modified/unchanged 四个场景 + summary 计数 + `exportDiffReport()`。

---

## E4: Dashboard Search

### 验证结果

#### ✅ E4.1: `useProjectSearch` 接口符合 hook 设计规范

| 字段 | Architecture | 实际实现 | 状态 |
|------|-------------|---------|------|
| filtered | `Project[]` | ✅ `useMemo` 计算结果 | ✅ |
| searching | `boolean` | ✅ `setSearching(query.trim().length > 0)` | ✅ |
| searchQuery | `string` | ✅ `useState` 管理 | ✅ |
| filter | `FilterOption` | ✅ `'all' \| '7d' \| '30d' \| 'mine'` | ✅ |
| sort | `SortOption` | ✅ `'updatedAt-desc' \| 'updatedAt-asc' \| 'name-asc' \| 'name-desc'` | ✅ |
| setSearch/setFilter/setSort | 函数 | ✅ 全部暴露 | ✅ |

**FilterOption 差异**: Architecture 定义 `'createdBy': 'me' | 'all'`，实际实现为 `'mine'`，语义相同，字符串不同。这是实现细节优化，不影响功能。

#### ✅ E4.2: debounce 300ms 策略

| 检查项 | Architecture 定义 | 实际实现 | 状态 |
|--------|------------------|---------|------|
| debounce 300ms | PRD S4.1 明确要求 | ✅ `useDebounce.ts:10` 默认 `delay = 300` | ✅ |
| SearchBar 内置 debounce | PRD S4.1 | ✅ `SearchBar.tsx:30` 默认 `debounceMs = 300` | ✅ |
| `useDebounce` 实现 | Hook 规范 | ✅ `setTimeout` 300ms 延迟，`clearTimeout` cleanup | ✅ |
| Dashboard 集成 | 调用 `setSearch` | ✅ `page.tsx:563` 传 `setSearch` | ✅ |

**搜索流程**: 用户输入 → `SearchBar` debounce 300ms → `setSearch(query)` → `useProjectSearch` 过滤 → `searching` loading 状态 ✅

---

## E5: Teams × Canvas

### 验证结果

#### ✅ E5.1: `canvas_team_mapping` 数据模型 — 多对多关系已建立

| 检查项 | Architecture 定义 | 实际实现 | 状态 |
|--------|------------------|---------|------|
| 多对多关系 | Canvas ↔ Team N:N | ✅ in-memory Map (`${canvasId}-${teamId}`) | ✅ |
| 字段: canvasId | string | ✅ `ShareRecord.canvasId` | ✅ |
| 字段: teamId | string | ✅ `ShareRecord.teamId` | ✅ |
| 字段: role | 'viewer' | 'editor' ✅ `ShareRecord.role` | ✅ |
| 字段: sharedBy | string | ✅ `ShareRecord.sharedBy` | ✅ |
| 字段: sharedAt | ISO 8601 | ✅ `sharedAt: string` (ISO8601) | ✅ |
| UNIQUE 约束 | (canvas_id, team_id) | ✅ `mapKey()` 拼接 key，重复时 update 而非 insert | ✅ |

**数据持久化说明**: Architecture 定义 SQL 表，实际为 in-memory Map（Cloudflare Workers 环境限制）。不影响功能正确性，但 **不符合 architecture 设计**（应使用 D1 数据库）。

#### ⚠️ E5.2: RBAC 优先级 — **存在 3 处关键偏差**

**Architecture 定义的 RBAC 规则**:
```
Project Owner  > Team Owner > Team Admin > Team Member > Viewer
canEdit:       ✓           ✓           ✓           ✗
canDelete:     ✓           ✓           ✗           ✗
canShare:      ✓           ✓           ✓           ✗
canView:       ✓           ✓           ✓           ✓
```

**实际 `useCanvasRBAC.ts` 实现**:

```typescript
// Team 角色判断（teamId 传入时）:
canDelete: teamRole === 'owner'        // ✅ 正确
canShare: teamRole === 'owner'         // ❌ 缺少 admin（应有 owner+admin）
canEdit:  teamRole === 'owner'         // ❌ 缺少 admin（应有 owner+admin）

// Project 角色判断（teamId 未传入时）:
canDelete: data.role === 'owner'      // ✅ 正确
canShare: data.role === 'owner'        // ✅ 正确
canEdit:  data.role === 'owner'        // ✅ 正确
           || data.role === 'member'   // ❌ 错误！member 不应有 canEdit
```

**RBAC 偏差详情**:

| # | 偏差位置 | 问题 | 影响 |
|---|---------|------|------|
| 1 | `useCanvasRBAC.ts:67` | Team Admin `canEdit = false` | 违反设计：Team Admin 应可编辑 |
| 2 | `useCanvasRBAC.ts:67` | Team Admin `canShare = false` | 违反设计：Team Admin 应可分享 |
| 3 | `useCanvasRBAC.ts:83` | Project Member `canEdit = true` | 严重：Member 不应可直接编辑 |
| 4 | `useCanvasRBAC.ts:82` | Project Member `canShare = true` | 严重：Member 不应可分享 |

**优先级逻辑缺失**: Architecture 定义 `Project Owner > Team Owner > Team Admin > Team Member`，但代码中 Team 角色和 Project 角色是**平行检查**（先查 Team，没有才查 Project），而非优先级合并。正确的实现应合并两个来源的权限，取最高。

#### ⚠️ E5.3: `resolveCanvasPermission` 函数不存在

Architecture §4.3 定义了 `resolveCanvasPermission(userId, canvasId, teamRole)` 函数作为权限解析核心。实际代码库中**不存在此函数**，权限逻辑分散在 `useCanvasRBAC` hook 内部。

---

## 发现问题汇总

### 高优先级（阻塞）

| ID | Epic | 问题 | 修复方案 |
|----|------|------|---------|
| H-1 | E5 | Team Admin `canEdit=false`，应为 `true` | 修改 `useCanvasRBAC.ts` 第 67 行 |
| H-2 | E5 | Team Admin `canShare=false`，应为 `true` | 修改 `useCanvasRBAC.ts` 第 67 行 |
| H-3 | E5 | Project Member `canEdit=true` | 移除 member 分支，仅保留 owner |
| H-4 | E5 | Project Member `canShare=true` | 移除 member 分支，仅保留 owner |

### 中优先级

| ID | Epic | 问题 | 修复方案 |
|----|------|------|---------|
| M-1 | E5 | `canvas_team_mapping` 使用 in-memory Map 而非 D1 数据库 | 确认 Cloudflare Workers 限制，若可行则更新 architecture |
| M-2 | E5 | `resolveCanvasPermission` 函数不存在 | 补充函数或确认 `useCanvasRBAC` 为其等价实现 |

### 低优先级

| ID | Epic | 问题 | 修复方案 |
|----|------|------|---------|
| L-1 | E1 | auto-fill 仅填充 requirement chapter，非所有 chapters | 评估是否需要扩展 |
| L-2 | E2 | `compareCanvasProjects` 返回 `modified` 而非 `changed` | 更新 architecture.md 字段名对齐实现 |

---

## 兼容性评估

| Epic | 兼容现有架构 | 接口文档 | 性能影响 |
|------|------------|---------|---------|
| E1 | ✅ 完全兼容 | ✅ 完整 | ✅ 无额外开销 |
| E2 | ✅ 完全兼容 | ✅ 完整 | ✅ O(n) 节点对比 |
| E4 | ✅ 完全兼容 | ✅ 完整 | ✅ `useMemo` 过滤，O(n) |
| E5 | ⚠️ RBAC 偏差 | ⚠️ 需修复后对齐 | ✅ 无性能影响 |

---

## 技术风险评估

| 风险 | 级别 | 描述 | 缓解 |
|------|------|------|------|
| E5 RBAC 权限过度授予 | 🔴 高 | Member 可编辑/分享本不属于他们的项目 | 立即修复 H-3/H-4 |
| E5 数据不持久化 | 🟡 中 | in-memory Map 重启丢失（Workers 环境） | 评估是否需要 D1 迁移 |
| E5 Admin 权限受限 | 🔴 高 | Team Admin 无法编辑，违反协作场景 | 立即修复 H-1/H-2 |

---

*Architect Agent | VibeX Sprint 25 QA | 2026-05-05*
