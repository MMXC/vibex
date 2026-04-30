# VibeX Sprint 19 功能提案

**Agent**: analyst
**日期**: 2026-04-30
**项目**: vibex-sprint19
**仓库**: /root/.openclaw/vibex
**分析视角**: 基于 Sprint 1-18 交付成果的可行性评估与风险分析

---

## 1. 提案列表

| ID | 类别 | 标题 | 影响范围 | 优先级 |
|----|------|------|----------|--------|
| P001 | quality | mcp-server MCP Tool 治理缺失 | 开发者体验 | P0 |
| P002 | feature | Design Review 真实 MCP 集成 | 画布协作 | P1 |
| P003 | tech-debt | 后端 TS 债务残留 | 全栈 | P1 |
| P004 | feature | 版本历史增强：跨版本 Diff | 项目管理 | P2 |

---

## 2. 提案详情

### P001: mcp-server MCP Tool 治理缺失

**问题描述**:

Sprint 16 P2-2 产出了 MCP Tool Governance 文档（MCP_TOOL_GOVERNANCE.md、ERROR_HANDLING_POLICY.md），但 DoD 明确要求的三项基础设施未实现：
1. `docs/mcp-tools/INDEX.md` — 工具索引文档
2. `scripts/generate-tool-index.ts` — 自动生成脚本
3. `GET /health` 端点 — 健康检查入口

代码审查结果显示 `INDEX.md` + `generate-tool-index.ts` + `GET /health` 均未实现（S16-P2-2-DoD gaps 明确记录）。MCP Tool 的可发现性为零——新开发者不知道有哪些工具、输入输出格式是什么。

**根因分析**

```
根因: DoD 验证缺失 — PRD 写明了验收标准(2-2.4/2-2.5)但未执行自动化验证
证据:
- CHANGELOG.md 明确记录 "⚠️ DoD gaps: INDEX.md + generate-tool-index.ts + GET /health 未实现"
- docs/vibex-sprint16/ 下无 INDEX.md 文件
- packages/mcp-server/src/index.ts 无 /health 路由
- 没有 CI gate 验证 DoD 完成度
```

**影响范围**: MCP Tool 开发者体验，新工具上线时必须手动维护文档

**验收标准**:
- [ ] `docs/mcp-tools/INDEX.md` 存在且包含所有已注册工具
- [ ] `scripts/generate-tool-index.ts` 可独立运行（`node scripts/generate-tool-index.ts`）
- [ ] `GET /v1/health` 返回 `{ status, version, tools: { registered, names } }`
- [ ] `pnpm run build` → 0 errors
- [ ] 新增 MCP tool 后，上述三项自动更新或 CI 失败

---

### P002: Design Review 真实 MCP 集成

**问题描述**:

Sprint 16 P0-1 实现了 Design Review UI（ReviewReportPanel + Ctrl+Shift+R 快捷键），但 `review_design` MCP 调用是 mock 的——模拟 1.5s 延迟返回假数据。真实设计评审能力从未验证过可用性。

Sprint 12 E9 已实现 `review_design.ts` MCP tool（Sprint 12 CHANGELOG 记录），但前端调用的是假数据路径。这意味着用户按 Ctrl+Shift+R 看到的结果集是伪造的，与真实 AI 评审结果可能完全不同。

**根因分析**

```
根因: UI 层与后端 MCP 层集成链路断裂 — 前端 useDesignReview 走了 mock 路径
证据:
- CHANGELOG S16-P0-1: "Mock review_design MCP call with 1.5s simulated delay"
- packages/mcp-server/src/tools/reviewDesign.ts 在 S12 已实现
- 前端 useDesignReview hook 未调用真实 MCP endpoint
- 没有任何 E2E 测试验证真实 MCP 集成链路
```

**影响范围**: 画布用户，Design Review 功能形同虚设

**验收标准**:
- [ ] `useDesignReview` 调用真实 MCP endpoint（而非 mock）
- [ ] ReviewReportPanel 展示真实 AI 评审结果（compliance/a11y/reuse）
- [ ] 离线/未配置状态有 graceful degradation（显示 "Design Review 暂不可用"）
- [ ] E2E 测试覆盖真实 MCP 集成路径
- [ ] `pnpm run build` → 0 errors

---

### P003: 后端 TS 债务残留

**问题描述**:

Sprint 11/12 两轮清理后，后端 TypeScript 编译仍有错误残留。S16 E1-U3 记录 "67处 `as any` 大部分在 test/schema 场景"，但无明确清理计划。S17-E3-U2/U3 defer 了 TS 严格模式修复（"342 errors from noUncheckedIndexedAccess require ~2-3d full-scopes fix"）。

从 CHANGELOG 追踪：S7-E1 已建立 `as any` 基线（163 个 pre-existing），但没有后续清理追踪机制。

**根因分析**

