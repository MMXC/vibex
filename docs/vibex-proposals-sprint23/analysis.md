# VibeX Sprint 23 提案分析报告

**Agent**: analyst
**日期**: 2026-05-03
**项目**: vibex-proposals-sprint23
**分析视角**: Analyst — gstack 验证提案问题真实性

---

## 审查结论

| 提案 | 问题真实性 | 状态 | 说明 |
|------|-----------|------|------|
| P001 | ⚠️ 部分真实 | **降级** | E2E CI job 已存在于 CI workflow，但 Slack 报告链路缺失 |
| P002 | ✅ 真实 | **通过** | Design Review 单向输出，无反馈闭环机制 |
| P003 | ✅ 真实 | **通过** | PresenceAvatars 无 cursor tracking，无 RemoteCursor 组件 |
| P004 | ✅ 真实 | **通过** | DDSToolbar 导出仅支持 JSON/Mermaid，无 PlantUML/SVG/JSON Schema |
| P005 | ✅ 真实 | **通过** | 模板库仅 localStorage，无版本管理/跨设备同步/团队分享 |

---

## 业务场景分析

### P001: E2E CI Gate 收尾落地

**gstack 验证结果**：

代码审计发现 `.github/workflows/test.yml` 中 **已存在** `e2e-staging` job，且：
- 执行 `pnpm --filter vibex-fronted run test:e2e:ci`
- staging health check（curl 3次重试）在 job 中存在
- BASE_URL 域名验证（禁止 vibex.top）存在
- merge-gate job 要求 `needs.e2e.result == "success"`
- E2E flaky monitor 在 CI 中执行

**真实部分**: CI E2E gate 已落地，S21 staging isolation 成果已被 CI 集成。

**缺失部分**（提案未识别）:
- `scripts/e2e-summary-to-slack.ts` 未在 CI job 中被调用（提案验收标准之一）
- Playwright HTML/JSON reporter 输出到 Slack 的链路断裂
- 没有 E2E 报告上传到 Slack #analyst-channel 的自动化步骤

**提案降级**: P001 从 P0 降为 P1 — CI gate 已完成，Slack 报告链路是剩余的唯一缺口。

### P002: Design Review 反馈闭环

**gstack 验证结果**：

代码审计发现：
- `ReviewReportPanel.tsx`: 仅有 issue 列表展示 + tab 切换，无"重新评审"按钮、无 diff 视图
- `useDesignReview.ts`: 无 snapshot 对比能力、无 history 记录
- 无 `canvasVersionId` 参数传递给 `review_design` 调用
- `VersionHistoryPanel` 与 Design Review 完全独立，无集成

**问题真实性**: ✅ 真实。用户看到评审结果后无法验证修复效果。

### P003: 多人实时协作 Cursor 同步

**gstack 验证结果**：

代码审计发现：
- `PresenceAvatars.tsx`: 仅渲染 avatar 列表，无 cursor tracking 逻辑
- `cursor.json`: 是 Canvas 设计风格 catalog（cursor 风格主题），不是 cursor sync 组件
- 无 `RemoteCursor` 组件或相关文件
- `firebase-presence.spec.ts` 只测试在线状态，不测试 cursor sync

**问题真实性**: ✅ 真实。Firebase Presence 仅实现在线状态，cursor 同步从未开始。

### P004: Canvas 导出格式扩展

**gstack 验证结果**：

代码审计发现 `DDSToolbar.tsx` 导出模态框支持格式：
- JSON（`exportDDSCanvasData`）
- Vibex
- OpenAPI
- StateMachine（Mermaid）

缺失格式：PlantUML / SVG / JSON Schema。

搜索 `grep -r "plantuml\|PlantUML\|svg.*export\|json.*schema.*export"` 无结果。

**问题真实性**: ✅ 真实。B6 backlog 项持续遗留。

### P005: 需求模板库深耕（版本+分享）

**gstack 验证结果**：

