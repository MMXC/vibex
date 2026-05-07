# VibeX Sprint 29 QA — 实施计划

**Agent**: architect
**日期**: 2026-05-08
**项目**: vibex-proposals-sprint29-qa
**Sprint 周期**: 2026-05-08（1 天紧急 QA）
**团队规模**: 1-2 人

---

## 执行决策

- **决策**: 已采纳
- **执行项目**: vibex-proposals-sprint29-qa
- **执行日期**: 2026-05-08

---

## 1. Unit Index

| Epic | Units | Status | Next |
|------|-------|--------|------|
| E01: Onboarding→Canvas 无断点 | E01-Q1 ~ E01-Q4 | 4/4 ✅ | — |
| E02: 分享通知系统 | E02-Q1 ~ E02-Q3 | 3/3 ✅ | — |
| E03: 全局搜索增强 | E03-Q1 ~ E03-Q3 | 2/3 ✅ | E03-Q3（需 gstack）|
| E04: RBAC 权限矩阵 | E04-Q1 ~ E04-Q4 | 0/4 | E04-Q1 |
| E05: 离线模式 | E05-Q1 ~ E05-Q3 | 0/3 | E05-Q1 |
| E06: Analytics 趋势分析 | E06-Q1 ~ E06-Q4 | 0/4 | E06-Q1 |
| E07: Specs 补全 | E07-Q1 | 0/1 | E07-Q1 |

---

## 2. Sprint Overview

### 2.1 优先级排序

| 优先级 | 判断标准 | Epic |
|--------|---------|------|
| **P0** | 影响 Sprint 验收阻塞项 | E01（Onboarding→Canvas 断点）|
| **P1** | 功能完整性验证 | E02（通知）、E03（搜索已有文件）、E04（RBAC）|
| **P2** | 非阻塞项 | E05（离线）、E06（Analytics）、E07（文档）|

### 2.2 日历表（1 天）

| 时间段 | 任务 | Epic | 验证方法 | 预计工时 |
|--------|------|------|---------|---------|
| 02:00-02:30 | Layer 1: tsc --noEmit + vitest | 全Epic | exec | 0.5h |
| 02:30-03:00 | E07 Specs 补全 + E03 search.spec.ts (86行) | E07+E03 | exec test -f | 0.5h |
| 03:00-03:30 | E01 代码审查：useCanvasPrefill + CanvasPageSkeleton | E01 | 代码审查 | 0.5h |
| 03:30-04:00 | E02 代码审查：NotificationService + ShareBadge | E02 | 代码审查 | 0.5h |
| 04:00-04:30 | E04 代码审查：RBACService + PUT role API | E04 | 代码审查 | 0.5h |
| 04:30-05:00 | E05 代码审查：ServiceWorker + OfflineBanner | E05 | 代码审查 | 0.5h |
| 05:00-05:30 | E06 代码审查：TrendChart + funnel API + CSV | E06 | 代码审查 | 0.5h |
| 05:30-06:00 | 5个 E2E 文件创建 + 行数验证 | E01/E02/E04/E05/E06 | exec wc -l | 0.5h |
| 06:00-06:30 | gstack /qa /browse 交互验证 | E02/E05/E06 | gstack | 0.5h |

**总工期**: ~4h（含 buffer）

---

## 3. Epic QA 详细步骤

---

## E01: Onboarding → Canvas 无断点 QA

**工期**: 0.5h | **优先级**: P0 | **依赖**: 无

### Unit Index

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| E01-Q1 | useCanvasPrefill localStorage 读取验证 | ✅ | — | PENDING_TEMPLATE_REQ_KEY 读取 + AI降级格式 |
| E01-Q2 | CanvasPageSkeleton 100ms 内显示 | ✅ | — | 组件已集成，100ms 内渲染 |
| E01-Q3 | AI 降级格式 `{ raw, parsed: null }` 存储 | ✅ | — | PreviewStep.tsx 存入正确格式 |
| E01-Q4 | E2E onboarding-canvas.spec.ts ≥80行 | ✅ | — | 文件存在且行数达标（174行） |

### E01-Q1 详细说明

**验证步骤**:
1. 代码审查 `hooks/useCanvasPrefill.ts`:
   ```bash
   grep -n "PENDING_TEMPLATE_REQ_KEY" hooks/useCanvasPrefill.ts
   # 期望: 存在
   ```
