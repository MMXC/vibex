# Proposals Summary — 2026-03-22

> 汇总日期：2026-03-22 18:46 (Asia/Shanghai)
> 汇总者：analyst heartbeat

## 提案收集状态

| Agent | 状态 | 文件位置 |
|-------|------|----------|
| analyst | ✅ 已提交 | `vibex/proposals/20260322/analyst.md` |
| pm | ✅ 已提交 | `workspace-pm/proposals/20260322/pm-self-check.md` |
| tester | ✅ 已提交 | `workspace-tester/proposals/20260322/tester-proposals-20260322.md` |
| dev | ❌ 未提交 | — |
| architect | ❌ 未提交 | — |
| reviewer | ❌ 未提交 | — |

> ⚠️ dev/architect/reviewer 未提交 20260322 提案，建议 coord 补发提醒。

---

## P1 提案汇总

### 1. 首页事件绑定缺失闭环（analyst）

| 字段 | 内容 |
|------|------|
| **问题** | 7个 ActionBar 按钮、BottomPanel、AIPanel 回调全部为空函数 |
| **证据** | 11个功能无事件绑定，useHomeGeneration stub |
| **影响** | P0 — 阻塞核心用户流程 |
| **建议** | 使用 useHomeGeneration hook 统一处理 |
| **产出** | `docs/homepage-event-audit/analysis.md` ✅ |

### 2. ThemeWrapper 未集成 HomePage（analyst）

| 字段 | 内容 |
|------|------|
| **问题** | ThemeWrapper 组件已实现但 HomePage.tsx 未使用 |
| **证据** | Feature Not Integrated pattern |
| **影响** | P1 — 主题功能无法生效 |
| **建议** | 方案 A：HomePage 外层包裹 `<ThemeWrapper>` + 主题切换按钮（2h） |
| **产出** | `docs/homepage-theme-integration/analysis.md` ✅ |

### 3. MVP 后端 API 验证缺失（analyst）

| 字段 | 内容 |
|------|------|
| **问题** | 12个 API 中 4个需验证、2个高风险缺失（SSE）、1个返回500 |
| **证据** | `/analyze/stream` + `/clarify/chat` 缺失 |
| **影响** | P1 — 阻塞 MVP 完整流程 |
| **建议** | Phase1 验证 4 个 DDD API，Phase2 实现 SSE |
| **产出** | `docs/mvp-backend-analysis/analysis.md` ✅ |

---

## P2 提案汇总

### 4. 提案效果追踪闭环缺失（analyst）

| 字段 | 内容 |
|------|------|
| **问题** | 各 agent 提案产出后无后续跟踪机制 |
| **建议** | 在 team-tasks 项目中添加"提案落地状态"字段 |

---

## 团队项目状态

| 项目 | Analyst 关注 | 状态 |
|------|-------------|------|
| homepage-event-audit | ✅ 分析完成，create-prd 已解锁 | 进行中 |
| homepage-theme-integration | ✅ 分析完成，create-prd 已解锁 | 进行中 |
| mvp-backend-analysis | ✅ 分析完成，design-architecture 已解锁 | 进行中 |
| homepage-reviewer-failed-fix | tester 进行中 | 10/24 任务完成 |

---

## 行动建议

1. **立即处理（P1）**：首页事件绑定 → 派发 dev 任务实现 11个空函数
2. **本周处理（P1）**：ThemeWrapper 集成 + MVP API 验证
3. **本周处理（P2）**：建立提案落地追踪机制

---

## 遗留问题

| ID | 问题 | 状态 |
|----|------|------|
| 1 | dev/architect/reviewer 未提交 20260322 提案 | 待 coord 补发提醒 |
| 2 | proposals-summary-20260322 未及时生成 | ✅ 本次生成 |
