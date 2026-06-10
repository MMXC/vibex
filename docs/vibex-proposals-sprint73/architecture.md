# VibeX Sprint73 架构文档

**Sprint**: Sprint73
**日期**: 2026-06-07
**版本**: 1.0
**架构师**: coord (heartbeat self-impl)

---

## 1. 概述

Sprint73 基于 Sprint71+Sprint72 的已完成功能，识别 5 个迭代缺口：
- E1: 画布内容全文搜索（全局快捷键 + 浮层面板）
- E2: 模板节点导入画布（完成预览→使用闭环）
- E3: 通知管理与历史（标已读/清空/设置）
- E4: 画布分支命名与保护（分支元数据 DB 升级）
- E5: AI 会话导出与分享（Markdown/PDF/剪贴板）

---

## 2. 现有资产映射

### E1: 画布内容全文搜索
| 文件 | 状态 | 说明 |
|------|------|------|
| `src/stores/dds/canvasSearchStore.ts` | ✅ 已存在 | Sprint68-E3 部分实现：`searchNodeContent`/`fulltextResults`/`fulltextQuery`/`fulltextLoading` 已完成 |
| `src/components/dds/canvas/CanvasSearchPanel.tsx` | 🆕 新建 | 全文搜索浮层面板 |
| `src/stores/dds/__tests__/canvasSearchStore.test.ts` | ⚠️ 需扩展 | 需新增 `searchNodes` 方法测试 |

**E1 架构决策**:
- `canvasSearchStore.searchNodeContent()` 已在 S68 实现，E1 扩展为同步 `searchNodes()` 方法供 `CanvasSearchPanel` 调用
- `CanvasSearchPanel` 作为 DDSDrawflow 浮层，不修改核心画布组件
- 键盘快捷键通过 `useKeyboardShortcuts` hook 注册 `Cmd/Ctrl+F`，由 DDSToolbar 或 DDSDrawflow 处理

### E2: 模板节点导入画布
| 文件 | 状态 | 说明 |
|------|------|------|
| `src/lib/canvas/templateStore.ts` | ✅ 已存在 | Sprint72 已实现 `getTemplateNodes` |
| `src/components/dds/templates/TemplatePreviewPanel.tsx` | ✅ 已存在 | Sprint72-E5 预览面板（5735B） |
| `src/components/dds/templates/ImportTemplateModal.tsx` | 🆕 新建 | 导入模式选择对话框 |
| `src/stores/__tests__/templateStore.test.ts` | ⚠️ 需扩展 | 需新增 `importTemplateToCanvas` 测试 |
| `src/components/dds/templates/__tests__/TemplatePreviewPanel.test.tsx` | 🆕 新建 | 集成测试 |

**E2 架构决策**:
- `importTemplateToCanvas(templateId, position)` 在 `templateStore` 中实现，写入 `canvasStore`
- 节点 UUID 映射表：源模板 UUID → 新 UUID，避免 ID 冲突
- 边引用通过映射表更新指向新节点 ID

### E3: 通知管理与历史
| 文件 | 状态 | 说明 |
|------|------|------|
| `src/stores/notificationStore.ts` | ✅ 已存在（部分） | S71-E4 已实现 `addNotification`/`dismiss`/`getUnreadCount` |
| `src/components/dds/notifications/NotificationPanel.tsx` | ✅ 已存在（部分） | 已有列表渲染，需新增 header 操作按钮 |
| `src/components/dds/notifications/NotificationSettingsDrawer.tsx` | 🆕 新建 | 通知偏好设置抽屉 |
| `src/stores/__tests__/notificationStore.test.ts` | ⚠️ 需扩展 | 需新增 `markAllAsRead`/`clearAll` 测试 |

**E3 架构决策**:
- `notificationStore` 已有 persist middleware，`markAllAsRead`/`clearAll` 作为新 action 添加
- `NotificationSettingsDrawer` 复用现有 Drawer 模式，保存至 localStorage（通过 store persist）

### E4: 画布分支命名与保护
| 文件 | 状态 | 说明 |
|------|------|------|
| `src/lib/canvas/historyDB.ts` | ✅ 已存在 | DB_VERSION=4，有 snapshots 表 |
| `src/stores/dds/canvasHistoryStore.ts` | ✅ 已存在（35648B） | 有分支操作方法 |
| `src/lib/canvas/historyDB.test.ts` | ✅ 已存在 | 需扩展 branchMeta 测试 |
| `src/components/dds/history/HistoryPanel.tsx` | ✅ 已存在（25791B） | 需新增分支编辑/保护 UI |

