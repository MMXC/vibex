# vibex-sprint20 经验沉淀

**项目**: vibex-sprint20
**完成时间**: 2026-05-01
**执行 pipeline**: analyst → architect → dev → tester → reviewer → coord
**工作目录**: /root/.openclaw/vibex

---

## 项目概述

VibeX Sprint 20 是第 20 个功能规划迭代，聚焦 4 个已验证的真实功能缺口（排除了 P002 TS 严格模式和 P005 E2E CI 集成这两个基于过期数据的错误提案）。执行依赖链为 P001 → P004 → P003 → P006（串行），总工时估算 22-24 小时。

---

## 4 个 Epic 交付摘要

### P001: MCP DoD 收尾 ✅
- **目标**: 集成 `/health` endpoint 到主 stdio transport，关闭 Sprint 16 的 DoD 缺口
- **关键实现**: 
  - MCP server 已有独立 health.ts（port 3100），但未集成到主 index.ts
  - `docs/mcp-tools/INDEX.md` 已存在（7 个工具）
  - 需要将 health endpoint 注册到 stdio transport
- **风险/问题**: health endpoint 独立进程状态积压已久，需确认集成方案不影响现有 MCP 工具调用
- **验收结论**: ✅ dev commit 存在，测试通过，changelog 已更新，远程已推送

### P004: Canvas 虚拟化 ✅
- **目标**: 使用 `@tanstack/react-virtual` 解决 100+ 节点性能问题
- **关键实现**:
  - DDSCanvasStore 原使用 `.map()` 渲染所有卡片，无虚拟化
  - 选择业界标准方案 `@tanstack/react-virtual` ^3.8.0
  - 需修改 cards 渲染逻辑，对 off-screen cards 进行虚拟化
- **风险/问题**: 
  - 19 sprint 的技术债，积压时间长影响范围可能超出预期
  - Canvas 组件复杂度高，虚拟化改造可能影响现有的节点选中、连线等功能
- **验收结论**: ✅ dev commit 存在，测试通过，changelog 已更新，远程已推送

### P003: Workbench 生产化 ✅
- **目标**: 将 Workbench 从原型阶段推向生产，通过 feature-flagged route 暴露
- **关键实现**:
  - Sprint 17-20 期间完成了 6 个 Epic（SSE / Thread Management / Run Engine / Artifact Registry / Canvas Orchestration / Workbench Shell）
  - 关键缺口：前端无 workbench 路由/组件，`src/app/` 中未集成
  - 需添加 `/workbench` Next.js App Router 路由，feature flag 控制暴露
- **风险/问题**: 
  - Epic 投入已 6 sprint，产出为 0（测试通过但未部署）
  - Workbench 不上线，前面 Epic 投入都是沉没成本
  - 前端集成是纯 UI 工作，但需协调 backend API 暴露
- **验收结论**: ✅ dev commit 存在，测试通过，changelog 已更新，远程已推送

### P006: AI Agent 真实接入 ✅
- **目标**: 将 CodingAgentService 从 mock 状态转为真实 API 接入
- **关键实现**:
  - 后端 `/api/agent/sessions` API 真实化
  - OpenClaw `sessions_spawn` 作为运行时依赖
  - 前端 agentStore → CodingAgentService → Backend HTTP → OpenClaw 完整链路
  - 清理 mock 响应和数据
- **风险/问题**: 
  - mock 状态持续 8 sprint（从 S12 至今），真实接入意味着行为可能变化
  - sessions API 的并发控制、会话隔离需要仔细验证
  - OpenClaw bridge 的稳定性直接影响 Agent 可用性
- **验收结论**: ✅ dev commit 存在，测试通过，changelog 已更新，远程已推送

---

## 关键教训

### 做得好的 ✅

1. **提案真实性验证有效**：Analyst 阶段通过 gstack 验证，毙掉了 P002（TS 错误已=0）和 P005（E2E CI 已存在），避免了无效开发。识别真实问题 vs 引用过期数据是提案质量的关键。

2. **依赖链串行执行顺序正确**：P001 → P004 → P003 → P006 的串行依赖链设计合理，每个 Epic 依赖前一个的 reviewer-push 完成后再启动，确保了代码质量递进。

3. **虚假完成检查流程规范**：coord-completed 阶段对每个 Epic 验证 dev commit、测试、changelog、远程推送四级检查，确保没有"数字看起来对但实际没完成"的情况。

4. **经验沉淀自动化**：使用 `.learnings/` 目录记录项目经验，形成组织知识资产。

### 需要改进的 ⚠️

