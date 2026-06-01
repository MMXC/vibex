# Sprint 49 提案分析

> **Agent**: coord (heartbeat self-implement — analyst ghost-completed, coord 重填提案)
> **日期**: 2026-06-01
> **背景**: analyst agent-submit 幽灵完成（标记 done 但无输出文件），coord 基于 Sprint48 交付成果识别 Sprint49 高优先级功能
> **方法**: 审查 CHANGELOG + 代码缺口分析 + 用户体验优先级

---

## Sprint48 交付成果

| Epic | 名称 | 状态 | 关键产出 |
|------|------|------|---------|
| E1 | Canvas 导出 | ✅ | PNG/SVG/JSON/YAML/Markdown + dual-CHANGELOG |
| E2 | Canvas PDF 批量导出 | ✅ | CanvasListPanel + backend /api/export/pdf |
| E3 | 键盘快捷键可配置化 | ✅ | ShortcutPanel + IndexedDB persist |
| E4 | 会话标签管理 | ✅ | SessionTagsPanel + context metadata |
| E5 | 跨画布粘贴 | ✅ | crossCanvasPasteStore + clipboard API |

**已验证技术基础**:
- IndexedDB 持久化链路打通（session/shortcut/template）
- Clipboard API 已可用（E5）
- Backend PDF 生成路由已部署（/api/export/pdf）
- 流式 SSE 端点（/api/ai/generate）已就绪（Sprint43）
- WebSocket presence 已集成（Sprint43）

---

## P001 (P0) — AI 断线重连 + 流式可靠性增强

### 问题描述
当 AI Agent 生成过程中网络断线，SSE 流式响应会永久卡死。用户无法感知重连状态，也没有自动恢复机制。这直接影响核心 AI 生成流程的可用性。

### 根因分析
Sprint43 实现的 SSE 端点缺少重连逻辑和超时处理。`useStreamingAgent` hook 没有 AbortController 超时，也没有指数退避重试。当连接断开时，panel 卡在 loading 状态，用户只能刷新页面。

### 影响范围
核心 AI 功能，所有依赖 `/api/ai/generate` 的用户流程

### 建议方案
- **S1**: `useStreamingAgent` 添加指数退避重试（max 3 次，base 1s）+ 状态展示（connecting/retry N/N）
- **S2**: `AbortController` 超时保护（60s 无响应自动终止 + toast 提示）
- **S3**: 连接状态指示器（在线/断线/重试中 badge）
- **S4**: Vitest 覆盖重试逻辑和超时行为

### 验收标准
- [ ] 网络断线后自动重试 3 次，每次间隔翻倍
- [ ] 60s 无响应自动终止，显示超时错误
- [ ] 重试时 UI 显示 "正在重连 (N/3)"
- [ ] vitest 覆盖：重试计数器 / 超时终止 / 正常完成

---

## P002 (P1) — 画布模板管理完善

### 问题描述
Sprint42 实现了模板 Gallery，但缺乏：模板搜索/分类过滤、用户自定义模板命名、模板预览缩略图。现有模板数量少，用户无法快速找到所需模板。

### 根因分析
TemplateGallery 只有预设 5 个模板，缺少用户生成内容的持久化入口和更好的发现机制。

### 影响范围
画布创建效率，所有新建画布用户

### 建议方案
- **S1**: 模板搜索（name 模糊匹配）+ 分类筛选（blank/flowchart/mindmap/swot）
- **S2**: 模板预览缩略图（首次打开时生成 SVG snapshot 存入 IndexedDB）
- **S3**: 用户自定义模板重命名（TemplateSaveDialog 可编辑 name）
- **S4**: Vitest 覆盖 templateStore CRUD + 搜索过滤

### 验收标准
- [ ] 搜索框输入 "flow" 过滤出 flowchart 类模板
- [ ] 模板卡片显示名称（可编辑）和预览缩略图
- [ ] IndexedDB 存储用户生成模板，刷新后不丢失
- [ ] vitest 10+ tests PASS

---

## P003 (P1) — 大型画布性能优化 v2

