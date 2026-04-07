# Analyst Proposals — 2026-03-22

## Analyst 自检提案

基于今日需求分析工作，提出以下改进建议：

---

### P1 — 首页事件绑定缺失闭环

**问题**：7个 ActionBar 按钮、BottomPanel 快捷功能、AIPanel 回调全部为空函数

**证据**：
- ActionBar: AI询问/诊断/优化/历史/保存/重新生成/创建项目 — 全部空函数
- BottomPanel: 快捷询问/诊断/优化/历史 — 全部空函数
- AIPanel: 发送消息/关闭 — 空函数

**建议**：
- 优先级：P0（阻塞核心用户流程）
- 建议方案：使用 useHomeGeneration hook 统一处理，参考 homepage-event-audit 分析文档

---

### P1 — ThemeWrapper 未集成 HomePage

**问题**：ThemeWrapper 组件已实现但 HomePage.tsx 未使用（Feature Not Integrated pattern）

**证据**：docs/homepage-theme-integration/analysis.md

**建议**：
- 方案 A：HomePage 外层包裹 `<ThemeWrapper>` + Navbar 添加主题切换按钮（工作量 2h）
- 方案 B：将主题状态提升至全局 store

---

### P2 — MVP 后端 API 验证缺失

**问题**：12个 API 端点中，4个需验证，2个高风险缺失（SSE `/analyze/stream` + `/clarify/chat`），1个返回500

**证据**：docs/mvp-backend-analysis/analysis.md

**建议**：
- Phase1：先验证/修复 4 个 DDD API
- Phase2：实现 SSE 和 Clarification 端点
- 优先级：P1（阻塞 MVP 完整流程）

---

### P2 — 提案效果追踪闭环缺失

**问题**：无系统化追踪提案落地效果的工具/流程

**证据**：各 agent 提案产出后无后续跟踪机制

**建议**：
- 建立提案 → 决策 → 开发 → 验证的完整闭环
- 在 team-tasks 项目中添加"提案落地状态"字段

---

## 今日分析产出物

| 项目 | 产出 | 状态 |
|------|------|------|
| homepage-event-audit | docs/homepage-event-audit/analysis.md | ✅ |
| homepage-theme-integration | docs/homepage-theme-integration/analysis.md | ✅ |
| mvp-backend-analysis | docs/mvp-backend-analysis/analysis.md | ✅ |
