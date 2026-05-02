# VibeX Sprint 23 功能提案规划

**Agent**: analyst
**日期**: 2026-05-03
**项目**: vibex-proposals-sprint23
**仓库**: /root/.openclaw/vibex
**分析视角**: Analyst — 基于 Sprint 1-22 交付成果，识别下一批高优先级功能增强

---

## 1. 提案列表

| ID | 类别 | 标题 | 影响范围 | 优先级 |
|----|------|------|----------|--------|
| P001 | quality | E2E CI Gate 收尾落地 | CI pipeline，发布可靠性 | P0 |
| P002 | feature | Design Review 反馈闭环 | 画布用户，AI 评审可信度 | P1 |
| P003 | feature | 多人实时协作 Cursor 同步 | 企业用户，多人画布 | P1 |
| P004 | feature | Canvas 导出格式扩展 | 所有用户，导出灵活性 | P2 |
| P005 | feature | 需求模板库深耕（版本+分享） | 新用户，模板生态系统 | P2 |

---

## 2. 提案详情

### P001: E2E CI Gate 收尾落地

**问题描述**:

Sprint 21 完成了 staging 环境隔离（S21-E2E-Staging-Isolation: 移除 BASE_URL 生产 fallback + staging health check + db-reset + slack-summary），Sprint 22 Epic1 实现了 `api/mcp/review_design` route，但整个 E2E 测试套件从未在 CI gate 中执行。

当前状态：
- `scripts/e2e-db-reset.ts` 完成
- `scripts/e2e-summary-to-slack.ts` 完成
- `.github/workflows/test.yml` 无 e2e job
- Playwright 测试套件（`tests/e2e/`）需手动触发

**影响范围**: CI pipeline，发布可靠性，任何 PR 都可能带未检测到的 E2E 回归

**根因**:
```
根因: E2E 测试建设持续 (S2-S22) 但 CI 执行 gate 始终缺失
证据:
- CHANGELOG S21 "CI E2E staging 环境强制隔离" 仅完成环境准备，无 job 集成
- CHANGELOG S22 "MCP Design Review 集成" 未提及 E2E CI
- .github/workflows/test.yml 中无 e2e-staging job
- FEATURE_REQUESTS.md: 无 E2E CI 相关功能（说明未进入产品视野）
- backlog-sprint17.md B5 (RICE:81 P0) "CodeGenerator E2E 测试补全" 仍未解决
```

**验收标准**:
- [ ] `.github/workflows/test.yml` 包含 `e2e-staging` job（staging health check 通过后执行 Playwright）
- [ ] `pnpm test:e2e` 在 CI 中可执行，`--reporter=html,json`
- [ ] 关键路径 E2E 测试（canvas-journey + workbench-journey）在 PR gate 中必须通过
- [ ] E2E 报告通过 `e2e-summary-to-slack.ts` 自动发送到 Slack #analyst-channel
- [ ] CI e2e job exit code 与测试结果一致（failures → job failure）

### P002: Design Review 反馈闭环

**问题描述**:

Sprint 22 Epic1 实现了 `api/mcp/review_design` route（调用 `callReviewDesignTool` from `mcp-bridge.ts`），Sprint 16 P0-1 实现了 ReviewReportPanel UI（3 tab + severity badge），Sprint 20 P006 实现了 Agent 会话。

但当前 Design Review 是单向的：AI 输出评审结果 → 用户看到报告 → 结束。没有机制让用户基于评审结果修正设计并重新验证。

用户真实场景：
1. 触发 Design Review → 看到 10 个问题
2. 手动修复了 3 个
3. **无法验证修复效果**（没有"重新评审"按钮或 diff 视图）

**影响范围**: 画布用户，AI 评审从"一次性报告"升级为"持续改进闭环"

**根因**:
```
根因: Design Review 输出与 Canvas 状态之间缺少反馈链路
证据:
- ReviewReportPanel 只有"查看问题"功能，无"验证修复"功能
- useDesignReview hook 无 snapshot 对比能力
- CHANGELOG 无 "Design Review diff" 或 "re-review" 相关条目
- review_design MCP tool 输出格式无 sessionId/versionId，无法关联历史
```

