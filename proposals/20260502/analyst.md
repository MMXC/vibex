# VibeX Sprint 22 功能提案

**Agent**: analyst
**日期**: 2026-05-02
**项目**: vibex-proposals-20260502-sprint22
**仓库**: /root/.openclaw/vibex
**分析视角**: Analyst — 基于 Sprint 1-21 交付成果，识别下一批高优先级功能增强

---

## 1. 提案列表

| ID | 类别 | 标题 | 影响范围 | 优先级 |
|----|------|------|----------|--------|
| P001 | feature | Design Review 真实 MCP 链路打通 | 画布用户，AI 评审可信度 | P0 |
| P002 | quality | E2E CI Gate 完整落地 | CI 质量门禁，发布可靠性 | P0 |
| P003 | feature | Teams 协作 UI 完善 | 企业用户，多人协作 | P1 |
| P004 | tech-debt | 需求模板库基础建设 | 新用户转化，留存 | P1 |
| P005 | quality | Claude Code Agent E2E 覆盖验证 | AI Coding 功能稳定性 | P1 |

---

## 2. 提案详情

### P001: Design Review 真实 MCP 链路打通

**问题描述**:

Sprint 16 P0-1 实现了 Design Review UI（ReviewReportPanel + Ctrl+Shift+R 快捷键），但 `review_design` MCP 调用走的是 mock 路径——前端 `useDesignReview` hook 模拟 1.5s 延迟返回假数据。Sprint 12 E9 已实现 `packages/mcp-server/src/tools/reviewDesign.ts`，但前端从未调用真实 MCP endpoint。

Sprint 20 声称完成了大量 MCP 基础设施（DoD 收尾），但 CHANGELOG 没有明确记录 Design Review mock → 真实迁移。

**影响范围**: 画布用户，Design Review 功能形同虚设（用户看到的是伪造结果集）

**根因**:
```
根因: UI 层与后端 MCP 层集成链路断裂
证据:
- CHANGELOG S16-P0-1: "Mock review_design MCP call with 1.5s simulated delay"
- packages/mcp-server/src/tools/reviewDesign.ts 在 S12 已实现
- 前端 useDesignReview hook 未调用真实 MCP endpoint
- 无 E2E 测试验证真实 MCP 集成链路
```

**验收标准**:
- [ ] `useDesignReview` 调用真实 MCP endpoint（而非 mock）
- [ ] ReviewReportPanel 展示真实 AI 评审结果（compliance/a11y/reuse 三段）
- [ ] 离线/未配置状态有 graceful degradation（显示 "Design Review 暂不可用"）
- [ ] E2E 测试覆盖真实 MCP 集成路径
- [ ] `pnpm run build` → 0 errors

---

### P002: E2E CI Gate 完整落地

**问题描述**:

Sprint 21 完成了 CI E2E staging 环境隔离（S21-E2E-Staging-Isolation：移除 BASE_URL 生产 fallback + staging health check + 域名验证 + db-reset 脚本 + slack-summary 脚本），但 E2E 测试本身未集成到 CI gate。

当前状态：staging health check 和 db-reset 脚本已就绪，但 Playwright 测试套件未在 CI 中执行，测试产出 vs 测试执行仍然脱节。

**影响范围**: CI pipeline，质量门禁完整性，发布可靠性

**根因**:
```
根因: E2E 测试建设持续 (S2-S21) 但 CI 执行 gate 缺失
证据:
- CHANGELOG 无 "E2E CI gate" 完成记录
- .github/workflows/test.yml 无 e2e test job
- `scripts/e2e-summary-to-slack.ts` 已完成但未被 CI 调用
- staging isolation 完成 (S21) 但测试套件仍需手动触发
```

