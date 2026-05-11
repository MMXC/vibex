# VibeX Sprint 36 提案分析报告

**Agent**: analyst
**日期**: 2026-05-11
**项目**: vibex-proposals-sprint36
**仓库**: /root/.openclaw/vibex
**分析视角**: gstack 验证 — 交叉验证提案问题真实性 + 技术方案评审

---

## 验证摘要

| 提案 | 验证状态 | 问题真实性 | 技术可行性 |
|------|----------|------------|------------|
| P001 多人协作 MVP | ✅ 已验证 | 真实（Firebase presence 已集成但 RemoteCursor 未挂载） | 可行（基础设施已有） |
| P002 模板市场 MVP | ✅ 已验证 | 真实（Dashboard 模板页存在但无 marketplace API） | 可行（CRUD API 已完成） |
| P003 MCP DoD 补全 | ✅ 已验证 | 真实（INDEX.md 存在，/health 已在 index.ts 集成） | 可行（实现已存在） |
| P004 撤销重做 UI | ✅ 已验证 | 部分失实（useKeyboardShortcuts 已连接 canvasHistoryStore） | 可行（Toolbar 无 undo/redo 按钮） |
| P005 Design Review E2E | ✅ 已验证 | 真实（design-review-mcp.spec.ts 已存在） | 可行（MCP 集成已有） |

---

## 业务场景分析

### P001: 多人协作 MVP

**业务场景**: 当多个用户同时在同一个 Canvas 上协作时，每个用户需要实时看到：
1. 其他用户的鼠标位置（RemoteCursor）
2. 其他用户正在执行的操作类型（IntentionBubble）
3. 当前在线用户列表（PresenceAvatars）

**现状验证**:
- `usePresence` 已集成到 DDSCanvasPage（第 260 行），`updateCursor` 每 100ms 节流广播（第 269-280 行）
- `PresenceAvatars` 已挂载（第 673 行），仅在 `isFirebaseConfigured()` 时显示
- **缺失**: `RemoteCursor` 组件存在（`vibex-fronted/src/components/presence/RemoteCursor.tsx`）但未在 DDSCanvasPage 中渲染
- **缺失**: `IntentionBubble` 存在但未与 presence 联动
- `useRealtimeSync` hook 存在但**未在 DDSCanvasPage 中使用**，仅做节点同步而非光标同步

**结论**: 提案 P001 问题真实，Firebase presence 基础设施存在但 RemoteCursor 未挂载到 Canvas。

---

### P002: 模板市场 MVP

**业务场景**: 用户希望在 Dashboard 的模板页面主动浏览和发现模板，而不是只能通过 Onboarding 被动看到。

**现状验证**:
- `/dashboard/templates` 页面存在（`vibex-fronted/src/app/dashboard/templates/page.tsx`），显示 `templateApi` 加载的模板列表
- `templateApi.getTemplates()` 存在，模板数据结构为 `IndustryTemplate`（含 industry/description/tags/icon 字段）
- **缺失**: `/api/templates/marketplace` 后端接口不存在（仅 CRUD 的 `/v1/templates`）
- S35-P004 调研结论：MVP 只读市场安全风险可控，GitHub Gist 方案 2-3 人天

**结论**: 提案 P002 问题真实，市场展示层和后端接口均缺失，S35-P004 调研结论可直接复用。

---

### P003: MCP Tool Governance DoD 补全

**业务场景**: MCP tool 文档需要与代码同步，维护者需要自动化的文档生成脚本和健康检查端点。

**现状验证**:
- `docs/mcp-tools/INDEX.md` **已存在**（7 tools，auto-generated at 2026-04-30）
- `scripts/generate-tool-index.ts` **已存在**且完整（解析 `tools/list.ts` → markdown table）
- `packages/mcp-server/src/index.ts` 第 64-66 行：`setupHealthEndpoint(3100)` 在 stdio transport 之前启动
- **原始 DoD gap 已解决**：原 S16-P2-2 记录的 gap 在 S17-E1-U3/U4 中已被修复

**结论**: 提案 P003 需更新——DoD gaps 已补全，但可补充"定期运行 generate-tool-index.ts 验证同步"的 CI gate。

---

### P004: 撤销/重做 UI 集成与快捷键绑定

**业务场景**: 用户在 Canvas 上编辑时，需要通过快捷键或 Toolbar 按钮撤销/重做操作。

