# Sprint 50 提案分析

> **Agent**: coord (heartbeat self-implement — agent-submit phantom ghost, analyst agent never spawned)
> **日期**: 2026-06-01
> **背景**: Sprint49 (E1-E5) 刚完成，基于 Sprint49 交付成果识别 Sprint50 高优先级功能
> **方法**: 审查 Sprint49 CHANGELOG + 代码缺口分析 + 用户体验优先级

---

## Sprint49 交付成果

| Epic | 名称 | 状态 | 关键产出 |
|------|------|------|---------|
| E1 | AI 断线重连 + 流式可靠性 | ✅ | retryStatus 状态机 / 60s 超时 / ConnectionStatus badge |
| E2 | 画布模板管理完善 | ✅ | 搜索/分类过滤/重命名/缩略图 / templateStore 增强 |
| E3 | 视口性能优化 v2 | ✅ | viewportBoundsStore debounce / nodeExtent ±50k |
| E4 | 画布版本历史可视化 | ✅ | snapshotHistoryStore / Timeline / SnapshotDiff / AIDraftDrawer 集成 |
| E5 | 协作评论系统 | ✅ | commentStore / CommentBadge / CommentPanel / IndexedDB |

**已验证技术基础**:
- IndexedDB 持久化链路全打通（comment/template/shortcut/snapshot）
- Zustand store + vitest 测试文化成熟（dds 全量 90+）
- SSE 流式端点（/api/ai/generate）具备重试机制
- WebSocket presence 已集成
- DDSDrawflow nodeExtent 全坐标范围支持

**识别出的待完善区域**:
1. **E4 Timeline 交互体验**：时间线无缩放/拖拽，100+ 快照时需滚动很久
2. **E5 评论通知**：评论添加后对方无法实时感知（WebSocket 只显示 presence）
3. **E2 模板导入/导出**：用户无法批量管理模板（只能单张新建）
4. **E3 节点布局自动排版**：节点重叠时无法自动调整位置
5. **全局：画布搜索**：用户无法通过内容关键词搜索画布

---

## P001 (P0) — 画布全局搜索

### 问题描述
Sprint1-Sprint49 没有任何画布内容搜索能力。用户有 50+ 画布时，只能靠记忆名称找画布，无法通过节点内容、标签、或 AI 生成文本定位画布。

### 根因分析
`sessionStore` 只存储 session metadata（name, createdAt），`cards` 内容存储在 IndexedDB 的 canvasDB 但从未建索引。Sprint46 的 `searchableText` 只覆盖 agent sessions，不是画布节点。

### 影响范围
所有拥有 5+ 画布的用户，核心导航效率

### 建议方案
- **S1**: `canvasSearchStore` — 新建 Zustand store，维护 `keywordIndex: Map<canvasId, string[]>`（节点 text + 边 label + 画布名）
- **S2**: 索引构建 — 画布打开时增量索引节点 text；IndexedDB canvasDB 添加 `fullTextSearch()` 方法（LIKE 查询）
- **S3**: 搜索 UI — Header 右侧搜索框（Cmd+K 快捷键），下拉列表显示匹配画布名 + 节点片段预览
- **S4**: 搜索结果 Rank — 按匹配次数、更新时间排序
- **S5**: Vitest 覆盖 canvasSearchStore CRUD + 索引逻辑

### 验收标准
- [ ] Cmd+K 打开全局搜索面板
- [ ] 输入 "AI 报告" 找到包含该文本的画布
- [ ] 搜索结果显示画布名 + 匹配片段高亮
- [ ] vitest 覆盖 canvasSearchStore 索引 + 搜索

---

## P002 (P1) — 画布节点自动布局

### 问题描述
用户复制/粘贴画布节点或从 AI 批量生成节点时，节点容易重叠扎堆。需要手动拖拽排列，效率低。Sprint46 的 `pasteCards` 只做了位置偏移（+30px cascade），但节点多了仍然重叠。

### 根因分析
复制粘贴时只做了 `position.x += 30` 偏移，没有布局算法。当粘贴 10+ 节点时，30px 偏移完全不够。需要 Dagre 或 ELK 分层布局。

### 影响范围
批量粘贴场景、AI 生成结果导入、模板展开

### 建议方案
- **S1**: 引入轻量布局库 `dagre` (`@types/dagre`)，`layoutGraph()` 按层级排列节点
- **S2**: `layoutStore` — Zustand store，`layoutMode: 'none' | 'dagre' | 'force'`；`applyAutoLayout()` 调用 `computeLayout(graph)` 并更新节点 position
- **S3**: DDSToolbar 添加"自动排版"按钮；快捷键 `Cmd+L`
- **S4**: `DDSDrawflow.tsx` 新增 `onNodesChange` 检测节点重叠（`getIntersectingNodes` from @xyflow/react）时自动提示用户
- **S5**: Vitest 覆盖 layoutStore + dagre 布局计算

