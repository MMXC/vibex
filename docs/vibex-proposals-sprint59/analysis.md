# Sprint59 提案分析文档

> **分析师**: coord (heartbeat self-implement)
> **日期**: 2026-06-03
> **输入**: proposals/20260603/analyst.md (5 proposals)
> **输出**: 本文档 + prd.md

---

## P001 — 画布全局搜索

### 问题
Sprint1-S58 没有任何画布内容搜索能力。用户有 50+ 画布时，无法通过节点内容定位画布。

### 根因
sessionStore 只存 metadata，画布节点内容在 IndexedDB 但从未建索引。

### 影响
所有拥有 5+ 画布用户，核心导航效率。

### 技术方案
1. `canvasSearchStore` — Zustand store，`keywordIndex: Map<canvasId, string[]>`（节点text + 边label + 画布名）
2. 画布打开时增量索引节点text；IndexedDB canvasDB 添加 `fullTextSearch()` 方法
3. Header 右侧搜索框（Cmd+K 快捷键）
4. 搜索结果按匹配次数、更新时间排序
5. vitest 覆盖 canvasSearchStore CRUD + 索引逻辑

### 风险
- IndexedDB fullTextSearch 性能：节点多时索引可能慢 → 异步 + 进度提示
- 搜索结果 Rank 简单实现，后期可升级 TF-IDF

### 验收标准
- [ ] Cmd+K 打开全局搜索面板
- [ ] 输入关键词找到包含该文本的画布
- [ ] 搜索结果显示画布名 + 匹配片段
- [ ] vitest 覆盖 canvasSearchStore 索引 + 搜索

---

## P002 — 评论实时通知

### 问题
Sprint58 E5 评论 CRUD 完成，但评论添加后对方无法实时感知。WebSocket 只推 presence/cursor/conflict，不推送 comment 事件。

### 根因
commentStore 没有和 WebSocket 层集成。wsCommentHandler 没有订阅 comment:created/comment:resolved。

### 影响
异步协作用户，小团队使用。

### 技术方案
1. `commentStore` 添加 `addListener`/`removeListener` 订阅机制
2. 后端 WebSocket 添加 `comment:created` / `comment:resolved` / `comment:mention` 消息类型
3. 前端 `wsCommentHandler` 订阅评论事件 → 调用 commentStore action → UI 更新
4. Header 评论图标显示未读数红点
5. vitest 覆盖 commentStore 事件订阅 + WebSocket handler

### 风险
- WebSocket 消息风暴：多人同时评论 → 频繁刷新 → UI 抖动 → 需要 debounce

### 验收标准
- [ ] 用户 A 添加评论 → 用户 B 收到 `comment:created` → 自动刷新 CommentPanel
- [ ] 评论图标显示未读数红点
- [ ] vitest 覆盖 commentStore 事件订阅

---

## P003 — 画布节点自动布局

### 问题
复制/粘贴或 AI 批量生成节点时重叠扎堆，手动拖拽排列效率低。

### 根因
pasteCards 只做了 `position.x += 30` 偏移，没有布局算法。

### 影响
批量粘贴场景、AI 生成结果导入、模板展开。

### 技术方案
1. 引入 `@types/dagre`，`layoutGraph()` 按层级排列节点
2. `layoutStore` — Zustand store，`layoutMode: 'none' | 'dagre'`，`applyAutoLayout()` 更新节点 position
3. DDSToolbar 添加"自动排版"按钮，快捷键 `Cmd+L`
4. vitest 覆盖 layoutStore 状态转换 + 布局计算

### 风险
- dagre 布局可能不符合用户直觉 → 可选 force-directed 作为备选
- 循环边布局效果差 → 跳过或警告

### 验收标准
- [ ] 粘贴 20 个重叠节点后，点击"自动排版"分散为整齐层级
- [ ] Cmd+L 快捷键触发自动布局
- [ ] vitest 覆盖 layoutStore 状态转换 + 布局计算

---

## P004 — 模板批量导入/导出

### 问题
Sprint58 E3 模板搜索/分类完成，但无法批量导出/导入模板。换设备后模板全部丢失。

### 根因
templateStore 没有 export/import 端到端链路。

### 影响
模板用户，跨设备迁移。

### 技术方案
1. `exportTemplates()` — 导出所有模板为 `{ version, templates: [...] }` JSON 文件
2. `importTemplates(file)` — 导入 JSON，覆盖/跳过/重命名冲突模板
3. TemplatePanel 添加 Export All / Import 按钮
4. `templateVersion` 字段（semver），导入时按版本合并
5. vitest 覆盖 export/import 序列化 + 冲突处理

### 风险
- 模板数据量大（thumbnail base64）→ JSON 文件可能过大 → 支持分块导出

### 验收标准
- [ ] Export All → 生成包含所有模板的 JSON 文件
- [ ] Import JSON → 正确导入，冲突时提示用户选择策略
- [ ] vitest 覆盖 export/import 序列化 + 冲突处理

---

## P005 — 键盘快捷键扩展

### 问题
Sprint52 E5 快捷键可配置化完成，但只覆盖 DDSDrawflow 内操作。CanvasList 页面没有快捷键支持。

### 根因
当前快捷键绑定在 DDSDrawflow 的 `useKeyboardShortcuts`，只监听画布内部事件。

### 影响
高频键盘用户，效率操作。

### 技术方案
1. 全局快捷键注册中心（`shortcutRegistry`）：所有页面共享的快捷键映射表
2. CanvasList 快捷键：`J/K` 上下选择，`Enter` 打开，`N` 新建，`D` 删除
3. `useGlobalShortcuts` hook — 在 layout 层注册，处理页面级快捷键
4. 快捷键冲突检测：同名快捷键提示用户
5. vitest 覆盖 shortcutRegistry + useGlobalShortcuts

### 风险
- 快捷键覆盖冲突：全局 vs 页面级 → 全局优先级更高需明确

### 验收标准
- [ ] CanvasList 页面按 J/K 上下选择画布
- [ ] 按 Enter 打开当前选中画布
- [ ] 快捷键冲突时显示警告
- [ ] vitest 覆盖 shortcutRegistry 快捷键映射
