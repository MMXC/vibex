# Analysis: Sprint 2 Canvas Dashboard QA 详细设计画布完整功能回归测试

**Project**: vibex-sprint2-20260415 / vibex-qa-canvas-dashboard
**Date**: 2026-04-15
**Analyst**: analyst
**Task**: analyze-requirements

---

## 执行决策

- **决策**: Conditional — 有条件通过，需解决一个阻塞项
- **执行项目**: vibex-qa-canvas-dashboard
- **执行日期**: 2026-04-15（前提：Coord 确认 E6 Phase 2 范围）

---

## 1. 背景与 Research 总结

### 1.1 Git History 发现（过去发生过什么）

| Commit | 内容 | 教训 |
|--------|------|------|
| `4090fc26` | E5 canvas-dashboard 替换 setTimeout mock 为真实 API | mock 持久化链路需完整替换，否则测试通过但功能假性 |
| `7be7ab79` | useAuthStore mock 缺少 getState 方法 | 测试 mock 必须覆盖所有被调用的方法，否则生产报错 |
| `0323cd4b` | E5 ProjectCreationStep 单元测试 | Vitest mock 语法与 Jest 不兼容是高频陷阱 |
| `cc91c831` / `a443f5df` | React Flow visibility + /api/chat mock 修复 | E2E mock 层级多，任何一层失效都会导致测试假通过 |
| `4d81f8b1` | Epic6 E2E test framework 详细 | Canvas E2E 已有完整测试框架，可复用 |

### 1.2 历史经验（docs/learnings/）

| 文件 | 关键教训 |
|------|---------|
| `canvas-testing-strategy.md` | mockStore 过于简化导致假通过；Vitest/Jest 隔离需配置保障；边界条件测试（TDD）比集成测试更有价值 |
| `canvas-api-completion.md` | Route 顺序敏感性（`GET /latest` 必须在 `GET /:id` 之前）；Snapshot testing 对 API 结构化响应更高效 |
| `canvas-cors-preflight-500.md` | OPTIONS 请求不带 Authorization；CORS 处理层级必须从 gateway 顶层拦截，越早越好 |

### 1.3 当前实现状态

- **E5 Phase 1**（ProjectCreationStep API 集成）：✅ 通过 reviewer-push，`7be7ab79`
- **E6 Phase 2**（三树数据持久化）：❌ 未开始，PRD 标记为"待 Coord 评审"
- **单元测试**：3/3 PASS（已通过 tester 验证）
- **E2E**：Epic6 E2E 框架已就绪（Playwright + 1027 上下文配置）

---

## 2. 业务场景分析

### 2.1 Canvas Dashboard Sprint 2 涉及 Epic

| Epic | 内容 | 工时 | 状态 |
|------|------|------|------|
| E1 | Tab State 残留修复（Prototype accordion） | 1h | 待实施 |
| E2 | 版本历史集成（E7，snapshot API 前端） | 3h | 待实施 |
| E3 | 导入导出（E8，JSON/YAML） | 2h | 待实施 |
| E4 | 三树数据持久化（E6 Phase 2） | 5h | 待 Coord 评审 |
| E5 | Canvas-Dashboard 项目持久化 Phase 1 | - | ✅ 已完成 |

### 2.2 本次 QA 回归测试范围

**"Sprint 2 QA验收：Canvas Dashboard 详细设计画布完整功能回归测试"** 的实际范围：

1. **E5 完成后端验证** — ProjectCreationStep API 集成链路回归
2. **Epic E1-E4 实施前的现状记录** — 建立 Baseline，为实施后对比提供依据
3. **E6 Phase 2（待定）** — 三树持久化，若 Coord 批准则纳入

---

## 3. 技术方案选项

### 方案 A：完整 E2E 回归（推荐）

覆盖所有已完成的 Epic E5 功能 + 现状 Baseline + Sprint 2 待实施项预估测试。

**测试覆盖范围**：
- E5 F5.1-F5.8（已实现功能完整回归）
- Canvas 核心交互（画布渲染、节点拖拽、上下文树）
- Dashboard 项目列表（加载、搜索、筛选）
- 项目详情页（Phase 2 前现状）

**工时**：4-6h（E2E 框架 + 用例编写 + 执行 + 报告）

**优势**：
- 与现有 Epic6 E2E 框架无缝衔接（Playwright + `vibex-prd-canvas-dev`）
- 覆盖端到端真实用户路径
- 为 E1-E4 实施后对比提供 Baseline

**劣势**：
- E2E 测试不稳定风险（已有 `waitForCanvasSettled` 等修复记录）
- 跨环境认证 mock 需要额外处理

### 方案 B：单元测试为主 + 关键 E2E 抽查

聚焦单元测试覆盖已完成的 E5 功能（ProjectCreationStep），辅以 3-5 个关键 E2E 抽查。

**工时**：2-3h（单元测试补充 + 抽查 E2E）

**优势**：
- 快速验证 E5 质量
- 单元测试稳定、可重复

**劣势**：
- 无法覆盖端到端全链路（Dashboard 真实可见性）
- 无法验证 Phase 2 三树持久化

### 方案 C：仅 E5 验收测试（保守）

严格按照 PRD 验收标准（AC1-AC11）逐条执行，聚焦 ProjectCreationStep。