### 验收标准
- [ ] 粘贴 20 个重叠节点后，点击"自动排版"分散为整齐层级
- [ ] Cmd+L 快捷键触发自动布局
- [ ] vitest 覆盖 layoutStore 状态转换 + 布局计算

---

## P003 (P1) — 评论实时通知

### 问题描述
Sprint49 E5 实现了评论 CRUD 和持久化，但评论添加后对方无法实时感知。WebSocket presence 只显示光标位置，不推送评论事件。异步协作体验差——用户不知道有人给他留了评论。

### 根因分析
`commentStore` 没有和 WebSocket 层集成。评论变更只在本地触发，没有广播给其他客户端。

### 影响范围
异步协作用户，小团队使用

### 建议方案
- **S1**: `commentStore` 添加 `addListener` / `removeListener` 订阅机制
- **S2**: 后端 `/api/ws` WebSocket 消息类型添加 `comment:created` / `comment:resolved`
- **S3**: 前端 WebSocket handler 订阅评论事件 → 调用 `commentStore` 对应 action → UI 更新
- **S4**: 新评论通知 Badge — Header 右侧评论图标显示未读数；点击打开 CommentPanel 并滚动到最新
- **S5**: Vitest 覆盖 commentStore 事件订阅 + WebSocket handler

### 验收标准
- [ ] 用户 A 添加评论 → 用户 B 的 WebSocket 收到 `comment:created` → 自动刷新 CommentPanel
- [ ] 评论图标显示未读数红点
- [ ] vitest 覆盖 commentStore 事件订阅

---

## P004 (P1) — 模板导入/导出管理

### 问题描述
Sprint49 E2 实现了模板搜索/分类/缩略图，但用户只能一张张新建画布，无法批量导出/导入模板。用户换设备后模板全部丢失。

### 根因分析
`templateStore` 没有 export/import 端到端链路。IndexedDB 的 templateDB 没有暴露全量导出接口。

### 影响范围
模板用户，跨设备迁移

### 建议方案
- **S1**: `exportTemplates()` — 导出所有模板为单个 JSON 文件（`{ version, templates: [...] }`）
- **S2**: `importTemplates(file)` — 导入 JSON，覆盖/跳过/重命名冲突模板
- **S3**: TemplatePanel 添加 Export All / Import 按钮
- **S4**: 模板版本化 — `templateStore` 添加 `templateVersion` 字段（semver），导入时按版本合并
- **S5**: Vitest 覆盖 export/import 序列化 + 冲突处理

### 验收标准
- [ ] 导出按钮下载 `vibex-templates-YYYYMMDD.json`
- [ ] 导入 JSON 后所有模板出现在 TemplatePanel 中
- [ ] 冲突模板（同名）导入时弹出重命名对话框
- [ ] vitest 覆盖 export/import + 冲突处理

---

## P005 (P2) — Timeline 增强（缩放 + 搜索）

### 问题描述
Sprint49 E4 Timeline 组件实现了时间线展示，但无法缩放、无法搜索快照内容。当画布有 20+ 快照时，用户只能横向滚动逐一查看。

### 根因分析
Timeline 组件只有水平滚动，缺少 `MiniMap` 风格的缩放导航和内容搜索。

### 影响范围
版本历史重度用户

### 建议方案
- **S1**: Timeline 添加缩放控制 — 放大/缩小按钮（改变每个 snapshot 的宽度：`minWidth=80px` → `maxWidth=240px`）
- **S2**: Timeline 添加快照搜索 — `snapshotHistoryStore` 添加 `searchSnapshots(query)` 方法；Timeline 顶部搜索框输入过滤时间线节点
- **S3**: Timeline 快照悬停预览 — 悬停显示 snapshot JSON 内容片段（类似 VS Code hover）
- **S4**: 快照时间分组 — 按「今天/昨天/本周/更早」分组折叠显示
- **S5**: Vitest 覆盖缩放状态 + 搜索过滤 + 分组折叠

### 验收标准
- [ ] Timeline 缩放按钮可以放大/缩小每个快照节点
- [ ] 搜索框输入 "AI" 过滤出包含该文本的快照节点
- [ ] 快照按时间分组折叠
- [ ] vitest 覆盖 Timeline 缩放 + 搜索过滤

---

## 提案汇总

| ID | 类别 | 标题 | 优先级 | 预估工作量 | 依赖 Sprint |
|----|------|------|--------|----------|------------|
| P001 | feature | 画布全局搜索（Cmd+K） | P0 | M | S1-S49 (canvasDB) |
| P002 | feature | 画布节点自动布局（Dagre） | P1 | M | S46 (paste), S49 (E3 nodeExtent) |
| P003 | feature | 评论实时通知（WebSocket） | P1 | M | S49-E5 (commentStore) |
| P004 | feature | 模板导入/导出管理 | P1 | S | S49-E2 (templateStore) |
| P005 | feature | Timeline 增强（缩放 + 搜索） | P2 | S | S49-E4 (Timeline) |
