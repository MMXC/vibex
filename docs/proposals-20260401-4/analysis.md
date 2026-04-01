# Analysis: 2026-04-01 第四批提案综合分析

**Agent**: analyst
**日期**: 2026-04-01
**项目**: proposals-20260401-4
**数据来源**: Sprint 3 执行复盘（E1-E5）+ Accessibility 测试发现 + 20260324 遗留

---

## 1. 执行摘要

第四批是收尾批次（Batches 1-3 全部完成）。

**核心发现**：
- proposals-20260401-3：E1-E5 全部完成 ✅
- Accessibility 测试揭示：**Canvas 运行时崩溃** + **颜色对比度违规**
- 20260324 遗留：P2 E2E 稳定性未彻底解决
- 所有历史批次收尾 → Batch 4 = **扫尾 + 稳定性加固**

**总工时**: ~15h（2 P0 + 2 P1）

---

## 2. Sprint 3 执行复盘

### 2.1 全部完成状态

| 批次 | 项目 | 状态 |
|------|------|------|
| Batch 1 | proposals-20260401 (E1-E7) | ✅ 全部完成 |
| Batch 2 | proposals-20260401-2 (E1-E5) | ✅ 全部完成 |
| Batch 3 | proposals-20260401-3 (E1-E5) | ✅ 全部完成 |

### 2.2 E4 Accessibility 测试揭示的 Bug

E4 Epic（axe-core 基线）执行期间发现 2 个真实 Bug：

#### Bug 1: Canvas 运行时崩溃（P0 — Critical）

**发现方式**: accessibility 测试触发 AppErrorBoundary，Canvas 页面报错

**错误**：
```
heading "Something went wrong"
Cannot read properties of undefined (reading 'length')
ERR-MNFL1ABY
```

**根因**: `AppErrorBoundary` 已部署（E4 Epic1），真实错误被捕获。错误信息 `Cannot read properties of undefined (reading 'length')` 说明某处代码在 undefined 上访问了 `.length`。

**JTBD**：「作为用户，我希望画布页面始终可用，不再崩溃」

**方案**:

| 方案 | 描述 | 工时 | 风险 |
|------|------|------|------|
| A: 全局 undefined 防护 | 在 canvas entry point 加 `?.[ ]` 安全访问 | 1h | 可能掩盖问题 |
| B: Error Boundary 详细日志 | 在 AppErrorBoundary 中上报 Sentry-like 日志 | 2h | 仅诊断，无修复 |
| C: 根因排查 + 修复 | 搜索 `.length` 调用点，定位 undefined 来源 | 3h | 可能需要重构 |

**推荐方案 C**：工时 3h。需要找到真正的根因，而非用防御性代码掩盖。

**验收标准**：
- Canvas 页面加载无 `Cannot read properties of undefined` 错误
- `ERR-*` 错误码不再出现在 accessibility 测试中
- ErrorBoundary 错误率 < 0.1%

---

#### Bug 2: 颜色对比度违规（P1 — Serious）

**发现方式**: axe-core accessibility 测试（reviewer E4 review 报告）

**问题**: reviewer E4 accessibility 报告标注了颜色对比度问题，导致 axe-core 测试实际运行会 fail（非 playwright 可执行性问题）。

**当前状态**: 测试环境 playwright browser 未安装，axe-core 测试无法运行。真实违规尚未量化。

**JTBD**：「作为有视力障碍的用户，我希望 VibeX 符合 WCAG 2.1 AA 标准」

**方案**:

| 方案 | 描述 | 工时 | 风险 |
|------|------|------|------|
| A: 安装 Playwright browser + axe-core 测试 | 解决环境问题，运行 axe-core | 0.5h | 发现后仍需修复 |
| B: 手动 axe DevTools audit | 用 axe DevTools 手动检查 3 个页面 | 1h | 无自动化回归 |
| C: 完整修复 | 安装 browser + axe-core + 颜色对比度修复 | 4h | 全面覆盖 |

**推荐方案 C**：工时 4h。axe-core 测试环境问题（0.5h）+ 颜色对比度修复（3.5h）。

**颜色对比度修复重点**：
- 按钮文本 vs 背景色：对比度 ≥ 4.5:1
- 次要文本 vs 背景：对比度 ≥ 3:1
- Focus indicator：对比度 ≥ 3:1

**验收标准**：
- `npx playwright test tests/a11y --project=chromium` 全部通过
- axe-core Critical/Serious 违规 = 0
- 颜色对比度符合 WCAG 2.1 AA（4.5:1 常规文本）

---

### 2.3 20260324 遗留（P2 E2E 稳定性）

**来源**: 20260324 P2-3（积压）

**问题**: E2E 测试偶发超时，特别是 canvas 页面的网络请求 mock 不稳定。Sprint 1 E5 CI Gate 已部署，但测试稳定性问题未彻底解决。

**证据**: 
- 多个 accessibility 测试失败信息包含 playwright install 问题（测试文件本身没问题）
- 但真实 E2E 稳定性问题仍可能存在（Sprint 1 后无新报告）

**JTBD**：「作为开发者，我希望 E2E 测试结果可信，不因偶发超时导致误报」

**方案**:

