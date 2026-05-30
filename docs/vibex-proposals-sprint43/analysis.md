# Sprint 43 提案分析

> **Agent**: coord (heartbeat self-implement)
> **日期**: 2026-05-30
> **触发**: analyst CLI-dispatch ghost — analyst 被自动派发但从未收到 Slack 通知（CLI-dispatch，updatedBy: cli），proposals/20260530/ 无 Sprint43 输出。proposals/20260530/analyst.md 实为 Sprint42 Phase2 Audit 内容（混淆目录）。coord 自举完成 Sprint43 提案分析，基于 Sprint 42 (E1-E5) 交付成果识别下一批高优先级功能增强。

---

## 概述

基于 Sprint 42 E1-E5 交付成果（S42 CHANGELOG 核实），识别 5 个高优先级功能增强方向：

- **P001**: Presence DDSCanvasPage 集成收尾 — E2 Presence store/hook/overlay 存在但未在画布主页面激活
- **P002**: AI Agent 流式响应界面（SSE） — AI 生成结果实时逐字展示，提升用户体验
- **P003**: Canvas 大型画布性能优化 — 视口外节点渲染跳过 + 渐进式加载
- **P004**: 画布导出（PNG / SVG / PDF）— 用户分享和存档核心诉求
- **P005**: 键盘快捷键自定义面板 — 用户可绑定/解绑快捷键，持久化存储

---

## P001: Presence DDSCanvasPage 集成收尾

### 问题描述
Sprint42 E2 Presence 光标同步：presenceStore、useWebSocketPresence、PresenceOverlay 已实现，但 **DDSCanvasPage 未集成** `useWebSocketPresence`，远程用户光标不显示。

### 根因分析
- Sprint42 E2 dev 未完成画布主页面集成（DDSCanvasPage）
- CHANGELOG E2 标注"待完成：DDSCanvasPage 集成"
- E4 设置面板（cursorVisible）存在，但无实际效果（因为 PresenceOverlay 未被激活）

### 影响范围
- 协作功能核心路径：用户看不到其他人的光标，协作体验断在半途
- Sprint41 WebSocket 后端部署完成，Sprint42 Presence 前端实现不完整

### 技术可行性
- ✅ 所有组件已就绪（presenceStore + useWebSocketPresence + PresenceOverlay）
- ✅ useWebSocketPresence 已接收 `onPresence` 回调并写入 store
- ✅ PresenceOverlay 已渲染用户头像+名称+颜色（绝对定位 overlay）
- ⏳ DDSCanvasPage 集成缺失：需要 import + mount `useWebSocketPresence`

### 验收标准（DoD）
- [ ] DDSCanvasPage import `useWebSocketPresence` 并在组件 mount 时调用
- [ ] DDSCanvasPage render `<PresenceOverlay />` 并传入 viewport bounds
- [ ] Firebase `usePresence` 完全替换为 `useWebSocketPresence`（无 Firebase presence 调用）
- [ ] E4 cursorVisible 设置能控制 PresenceOverlay 显示/隐藏
- [ ] vitest: `presenceStore.test.ts` 覆盖 4 种状态切换场景
- [ ] TypeScript 编译通过，零新增错误

### 工作量估算
**P0, 1-2人日**
- DDSCanvasPage 集成: 0.5人日
- Firebase → WebSocket 替换: 0.5人日
- cursorVisible 联动: 0.5人日
- 测试: 0.5人日

---

## P002: AI Agent 流式响应界面（SSE）

### 问题描述
当前 AgentFeedbackPanel 一次性展示 AI 完整响应，大段文字无反馈感。流式响应（SSE）让用户看到 AI 逐字输出，体验接近 ChatGPT 风格。

### 根因分析
- Sprint40 E1 实现了 `/ai` 页面 + AgentFeedbackPanel 国际化
- 后端 `vibex-backend/src/services/llm/` 有 AI 生成能力（Sprint40 E1）
- 前端 AI 调用目前是 fetch+完整 JSON 返回，无 streaming

### 影响范围
- AI Agent 用户体验：流式 vs 非流式差异显著
- 中等优先级，但实现成本不高（SSE 基础设施后端已有）

### 技术可行性
- **后端**: OpenAI-compatible `/v1/chat/completions` 流式接口（`stream: true`）
- **前端**: `EventSource` / `fetch` + `ReadableStream` 解析 SSE 行，逐字追加到响应
- **现有 hook**: `useAgentFeedback` 可扩展支持流式模式
- **风险**: 跨域 SSE 代理（后端在 vibex-backend，前端在 vibex-fronted，需配置 `/api/ai/stream` 代理路由）

### 验收标准（DoD）
- [ ] 后端 `/api/ai/stream` 端点支持 SSE（`text/event-stream`）
- [ ] 前端 AgentFeedbackPanel 逐字追加显示（chunked rendering）
- [ ] 流式/非流式双模式兼容（stream toggle 或自动检测）
- [ ] loading 状态正确（逐字输出期间显示"正在生成..."）
- [ ] 取消生成功能（AbortController）
- [ ] E2E 测试：流式响应完整渲染

### 工作量估算
**P1, 2-3人日**
- 后端 SSE 端点: 0.5人日
- 前端 SSE 解析 + UI: 1人日
- AbortController 取消: 0.5人日
- 测试: 1人日

---

## P003: Canvas 大型画布性能优化

### 问题描述
当画布节点数 >100 时，DDSFlow 渲染全部节点，滚动卡顿。VibeX 无视口裁剪（viewport culling）—— 屏幕外节点仍参与渲染树。

### 根因分析
- `@xyflow/react` 的默认行为：全部节点均挂载到 DOM
- Sprint41-42 无性能优化规划
- Sprint41 IndexedDB 持久化已完成，但加载大画布仍全量解析