### 问题描述
Sprint43 实现了视口裁剪（onlyRenderVisibleElements），但对于 100+ 节点的画布仍存在交互卡顿。节点拖拽、缩放时帧率下降明显，影响核心编辑体验。

### 根因分析
React Flow 默认对所有节点做 diff 比较，即使节点不在视口内。缺少节点虚拟化（virtualization）和懒加载机制。

### 影响范围
大型画布用户，核心编辑体验

### 建议方案
- **S1**: `nodeExtent` 限制渲染范围 + `onlyRenderVisibleElements` 默认开启
- **S2**: 节点懒加载（offscreen 节点延迟 100ms 后渲染）
- **S3**: 缩放时 debounce viewport 更新（100ms）
- **S4**: 大型画布性能基准测试（100 节点 / 500 节点渲染时间对比）
- **S5**: Vitest 覆盖性能相关逻辑

### 验收标准
- [ ] 100 节点画布缩放帧率 >= 30fps（Chrome DevTools Performance）
- [ ] 缩放时 viewport 更新 debounce 生效
- [ ] vitest 覆盖视口相关逻辑

---

## P004 (P1) — 画布版本历史可视化

### 问题描述
Sprint15 实现了版本对比 UI（SnapshotSelector + VersionPreview），但缺乏自动快照触发机制。用户必须手动点击"保存快照"，容易遗漏关键状态。版本历史也不支持时间线视图。

### 根因分析
快照需要手动触发，缺少关键操作的自动快照（生成后、重要编辑前、导出前）。

### 影响范围
所有重视画布数据安全的用户

### 建议方案
- **S1**: 自动快照触发器（关键 action 前自动调用 `addCustomSnapshot`）
- **S2**: 时间线视图（Timeline 组件，水平滚动，关键节点标注）
- **S3**: 快照比较（选择任意两个快照对比 diff）
- **S4**: Vitest 覆盖 auto-snapshot 逻辑 + Timeline 渲染

### 验收标准
- [ ] AI 生成完成后自动创建快照（snapshotType: "ai-generate"）
- [ ] 导出前自动创建快照（snapshotType: "pre-export"）
- [ ] Timeline 组件可水平滚动，关键节点有 label
- [ ] vitest 覆盖 auto-snapshot 逻辑

---

## P005 (P2) — 协作评论系统

### 问题描述
当前协作只显示光标位置（presence），缺少评论/标注能力。用户无法在画布特定节点上留下反馈，异步协作效率低。

### 根因分析
WebSocket presence 已就绪，但没有评论数据模型和 UI。评论需要持久化（IndexedDB 或后端），涉及新的数据流设计。

### 影响范围
异步协作场景，小团队使用

### 建议方案
- **S1**: `commentStore` 数据模型（commentId, nodeId, text, author, timestamp, resolved）
- **S2**: 节点评论气泡（节点右上角 comment badge，显示未读数）
- **S3**: 评论 Panel（右侧边栏，列出当前画布所有评论，支持回复）
- **S4**: 评论持久化到 IndexedDB（offline-first）
- **S5**: Vitest 覆盖 commentStore CRUD

### 验收标准
- [ ] 选中节点后可在节点上添加评论
- [ ] 评论 Panel 列出当前画布所有评论
- [ ] 评论存储在 IndexedDB，刷新不丢失
- [ ] vitest 覆盖 commentStore

---

## 提案汇总

| ID | 类别 | 标题 | 优先级 | 预估工作量 | 依赖 Sprint |
|----|------|------|--------|----------|------------|
| P001 | reliability | AI 断线重连 + 流式可靠性 | P0 | M | S43 (SSE) |
| P002 | feature | 画布模板管理完善 | P1 | M | S42 (TemplateGallery) |
| P003 | performance | 大型画布性能优化 v2 | P1 | M | S43 (视口裁剪) |
| P004 | feature | 画布版本历史可视化 | P1 | M | S15 (SnapshotSelector) |
| P005 | feature | 协作评论系统 | P2 | L | S43 (WebSocket) |