```
根因: 无增量 TS 债务管控机制 — 每个 Sprint 引入新 as any 但无 Gate
证据:
- AS_ANY_BASELINE.md 建立了基线但无 CI 增量检查
- S17 明确 defer 了 342 个 noUncheckedIndexedAccess 错误
- CI 有 typecheck-backend gate 但无 as-any-incremental gate
- S16 E1-U3 "67处 as any 大部分在 test/schema" 分类后无清理计划
```

**影响范围**: 全栈开发质量，技术债持续累积

**验收标准**:
- [ ] 量化当前后端 `as any` 总数（对照 S7 基线 163）
- [ ] 建立增量检查：每个 PR 新增 `as any` 不得超过 3 个（需 CI gate）
- [ ] noUncheckedIndexedAccess 错误从 342 降至 < 50（一个 Sprint 可完成）
- [ ] `pnpm exec tsc --noEmit` → 0 errors（backend）
- [ ] `as any` 总数不高于 S7 基线

---

### P004: 版本历史增强：跨版本 Diff

**问题描述**:

Sprint 16 P2-1 实现了 Canvas 版本历史（快照创建/恢复/30s 自动保存），Sprint 6 E3 实现了 VersionDiff（结构差异对比）。但两者未集成——用户可以在 Version History 面板看到历史快照，却无法选择两个快照对比差异。

用户要对比项目在不同时间点的变化，必须手动导出再对比，效率极低。

**根因分析**

```
根因: 版本历史与 Diff 功能各自独立，未形成完整用户体验闭环
证据:
- CHANGELOG S16-P2-1: VersionHistoryPanel 已实现快照列表
- CHANGELOG S6-E3: VersionDiff 可计算两个快照的结构差异
- docs/backlog-sprint17.md FR-003 "项目版本对比" 标记为 P1
- 两者之间无 UI 桥接：无法从 VersionHistoryPanel 跳转 VersionDiff
```

**影响范围**: 画布项目用户，需要版本追溯的团队

**验收标准**:
- [ ] VersionHistoryPanel 添加 "对比" 按钮（选择两个快照时激活）
- [ ] 点击 "对比" 跳转 `/canvas/version?compare=snapA,snapB`
- [ ] 对比页面展示新增/删除/修改的节点
- [ ] `pnpm run build` → 0 errors
- [ ] E2E 测试覆盖对比路径

---

## 3. 相关文件

- CHANGELOG.md: `CHANGELOG.md`
- Backlog: `docs/backlog-sprint17.md`
- Feature Requests: `FEATURE_REQUESTS.md`
- MCP Governance: `docs/vibex-sprint16/MCP_TOOL_GOVERNANCE.md`
- Error Handling: `docs/vibex-sprint16/ERROR_HANDLING_POLICY.md`
- Design-to-Code Verification: `docs/vibex-sprint16/design-to-code-verification.md`
- Version Diff: `packages/mcp-server/src/tools/reviewDesign.ts`

---

## 4. 风险矩阵

| 提案 | 风险项 | 可能性 | 影响 | 风险等级 | 缓解方案 |
|------|--------|--------|------|----------|----------|
| P001 | MCP index 生成依赖工具注册顺序 | 低 | 低 | 🟢 | 先 hardcode 再迭代生成脚本 |
| P002 | 真实 MCP 调用链路不稳定 | 中 | 中 | 🟡 | graceful degradation 先做 |
| P003 | noUncheckedIndexedAccess 修复面大 | 高 | 低 | 🟡 | 分 Epic，按文件逐个击破 |
| P004 | 快照数据结构变化导致 Diff 失效 | 低 | 高 | 🟡 | Schema evolution plan 先于 Diff |

---

## 5. 工期估算

| 提案 | 预估工时 | 复杂度 | 依赖 | Sprint 建议 |
|------|----------|--------|------|-------------|
| P001 | 2-3h | 低 | 无 | Sprint 19 Week 1 |
| P002 | 1d | 中 | P001（真实 MCP 链路） | Sprint 19 Week 1 |
| P003 | 2-3d | 高 | 无 | Sprint 19 Week 1-2 |
| P004 | 1d | 中 | S16-P2-1 VersionHistory | Sprint 19 Week 2 |

**总工时**: 约 4-6 人日

---

## 6. 执行决策

- **决策**: 已采纳
- **执行项目**: vibex-sprint19
- **执行日期**: 2026-04-30
- **执行顺序**: P001 → P002 → P004（解耦可并行），P003 独立 track
- **注意**: P002 依赖真实 MCP 链路，先决条件是 P001 INDEX.md 建立后确认工具注册机制

---

## 7. RICE 评分

| 提案 | Reach | Impact | Confidence | Effort | RICE | 推荐 |
|------|-------|--------|-------------|--------|------|------|
| P001 MCP治理 | 3 | 3 | 3 | 3 | 9 | ✅ |
| P002 DR真实集成 | 3 | 3 | 2 | 3 | 6 | ✅ |
| P003 TS债务 | 3 | 2 | 3 | 3 | 6 | ✅ |
| P004 版本Diff | 2 | 2 | 2 | 3 | 2.7 | 🟡 |

---

*生成时间: 2026-04-30 11:25 GMT+8*
*Analyst Agent | VibeX Sprint 19*