**E4 架构决策**:
- `historyDB`: DB_VERSION=5 upgrade，新增 `branchMeta` 表（`canvasId`, `branchName`, `name`, `isProtected`, `createdAt`）
- `canvasHistoryStore` 新增 `setBranchName`/`setBranchProtected`/`getBranchMeta` 方法
- 保护分支删除操作通过 `window.confirm()` 前端确认（不涉及 store 方法）
- `HistoryPanel` 分支列表：inline 编辑名称 + 🔒 toggle 保护状态

### E5: AI 会话导出与分享
| 文件 | 状态 | 说明 |
|------|------|------|
| `src/lib/collaboration/collabSessionStore.ts` | ✅ 已存在（9011B） | 有 session 录制/回放引擎 |
| `src/components/canvas/features/SessionReplayPanel.tsx` | ✅ 已存在 | 需新增导出下拉菜单 |
| `src/lib/collaboration/__tests__/collabSessionStore.test.ts` | ⚠️ 需扩展 | 需新增 `exportSessionMarkdown` 测试 |

**E5 架构决策**:
- `exportSessionMarkdown(sessionId)` 读取 IndexedDB events，格式化为 Markdown
- `exportSessionPDF(sessionId)` 调用 `window.print()` + CSS `@media print` 样式
- 导出下拉菜单放在 `SessionReplayPanel` header，与回放控制并列
- Markdown 格式：H1 会话名 + H2 Events + 时间戳 + 用户名 + 事件内容

---

## 3. 跨 Epic 集成点

| 集成点 | 涉及 Epic | 实现方式 |
|--------|---------|---------|
| DDSToolbar | E1 | E1 搜索按钮添加到 Toolbar，与通知按钮并列 |
| useKeyboardShortcuts | E1 | `Cmd/Ctrl+F` 触发 `CanvasSearchPanel` 打开 |
| canvasStore | E2 | `importTemplateToCanvas` 写入节点到当前画布 |
| NotificationPanel | E3 | header 新增两个操作按钮 |
| HistoryPanel | E4 | 分支列表区域新增编辑/保护 UI |
| SessionReplayPanel | E5 | header 新增导出下拉菜单 |
| IndexedDB | E3/E4 | E3: notificationStore 用现有 persist；E4: historyDB 版本升级 |

---

## 4. 技术风险

| 风险 | 影响 | 缓解方案 |
|------|------|---------|
| E1 大画布搜索性能 | 高 | 限制标题+第一行内容匹配，避免全量遍历；`searchNodes` 返回结果上限 100 条 |
| E2 UUID 映射完整性 | 中 | 实现节点 ID 映射表，导入时遍历所有边引用并更新 |
| E4 IndexedDB 版本升级 | 中 | 保留 v4 数据，upgrade 函数中检测旧版本并迁移 |
| E5 PDF 导出格式 | 低 | 使用 `@media print` CSS，提供基础打印样式 |

---

## 5. 测试策略

| Epic | 测试文件 | 覆盖目标 |
|------|---------|---------|
| E1 | `canvasSearchStore.test.ts` (扩展) | `searchNodes` / 空查询 / 边界情况 |
| E1 | `CanvasSearchPanel.test.tsx` (新建) | 渲染 / 搜索交互 / 结果点击 |
| E2 | `templateStore.test.ts` (扩展) | `importTemplateToCanvas` / 空模板 / ID 冲突 |
| E2 | `TemplatePreviewPanel.test.tsx` (新建) | 导入按钮点击 / 模态框交互 |
| E3 | `notificationStore.test.ts` (扩展) | `markAllAsRead` / `clearAll` / `getUnreadCount` |
| E3 | `NotificationPanel.test.tsx` (扩展) | header 按钮点击 |
| E4 | `historyDB.test.ts` (扩展) | branchMeta CRUD |
| E4 | `HistoryPanel.test.tsx` (扩展) | 分支编辑 / 保护 toggle |
| E5 | `collabSessionStore.test.ts` (扩展) | `exportSessionMarkdown` 格式验证 |