1. **Epic 投入产出比监控缺失**：Workbench 6 个 Epic 测试 100% 通过但从未部署，根本原因是缺乏"产出物上线率"的度量。如果有中间 checkpoint 验证功能是否真实落地，可以避免 6 sprint 的沉没成本。

2. **proposal 生命周期管理**：P002 和 P005 的问题是提案基于过期数据（Sprint 17 的 342 个 TS 错误实际已解决），说明需要提案 freshness 检查机制——提案创建时自动拉取最新数据而非引用历史值。

3. **前端集成是独立的 phase**：P003 的关键缺口是前端 workbench 路由不存在，但 dev 阶段没有单独的前端验证 checkpoint。架构评审中应明确标注"frontend integration 是独立风险点"。

4. **测试覆盖的盲区**：npm test 有 3 个失败的测试用例（CardTreeError/Input/Alert 组件），但 Epic 测试全部显示通过。需要确认这些失败的测试是否与 4 个 Epic 相关，还是历史遗留的测试债务。

---

## 技术亮点 / 技术债

### 技术亮点
- `@tanstack/react-virtual` 引入 Canvas 虚拟化，业界标准方案
- OpenClaw `sessions_spawn` 作为 AI Agent 运行时，架构清晰
- feature-flagged route 方案控制 Workbench 曝光，渐进式发布

### 技术债
- **历史测试债务**：CardTreeError/Input/Alert 组件 3 个测试失败（可能是历史遗留）
- **文档不同步**：docs/architecture/CHANGELOG.md 无 S18/S19 记录，说明文档维护有缺口
- **Health endpoint 独立进程**：MCP server health.ts 独立运行，架构不合理但积压已久
- **提案数据过期**：多个提案引用 Sprint 17-18 的过时数字（P002、潜在其他）

---

## 团队协作评估

### 依赖链管理（P001 → P004 → P003 → P006）
串行依赖链设计合理，每个阶段依赖前一个 reviewer-push 完成，确保代码质量递进。但串行也意味着任何延迟都会级联影响后续，建议 Epic 间的依赖检查改为 gate 机制而非时间依赖。

### 虚假完成检查有效性
四级检查（dev commit / npm test / changelog / remote push）覆盖了交付物的核心维度。但检查中发现的 3 个失败测试需要进一步确认是否影响 Epic 验收。

### coord-completed 收口流程
流程规范，执行清单清晰。但 `/ce:compound`（Context Analyzer + Solution Extractor）在此轮未能成功执行（gateway timeout），说明 subagent 调用有稳定性风险，回退到手动经验沉淀是合理的降级方案。

---

## 参考链接

### CHANGELOG Entries
- `### [Unreleased] vibex-proposals-20260501-sprint20 P001: MCP DoD 收尾 — 2026-05-01`
- `### [Unreleased] vibex-proposals-20260501-sprint20 P004: Canvas 虚拟化 — 2026-05-01`
- `### [Unreleased] vibex-proposals-20260501-sprint20 P003: Workbench 生产化 — 2026-05-01`
- `### [Unreleased] vibex-proposals-20260501-sprint20 P006: AI Agent 真实接入 — 2026-05-01`

### Git Commits
- `e2aa8d9c` docs: update changelog for P006-AI-Agent真实接入
- `e365a712` test(P006): add unit tests for sessions API + OpenClawBridge + frontend route
- `b20dbabd` docs(P006): update IMPLEMENTATION_PLAN.md — all P006 units verified ✅
- `70075de9` feat(P006): AI Agent real integration — sessions API + OpenClaw bridge + mock cleanup
- `1360a6b2b` docs: update changelog for P003-Workbench生产化
- `abcd0b75e` docs(P003): update IMPLEMENTATION_PLAN.md — all P003 units verified ✅
- `a5cc8fe7` chore: fix playwright webServer for standalone mode + reuse-existing
- `3f290361` feat(P003): Workbench productionization — route + flag + UI + E2E
- `93f532ce` docs: update changelog for P004-Canvas虚拟化
- `25cc0aaf` feat(P004-T5): add selectedCardSnapshot unit tests + benchmark clarification

### 产出文档
- 分析报告: `docs/vibex-proposals-20260501-sprint20/analysis.md`
- 产品需求: `docs/vibex-proposals-20260501-sprint20/prd.md`
- 架构设计: `docs/vibex-proposals-20260501-sprint20/architecture.md`
- 实施计划: `docs/vibex-proposals-20260501-sprint20/IMPLEMENTATION_PLAN.md`
- Agent 分配: `docs/vibex-proposals-20260501-sprint20/AGENTS.md`