| 方案 | 描述 | 工时 | 风险 |
|------|------|------|------|
| A: 重试机制 | Playwright 全局 retry on failure | 1h | 可能掩盖真实问题 |
| B: 网络 mock 稳定化 | 使用 `@playwright/test` 的 `route` API 替代手写 mock | 2h | API 复杂 |
| C: 测试隔离 | 每个测试独立 mock setup/teardown | 2h | 架构改进 |

**推荐方案 C**：工时 2h。确保每个测试独立，不共享全局状态。

**验收标准**：
- E2E 测试连续 3 次运行结果一致（0 flaky）
- 无偶发 timeout 错误
- CI 中 E2E 测试 blocking on failure

---

## 3. 全部批次汇总

### 3.1 历史批次完成情况

| 批次 | Epics | 状态 | 产出 |
|------|--------|------|------|
| Batch 1 | E1-E7 | ✅ | Dev Env / Collab Quality / Canvas Selection / Guidance / Quality Process / Competitive / Arch |
| Batch 2 | E1-E5 | ✅ | Vercel Deploy / Rollback SOP / Zustand Migration / Multi-Framework / MCP |
| Batch 3 | E1-E5 | ✅ | Proposal-Dedup / Heartbeat-Changelog / Undo-Redo / Accessibility / Svelte |
| **Batch 4** | **E1-E3** | **进行中** | **Crash Fix / Color Contrast / E2E Stability** |

### 3.2 VibeX Sprint 4 路线图

| 方向 | Epic | 来源 | 工时 | 状态 |
|------|------|------|------|------|
| 稳定性 | E1: Canvas 崩溃修复 | Accessibility 发现 | 3h | Batch 4 |
| Accessibility | E2: 颜色对比度 | Accessibility 发现 | 4h | Batch 4 |
| 测试质量 | E3: E2E 稳定性 | 20260324 遗留 | 2h | Batch 4 |
| 部署平台 | Vercel 一键部署 | Batch 2 E1 | - | ✅ |
| DDD 规范 | DDD bounded context 命名 | 20260330 遗留 | 2h | 未认领 |
| 竞品监控 | v0 监控 | Batch 2 E6 发现 | 2h | 未认领 |

---

## 4. 提案详情

### 4.1 P0-1: Canvas 运行时崩溃修复

**工时**: 3h
**优先级**: P0
**JTBD**: 「作为用户，我希望画布页面始终可用，不再崩溃」

**技术调查路径**：
1. 在 staging 环境复现（AppErrorBoundary + Sentry 日志）
2. 搜索 `?.length` 或 `.length` 在 canvas 相关文件中
3. 重点检查：panel collapse 相关代码、store migration 代码

**验收标准**：
- [ ] Canvas 页面加载无 `Cannot read properties of undefined` 错误
- [ ] `ERR-*` 错误码不再出现
- [ ] ErrorBoundary 错误率 < 0.1%

---

### 4.2 P1-1: 颜色对比度 WCAG 2.1 AA 修复

**工时**: 4h
**优先级**: P1
**JTBD**: 「作为有视力障碍的用户，我希望 VibeX 符合 WCAG 2.1 AA 标准」

**修复范围**：
| 页面 | 问题 | 修复方案 |
|------|------|----------|
| Homepage | 导航/按钮对比度 | 调整 CSS 颜色变量 |
| Canvas | 三栏面板对比度 | 调整面板/按钮颜色 |
| Export | 导出按钮对比度 | 调整 primary button 颜色 |

**验收标准**：
- [ ] `npx playwright test tests/a11y --project=chromium` 全部通过
- [ ] axe-core Critical/Serious 违规 = 0
- [ ] 对比度工具验证 ≥ 4.5:1（常规文本）

---

### 4.3 P1-2: E2E 测试稳定性加固

**工时**: 2h
**优先级**: P1
**JTBD**: 「作为开发者，我希望 E2E 测试结果可信，不因偶发超时导致误报」

**方案**：
1. 添加 `afterEach` cleanup 确保每个测试独立
2. 在 canvas E2E 中用 `waitForResponse` 替代 `waitForTimeout`
3. 添加 flaky test retry 配置

**验收标准**：
- [ ] E2E 测试连续 3 次运行结果一致
- [ ] 无偶发 timeout
- [ ] CI 中 E2E blocking on failure

---

## 5. Epic 拆分

| Epic | 包含 | 工时 | 优先级 | 并行性 |
|------|------|------|--------|--------|
| Epic1 | Canvas 崩溃修复 | 3h | P0 | 可并行 |
| Epic2 | 颜色对比度修复 | 4h | P1 | 可并行 |
| Epic3 | E2E 稳定性 | 2h | P1 | 可并行 |

**总工时**: 9h

---

## 6. 验收标准

| Epic | 验收标准 |
|------|----------|
| Epic1 | Canvas 无崩溃；ErrorBoundary 错误率 < 0.1% |
| Epic2 | axe-core Critical/Serious = 0；WCAG 2.1 AA 合规 |
| Epic3 | E2E 连续 3 次一致；无偶发 timeout |

---

## 7. 风险评估

| 风险 | 概率 | 影响 | 缓解 |
|------|------|------|------|
| Canvas 根因难以定位 | 中 | 高 | 优先检查 panel collapse migration 相关代码 |
| 颜色对比度修复影响设计一致性 | 中 | 中 | 用 CSS 变量控制，便于主题切换 |
| playwright browser 环境问题反复 | 低 | 低 | 添加 CI `npx playwright install` 步骤 |
