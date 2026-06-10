# S69 实现计划：IMPLEMENTATION_PARTITION

**项目**: vibex-proposals-sprint69
**日期**: 2026-06-06

---

## E1: 画布版本快照历史 — 实现分区

### DoD Checklist
- [ ] HistoryPanel.tsx 渲染快照列表（timestamp / branch / author）
- [ ] 点击快照 → read-only 预览
- [ ] restoreSnapshot(canvasId, snapshotId) 恢复画布状态
- [ ] 快照按 branchId 过滤
- [ ] BranchManager.tsx 支持创建/切换/删除分支
- [ ] vitest canvasHistoryStore E1 测试 ≥ 8 个

### 新增/扩展文件

| 文件 | 类型 | 说明 |
|------|------|------|
| `src/components/dds/canvas-history/HistoryPanel.tsx` | 新增 | 快照历史面板抽屉 |
| `src/components/dds/canvas-history/SnapshotDiffDialog.tsx` | 新增 | 快照对比浮层 |
| `src/components/dds/canvas-history/BranchManager.tsx` | 新增 | 分支管理面板 |
| `src/stores/dds/canvasHistoryStore.ts` | 扩展 | +getSnapshotsByCanvas/+restoreSnapshot/+deleteSnapshot |
| `src/components/dds/toolbar/DDSToolbar.tsx` | 扩展 | +历史按钮 |

### 测试
```bash
cd vibex-fronted && npx vitest run canvasHistoryStore --reporter=verbose
```

---

## E2: 全局搜索增强 — 实现分区

### DoD Checklist
- [ ] `<mark>` 高亮匹配关键词（背景 #fef08a）
- [ ] 每条结果显示：标题 + 前后各 30 字上下文片段
- [ ] ↑↓ 键盘选择（selectedIndex 状态）
- [ ] Enter 跳转节点并关闭，Escape 关闭
- [ ] searchHistory 持久化（localStorage，MAX 10 条）
- [ ] vitest canvasSearchStore E2 测试 ≥ 6 个

### 新增/扩展文件

| 文件 | 类型 | 说明 |
|------|------|------|
| `src/services/canvasFulltextIndex.ts` | 扩展 | +searchWithContext(query) 返回上下文片段 |
| `src/components/dds/search/GlobalSearchPanel.tsx` | 扩展 | +mark 高亮 + 上下文预览 + 键盘导航 |
| `src/stores/canvasSearchStore.ts` | 扩展 | +searchHistory[] + searchWithContext() 调用 |

### 测试
```bash
cd vibex-fronted && npx vitest run canvasSearchStore --reporter=verbose
```

---

## E3: 模板市场 — 实现分区

### DoD Checklist
- [ ] TemplateShareDialog 生成含 Base64 模板数据的 URL
- [ ] URL 一键复制到剪贴板
- [ ] ImportFromUrlDialog 解析 URL 并导入模板
- [ ] 重复导入 → 覆盖/跳过/重命名选择
- [ ] vitest templateStore E3 测试 ≥ 6 个

### 新增/扩展文件

| 文件 | 类型 | 说明 |
|------|------|------|
| `src/stores/templateShareStore.ts` | 新增 | 分享状态管理 |
| `src/components/dds/templates/TemplateShareDialog.tsx` | 新增 | 生成/复制分享链接 |
| `src/components/dds/templates/ImportFromUrlDialog.tsx` | 新增 | URL 导入对话框 |
| `src/stores/templateStore.ts` | 扩展 | +importFromShareUrl(url) |
| `src/components/dds/templates/TemplateGallery.tsx` | 扩展 | +"发现" Tab |

### 测试
```bash
cd vibex-fronted && npx vitest run templateStore --reporter=verbose
```

---

## E4: 节点评论系统 — 实现分区

### DoD Checklist
- [ ] 右键节点 → 上下文菜单出现"查看评论"
- [ ] CommentThread 浮层显示评论列表
- [ ] 支持 @提及回复（MentionInput）
- [ ] 未读评论节点显示红色徽章数字
- [ ] 点击徽章 → 打开浮层 → 自动标记已读
- [ ] 评论后触发 notificationStore 通知
- [ ] vitest commentStore 测试 ≥ 8 个

### 新增/扩展文件

| 文件 | 类型 | 说明 |
|------|------|------|
| `src/stores/commentStore.ts` | 新增 | 评论 CRUD + Zustand persist |
| `src/services/commentDB.ts` | 新增 | IndexedDB 操作层 |
| `src/components/dds/comments/CommentThread.tsx` | 新增 | 评论浮层（评论列表+输入框） |
| `src/components/dds/comments/NodeCommentBadge.tsx` | 新增 | 未读评论徽章 |
| `src/components/dds/canvas-dashboard/DDSCanvasPage.tsx` | 扩展 | +右键"查看评论"菜单 |
| `src/stores/notificationStore.ts` | 扩展 | +addCommentNotification() |

### 测试
```bash
cd vibex-fronted && npx vitest run commentStore --reporter=verbose
```

---

## E5: 画布视图预设 — 实现分区

### DoD Checklist
- [ ] 当前视图设置可保存为命名预设
- [ ] 工具栏预设下拉菜单一键应用预设
- [ ] 可编辑/删除预设
- [ ] 预设通过 settingsStore persist 持久化
- [ ] vitest settingsStore E5 测试 ≥ 6 个

### 新增/扩展文件

| 文件 | 类型 | 说明 |
|------|------|------|
| `src/components/dds/settings/ViewPresetsPanel.tsx` | 新增 | 预设管理面板（创建/编辑/删除） |
| `src/stores/dds/settingsStore.ts` | 扩展 | +canvasPresets[] + activePresetId + saveAsPreset/applyPreset/deletePreset |
| `src/components/dds/toolbar/DDSToolbar.tsx` | 扩展 | +预设下拉菜单 |

### 测试
```bash
cd vibex-fronted && npx vitest run settingsStore --reporter=verbose
```

---

## vitest 汇总

| Epic | 测试文件 | 预期通过 |
|------|----------|---------|
| E1 | `canvasHistoryStore.e1-snapshot.test.ts` | ≥ 8 |
| E2 | `canvasSearchStore.test.ts` (E2 部分) | ≥ 6 |
| E3 | `templateStore.test.ts` (E3 部分) | ≥ 6 |
| E4 | `commentStore.test.ts` (新建) | ≥ 8 |
| E5 | `settingsStore.test.ts` (E5 部分) | ≥ 6 |
| **合计** | | **≥ 34** |