2. 代码审查 `PreviewStep.tsx`:
   ```bash
   grep -n "raw\|parsed" PreviewStep.tsx
   # 期望: 降级格式存储
   ```

---

## E02: 项目分享通知系统 QA

**工期**: 0.5h | **优先级**: P1 | **依赖**: 无

### Unit Index

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| E02-Q1 | NotificationService Slack DM + 站内降级 | ✅ | — | Slack DM → in-app fallback（try/catch 静默降级）|
| E02-Q2 | ShareBadge 未读计数 | ✅ | — | data-testid="share-badge" 已添加 |
| E02-Q3 | E2E share-notify.spec.ts ≥80行 | ✅ | — | 文件存在 191行 |

### E02-Q1 详细说明

**验证步骤**:
1. 代码审查 `lib/notification/NotificationService.ts`:
   ```bash
   grep -n "slack\|in-app\|fallback" lib/notification/NotificationService.ts
   # 期望: Slack DM 调用 + in-app fallback
   ```
2. 代码审查 `components/dashboard/ShareBadge.tsx`:
   ```bash
   grep -n "data-testid=\"share-badge\"" components/dashboard/ShareBadge.tsx
   # 期望: 存在
   ```

---

## E03: Dashboard 全局搜索增强 QA

**工期**: 0.5h | **优先级**: P1 | **依赖**: 无

### Unit Index

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| E03-Q1 | 搜索高亮 `<mark>` 标签 | ✅ | — | highlightSearchMatch() 返回 `<mark>$1</mark>` |
| E03-Q2 | E2E search.spec.ts 86行存在 | ✅ | — | 86行，已存在 |
| E03-Q3 | 无结果提示文案验证 | ✅ | — | gstack /qa: “未找到匹配的节点” + 清除按钮 |

### E03-Q1 详细说明

**验证步骤**:
1. 代码审查 `SearchFilter.tsx`:
   ```bash
   grep -n "<mark>" SearchFilter.tsx
   # 期望: 高亮匹配文本
   ```
2. E2E 文件验证：
   ```bash
   wc -l tests/e2e/search.spec.ts
   # 期望: ≥80
   ```

---

## E04: RBAC 细粒度权限矩阵 QA

**工期**: 0.5h | **优先级**: P1 | **依赖**: 无

### Unit Index

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| E04-Q1 | types.ts ProjectPermission + TeamRole | ⬜ | — | lib/rbac/types.ts 完整定义 |
| E04-Q2 | RBACService.canPerform 逻辑正确 | ⬜ | — | RBACService.ts 逻辑审查 |
| E04-Q3 | PUT /api/projects/:id/role API | ⬜ | — | route.ts 返回正确响应码 |
| E04-Q4 | E2E rbac-permissions.spec.ts ≥80行 | ⬜ | — | 文件存在且行数达标 |

### E04-Q1 详细说明

**验证步骤**:
1. 代码审查 `lib/rbac/types.ts`:
   ```bash
   grep -n "ProjectPermission\|TeamRole" lib/rbac/types.ts
   # 期望: 完整枚举/接口定义
   ```
2. 代码审查 `lib/rbac/RBACService.ts`:
   ```bash
   grep -n "canPerform" lib/rbac/RBACService.ts
   # 期望: 权限判断逻辑
   ```

---

## E05: Canvas 离线模式 QA

**工期**: 0.5h | **优先级**: P2 | **依赖**: 无

### Unit Index

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| E05-Q1 | Service Worker cacheFirst/networkFirst | ⬜ | — | public/sw.js 存在且策略正确 |
| E05-Q2 | PWA manifest standalone | ⬜ | — | manifest.json 存在 |
| E05-Q3 | OfflineBanner 5s 重连隐藏 | ⬜ | — | gstack /qa Banner 显示+隐藏 |
| E05-Q4 | E2E offline-canvas.spec.ts ≥80行 | ⬜ | — | 文件存在且行数达标 |

### E05-Q1 详细说明

**验证步骤**:
1. 代码审查 `public/sw.js`:
   ```bash
   grep -n "cacheFirst\|networkFirst\|offline" public/sw.js
   # 期望: 缓存策略存在
   ```
2. 代码审查 `manifest.json`:
   ```bash
   grep -n "display.*standalone\|display_mode" manifest.json
   # 期望: standalone
   ```
