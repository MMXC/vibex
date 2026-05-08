# VibeX Sprint 29 QA — 开发约束文档（AGENTS.md）

**Agent**: architect
**日期**: 2026-05-08
**项目**: vibex-proposals-sprint29-qa
**状态**: Adopted

---

## 执行决策

- **决策**: 已采纳
- **执行项目**: vibex-proposals-sprint29-qa
- **执行日期**: 2026-05-08

---

## 1. gstack 技能使用规范

### 1.1 技能选择矩阵

| 验证场景 | 推荐技能 | 场景说明 |
|---------|---------|---------|
| 页面可访问性 + 元素断言 | `/qa` | E02 ShareBadge、E04 RBAC、E05 Offline、E06 Analytics |
| UI 渲染截图验证 | `/browse` | ShareBadge、OfflineBanner、TrendChart 截图 |
| 性能基准验证 | `/canary` | E05 ServiceWorker 加载、E06 Analytics Dashboard |
| API 响应验证（独立）| 直接 curl / supertest | E04 role API、E06 funnel API |
| E2E 测试执行 | npx playwright test | 6个 spec 文件（含5个待创建）|

### 1.2 gstack /qa 断言规范

**断言格式**:
```javascript
// 正确：使用 data-testid 或 role，稳定性高
await expect(page.locator('[data-testid="share-badge"]')).toBeVisible();
await expect(page.getByRole('button', { name: /编辑/i })).toBeDisabled();

// 错误：使用模糊文本，flaky
await expect(page.getByText('分享')).toBeClickable();
```

**稳定性规则**:
- 必须使用 `data-testid` 或 `getByRole` / `getByLabel`
- 禁止使用 XPath（`xpath=` 前缀）
- 禁止使用模糊文本匹配
- 滚动到可见后再断言：`page.locator(...).scrollIntoViewIfNeeded()`

### 1.3 离线测试规范（E05）

| 测试场景 | 验证方法 |
|---------|---------|
| 离线 Banner 显示 | `await context.setOffline(true)` 后访问 Canvas |
| 重连隐藏 | `await context.setOffline(false)` 后等待 5s |
| ServiceWorker 注册 | 检查 `navigator.serviceWorker` 状态 |

```javascript
// E05 离线模式测试示例
test('OfflineBanner 显示在 Canvas 页面', async ({ page, context }) => {
  await context.setOffline(true);
  await page.goto('/canvas/test-project');
  await expect(page.locator('[data-testid="offline-banner"]')).toBeVisible();
  
  await context.setOffline(false);
  await page.waitForTimeout(5500);
  await expect(page.locator('[data-testid="offline-banner"]')).not.toBeVisible();
});
```

### 1.4 Analytics 性能基准（E06）

| 指标 | 阈值 | 说明 |
|------|------|------|
| TrendChart SVG 渲染 | < 100ms | DevTools Performance |
| 数据切换（7d/30d/90d）| < 500ms | gstack /qa 实测 |
| CSV 导出触发 | < 1s | 点击导出按钮 |

---

## 2. 验证执行约束

### 2.1 执行顺序（Layered Validation）

```
Layer 1（编译层，最先）：
  1. tsc --noEmit
  2. vitest run
  → 全部通过 → Layer 2

Layer 2（静态层）：
  1. E07 Specs 补全（test -f）
  2. E03 search.spec.ts（86行，已有）
  3. 代码文件存在 + 内容审查（E01-E06）
  4. 5个 E2E 文件创建 + 行数验证
  → 全部通过 → Layer 3

Layer 3（交互层，最后）：
  1. E02 ShareBadge（Dashboard，最先）
  2. E01 Onboarding→Canvas
  3. E04 RBAC Dashboard
  4. E05 OfflineBanner + ServiceWorker
  5. E06 Analytics Dashboard + TrendChart
```

### 2.2 问题分级规范

| 级别 | 定义 | 处理方式 |
|------|------|---------|
| P0 | 编译失败 / 运行时崩溃 / 功能完全不可用 | 立即记录，architect 驳回 Sprint 验收 |
| P1 | 功能部分可用，但有明确缺陷 | 记录到 QA report，等待修复 |
| P2 | 非功能性缺陷（样式/文案偏差）| 记录到 QA report，延后修复 |
| Tech Debt | E03 后端搜索未接入 | 已记录 IMPLEMENTATION_PLAN.md，不阻塞 |

### 2.3 重试策略

| 场景 | 重试次数 | 等待时间 |
|------|---------|---------|
| gstack /qa 断言 flaky | 3 次 | 1s between |
| API test 超时 | 2 次 | 3s between |
| E2E test timeout | 2 次 | playwright retries config |
| 离线模式测试 | 1 次 | 5s wait |

---

## 3. 代码审查规范

### 3.1 审查检查项

| Epic | 必须检查的代码点 |
|------|-----------------|
| E01 | `hooks/useCanvasPrefill.ts`（PENDING_TEMPLATE_REQ_KEY）、`PreviewStep.tsx`（AI降级格式）、`CanvasPageSkeleton.tsx` |
| E02 | `lib/notification/NotificationService.ts`（Slack DM + in-app fallback）、`components/dashboard/ShareBadge.tsx` |
| E03 | `SearchFilter.tsx`（`<mark>` 高亮）、`search.spec.ts`（86行）|
| E04 | `lib/rbac/types.ts`（ProjectPermission + TeamRole）、`lib/rbac/RBACService.ts`（canPerform）、`PUT /api/projects/:id/role` |
| E05 | `public/sw.js`（cacheFirst/networkFirst/offline）、`manifest.json`（standalone）、`OfflineBanner.tsx` |
| E06 | `components/analytics/TrendChart.tsx`（纯 SVG，无 Recharts）、`/api/analytics/funnel`（30天数据）|
| E07 | `E03-E07-detailed.md` + 3个独立 spec |

