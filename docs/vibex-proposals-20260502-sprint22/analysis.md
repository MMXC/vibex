# VibeX Sprint 22 提案分析报告

**Agent**: analyst
**日期**: 2026-05-02
**项目**: vibex-proposals-20260502-sprint22
**分析视角**: Analyst — gstack 验证提案问题真实性

---

## 审查结论

| 提案 | 问题真实性 | 状态 | 说明 |
|------|-----------|------|------|
| P001 | ⚠️ 部分真实 | **有条件通过** | Design Review mock→真实链路部分完成，但 MCP 基础设施未使用 |
| P002 | ✅ 已解决 | **降级** | E2E CI Gate 在 S21 已完整落地，提案需更新表述 |
| P003 | ✅ 真实 | **通过** | Teams API 完整但画布协作断裂，问题可复现 |
| P004 | ✅ 真实 | **通过** | 需求模板库未实现，新用户引导缺失 |
| P005 | ⚠️ 部分真实 | **有条件通过** | Agent API E2E 存在但 UI 路径未覆盖 |

---

## 业务场景分析

### P001: Design Review 真实 MCP 链路

**gstack 验证结果**：

代码审计发现 `useDesignReview.ts` 在 S19 已从 mock 迁移到真实 API 调用（标注 `E19-1-S2: Real API call — replaces setTimeout mock`）。但该链路走的是 `/api/mcp/review_design` 路由（Next.js App Router），而非真正的 MCP server (`packages/mcp-server/src/tools/reviewDesign.ts`)。

- **真实部分**: API route 使用内联逻辑（`checkDesignCompliance` / `checkA11yCompliance` / `analyzeComponentReuse`），对输入节点做本地静态分析
- **缺失部分**: 未调用 MCP server `/tools/review_design` endpoint，未使用真实的 MCP 工具链

**业务影响**: 用户收到的是基于本地规则的结果，而非 AI 驱动的设计评审（当前实现本质上是静态 linting，非 AI 评审）

**验收标准**:
- [ ] API route 调用真实 MCP server（`localhost:3100/tools/review_design` 或通过 gateway bridge）
- [ ] graceful degradation：MCP server 不可用时显示 "Design Review 暂不可用"（而非静默返回空结果）
- [ ] `pnpm run build` → 0 errors
- [ ] E2E 测试覆盖真实 MCP 路径

---

### P002: E2E CI Gate 完整落地

**gstack 验证结果**：

`.github/workflows/test.yml` 已包含完整的 `e2e` job：
- Line 173: `e2e:` job 定义
- Line 188-189: `playwright install chromium --with-deps`
- Line 191-195: 域名验证（`vibex.top` → exit 1）
- Line 197-208: staging health check（3 次重试，10s 间隔）
- Line 214: `test:e2e:ci` 执行
- Line 219: `playwright-report` artifact
- Line 238: E2E 失败时 gate 退出

**结论**: P002 描述的 "E2E 测试未集成到 CI gate" 已不准确。S21 的 CI E2E 环境隔离是完整实现，不是 "部分完成"。提案需要更新表述，聚焦于验证 CI E2E 的稳定性或扩大覆盖范围。

**验收标准**（修订版）:
- [ ] 当前 `test:e2e:ci` 在 main 分支上稳定运行（flaky rate < 5%）
- [ ] E2E 测试关键路径覆盖率 ≥ 80%（Canvas 创建/API 调用/协作基础）
- [ ] `e2e-summary-to-slack.ts` 已在 CI job 中调用并生成 Slack 报告

---

### P003: Teams 协作 UI 完善

**gstack 验证结果**：

代码确认：
- `vibex-backend/src/routes/v1/teams/` — Teams API 完整（CRUD + 成员管理 + RBAC）
- `vibex-fronted/src/app/dashboard/teams/` — Teams Dashboard UI 完整
- `vibex-fronted/src/components/dds/DDSCanvasPage.tsx` — 无团队权限检查逻辑
- `PresenceAvatars.tsx` — 已实现在线状态显示，但不区分团队成员 vs 外部用户

**业务场景**:
1. Alice 创建 Team A，邀请 Bob 作为 member
2. Alice 将 Canvas 项目 P1 共享给 Team A
3. Bob 加入后发现：画布中能看到 Alice 的 presence（✅），但无法区分"Alice 是团队成员" vs "Alice 是其他用户"（❌）
4. 团队权限在画布操作按钮上无体现（delete/share/edit 对所有人都一样）（❌）

**根因**: Teams API 与 Canvas 权限系统无集成点

**验收标准**:
- [ ] PresenceAvatars 可区分"团队成员"（绿色边框）与"访客"（灰色边框）
- [ ] 非 owner 用户的画布删除按钮置灰（有 tooltip: "需要 Owner 权限"）
- [ ] 团队成员列表在画布 Toolbar 显示（团队头像堆叠）
- [ ] E2E 测试覆盖：member 尝试删除画布 → 403 拒绝
- [ ] `pnpm run build` → 0 errors

---

### P004: 需求模板库基础建设

**gstack 验证结果**：

代码确认：
- `vibex-fronted/src/hooks/dds/` — 无模板相关 hook
- onboarding modal 只介绍功能，无需求输入引导
- Canvas `requirement` chapter 为空时无参考样本

**业务场景**:
新用户 ZhangSan 第一次使用 VibeX：
1. 注册 → 进入 Dashboard → 点击 "New Project"
2. 项目创建成功，进入 Canvas
3. `requirement` chapter 为空，用户不知道该输入什么
4. 用户要么跳过（导致后续 AI 生成质量差），要么随便输入（导致产出不相关）

