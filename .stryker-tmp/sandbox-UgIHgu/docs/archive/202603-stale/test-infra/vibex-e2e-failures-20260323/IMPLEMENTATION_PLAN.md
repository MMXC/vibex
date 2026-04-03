# Implementation Plan: vibex-e2e-failures-20260323 — E2E 测试失败修复

**项目**: vibex-e2e-failures-20260323
**Architect**: architect
**日期**: 2026-03-23
**状态**: ✅ 完成

---

## 1. Sprint 概览

| 阶段 | 内容 | 工期 | 负责人 | 产出 |
|------|------|------|--------|------|
| Phase 1 | 创建 `/confirm` 页面 | 1 天 | Dev | `src/app/confirm/page.tsx` |
| Phase 2 | 验证 `confirmationStore` 持久化 | 0.5 天 | Dev | Store 验证测试 |
| Phase 3 | 修复首页 404 | 0.5 天 | Dev | 首页正常加载 |
| Phase 4 | E2E 测试验证 | 1 天 | Tester | Playwright 通过率 ≥ 90% |
| Phase 5 | 构建验证 + CI 集成 | 0.5 天 | Dev | `npm run build` 通过 |

**预计总工期**: 3.5 天

---

## 2. Phase 详细计划

### Phase 1 — 创建 /confirm 页面 (Day 1)

**目标**: 创建缺失的 `/confirm` 页面，兼容 `output: 'export'` 约束

#### 任务

| ID | 任务 | 负责 | 验收标准 |
|----|------|------|---------|
| P1.1 | 创建 `src/app/confirm/page.tsx` 路由入口 | dev | expect(page.goto('/confirm/')).resolves.not.toThrow() |
| P1.2 | 创建 `src/components/confirm/ConfirmPage.tsx` 主组件 | dev | expect(screen.getByTestId('confirm-page')).toBeTruthy() |
| P1.3 | 创建 `src/components/confirm/SuccessView.tsx` 成功视图 | dev | expect(SuccessView).toRenderProjectId() |
| P1.4 | 创建 `src/components/confirm/OrderSummary.tsx` 订单摘要组件 | dev | expect(OrderSummary).toDisplayContexts() |
| P1.5 | 添加 `data-testid` 属性 | dev | expect(page.locator('[data-testid="order-id"]')).toBeTruthy() |
| P1.6 | hydration guard 实现 | dev | expect(loading state).toBeDefined() before hydration |
| P1.7 | 单元测试 | tester | expect(confirmationStore).toPreserveStateOnRefresh() |

**交付物**: `/confirm` 页面完整实现

---

### Phase 2 — 验证 confirmationStore 持久化 (Day 2 上午)

**目标**: 确保状态跨页面持久化

#### 任务

| ID | 任务 | 负责 | 验收标准 |
|----|------|------|---------|
| P2.1 | 审查 `confirmationStore` partialize 字段 | dev | expect(all required fields).toBeIn(partialize) |
| P2.2 | 添加 `createdProjectId` 到页面渲染逻辑 | dev | expect(confirmPage).toDisplayProjectId() |
| P2.3 | 端到端 store 持久化测试 | tester | expect(store).toHaveSameState() after page refresh |
| P2.4 | localStorage migration 路径验证 | dev | expect(migrate).toBeCalled() on version change |

**交付物**: Store 持久化验证报告

---

### Phase 3 — 修复首页 404 (Day 2 下午)

**目标**: 确保首页正常加载

#### 任务

| ID | 任务 | 负责 | 验收标准 |
|----|------|------|---------|
| P3.1 | 诊断首页 404 根因 | dev | expect(homepage).toLoadWithout404() |
| P3.2 | 修复路由/组件问题 | dev | expect(page.goto('/')).resolves.toHaveStatus(200) |
| P3.3 | 验证 `HomePage` 组件渲染 | dev | expect(page.locator('h1, [data-testid="logo"]')).toBeVisible() |
| P3.4 | 首页加载性能验证 | tester | expect(loadTime).toBeLessThan(5000) |

**交付物**: 首页正常加载

---

### Phase 4 — E2E 测试验证 (Day 3)

**目标**: 验证修复后测试套件通过

#### 任务

| ID | 任务 | 负责 | 验收标准 |
|----|------|------|---------|
| P4.1 | 运行 `activation.spec.ts` | tester | expect(passed).toBeGreaterThanOrEqual(0.9) of activation tests |
| P4.2 | 运行 `homepage.spec.ts` | tester | expect(homepage tests).toAllPass() |
| P4.3 | 运行 `confirmation-progress-persist.spec.ts` | tester | expect(store tests).toAllPass() |
| P4.4 | 运行 `integrated-preview.spec.ts` | tester | expect(integration tests).toPass() |
| P4.5 | 统计完整 E2E 套件通过率 | tester | expect(passed/total).toBeGreaterThanOrEqual(0.9) |
| P4.6 | 修复剩余失败用例 | dev | expect(failed tests).toDecrease() |

**交付物**: E2E 测试报告，通过率 ≥ 90%

---

### Phase 5 — 构建验证 + CI 集成 (Day 4)

**目标**: 确保修改不影响构建和 CI 流程

#### 任务

| ID | 任务 | 负责 | 验收标准 |
|----|------|------|---------|
| P5.1 | `npm run build` 成功 | dev | expect(build exit code).toBe(0) |
| P5.2 | 构建产物验证 | dev | expect('out/' directory).toContainStaticFiles() |
| P5.3 | CI pipeline 验证 | tester | expect(CI).toPass() |
| P5.4 | Playwright CI 配置更新 | tester | expect(playwright.config.ts).toIncludeConfirmRoute() |

**交付物**: 构建成功 + CI 通过

---

## 3. 验收检查清单

### /confirm 页面
- [ ] `src/app/confirm/page.tsx` 存在
- [ ] `GET /confirm` 返回 200（非 404）
- [ ] 页面内容包含订单确认信息
- [ ] hydration guard 防止闪烁
- [ ] `data-testid="confirm-page"` 存在
- [ ] `data-testid="order-id"` 存在（如果显示订单 ID）

### 首页
- [ ] `GET /` 返回 200
- [ ] 页面包含 `<h1>` 或 logo 元素
- [ ] 加载时间 < 5s

### E2E 测试
- [ ] `activation.spec.ts` 通过
- [ ] `homepage.spec.ts` 通过
- [ ] `confirmation-progress-persist.spec.ts` 通过
- [ ] `integrated-preview.spec.ts` 通过
- [ ] 整体通过率 ≥ 90%

### 构建
- [ ] `npm run build` 退出码 0
- [ ] 构建时间 < 5 分钟
- [ ] `output: 'export'` 配置保留

---

## 4. 风险识别与缓解

| 风险 | 影响 | 概率 | 缓解措施 |
|------|------|------|---------|
| 首页 404 根因复杂 | 中 | 中 | 先诊断再修复，避免盲目改动 |
| confirmationStore 字段缺失 | 高 | 低 | partialize 已包含所有关键字段，提前审查 |
| E2E flaky 测试 | 中 | 中 | 配置 Playwright 重试 (retries: 2) |
| 构建产物过大 | 低 | 低 | 静态导出无变化，不影响 |

---

**实施计划完成**: 2026-03-23 08:38 (Asia/Shanghai)
**预计上线**: 2026-03-27 (基于 3.5 天估算)