**现状验证**:
- `useKeyboardShortcuts` **已连接** `canvasHistoryStore`（第 405-416 行：undoCallback = useCanvasHistoryStore.getState().undo()，redo 同理）
- `ShortcutPanel.tsx` 引用了 `Ctrl+Z`、`Ctrl+Shift+Z`、`Ctrl+Y` 快捷键说明
- **缺失**: `DDSToolbar.tsx` 中**无 Undo/Redo 按钮**（grep 结果：无 undo/redo 相关代码）

**结论**: 提案 P004 部分失实——快捷键绑定已完成，Toolbar 按钮缺失是唯一剩余项。预计工时从 1-2 人天降至 **0.5 人天**。

---

### P005: AI Design Review E2E 闭环验证

**业务场景**: Design Review 功能需要端到端测试覆盖，包括真实 API 调用路径和降级路径。

**现状验证**:
- `vibex-fronted/tests/e2e/design-review-mcp.spec.ts` **已存在**（覆盖 POST /api/mcp/review_design → 200 + mcp.called）
- `design-review.spec.ts` 使用 `page.route()` mock 了 `/api/mcp/review_design`（第 50/66 行），覆盖 UI 交互测试
- `Ctrl+Shift+R` 快捷键触发 real POST 的 E2E 测试已存在（design-review.spec.ts 第 10-12 行 TC1）
- ReviewReportPanel 存在于 DDSCanvasPage（第 711 行）

**结论**: 提案 P005 需更新——E2E 测试已存在，但可补充以下验证：
1. MCP server 不可达时的降级路径测试
2. 评审结果三 tab（compliance/a11y/reuse）渲染验证

---

## 技术方案选项

### P001: 多人协作 MVP

**方案 A（推荐）**: 在 DDSCanvasPage 中挂载 RemoteCursor + 调用 useRealtimeSync
- 描述：在 Canvas overlay 层渲染 RemoteCursor（订阅 Firebase RTDB 其他用户 cursor 位置）；添加 useRealtimeSync 订阅远程节点变更
- 实施成本：**中**（3-5 人天）
- 风险：**低**（已有 Firebase mock + presence infrastructure）
- 回滚：Firebase 配置回退到 mock，RemoteCursor 条件渲染

**方案 B**: 直接上 Yjs CRDT，跳过 Firebase
- 描述：采用 S35-P003 方案 B（自建 WebSocket + Yjs）
- 实施成本：**高**（10-15 人天），推迟到下个 Sprint
- 风险：**中**（全新实现，无 mock fallback）
- 回滚：不部署 Yjs，无回滚成本

---

### P002: 模板市场 MVP

**方案 A（推荐）**: 静态 JSON + 只读 marketplace API（2-3 人天）
- 描述：`vibex-backend/src/app/api/templates/marketplace/route.ts` 返回静态 JSON（/public/data/marketplace-templates.json）；前端 `/dashboard/templates` 增加 industry filter tab
- 实施成本：**低**（2-3 人天）
- 风险：**低**（无需网络请求，static fallback）
- 回滚：前端降级为已有 CRUD 模板列表，无网络依赖

**方案 B**: GitHub Gist 动态拉取
- 描述：后端调用 GitHub Gist API 拉取公开模板列表
- 实施成本：**中**（3-4 人天）
- 风险：**中**（GitHub API 限流/不可达时降级）
- 回滚：降级到静态 JSON

---

### P003: MCP DoD 补全

**方案 A（推荐）**: 增加 CI Gate 验证 tool index 同步
- 描述：`.github/workflows/test.yml` 新增 job 运行 `node scripts/generate-tool-index.ts && git diff --exit-code docs/mcp-tools/INDEX.md`；在 PR 阶段拦截文档不同步
- 实施成本：**低**（0.5 人天）
- 风险：**低**（仅 CI 配置）
- 回滚：移除 CI job

---

### P004: 撤销/重做 Toolbar 按钮

**方案 A（推荐）**: 在 DDSToolbar 添加 Undo/Redo 按钮（0.5 人天）
- 描述：`DDSToolbar.tsx` 添加 `canUndo`/`canRedo` 状态读取 + 按钮 UI（disabled/enabled）
- 实施成本：**低**（0.5 人天）
- 风险：**低**
- 回滚：移除按钮

---

### P005: Design Review E2E 补全

**方案 A（推荐）**: 补充降级路径 E2E 测试
- 描述：新增 `tests/e2e/design-review-degradation.spec.ts` — mock MCP server 503，验证降级文案显示
- 实施成本：**低**（1 人天）
- 风险：**低**
- 回滚：移除测试文件