**竞品参考**:
- Jira: 预设 Agile/Scrum/Kanban 模板
- Notion: 预设 PRD/Roadmap/Brainstorm 模板
- Figma: 预设设计系统模板

**验收标准**:
- [ ] 新项目创建流程提供模板选择界面（3 个行业模板 + 1 个空白选项）
- [ ] 模板选择后自动填充 `requirement` chapter（包含结构化引导：用户/场景/目标/约束）
- [ ] 用户可保存自定义模板（保存到 localStorage）
- [ ] 模板预览可折叠（不强制用户阅读）
- [ ] `pnpm run build` → 0 errors

---

### P005: Claude Code Agent E2E 覆盖验证

**gstack 验证结果**：

`workbench-journey.spec.ts` 包含 4 个 API tests（POST 201/400×2, GET 200）和 1 个 UI test（404 feature flag）。但以下场景未覆盖：

- Agent 超时降级（backend 不可用时）
- Agent 结果回写到 Canvas UI
- Agent 会话列表 UI（多会话场景）
- Agent 会话删除

**业务场景**:
1. 用户创建 agent 会话，发送 "帮我生成用户登录页面" 任务
2. Agent 响应返回 code generation 结果
3. 结果显示在 Workbench UI 中（✅ 已有 basic test）
4. 用户点击 "回写到 Canvas" → Canvas 更新 card（❌ 无 E2E）
5. 用户删除会话（❌ 无 E2E）

**验收标准**:
- [ ] E2E 测试：backend timeout → UI 显示 graceful error message
- [ ] E2E 测试：agent 会话列表 UI（创建 2 个会话后列表显示 2 条）
- [ ] E2E 测试：agent 会话删除（DELETE /api/agent/sessions/:id）
- [ ] `pnpm test:e2e --grep "agent"` 全部通过

---

## 技术方案选项

### P001 技术方案

**方案 A — MCP Server Bridge（推荐）**
- 修改 `/api/mcp/review_design` 路由，通过 OpenClaw MCP bridge 调用真实 MCP server
- 复用 `OpenClawBridge.ts`（S20 已实现）调用 MCP tools
- MCP server 返回结构化结果，frontend adapter 转换格式
- 成本: 2-3h | 风险: 低

**方案 B — AI Backend 集成**
- 调用外部 AI API（Claude/GPT）做真实设计评审
- 成本: 6-8h | 风险: 高（依赖外部 API 可用性、费用）

---

### P002 技术方案（修订）

**方案 A — CI E2E 稳定性监控（推荐）**
- 添加 E2E flaky rate 监控（连续 3 次失败告警）
- 扩大 CI E2E 覆盖路径（新增 Canvas 核心路径测试）
- 成本: 4h | 风险: 低

**方案 B — E2E 测试分级**
- Critical path: 必须在 CI 中通过
- Extended path: PR 建议，非强制
- 成本: 6h | 风险: 中（分级策略需团队共识）

---

### P003 技术方案

**方案 A — 渐进式集成（推荐）**
- Step 1: 在 PresenceAvatars 添加团队成员标识（UI 改动，无 backend 依赖）
- Step 2: 在 DDSCanvasPage 读取当前用户的 team membership，决定操作权限
- Step 3: 添加 API route 获取 project team members
- 成本: 8-12h | 风险: 中（跨 store 同步）

**方案 B — 完整 RBAC 画布集成**
- 重建 Canvas 权限模型，与 Teams API 完全对齐
- 成本: 3d+ | 风险: 高（大规模重构）

---

## 可行性评估

| 提案 | 技术可行性 | 工期 | 依赖 | 推荐 |
|------|-----------|------|------|------|
| P001 | ✅ 高 | 2-3h | S20 OpenClawBridge | ✅ |
| P002（修订） | ✅ 高 | 4h | S21 CI isolation | ✅ |
| P003 | ⚠️ 中 | 8-12h | S14 Teams API | ✅（分期） |
| P004 | ✅ 高 | 4-6h | 无 | ✅ |
| P005 | ✅ 高 | 3-4h | S20 Agent | ✅ |

---

## 风险矩阵（更新）

| 提案 | 风险项 | 可能性 | 影响 | 风险等级 |
|------|--------|--------|------|----------|
| P001 | MCP bridge 链路不稳定 | 中 | 中 | 🟡 |
| P002 | E2E 测试 flaky | 中 | 高 | 🟠 |
| P003 | 跨 store 权限同步复杂 | 高 | 高 | 🔴（分期执行） |
| P004 | 模板增加认知负担 | 低 | 低 | 🟢 |
| P005 | agent 超时 mock 场景难模拟 | 中 | 低 | 🟢 |

---

## 验收标准（最终）

### P001
- [ ] `/api/mcp/review_design` 调用真实 MCP server（或优雅降级）
- [ ] UI 显示 "Design Review 暂不可用" 而非静默失败
- [ ] `pnpm run build` → 0 errors

### P002（修订）
- [ ] CI E2E flaky rate < 5%（连续 3 次观察）
- [ ] 关键路径 E2E 覆盖 ≥ 80%
- [ ] `e2e-summary-to-slack.ts` 在 CI 中已集成并运行

### P003
- [ ] PresenceAvatars 区分团队成员标识
- [ ] RBAC 权限在 Canvas 操作按钮体现
- [ ] member 尝试越权操作 → 403 或 button disabled

### P004
- [ ] 模板选择界面（3+1 选项）
- [ ] 模板预览可折叠
- [ ] 用户可保存自定义模板

### P005
- [ ] agent timeout graceful error E2E
- [ ] agent 会话列表 UI E2E
- [ ] agent 会话删除 E2E

---

*生成时间: 2026-05-02 06:27 GMT+8*
*Analyst Agent | VibeX Sprint 22 Analysis*