**工时**：1-2h

**优势**：
- 明确、有据可查
- 快速闭环

**劣势**：
- 过于保守，Sprint 2 完整性不足

---

## 4. 可行性评估

| 维度 | 评估 | 说明 |
|------|------|------|
| 技术可行性 | ✅ 高 | E5 已通过 reviewer-push，单元测试 3/3 PASS；Epic6 E2E 框架已就绪 |
| 工时可控性 | ✅ 中高 | 方案 A 4-6h 在合理范围；方案 B 2-3h 更保守 |
| 测试稳定性 | ⚠️ 中 | E2E 历史上有 `waitForTimeout` 重构问题（commit `4090fc26`），需使用已有的 `waitForCanvasSettled` 模式 |
| 认证处理 | ✅ 已解决 | `useAuthStore.getState()` 已修复（commit `7be7ab79`） |

**结论**：技术可行，但需注意 E2E 测试稳定性问题。

---

## 5. 初步风险识别

### 风险矩阵

| 风险 | 可能性 | 影响 | 等级 | 缓解 |
|------|--------|------|------|------|
| E2E 测试 flakiness（已有历史） | 中 | 中 | 🟡 中 | 使用 `waitForCanvasSettled` 而非固定 timeout；复用 Epic6 已有修复模式 |
| E6 Phase 2 范围未确认 | 高 | 高 | 🔴 高 | 阻塞 QA 执行 — 需 Coord 立即确认 |
| 认证 mock 在不同环境不一致 | 低 | 中 | 🟡 中 | 使用 `useAuthStore.getState()`（已修复），避免测试环境硬编码 userId |
| Dashboard 项目列表未真实验证 | 中 | 中 | 🟡 中 | E2E 需包含 `page.goto('/dashboard')` 并断言项目出现 |
| Canvas 画布交互测试耗时过长 | 低 | 低 | 🟢 低 | 聚焦关键场景，不做穷举交互测试 |

### ⚠️ 阻塞项

> **E6 Phase 2 范围未确认是本次 QA 的最高优先级阻塞项。**
>
> PRD 明确标注 E6 为"待 Coord 评审"，但其直接影响"Canvas Dashboard 完整功能回归"的边界定义。若 E6 纳入范围，测试用例需增加 F6.1-F6.3，工作量增加 2h；若不纳入，则聚焦 E5 即可。
>
> **建议 Coord 在 4h 内给出决策。**

---

## 6. 推荐方案

**推荐：方案 A（完整 E2E 回归）**

理由：
1. E5 已完成且质量有保障（reviewer-push 闭环），有条件做完整回归
2. 为 E1-E4 实施建立 Baseline，避免后续无参照对比
3. Epic6 E2E 框架（Playwright + `vibex-prd-canvas-dev`）可复用，投入产出比高
4. 历史教训（mock 不完整、CORS 边界条件）提示必须做真实环境验证

---

## 7. 验收标准

| ID | 验收条件 | 优先级 | 测试方式 |
|----|---------|--------|---------|
| AC-QA1 | E5 ProjectCreationStep API 集成全链路回归通过 | P0 | E2E |
| AC-QA2 | 创建成功 → Dashboard 列表出现该项目（≤3s） | P0 | E2E |
| AC-QA3 | 创建失败 → error banner 显示（非 alert），可关闭 | P0 | E2E |
| AC-QA4 | "View Project →" 正确跳转 `/project?id=xxx` | P0 | E2E |
| AC-QA5 | `useAuthStore` 无 userId 时显示"请先登录" | P0 | 单元测试 |
| AC-QA6 | 空项目名 → API 不被调用，按钮禁用 | P0 | 单元测试 |
| AC-QA7 | 单元测试 3/3 PASS + TC4-TC7 补充覆盖 | P0 | 单元测试 |
| AC-QA8 | E6 Phase 2 决策已确认（纳入/排除 QA 范围） | P0 | Coord 决策 |
| AC-QA9 | Canvas 画布核心交互 Baseline（截图 + 断言） | P1 | gstack screenshot |
| AC-QA10 | Dashboard 项目列表加载 Baseline | P1 | E2E |

---

## 8. 工期估算

| 阶段 | 工时 | 产出 |
|------|------|------|
| E5 完整回归测试执行 | 2h | E2E 测试用例 + 执行报告 |
| E5 单元测试补充（TC4-TC7） | 0.5h | 补充测试用例 + PASS 结果 |
| Canvas/Dashboard Baseline 建立 | 1h | 截图 + 断言报告 |
| E6 Phase 2 测试准备（若纳入） | 2h | F6.1-F6.3 测试用例 |
| 报告编写与 Coord 沟通 | 0.5h | 验收报告 |
| **Total（不含 E6 Phase 2）** | **4h** | |
| **Total（含 E6 Phase 2）** | **6h** | |

---

## 9. 驳回条件

若以下条件之一触发，驳回本次任务要求补充：

1. **需求模糊** — "完整功能回归测试" 未明确 E6 Phase 2 是否在范围内 → Coord 必须明确
2. **缺少验收标准** — PRD AC1-AC11 为设计文档，非可测试用例 → 需转换为 Playwright 测试用例
3. **未执行 Research** — 无 git history 分析记录 → 本文档已包含

---

*Analysis by analyst | 2026-04-15*