---

## 可行性评估

| 提案 | 可行性 | 关键依赖 | 阻塞风险 |
|------|--------|----------|----------|
| P001 | 高 | Firebase RTDB 配置 + RemoteCursor 挂载点 | 低 |
| P002 | 高 | S35-P004 调研结论 + 静态 JSON 数据 | 低 |
| P003 | 高 | CI 配置修改 + git diff 验证 | 低 |
| P004 | 高 | DDSToolbar.tsx 修改（0.5 人天） | 低 |
| P005 | 高 | 新增 E2E 测试文件 | 低 |

---

## 初步风险识别

| 风险 | 影响 | 概率 | 缓解措施 |
|------|------|------|----------|
| P001: Firebase RTDB 20 并发上限 | 高 | 低 | 监控并发数，超限后 PresenceAvatars 显示"人数已达上限" |
| P002: 静态 JSON 数据过期 | 低 | 低 | 定期手动更新（MVP 阶段可接受） |
| P004: useKeyboardShortcuts 与浏览器 Ctrl+Z 冲突 | 低 | 低 | 已处理（preventDefault），ShortcutEditModal 可自定义 |
| P005: E2E 测试不稳定（时序依赖） | 中 | 中 | Mock MCP 响应，设置合理 timeout |

---

## 验收标准（具体可测试）

### P001
- [ ] E2E: 2 个 Playwright browser context 同时打开同一 canvas，`isFirebaseConfigured()` mock → 每个页面可看到另一个页面的 RemoteCursor（延迟 < 3s）
- [ ] Unit: `DDSCanvasPage.tsx` 渲染 `<RemoteCursor />`（exists in render tree）
- [ ] E2E: `tests/e2e/presence-mvp.spec.ts` 通过（Firebase mock mode）

### P002
- [ ] GET `/api/templates/marketplace` 返回 HTTP 200，含至少 3 个模板对象
- [ ] `/dashboard/templates` 页面 industry filter 下拉框可选择（saas/mobile/ecommerce）
- [ ] E2E: `tests/e2e/templates-market.spec.ts` 新增市场浏览测试

### P003
- [ ] CI: `.github/workflows/test.yml` 包含 `generate-tool-index` job，exit 0
- [ ] PR 检测：提交 `packages/mcp-server/src/tools/*.ts` 变更时，`git diff docs/mcp-tools/INDEX.md` 非空触发 CI failure

### P004
- [ ] DDSToolbar.tsx 存在 `undo`/`redo` button JSX（含 `data-testid="undo-btn"` / `data-testid="redo-btn"`）
- [ ] E2E: `Ctrl+Z` 在 Canvas focus 时调用 `useCanvasHistoryStore.getState().undo()`（spy 验证）
- [ ] Toolbar undo button 在 `canUndo() === false` 时 `disabled={true}`

### P005
- [ ] E2E: `design-review-degradation.spec.ts` — MCP 503 → 页面显示"AI 评审暂时不可用"文案
- [ ] E2E: 评审结果三 tab（compliance/accessibility/reuse）可切换，数据正确渲染

---

## 更新后的提案优先级矩阵

| 提案 | 原工时 | 验证后工时 | 变化原因 | 综合得分 | 建议 |
|------|--------|------------|----------|----------|------|
| P001 多人协作 MVP | 5-7 人天 | 3-5 人天 | RemoteCursor 已存在，仅需挂载 | **9** | Sprint 36 |
| P002 模板市场 MVP | 2-3 人天 | 2-3 人天 | 无变化 | **8** | Sprint 36 |
| P003 MCP DoD CI Gate | 0.5 人天 | 0.5 人天 | DoD 已补全，仅需 CI gate | **7** | Sprint 36 |
| P004 撤销重做 Toolbar | 1-2 人天 | **0.5 人天** | 快捷键已完成，仅 Toolbar 按钮 | **6** | Sprint 36 |
| P005 Design Review E2E | 1-2 人天 | 1 人天 | 降级路径测试缺失 | **5** | Sprint 36 |

---

## 执行决策

- **决策**: 已采纳（带更新）
- **执行项目**: vibex-proposals-sprint36
- **执行日期**: 2026-05-11
- **更新项**: P004 工期修正（1-2 人天→0.5 人天），P003 DoD gaps 修正（已补全，仅需 CI gate）

---

*本文档由 analyst agent 编写，基于 gstack 代码审查验证。*
*生成时间: 2026-05-11 20:00 GMT+8*