代码审计发现：
- `useTemplates.ts`: customTemplates 仅存 `localStorage` key，无跨设备同步
- 无 template version/history 相关代码
- 无 template share/fork 功能
- `industry-templates.json`: 仅有 4 个固定模板（ecommerce/social/saS/blank）
- CHANGELOG S22 Epic4: 交付物为 "NewProjectModal 模板选择 + industry-templates.json + useTemplates hook"，无版本管理/分享

**问题真实性**: ✅ 真实。模板库基础完成，生态层缺失。

---

## 技术方案选项

### P001: E2E Slack 报告链路

**方案 A（推荐）: CI 步骤集成**
- 在 `.github/workflows/test.yml` e2e job 末尾添加 `pnpm --filter vibex-fronted run e2e:summary:slack`
- `e2e-summary-to-slack.ts` 读取 Playwright JSON report，生成 Slack Block Kit 消息
- 发送到 `#analyst-channel`（通过 `secrets.SLACK_WEBHOOK_URL`）
- 预估工时: 1-2h（无新文件，仅 CI 步骤配置）

**方案 B: GitHub Actions Artifact → Slack**
- 上传 Playwright HTML report 到 GitHub artifact
- 通过 `google-github-actions/upload-cloud-storage` 或 Slack webhook 下载并发送
- 预估工时: 3-4h（需要额外 secret 配置）

### P002: Design Review 反馈闭环

**方案 A（推荐）: 轻量 diff**
- 在 `ReviewReportPanel` 添加"重新评审"按钮
- 调用 `useDesignReview.review()` 时传入 `previousReportId`（从 localStorage 获取）
- 后端 `/api/mcp/review_design` 对比前后两次评审结果，返回 `diff: { added: [], removed: [], unchanged: [] }`
- 前端 diff 视图用绿色/红色标记变化
- 预估工时: 4-6h

**方案 B: 完整 VersionHistory 集成**
- 将 Design Review 结果存入 `VersionHistoryPanel` snapshot
- 用户可在 VersionHistory 中查看任意时间点的评审结果
- 需要新增 `DesignReviewSnapshot` 类型与 `useVersionHistory` 集成
- 预估工时: 6-8h

### P003: 多人实时协作 Cursor 同步

**方案 A（推荐）: Firebase Cursor Channel**
- 在现有 Firebase presence channel 中新增 `cursor: { x, y, nodeId, timestamp }` 字段
- 鼠标移动时 throttle 100ms 写入 Firebase（仅移动时写，不渲染时跳过）
- 新增 `RemoteCursor` 组件：显示其他用户的 cursor icon + username label + nodeId 提示
- Firebase mock 模式下：RemoteCursor 不渲染
- 预估工时: 5-7h（跨 store 改造）

**方案 B: Canvas 原生 SVG Overlay**
- 在 Canvas DOM 上方覆盖 SVG layer 渲染 remote cursors
- 通过 WebSocket（而非 Firebase）同步 cursor 位置
- 需要新增 WebSocket server endpoint
- 预估工时: 8-12h（新增后端依赖）

### P004: Canvas 导出格式扩展

**方案 A（推荐）: 分阶段实现**
- Phase 1: PlantUML exporter（简单字符串模板转换，2h）
- Phase 2: JSON Schema exporter（从 API endpoints 数据结构生成，2h）
- Phase 3: SVG exporter（Canvas DOM → SVG via html2canvas 或原生 SVG 渲染，3h）
- 降级策略：SVG 导出失败时显示"当前视图不支持 SVG 导出"
- 预估工时: 7h（分阶段）

**方案 B: 全量实现**
- 三个格式同时实现，统一 export service
- 预估工时: 5-6h（并行开发，但测试覆盖不足风险）

### P005: 需求模板库深耕（版本+分享）

**方案 A（推荐）: 本地优先，后端跟进**
- Phase 1（localStorage）: 模板导入/导出 JSON 文件（2h）+ 模板版本历史（2h）
- Phase 2（后端存储）: 模板分享 link + team fork（列入 Sprint 24+）
- 自定义模板存 localStorage，用户可手动 export/import 迁移
- 预估工时: 4h（Phase 1），后端部分待定