**验收标准**:
- [ ] ReviewReportPanel 添加"重新评审"按钮（对比上次 snapshot）
- [ ] diff 视图显示：已修复问题（green checkmark）+ 新发现问题（red）
- [ ] 历史评审记录可查看（VersionHistoryPanel 已有 snapshot 机制）
- [ ] review_design 调用携带 canvasVersionId，支持 diff 对比
- [ ] `pnpm run build` → 0 errors

### P003: 多人实时协作 Cursor 同步

**问题描述**:

Sprint 22 Epic3 实现了 PresenceAvatars（团队边框 + RBAC toolbar buttons），Sprint 17 E2 实现了 Firebase Presence E2E（5-user concurrent presence delay < 3s），Sprint 17 E1 实现了 Firebase Mock 降级策略。

但当前 PresenceAvatars 只显示"谁在线"（avatar 列表），没有同步用户在 Canvas 中的光标位置。

用户真实场景：
- 用户 A 在修改 BoundedContext X
- 用户 B 看到 A 的 avatar 显示在线，但不知道 A 在操作哪个节点
- B 可能同时修改 X，产生冲突

竞品对标：Figma、Miro、Notion 均实现了实时 cursor 同步。

**影响范围**: 企业用户，多人画布协作场景

**根因**:
```
根因: Firebase Presence 仅实现了在线状态同步，未扩展为 Cursor 同步
证据:
- CHANGELOG S17 E2: "5-user concurrent presence delay < 3s" 仅测量 presence，未测 cursor
- PresenceAvatars.tsx 仅有 avatar list，无 cursor tracking
- FEATURE_REQUESTS.md FR-004 "团队协作空间" 标记 P1，cursor sync 未列入
- 无 "RemoteCursor" 组件或相关 CHANGELOG 条目
```

**验收标准**:
- [ ] RemoteCursor 组件：显示其他用户的鼠标位置 + 用户名 label
- [ ] Cursor 位置通过 Firebase Realtime Database 同步（复用现有 presence channel）
- [ ] 当用户悬停/选中节点时，cursor 显示"正在操作 X 节点"提示
- [ ] cursor sync 在 Firebase unconfigured/mock 状态下优雅降级（不渲染 cursor）
- [ ] E2E 测试覆盖多用户 cursor sync 场景

### P004: Canvas 导出格式扩展

**问题描述**:

backlog-sprint17.md B6 识别了"实体关系图导出增强（格式支持）"（PlantUML/SVG/JSON Schema），RICE:24 P2，但从未实现。

当前导出能力：
- JSON（`exportDDSCanvasData`）
- Mermaid（`exportToStateMachine`）
- Vibex format

缺失格式：
- PlantUML（企业用户用于 Archi 等工具）
- SVG 图片（PPT/文档直接使用）
- JSON Schema（API 文档自动化）

**影响范围**: 所有用户，导出灵活性

**根因**:
```
根因: 导出功能建设停留在 JSON/Mermaid，未扩展到企业场景常用格式
证据:
- backlog-sprint17.md B6 识别但未实现
- DDSToolbar.tsx 导出模态框仅支持 JSON/Vibex/OpenAPI/StateMachine
- 无 PlantUML/SVG/JSON Schema exporter 相关代码
```

**验收标准**:
- [ ] DDSToolbar 导出模态框添加 PlantUML 选项
- [ ] 添加 SVG 图片导出（Canvas → SVG 渲染）
- [ ] 添加 JSON Schema 导出（API endpoints → JSON Schema）
- [ ] 各格式导出后格式正确（PlantUML 可被 StarUML 打开，SVG 可被 Figma 导入）
- [ ] `pnpm run build` → 0 errors

### P005: 需求模板库深耕（版本+分享）

**问题描述**:

Sprint 22 Epic4 实现了模板选择 Modal + industry-templates.json + useTemplates hook（懒加载 + localStorage 自定义模板管理），Sprint 18 E18-CORE-1 识别了需求模板库作为 top priority。

但当前模板能力：
- 只有 4 个固定行业模板（ecommerce/social/saS/blank）
- 自定义模板仅存储在 localStorage（换设备即丢失）
- 无模板版本管理（无法追踪模板变更历史）
- 无模板分享（无法在团队内共享）

**影响范围**: 新用户，模板生态系统完整度

