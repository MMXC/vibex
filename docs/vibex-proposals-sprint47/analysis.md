# Sprint 47 提案分析

> **Agent**: coord (heartbeat self-implement)
> **日期**: 2026-05-31
> **触发**: analyst CLI-dispatch ghost — Sprint47 analyst 派发后无输出，coord 自举完成 Sprint46 提案分析，基于 Sprint46 (E1-E5) 交付成果识别下一批高优先级功能增强。
> **方法**: 审查 CHANGELOG + 代码缺口分析 + 用户体验优先级

---

## 背景：Sprint45 交付成果

| Epic | 名称 | 状态 | 关键产出 |
|------|------|------|---------|
| E1 | AI 断线重连 | ✅ | exponential backoff retry、IndexedDB chunk 持久化 |
| E2 | Presence 协作光标 | ✅ | RemoteCursor WebSocket 迁移、实时彩色光标 + 用户名标签 |
| E3 | 画布 MiniMap | ✅ | MiniMapPanel、右下角视口导航、Controls 缩放按钮 |
| E4 | 模板版本管理 | ✅ | version 字段、templateStore actions、版本切换 |
| E5 | 画布快照分享 | ✅ | 公开只读分享链接、readOnly 模式 |

**已验证技术基础**：
- AI Session → IndexedDB 持久化链路已通
- Presence → WebSocket 实时光标已集成
- Canvas → MiniMap/Controls/Background 基础设施完整
- Template → 版本化体系已建立
- Sharing → 公开链接路由已实现

---

## P001 (P0) — AI Session 搜索 + 历史会话管理

### 问题描述
当前 AI Session 只支持按时间倒序浏览。用户无法搜索历史 session 内容（如"上周的 template A 讨论"），无法按关键词过滤。Session 积累后管理成本高。

### 根因分析
- `agentStore` / IndexedDB schema 无 `searchableText` 字段
- 无 session 列表过滤 UI（只有时间排序的列表）
- Session 标题默认使用"新对话"等无意义名称

### 技术可行性
**高** — IndexedDB 已有完整 session 数据，只需：
1. 新增 IndexedDB index (`searchableText`)
2. IndexedDB 写入时拼接 session title + 摘要文本
3. `AgentSessions` 组件增加搜索框 + 过滤逻辑
4. 已有 `useTranslations('ai')` i18n 基础

### DoD
- [ ] IndexedDB `sessions` 表新增 `searchableText` 字段（session title + 首条用户消息摘要）
- [ ] session 创建/更新时自动写入 `searchableText`
- [ ] `AgentSessions.tsx` 新增搜索输入框，实时过滤
- [ ] 搜索高亮匹配关键词
- [ ] Vitest: `agentStore` 搜索状态测试
- [ ] dual-CHANGELOG 更新

---

## P002 (P0) — 键盘快捷键系统 + 全局快捷键面板

### 问题描述
用户无法通过键盘快捷键快速操作（如快速保存、切换模板、打开 AI 面板）。高级用户和 power user 场景下快捷键是核心效率功能。Sprint44 E5 实现了触控手势，但键盘快捷键尚未建立。

### 根因分析
- 无统一的 `useKeyboardShortcuts` hook
- 无快捷键注册表（key → action 映射）
- 各组件内硬编码 keydown 监听，冲突无法管理
- Sprint44 shortcut-panel 相关代码存在但未完成

### 技术可行性
**高** — 只需：
1. 新建 `useKeyboardShortcuts` hook（注册表模式）
2. 快捷键冲突检测（同一快捷键被多个 action 绑定时报 warning）
3. 常用快捷键：`Cmd+S` 保存、`Cmd+K` AI 面板、`Cmd+Z` 撤销、`Cmd+/` 快捷键面板
4. `ShortcutPanel` 组件展示所有可用快捷键（已部分存在，需补全）
5. i18n: `shortcuts` namespace（需新建）

### DoD
- [ ] `useKeyboardShortcuts.ts` hook：注册表 + 冲突检测 + cleanup
- [ ] `ShortcutPanel.tsx` 展示所有快捷键列表（可从 AgentSessions 入口触发）
- [ ] `Cmd+S` → `saveCanvas()`（调用已有 save API）
- [ ] `Cmd+K` → 打开 AI 面板
- [ ] `Cmd+Shift+Z` → 重做（redo）
- [ ] 冲突快捷键：console.warn + UI tooltip 提示
- [ ] Vitest: 快捷键 hook 测试
- [ ] `shortcuts` i18n namespace 建立
- [ ] dual-CHANGELOG 更新

---

## P003 (P1) — 画布节点复制/粘贴 + 跨画布复用

### 问题描述
用户在一个画布中创建了节点/连线，想要在另一个画布中复用当前只能截图或手动重建。缺乏节点复制粘贴功能导致重复工作量大。

### 根因分析
- 无节点序列化/反序列化能力
- `canvasStore` 无 `copyNodes`/`pasteNodes` action
- 跨画布 session 隔离（不同 CanvasId），粘贴需要创建新节点