**验收标准**:
- [ ] `.github/workflows/test.yml` 包含 `e2e-staging` job（staging health check 通过后执行）
- [ ] Playwright 测试套件在 CI 中可执行（`pnpm test:e2e --reporter=html`）
- [ ] 关键路径 E2E 测试在 PR gate 中必须通过
- [ ] E2E 报告通过 `e2e-summary-to-slack.ts` 自动发送到 Slack
- [ ] CI e2e job 退出码正确（failure 时整个 job 失败）

---

### P003: Teams 协作 UI 完善

**问题描述**:

Sprint 13-14 实现了 Teams API（Team + TeamMember + TeamInvite 表，CRUD + 权限分层，Backend routes），Sprint 7 E3 实现了 Teams Dashboard UI（团队列表/创建/成员管理/角色分层），但多人实时协作画布（FR-004）从未实现。

Teams API 完整但 Teams Dashboard UI 存在以下问题：
- 团队切换机制未与画布权限关联
- 成员邀请未与画布共享机制打通
- RBAC 权限未在画布层面体现（所有人看到相同 UI）

**影响范围**: 企业用户，多人协作场景

**根因**:
```
根因: Teams API 与画布协作能力断裂 — backend 完成了但 frontend 未完整集成
证据:
- CHANGELOG S14 E6-U1: Teams API 完整实现（9 unit tests）
- CHANGELOG S7 E3-U1~E4: Teams Dashboard UI（TanStack Query + 乐观更新）
- 无 "团队协作画布" CHANGELOG 条目
- FEATURE_REQUESTS.md FR-004 "团队协作空间" 标记 P1，未解决
```

**验收标准**:
- [ ] 团队成员可在画布中看到彼此（PresenceAvatars + RemoteCursor）
- [ ] 团队权限在画布中生效（owner/admin/member 差异化操作）
- [ ] 邀请成员后可共享画布项目
- [ ] E2E 测试覆盖多团队成员画布协作场景
- [ ] `pnpm run build` → 0 errors

---

### P004: 需求模板库基础建设

**问题描述**:

FEATURE_REQUESTS.md FR-001 标记为 P0（"新用户常不知如何描述需求，提供行业模板可降低使用门槛 50%"），但 Sprint 1-21 没有实现需求模板库。

新用户进入 Canvas 后不知道如何描述第一个需求。当前 onboarding 引导只介绍功能，不提供需求输入的参照模板。

**影响范围**: 新用户转化，用户体验

**根因**:
```
根因: 需求输入依赖用户自身领域知识，但产品未提供结构化引导
证据:
- FEATURE_REQUESTS.md FR-001 标记 P0，未解决
- onboarding modal 无需求模板引导
- Canvas 首次使用时 requirement chapter 为空，无参考样本
- 竞品（Jira/Notion）均有模板库降低输入门槛
```

**验收标准**:
- [ ] 提供 3-5 个行业需求模板（电商/SaaS/社交/金融/通用）
- [ ] 用户创建第一个项目时看到模板选择界面
- [ ] 模板选择后自动填充 requirement chapter 示例内容
- [ ] 模板可自定义（用户可创建自己的模板）
- [ ] `pnpm run build` → 0 errors

---

### P005: Claude Code Agent E2E 覆盖验证

**问题描述**:

Sprint 20 完成了 P006 AI Agent 真实接入（`OpenClawBridge.ts` spawnAgent + Sessions CRUD + frontend 集成），40 个单元测试通过，但 E2E 层面没有覆盖真实 agent 会话创建/管理/重试的完整路径。

单元测试覆盖了接口层面，但端到端用户旅程（创建 agent 会话 → 发送任务 → 接收结果 → 回写到 Canvas）没有 E2E 验证。

**影响范围**: AI Coding 功能稳定性，用户信任度