### 影响范围
- 大型画布用户（>50 节点）体验瓶颈
- 移动端影响更大（CPU 弱，100+ 节点卡顿明显）

### 技术可行性
- `@xyflow/react ^12.10.1` 支持 `nodeExtent` + `onlyRenderVisibleElements` prop
- 视口边界计算已有（`viewportBoundsStore` Sprint42 E4 引入）
- 渐进式加载：IndexedDB 已就绪，首次加载渲染可见区域节点，滚动时增量加载

### 验收标准（DoD）
- [ ] `onlyRenderVisibleElements={true}` 激活视口裁剪
- [ ] `viewportBoundsStore` 与 DDSFlow 联动（视口变化时更新）
- [ ] 首次加载性能：100 节点画布 < 2s 渲染完成
- [ ] 滚动流畅度：FPS > 30（Chrome DevTools Performance 验证）
- [ ] vitest: 视口裁剪边界计算正确性
- [ ] 不破坏现有 E1-E5 功能（回归测试通过）

### 工作量估算
**P1, 2-3人日**
- 视口裁剪配置: 0.5人日
- viewportBoundsStore 集成: 1人日
- 性能测试 + 优化: 1人日
- 回归测试: 0.5人日

---

## P004: 画布导出（PNG / SVG / PDF）

### 问题描述
用户需要将画布导出为图片（PNG/SVG）或文档（PDF），用于分享和存档。当前 VibeX 无导出功能。

### 根因分析
- Sprint1-42 均无导出功能规划
- `@xyflow/react` 提供 `toObject()` / `toPNG()` / `toSVG()` API
- `html-to-image` 库可补充 PDF 导出

### 影响范围
- 用户分享需求：导出图片是最常见的协作后需求
- 重要性高，但实现复杂度中等

### 技术可行性
- `@xyflow/react` 内置 `getNodes`, `getEdges` + `toObject`
- `html-to-image` (`toPng`, `toSvg`) 可导出 canvas DOM
- PDF 导出：`jspdf` + `html-to-canvas`
- UI: DDSToolbar 添加 Export 按钮 + 下拉菜单（PNG / SVG / PDF）

### 验收标准（DoD）
- [ ] PNG 导出：DDSToolbar Export 按钮 → `toPng()` → 下载文件
- [ ] SVG 导出：`toSvg()` → 下载 .svg 文件
- [ ] PDF 导出：`html-to-image` + `jspdf` → A4 页面 PDF
- [ ] 导出时显示加载状态（canvas 较大时渲染需时间）
- [ ] 导出内容包含当前视口（可见区域）而非全画布
- [ ] i18n: 导出菜单 key 已添加（`exportBtn`, `exportPNG`, `exportSVG`, `exportPDF`）
- [ ] vitest: 导出逻辑单元测试

### 工作量估算
**P2, 2-3人日**
- PNG/SVG 导出: 1人日
- PDF 导出: 1人日
- UI + i18n: 0.5人日
- 测试: 0.5人日

---

## P005: 键盘快捷键自定义面板

### 问题描述
当前键盘快捷键硬编码（useKeyboardShortcuts Sprint41 E5 实现）。用户无法自定义绑定，部分用户习惯与 VibeX 默认冲突时无法调整。

### 根因分析
- Sprint41 E5 实现了 useKeyboardShortcuts + ShortcutManager（冲突检测）
- ShortcutManager 已有冲突检测逻辑，可复用
- `userPreferencesStore` Sprint42 E4 已添加快捷键存储字段

### 影响范围
- 高级用户和专业用户（快捷键重度依赖者）
- 提升产品竞争力（对标 Miro/FigJam 均支持快捷键自定义）

### 技术可行性
- **已有**: `userPreferencesStore` (Sprint42 E4), `ShortcutManager` 冲突检测
- **新增**: 快捷键绑定配置 UI（Settings 页面新增 Shortcuts section）
- **存储**: `userPreferencesStore.shortcuts` (IndexedDB via persistence)
- **实现**: 每个快捷键: `{ action: string, keys: string[], enabled: boolean }`

### 验收标准（DoD）
- [ ] Settings 页面新增 Shortcuts section（使用 E4 现有设置 UI 模式）
- [ ] 支持绑定/解绑快捷键（快捷键录制 UI: 按键 → 绑定）
- [ ] 支持启用/禁用单个快捷键
- [ ] ShortcutManager 读取 userPreferencesStore 配置（而非硬编码）
- [ ] 冲突检测：重复绑定时显示警告（复用 ShortcutManager）
- [ ] IndexedDB 持久化（页面刷新后保留自定义绑定）
- [ ] i18n: shortcut/shortcuts namespace keys
- [ ] vitest: ShortcutManager 读取配置 + 冲突检测

### 工作量估算
**P2, 3-4人日**
- 设置 UI + 快捷键录制: 1.5人日
- ShortcutManager 配置化: 1人日
- 持久化: 0.5人日
- 测试: 1人日

---

## 优先级总结

| ID | 提案 | P | 工作量 | 风险 | 依赖 |
|----|------|---|--------|------|------|
| P001 | Presence DDSCanvasPage 集成收尾 | P0 | 1-2人日 | 低 | Sprint42 E2（部分完成） |
| P002 | AI Agent 流式响应界面（SSE） | P1 | 2-3人日 | 中 | Sprint40 E1（/ai页面） |
| P003 | Canvas 大型画布性能优化 | P1 | 2-3人日 | 低 | Sprint42 E4 viewportBounds |
| P004 | 画布导出（PNG/SVG/PDF） | P2 | 2-3人日 | 低 | 无 |
| P005 | 键盘快捷键自定义面板 | P2 | 3-4人日 | 中 | Sprint41 E5, Sprint42 E4 |
