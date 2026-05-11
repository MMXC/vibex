# Planning 输出 — VibeX Sprint 36 Dev Feature List

**Agent**: pm
**日期**: 2026-05-11
**项目**: vibex-proposals-sprint36-dev
**输入**: analysis.md（analyst 需求分析报告）

---

## Feature List（Epic/Story 划分）

| ID | 功能名 | 描述 | 根因关联 | 工时 | Epic |
|----|--------|------|----------|------|------|
| F1.1 | RemoteCursor Canvas 挂载 | 在 DDSCanvasPage overlay 层渲染 RemoteCursor，订阅 Firebase RTDB 远端用户 cursor 位置 | Firebase presence 基础设施完整，RemoteCursor 组件存在但未挂载 | 1.5d | E1 |
| F1.2 | useRealtimeSync 状态订阅 | 在 DDSCanvasPage 引入 useRealtimeSync hook，订阅远程节点变更并同步到 canvas store | hook 已实现但未被调用，节点同步功能断链 | 1d | E1 |
| F1.3 | Presence E2E 测试 | 编写 presence-mvp.spec.ts，验证多用户场景下 RemoteCursor 和 PresenceAvatars 正确显示 | 多用户协作场景无测试覆盖 | 1d | E1 |
| F2.1 | Marketplace API + 静态数据 | 新建 `/api/templates/marketplace` 接口，返回静态 JSON 模板列表（≥3 个，含 industry/tags/icon） | Dashboard 模板页存在但无 marketplace API，数据来源断裂 | 1d | E2 |
| F2.2 | Dashboard Industry Filter | `/dashboard/templates` 增加 industry filter tab（saas/mobile/ecommerce），前端按 industry 过滤展示 | 用户无法主动发现/浏览模板，只能被动看到已有列表 | 1d | E2 |
| F3.1 | Tool Index CI 同步验证 | `.github/workflows/test.yml` 新增 job，运行 generate-tool-index.ts 并用 git diff 检测文档失步 | MCP tool 代码变更后文档可能失步，缺乏自动化拦截 | 0.5d | E3 |
| F4.1 | DDSToolbar Undo/Redo 按钮 | 在 DDSToolbar.tsx 添加 Undo/Redo 按钮，连接 canvasHistoryStore，支持 disabled/enabled | 快捷键已就绪，Toolbar UI 缺失，只能靠键盘操作 | 0.5d | E4 |
| F5.1 | 降级路径 E2E 测试 | 新增 design-review-degradation.spec.ts，mock MCP 503，验证降级文案显示 | Design Review MCP 503 时无降级测试覆盖 | 0.5d | E5 |
| F5.2 | 评审结果三 Tab 验证 | 验证 compliance/accessibility/reuse 三个 tab 数据正确渲染、可切换 | 三 tab 渲染无 E2E 验证 | 0.5d | E5 |
| **合计** | | **9 功能点** | | **7.5d** | |

---

## Planning 决策记录

### Q1: E1 是否需要包含 IntentionBubble 联动？
**结论**: 本期不做。IntentionBubble 已实现但与 presence 未联动，属于体验增强而非核心路径。用户协作时 RemoteCursor 足以传递"有人在场"的信息，IntentionBubble 可在下一期作为体验优化项。

### Q2: E2 模板市场是否需要搜索功能？
**结论**: 本期不做。搜索功能增加前端复杂度（debounce + 模糊匹配），属于体验增强。MVP 阶段 industry filter 已满足"主动发现"的核心需求，搜索可在用户量验证后加入。

### Q3: E4 按钮图标使用什么方案？
**结论**: 使用 lucide-react 已有图标（Undo2/Redo2）。不引入新图标库，减少 bundle size。

### Q4: E5 ReviewReportPanel 三 Tab 是否需要骨架屏？
**结论**: 本期不实现骨架屏。Tab 切换是前端状态切换（非异步加载），数据已在 mock 响应中，骨架屏仅增加复杂度。