**根因**:
```
根因: 模板库基础功能完成，但缺少生态层（版本管理/跨设备同步/团队共享）
证据:
- CHANGELOG S22 Epic4: "industry-templates.json 4 templates" 仅完成静态模板
- useTemplates.ts: customTemplates 存 localStorage（单设备限制）
- 无模板 version/history 相关代码
- FEATURE_REQUESTS.md FR-001 "需求模板库" 标记 P0，但未继续建设
```

**验收标准**:
- [ ] 自定义模板支持导入/导出（JSON 文件），换设备可迁移
- [ ] 模板版本历史（每次修改生成 snapshot，最多保留 10 个）
- [ ] 模板可分享（生成 shareable link，团队成员可 fork）
- [ ] 模板分类标签（可按行业/场景/复杂度过滤）
- [ ] `pnpm run build` → 0 errors

---

## 3. 相关文件

- CHANGELOG.md: Sprint 1-22 全量交付追踪
- `docs/backlog-sprint17.md`: B6（导出格式）、B5（E2E 测试）仍未解决
- `vibex-fronted/src/components/design-review/ReviewReportPanel.tsx`: 设计评审面板
- `vibex-fronted/src/components/presence/PresenceAvatars.tsx`: 在线状态展示
- `packages/mcp-server/src/tools/reviewDesign.ts`: MCP review_design tool
- `vibex-fronted/src/hooks/useDesignReview.ts`: Design Review hook
- `vibex-fronted/src/components/dds/toolbar/DDSToolbar.tsx`: 导出功能

---

## 4. 风险矩阵

| 提案 | 风险项 | 可能性 | 影响 | 风险等级 | 缓解方案 |
|------|--------|--------|------|----------|----------|
| P001 | E2E 测试 flaky 导致 CI 红 | 中 | 高 | 🟠 | staging isolation 已完成，先跑关键路径（canvas + workbench） |
| P002 | review_design snapshot 对比增加 MCP 调用量 | 中 | 中 | 🟡 | 仅在用户主动点击"重新评审"时触发，不自动 |
| P003 | Firebase cursor sync 增加 DB 写入频率 | 高 | 中 | 🟠 | 节流（throttle 100ms）+ 仅在移动时写，避免频繁更新 |
| P004 | SVG 导出依赖 Canvas DOM 结构 | 中 | 低 | 🟡 | 降级：导出失败时提示"当前视图不支持 SVG 导出" |
| P005 | 模板分享需要后端存储支持 | 高 | 高 | 🔴 | 先做本地功能（import/export），后端存储列入 Sprint 24+ |

---

## 5. 工期估算

| 提案 | 预估工时 | 复杂度 | 依赖 | Sprint 建议 |
|------|----------|--------|------|-------------|
| P001 | 3-5h | 中 | S21 staging isolation + S22 review_design route | Sprint 23 Week 1 |
| P002 | 4-6h | 中 | S22 ReviewReportPanel + useDesignReview | Sprint 23 Week 1 |
| P003 | 6-8h | 高 | S17 Firebase Presence + S22 PresenceAvatars | Sprint 23 Week 2（分 Epic） |
| P004 | 3-4h | 低 | 无 | Sprint 23 Week 1 |
| P005 | 4-6h | 中 | S22 模板库基础 | Sprint 23 Week 2 |

**总工时**: 约 5-7 人日

---

## 6. 执行决策

- **决策**: 待评审
- **执行项目**: vibex-proposals-sprint23
- **执行日期**: 待定
- **执行顺序**: P001 → P002 → P004（可并行，Week 1）；P003/P005 独立 track（Week 2）

---

## 7. Sprint 22 未完成项追踪

| 原提案 | 原 Sprint | 状态 | Sprint 23 行动 |
|--------|-----------|------|----------------|
| P002 E2E CI Gate | S22 | 🔴 未完成 | P001 本 Sprint 收尾 |
| P001 Design Review 反馈闭环 | S22 | 🟡 部分 | P002 本 Sprint 完善 |
| P003 Teams 协作 Cursor | S22 | 🔴 未开始 | P003 本 Sprint 实现 |

---

*生成时间: 2026-05-03 03:30 GMT+8*
*Analyst Agent | VibeX Sprint 23*