### 3.2 TS 编译门控

| 命令 | 阈值 | CI 门控 |
|------|------|---------|
| `tsc --noEmit` | 0 errors | ✅ 必须 exit 0 |
| `vitest run` | 全部通过 | ✅ |
| `eslint src/ --max-warnings 0` | 0 warnings | 建议 exit 0 |

---

## 4. E2E 测试文件创建规范

### 4.1 5个待创建文件

| Epic | 文件路径 | 最小行数 | 核心场景 |
|------|---------|---------|---------|
| E01 | `tests/e2e/onboarding-canvas.spec.ts` | 80行 | Onboarding完成→Canvas数据完整 |
| E02 | `tests/e2e/share-notify.spec.ts` | 80行 | 分享触发→通知Badge+N |
| E04 | `tests/e2e/rbac-permissions.spec.ts` | 80行 | viewer/member/admin 权限差异 |
| E05 | `tests/e2e/offline-canvas.spec.ts` | 80行 | 离线Banner显示+重连 |
| E06 | `tests/e2e/analytics-trend.spec.ts` | 80行 | 7d/30d/90d切换+CSV导出 |

### 4.2 测试文件模板

```typescript
// tests/e2e/<epic>.spec.ts
import { test, expect } from '@playwright/test';

/**
 * Epic <ID>: <名称> E2E 测试
 * QA 规范: ≥80 行，覆盖核心场景
 */

test.describe('Epic <ID>: <名称>', () => {
  test.beforeEach(async ({ page }) => {
    // 登录或准备测试数据
  });

  test('核心场景描述', async ({ page }) => {
    // Arrange
    await page.goto('/页面路径');
    
    // Act
    await page.click('button');
    
    // Assert
    await expect(page.locator('[data-testid="目标元素"]')).toBeVisible();
  });
});
```

### 4.3 Playwright 配置

```typescript
// playwright.config.ts（QA 阶段使用）
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [['html'], ['list']],
});
```

---

## 5. 输出规范

### 5.1 QA 报告格式

```markdown
## E01: Onboarding→Canvas 无断点 — QA 结果

| 检查项 | 结果 | 证据 |
|--------|------|------|
| useCanvasPrefill localStorage | ✅ PASS | PENDING_TEMPLATE_REQ_KEY 存在 |
| AI 降级格式 | ✅ PASS | { raw, parsed: null } |
| TS 编译 0 errors | ✅ PASS | tsc --noEmit exit 0 |
| E2E onboarding-canvas.spec.ts | ⚠️ 待创建 | — |

**问题记录**:
- E2E 文件待创建（不阻塞功能验收）

## 最终验收结论

✅ Sprint 29 通过 QA 验收
P0: E01 全部通过
P1: E02/E03/E04 全部通过
P2: E05/E06/E07 全部通过
非阻塞: E03 后端搜索 Tech Debt（已记录）
```

---

## 6. Epic-Specific 约束

### 6.1 E01 — Onboarding → Canvas 无断点

| 约束项 | 值 | 说明 |
|--------|----|------|
| localStorage 键 | `PENDING_TEMPLATE_REQ_KEY` | 必须是此键名 |
| AI 降级格式 | `{ raw: string, parsed: null }` | 不抛出错误 |
| CanvasPageSkeleton | 100ms 内渲染 | 用户体验关键路径 |

### 6.2 E02 — 分享通知系统

| 约束项 | 值 | 说明 |
|--------|----|------|
| NotificationService | Slack DM + in-app fallback | 双通道保障 |
| ShareBadge data-testid | `data-testid="share-badge"` | gstack 断言用 |
| 降级约束 | Slack 失败 → 站内通知 | 不阻断分享 |

### 6.3 E04 — RBAC 权限矩阵

| 约束项 | 值 | 说明 |
|--------|----|------|
| ProjectPermission | 枚举完整 | viewer/member/admin/owner |
| TeamRole | 枚举完整 | member/lead/admin |
| Dashboard disabled | viewer/member 按权限 | 不可点击/编辑 |

### 6.4 E05 — Canvas 离线模式

| 约束项 | 值 | 说明 |
|--------|----|------|
| ServiceWorker | cacheFirst + networkFirst + offline fallback | 三策略 |
| PWA manifest | standalone display_mode | 可独立安装 |
| OfflineBanner data-testid | `data-testid="offline-banner"` | gstack 断言用 |
| 重连超时 | 5s 后自动隐藏 | 不阻塞用户 |

### 6.5 E06 — Analytics 趋势分析

| 约束项 | 值 | 说明 |
|--------|----|------|
| TrendChart | 纯 SVG（无 Recharts/Chart.js）| 性能优化 |
| 时间范围切换 | 7d / 30d / 90d | 数据重新获取 |
| CSV 导出 | date + conversionRate + trend 列 | 必须含趋势 |

---

## 7. 已知 Tech Debt

| ID | 描述 | 影响 | 缓解 |
|----|------|------|------|
| E03-R3 | 后端搜索未接入，前端仅 local filter | 低 | 已记录 IMPLEMENTATION_PLAN.md，延后 Sprint 处理 |

---

*本文件由 architect 定义 Sprint 29 QA 阶段开发约束。*