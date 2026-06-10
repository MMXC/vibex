# S74 需求分析 — 基于 S72/S73 已完成功能识别迭代缺口

**Sprint**: vibex-proposals-sprint74  
**分析日期**: 2026-06-07  
**上游 Sprint**: S72（批量操作/趋势图表/协作presence/模板预览）+ S73（全文搜索/模板导入/通知管理/分支命名/会话导出）

---

## 提案列表（P001–P005）

---

### P001: 搜索历史记录与最近搜索

**问题描述**: S73-E1 实现了 CanvasSearchPanel + Ctrl+F 全文搜索，但用户每次搜索时没有"历史记录"或"最近搜索"功能。对于频繁使用的搜索词，用户需要重复输入，无法快速召回。

**根因**: `canvasSearchStore` 仅实现了 `searchNodes()` 单一方法，没有搜索历史持久化能力。`CanvasSearchPanel` 也没有 UI 展示历史记录。

**影响**: 用户体验 — 重复搜索效率低，高频搜索词无法快速访问。

**技术方案**:
- 扩展 `canvasSearchStore`：新增 `recentSearches: string[]` 状态（max 20 条，Zustand persist）
- 新增 `addRecentSearch(query)` action：去重后 unshift，截断至 20 条
- `CanvasSearchPanel` header 区域：在输入框上方/下方渲染最近搜索 chips，点击填充
- 搜索提交时自动调用 `addRecentSearch`；提供"清除历史"按钮

**验收标准**:
1. 搜索后输入词出现在最近搜索列表顶部
2. 刷新页面后最近搜索列表保留（persist）
3. 重复搜索词不重复追加
4. 最近搜索最多保留 20 条
5. 清除历史后列表为空

---

### P002: 模板标签与分类筛选

**问题描述**: S72-E5 实现了 TemplatePreviewPanel，但模板库（TemplateGallery）没有按标签/分类筛选功能。模板数量增长后，用户只能浏览全部模板或依赖名称搜索，效率低。

**根因**: `templateStore` 的模板数据结构（`TemplateSnapshot`）缺少 `tags` 字段，`TemplateGallery` 也没有标签过滤 UI。

**影响**: 用户体验 — 大量模板时无法快速定位目标模板。

**技术方案**:
- 扩展 `TemplateSnapshot` 接口：新增 `tags: string[]` 字段
- `templateStore` 新增 `filterTemplatesByTag(tag: string | null)` getter：返回过滤后模板列表
- `TemplateGallery` 顶部新增标签筛选栏（chip 按钮 All/Design/Analysis/...），点击切换
- 支持多标签 AND 筛选
- 为现有模板批量补充默认 tags（Design=通用设计类, Analysis=分析类, Collab=协作类）

**验收标准**:
1. 模板 Gallery 顶部显示标签筛选栏
2. 点击标签仅显示该标签模板
3. 多标签 AND 筛选正确
4. 新增/导入模板时支持设置 tags
5. 标签筛选状态不因面板切换丢失

---

### P003: 画布分支对比视图（Diff View）

**问题描述**: S73-E4 实现了分支命名与保护，但用户无法直观对比两个分支之间的差异。当分支偏离主分支或需要合并时，用户需要靠记忆判断差异。

**根因**: `canvasHistoryStore` 实现了分支元数据管理，但没有分支间差异对比能力。`HistoryPanel` 也只展示分支列表，没有对比功能。

**影响**: 用户体验 — 分支管理效率低，合并决策缺乏数据支撑。

**技术方案**:
- `canvasHistoryStore` 新增 `compareBranches(sourceBranchId, targetBranchId)`：返回增/删/改节点列表
- 新增 `BranchDiffResult` 类型：`{ added: Node[], removed: Node[], modified: Node[] }`
- `HistoryPanel` 分支列表新增"对比"按钮（选中两个分支后激活）
- 新增 `BranchDiffDialog.tsx`：模态框展示两个分支的节点差异（绿色=新增/红色=删除/黄色=修改）
- 支持分支 → 主分支 快捷对比

**验收标准**:
1. 选中两个分支后可点击"对比"按钮
2. 对比结果展示：新增/删除/修改节点数量
3. 对比弹窗支持展开查看具体节点内容
4. 支持"对比到主分支"快捷操作
5. 对比结果实时计算，不卡 UI

---

### P004: 协作 @mention 通知推送闭环

**问题描述**: S51 实现了 mentionsStore（@输入时用户列表 UI），S73-E3 实现了通知管理（NotificationPanel + preferences），但 @mention 后对方不会收到通知推送。mention 输入 → 通知持久化 → 推送缺失。

**根因**: `mentionsStore` 仅管理输入时的 UI 状态（`Mention[]`），没有与 `notificationStore` 打通。发送 mention 消息时没有触发 `addNotification`。

**影响**: 协作体验 — @mention 核心价值无法兑现，协作者收不到提醒。

**技术方案**:
- `useActivityStore` 发送消息时（`addEntry`）：解析消息内容中的 `@username` 模式
- 解析到的每个被 @ 用户 → 调用 `notificationStore.addNotification({ type: 'mention', from, messageId, ... })`
- `notificationStore` 的 `type: 'mention'` 需要对应的 `isTypeEnabled` 过滤
- `NotificationPanel` 中 mention 类型通知：点击跳转至对应消息位置

**验收标准**:
1. @mention 消息发送后被 @ 用户收到通知
2. 通知出现在 NotificationPanel 的 mention 类型下
3. 通知偏好设置中 mention 类型可独立开关
4. 点击通知跳转至对应消息
5. 多次 @ 同一用户不重复通知

---

### P005: 键盘导航增强 — 搜索/模板/通知面板

**问题描述**: S73-E1 搜索面板、S72-E5 模板预览、S73-E3 通知面板都缺少键盘导航支持。Tab/方向键无法在面板内导航，Esc 关闭支持不一致。

**根因**: 这些面板开发时聚焦功能交付，键盘可访问性未纳入验收标准。

**影响**: 可访问性 — 高级用户和依赖键盘操作的用户体验差，不符合 WCAG 基本要求。

**技术方案**:
- `CanvasSearchPanel`：`↑↓` 在结果列表内导航，Enter 选中/跳转，Esc 关闭
- `TemplateGallery` / `TemplatePreviewPanel`：Tab 在模板卡片间导航，Enter 打开预览，Esc 关闭预览
- `NotificationPanel`：Tab 在通知项间导航，Enter 标记已读/跳转，Esc 关闭
- 所有面板添加 `role` / `aria-label` / `aria-activedescendant` 语义
- 全局焦点管理：打开面板时聚焦面板，关闭时焦点返回触发元素

**验收标准**:
1. 搜索面板：↑↓导航结果，Enter跳转，Esc关闭
2. 模板Gallery/Preview：Tab导航，Enter打开，Esc关闭
3. 通知面板：Tab导航，Enter操作，Esc关闭
4. 面板打开时焦点移入，关闭时焦点还原
5. 所有可交互元素有 role/aria-label

---

## 技术风险

| 风险 | 可能性 | 影响 | 缓解 |
|------|--------|------|------|
| BranchDiff 计算量（大型画布） | 中 | 高 | 异步计算 + loading 状态，支持取消 |
| NotificationStore 类型爆炸 | 低 | 中 | mention 作为现有 type 枚举扩展 |
| 模板标签数据迁移 | 中 | 低 | 增量迁移脚本 + 默认 tag |
| 搜索历史 persist 隐私合规 | 低 | 中 | 本地存储，明确告知用户可清除 |
