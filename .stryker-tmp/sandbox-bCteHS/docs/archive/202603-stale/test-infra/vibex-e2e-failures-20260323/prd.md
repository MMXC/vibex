# PRD: vibex-e2e-failures-20260323 — E2E 测试失败修复

**状态**: Draft  
**版本**: 1.0  
**日期**: 2026-03-23  
**PM**: PM Agent  
**目标**: 修复 E2E 测试三大失败场景，测试通过率 ≥ 90%

---

## 1. 执行摘要

### 背景
E2E 测试套件（Playwright）当前失败率较高，主要影响 CI/CD 发布门禁和用户激活流程验证。

### 目标
修复以下三个根因问题，使 E2E 测试通过率 ≥ 90%：
1. `/confirm` 路由缺失 → 页面 404
2. `output: 'export'` 静态导出限制 → 动态路由不可用
3. 首页加载 404 → 影响所有首页相关测试

### 关键指标
| 指标 | 当前 | 目标 |
|-----|------|------|
| E2E 通过率 | ~50% | ≥ 90% |
| 首页加载 | 404 | 正常加载 |
| /confirm 路由 | 不存在 | 存在且可用 |

---

## 2. 方案决策

**采用方案二：保持静态导出 + 创建 /confirm 页面**

理由：
- 改动最小，风险可控
- 保持当前部署流程稳定
- 适合 MVP 阶段快速迭代

后续可在需要更复杂服务端逻辑时迁移到 SSR（方案三）。

---

## 3. Epic 拆分

### Epic 1: 路由与页面修复
**目标**: 创建缺失页面，修复路由问题

| Story ID | 描述 | 验收标准 |
|----------|------|---------|
| S1.1 | 创建 `src/app/confirm/page.tsx` 基础页面 | ✅ 访问 `/confirm` 返回有效 HTML（非 404），DOM 包含确认流程相关内容 |
| S1.2 | 验证首页路由配置，修复 404 | ✅ `npm run dev` 后访问 `http://localhost:3000/` 返回 200，含 `<h1>` 或 logo 元素 |

### Epic 2: 状态持久化
**目标**: 确保确认流程状态跨页面保持

| Story ID | 描述 | 验收标准 |
|----------|------|---------|
| S2.1 | 验证 `confirmationStore` 实现 | ✅ `confirmationStore` 在页面刷新后保留之前设置的 `orderId` 和 `email` |
| S2.2 | 确认页面显示正确状态 | ✅ `/confirm` 页面能读取并展示 store 中的订单信息 |

### Epic 3: E2E 测试验证
**目标**: 验证修复后测试套件通过

| Story ID | 描述 | 验收标准 |
|----------|------|---------|
| S3.1 | 运行 `activation.spec.ts` | ✅ 所有 `/confirm` 相关测试用例通过，无 404 错误 |
| S3.2 | 运行 `homepage.spec.ts` | ✅ 首页加载测试通过，页面含预期元素 |
| S3.3 | 运行完整 E2E 套件 | ✅ 通过率 ≥ 90%（共 N 个测试，至少 N*0.9 个通过） |

### Epic 4: 构建与部署保障
**目标**: 确保修改不影响构建和部署流程

| Story ID | 描述 | 验收标准 |
|----------|------|---------|
| S4.1 | `npm run build` 成功 | ✅ `next build` 退出码为 0，构建时间 < 5 分钟 |
| S4.2 | 构建产物验证 | ✅ `output: 'export'` 配置保留，构建产物为纯静态文件 |

---

## 4. UI/UX 流程

```
[首页] → [分析流程] → [确认页面 /confirm] → [完成]
   ↓              ↓              ↓
加载成功    状态保存到      展示订单信息
   ↓         confirmationStore    ↓
重试兜底                    刷新页面状态保留
```

### /confirm 页面最低要求
- 显示订单摘要（orderId、email）
- 显示"激活成功"或"确认中"状态
- 包含返回首页链接

---

## 5. 验收标准（expect 断言格式）

| ID | Given | When | Then |
|----|-------|------|------|
| AC-1 | Dev server running on port 3000 | GET `/` | expect(response.status).toBe(200) |
| AC-2 | Dev server running | GET `/confirm` | expect(response.status).toBe(200) |
| AC-3 | `/confirm` page loaded | page content | expect(page.locator('body').textContent()).not.toContain('404') |
| AC-4 | Store has orderId set | navigate to `/confirm` | expect(page.locator('[data-testid="order-id"]').textContent()).toBeTruthy() |
| AC-5 | After `npm run build` | exit code | expect(code).toBe(0) |
| AC-6 | Playwright suite | test results | expect(passed / total).toBeGreaterThanOrEqual(0.9) |

---

## 6. 非功能需求

| 类别 | 要求 |
|------|------|
| **性能** | `npm run build` < 5 分钟 |
| **兼容性** | 保持 `output: 'export'` 不变 |
| **可测试性** | 所有新增页面有 `data-testid` 属性 |
| **CI/CD** | E2E 测试作为 PR 门禁必须通过 |

---

## 7. 实施计划

| 阶段 | 内容 | 负责 |
|------|------|------|
| Phase 1 | 创建 `/confirm` 页面 + 修复首页路由 | Dev |
| Phase 2 | 验证 `confirmationStore` 持久化 | Dev |
| Phase 3 | 运行 E2E 套件，修复剩余失败用例 | Tester |
| Phase 4 | `npm run build` + CI 验证 | Dev |
| Phase 5 | PRD 验收 + 上线 | PM |

---

## 8. 风险与缓解

| 风险 | 影响 | 概率 | 缓解 |
|------|------|------|------|
| 静态导出限制确认页功能 | 高 | 中 | 如需服务端逻辑，提前评估 SSR 迁移 |
| E2E 测试不稳定（flaky）| 中 | 中 | 增加重试配置，确保测试可重复执行 |
| 构建失败影响部署 | 中 | 低 | 先在 dev 环境验证，再合入 main |

---

*PRD v1.0 — 2026-03-23*