3. gstack /qa OfflineBanner:
   ```javascript
   await page.goto('/canvas/test-project');
   // 离线模式断言
   await expect(page.locator('[data-testid="offline-banner"]')).toBeVisible();
   ```

---

## E06: Analytics 趋势分析 QA

**工期**: 0.5h | **优先级**: P2 | **依赖**: 无

### Unit Index

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| E06-Q1 | TrendChart.tsx 纯 SVG（无 Recharts）| ⬜ | — | 代码审查：无 chart 库依赖 |
| E06-Q2 | GET /api/analytics/funnel 30天数据 | ⬜ | — | API curl 验证 |
| E06-Q3 | 7d/30d/90d 切换按钮 | ⬜ | — | gstack /qa 切换验证 |
| E06-Q4 | E2E analytics-trend.spec.ts ≥80行 | ⬜ | — | 文件存在且行数达标 |

### E06-Q1 详细说明

**验证步骤**:
1. 代码审查 `components/analytics/TrendChart.tsx`:
   ```bash
   grep -n "recharts\|chart.js\|chart" components/analytics/TrendChart.tsx
   # 期望: 无结果（纯 SVG）
   ```
2. API 测试：
   ```bash
   curl -s http://localhost:3000/api/analytics/funnel?range=30d | jq .
   # 期望: 30天聚合数据
   ```

---

## E07: Sprint 28 Specs 补全 QA

**工期**: 0.5h | **优先级**: P2 | **依赖**: 无

### Unit Index

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| E07-Q1 | E03-E07-detailed.md + 3个独立 spec | ⬜ | — | test -f 全部通过 |

### E07-Q1 详细说明

**验证步骤**:
1. 文件存在验证：
   ```bash
   test -f docs/vibex-proposals-sprint29/specs/E03-E07-detailed.md && echo "OK"
   test -f docs/vibex-proposals-sprint29/specs/E04-template-crud.md && echo "OK"
   test -f docs/vibex-proposals-sprint29/specs/E06-error-boundary.md && echo "OK"
   test -f docs/vibex-proposals-sprint29/specs/E07-mcp-server.md && echo "OK"
   ```

---

## 4. 关键里程碑

| 里程碑 | 时间 | 验收标准 |
|--------|------|----------|
| M1: Layer 1 编译通过 | 02:00-02:30 | tsc --noEmit 0 errors + vitest 全绿 |
| M2: E2E 文件创建 | 05:30-06:00 | 5个文件全部 ≥80 行 |
| M3: gstack 交互验证 | 06:00-06:30 | ShareBadge/OfflineBanner/Analytics 断言通过 |
| M4: 最终报告 | 06:30 | QA report + P0/P1 问题记录 |

---

## 5. 验收标准速查表

| Epic | 验证项 | 验收标准 | 验证方法 |
|------|--------|---------|----------|
| E01 | useCanvasPrefill localStorage | PENDING_TEMPLATE_REQ_KEY 读取 | 代码审查 |
| E01 | AI 降级格式 | `{ raw, parsed: null }` | 代码审查 |
| E01 | E2E | onboarding-canvas.spec.ts ≥80行 | exec wc -l |
| E02 | NotificationService | Slack DM + 站内 fallback | 代码审查 |
| E02 | ShareBadge | data-testid="share-badge" 可见 | gstack /qa |
| E02 | E2E | share-notify.spec.ts ≥80行 | exec wc -l |
| E03 | 搜索高亮 | `<mark>` 标签 | 代码审查 |
| E03 | E2E | search.spec.ts 86行存在 | exec wc -l |
| E04 | RBAC types | ProjectPermission + TeamRole | 代码审查 |
| E04 | E2E | rbac-permissions.spec.ts ≥80行 | exec wc -l |
| E05 | ServiceWorker | cacheFirst + networkFirst + offline | 代码审查 |
| E05 | OfflineBanner | 5s 重连隐藏 | gstack /qa |
| E05 | E2E | offline-canvas.spec.ts ≥80行 | exec wc -l |
| E06 | TrendChart | 纯 SVG，无 chart 库 | 代码审查 |
| E06 | E2E | analytics-dashboard.spec.ts 257行 + trend ≥80行 | exec wc -l |
| E07 | Specs | E03-E07-detailed + 3个独立 spec 存在 | test -f |

---

*本文件由 architect 定义 Sprint 29 QA 实施计划。*