### 技术可行性
**高** — Canvas JSON 序列化能力已在 export 功能中验证（Sprint44 E4）：
1. 新增 `canvasStore.copyNodes(nodeIds)` → 序列化到 `clipboardStore`
2. 新增 `canvasStore.pasteNodes(targetCanvasId)` → 反序列化 + 创建新节点
3. 生成新的 `nodeId`（避免 ID 冲突）
4. 快捷键 `Cmd+C`/`Cmd+V` 绑定到节点选中状态
5. 跨画布粘贴：创建新节点到目标画布

### DoD
- [ ] `canvasStore` 新增 `copyNodes(nodeIds)` action → 序列化到 localStorage
- [ ] `canvasStore` 新增 `pasteNodes(targetCanvasId)` action → 反序列化 + 新 ID
- [ ] 选中节点时 toolbar 显示复制按钮
- [ ] `Cmd+C`/`Cmd+V` 全局快捷键（在节点选中状态下生效）
- [ ] 跨画布粘贴时显示目标画布选择器
- [ ] Vitest: copy/paste 逻辑测试
- [ ] dual-CHANGELOG 更新

---

## P004 (P1) — Canvas 列表视图 + 多画布管理面板

### 问题描述
当前用户只能通过 URL 直接访问特定画布（`/canvas/[id]`），没有画布列表入口。用户不知道自己有哪些画布，无法管理（重命名、删除、排序）。Sprint42 E4 建立了 HistoryPanel（单画布历史），但多画布管理缺失。

### 根因分析
- 无 `/canvases` 或 `/dashboard` 路由
- 无 Canvas 列表 API（IndexedDB 有 canvasMetaStore 但无列表 UI）
- Canvas 创建/删除入口缺失

### 技术可行性
**中** — 需要新页面路由：
1. 新建 `src/app/[locale]/canvases/page.tsx` 列表页面
2. `canvasMetaStore` 提供列表 + 搜索 + 排序
3. Canvas 卡片：预览缩略图 + 名称 + 更新时间 + 操作菜单
4. 操作：重命名（inline edit）、删除（confirm dialog）、置顶
5. 设计符合 `DESIGN.md` 设计系统

### DoD
- [ ] 新建 `src/app/[locale]/canvases/page.tsx` 列表页面
- [ ] `canvasMetaStore` 新增 `listCanvases()`、`deleteCanvas(id)`、`renameCanvas(id, name)` actions
- [ ] Canvas 卡片 UI：缩略图（用 `html2canvas` 或占位图）+ 名称 + 更新时间
- [ ] 删除确认 dialog（防误删）
- [ ] 首页 `/` 或侧边栏增加「我的画布」入口
- [ ] Vitest: canvasMetaStore 测试
- [ ] dual-CHANGELOG 更新

---

## P005 (P2) — Canvas 导出格式扩展：PNG/SVG 单文件 + Figma 兼容

### 问题描述
当前 export 支持 JSON/Vibex/PNG/SVG，但 PNG/SVG 只能导出当前视口（单页）。用户需要完整画布的高质量导出（PNG/SVG 全景图），以及可导入 Figma 的格式（CSV node data）。

### 根因分析
- 现有 PNG/SVG 导出使用 `htmlToImage` 只截取当前 viewport
- 无完整画布尺寸导出（全景图）
- 无 Figma-compatible 格式（CSV）

### 技术可行性
**中** — 依赖第三方库：
1. PNG 全景：分块渲染 + 拼接（`htmlToImage` 支持 scale 参数，分块截取后 canvas 拼接）
2. SVG 全景：`htmlToImage.toSvg` 支持全图
3. Figma CSV：遍历 nodes 输出 `{id, type, label, x, y, width, height}` 表格
4. Sprint44 E4 jspdf 已安装，可复用 PDF 导出模式

### DoD
- [ ] PNG 全景导出：检测画布边界，分块截取，拼接输出
- [ ] SVG 全景导出：完整画布 SVG
- [ ] Figma CSV 导出：node 数据表格（id/type/label/position/size）
- [ ] ExportMenu UI 增加全景导出选项
- [ ] Vitest: 导出格式测试
- [ ] dual-CHANGELOG 更新

---

## 优先级总结

| 编号 | 提案 | 优先级 | 工作量 | 风险 |
|------|------|--------|--------|------|
| P001 | AI Session 搜索+历史管理 | P0 | 中 | 低 |
| P002 | 键盘快捷键系统 | P0 | 中 | 低 |
| P003 | 画布节点复制/粘贴 | P1 | 中 | 低 |
| P004 | Canvas 多画布管理面板 | P1 | 中 | 中（路由新增） |
| P005 | Canvas 导出格式扩展 | P2 | 高 | 中（分块渲染） |

**建议 Sprint46 实施范围**：P001 + P002 + P003（三个中低风险 P0/P1）