**根因**:
```
根因: 单元测试覆盖了 mock 路径，真实 agent 集成缺乏 E2E 保障
证据:
- CHANGELOG S20 P006: "40 tests passed" (sessions.test.ts + OpenClawBridge.test.ts + agent-sessions.test.ts)
- 无 "Agent E2E" CHANGELOG 条目
- workbench-journey.spec.ts 只覆盖 API 路由，未覆盖真实 agent 场景
- OpenClawBridge.spawnAgent() 的 AbortController 超时场景无 E2E 验证
```

**验收标准**:
- [ ] E2E 测试覆盖 agent 会话创建（POST /api/agent/sessions）
- [ ] E2E 测试覆盖 agent 超时降级（backend 不可用时 graceful error）
- [ ] E2E 测试覆盖 agent 结果回写到 Canvas
- [ ] E2E 测试覆盖 agent 会话列表 UI
- [ ] `pnpm test:e2e` 中 agent 相关测试全部通过

---

## 3. 相关文件

- CHANGELOG.md: 全量交付追踪
- FEATURE_REQUESTS.md: FR-001/FR-004 未解决
- Backlog: `docs/backlog-sprint17.md`
- MCP Tools: `packages/mcp-server/src/tools/reviewDesign.ts`
- Teams API: `vibex-backend/src/routes/v1/teams/`
- Agent Integration: `vibex-backend/src/services/OpenClawBridge.ts`

---

## 4. 风险矩阵

| 提案 | 风险项 | 可能性 | 影响 | 风险等级 | 缓解方案 |
|------|--------|--------|------|----------|----------|
| P001 | 真实 MCP 调用链路不稳定 | 中 | 中 | 🟡 | graceful degradation 先做，确保 offline 不崩 |
| P002 | E2E 测试 flaky 导致 CI 红 | 中 | 高 | 🟠 | staging isolation 已完成，先跑关键路径 |
| P003 | 多人画布协作跨 store 同步复杂 | 高 | 高 | 🔴 | 分 Epic，先做权限 UI 再做实时同步 |
| P004 | 模板 UI 可能增加认知负担 | 低 | 中 | 🟡 | 可选入口，不强制，不影响已有用户 |
| P005 | agent 超时场景需要 mock OpenClaw | 中 | 低 | 🟡 | CI staging 环境已有 health check，降级路径已实现 |

---

## 5. 工期估算

| 提案 | 预估工时 | 复杂度 | 依赖 | Sprint 建议 |
|------|----------|--------|------|-------------|
| P001 | 4-6h | 中 | S16 Design Review UI | Sprint 22 Week 1 |
| P002 | 6-8h | 中 | S21 staging isolation | Sprint 22 Week 1 |
| P003 | 2d+ | 高 | S14 Teams API | Sprint 22 Week 2（分 Epic） |
| P004 | 4-6h | 低 | 无 | Sprint 22 Week 1 |
| P005 | 3-4h | 低 | S20 Agent 真实接入 | Sprint 22 Week 1 |

**总工时**: 约 5-7 人日

---

## 6. 执行决策

- **决策**: 待评审
- **执行项目**: vibex-proposals-20260502-sprint22
- **执行日期**: 待定
- **执行顺序**: P001 → P002 → P004 → P005（可并行），P003 独立 track（复杂度高）

---

## 7. Sprint 1-21 关键未决项追踪

| 原提案 | 原 Sprint | 状态 | 当前进展 |
|--------|-----------|------|----------|
| P002 S19 Design Review 真实 MCP | S19 | 🔴 未解决 | P001 本 Sprint |
| P003 S19 后端 TS 债务 | S19 | 🟡 部分 | as any baseline 无增量控制 |
| P005 S20 E2E CI 集成 | S20 | 🟡 部分 | S21 staging isolation 完成，gate 未集成 |
| FR-001 需求模板库 | S21 规划 | 🔴 未解决 | P004 本 Sprint |
| FR-004 团队协作空间 | S21 规划 | 🔴 未解决 | P003 本 Sprint |

---

*生成时间: 2026-05-02 06:22 GMT+8*
*Analyst Agent | VibeX Sprint 22*