**方案 B: 全功能后端化**
- 模板存 backend DB，支持 CRUD + version + share
- 需要新增 template service + API routes + DB migrations
- 预估工时: 8-10h（含后端）

---

## 可行性评估

| 提案 | 技术可行性 | 风险 | 结论 |
|------|-----------|------|------|
| P001 | ✅ 高 | Slack webhook secret 配置 | 通过 |
| P002 | ✅ 高 | diff 计算增加 API 延迟 | 通过 |
| P003 | 🟡 中 | Firebase cursor 写入频率 + 跨 store 同步 | 有条件通过（先做 PresenceAvatars 扩展） |
| P004 | ✅ 高 | SVG 导出依赖 DOM 渲染 | 通过（降级策略） |
| P005 | ✅ 高 | 后端存储部分需 Sprint 24+ | 通过（先做本地功能） |

---

## 风险识别（初步）

| 提案 | 风险项 | 可能性 | 影响 | 缓解方案 |
|------|--------|--------|------|----------|
| P001 | Slack webhook 未配置 | 低 | 中 | CI job 添加 if 条件，webhook 缺失时跳过 |
| P002 | diff 视图与现有 panel 布局冲突 | 中 | 低 | ReviewReportPanel 作为 overlay，避免修改 panel 结构 |
| P003 | Firebase cursor 写入导致 DB 费用增加 | 中 | 高 | throttle 100ms + 仅移动时写 + 上限 10 users |
| P004 | SVG 导出在 SSR 模式下失败 | 低 | 低 | 降级文案，不需要 fallback |
| P005 | localStorage 模板与后端模板混用导致 UX 混乱 | 中 | 中 | Phase 1 明确标注"本地模板"，不与后端模板混合 |

---

## 验收标准（可测试）

### P001
- [ ] `.github/workflows/test.yml` e2e job 末尾调用 `e2e:summary:slack`
- [ ] E2E 完成后 Slack 收到带 pass/fail 摘要的报告消息
- [ ] CI job exit code 与 E2E 结果一致

### P002
- [ ] ReviewReportPanel 有"重新评审"按钮（`data-testid="re-review-btn"`）
- [ ] 重新评审后 diff 视图显示 added（红）/ removed（绿）问题
- [ ] `useDesignReview` 支持 `previousReportId` 参数
- [ ] `pnpm run build` → 0 errors

### P003
- [ ] RemoteCursor 组件存在（`src/components/presence/RemoteCursor.tsx`）
- [ ] 多用户 cursor 位置通过 Firebase 同步
- [ ] Firebase mock 模式下 RemoteCursor 不渲染
- [ ] E2E 测试覆盖 cursor sync 场景

### P004
- [ ] DDSToolbar 导出模态框添加 PlantUML / SVG / JSON Schema 选项
- [ ] PlantUML 导出文件可被 StarUML 打开
- [ ] SVG 导出文件可被 Figma 导入
- [ ] `pnpm run build` → 0 errors

### P005
- [ ] 自定义模板支持导入/导出 JSON 文件
- [ ] 模板版本历史可查看（最多 10 个 snapshot）
- [ ] 模板可分享（生成 shareable link，Phase 1 先做 export）
- [ ] `pnpm run build` → 0 errors

---

## 审查结论

| 提案 | 结论 | 理由 |
|------|------|------|
| P001 | ⚠️ **降级通过** | CI E2E gate 已完成，Slack 报告链路是唯一缺口，P0 → P1 |
| P002 | ✅ **通过** | 问题真实，方案可行 |
| P003 | ⚠️ **有条件通过** | Firebase cursor sync 复杂度高，建议分 Epic 先做 PresenceAvatars 扩展 |
| P004 | ✅ **通过** | 问题真实，分阶段实现风险可控 |
| P005 | ✅ **通过** | 本地功能优先，后端部分待 Sprint 24+ |

---

*生成时间: 2026-05-03 03:45 GMT+8*
*Analyst Agent | VibeX Sprint 23 Review*