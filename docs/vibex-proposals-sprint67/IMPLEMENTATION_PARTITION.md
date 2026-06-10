# VibeX Sprint67 实现分工文档

**Sprint**: vibex-proposals-sprint67  
**版本**: 1.0  
**日期**: 2026-06-06  
**架构师**: architect (phantom ghost — coord self-impl)  
**上游**: vibex-proposals-sprint67/architecture.md

---

## 新增文件表

### E1: 画布分支快照视觉对比

| 文件 | 类型 | 位置 | 说明 |
|------|------|------|------|
| `BranchDiffPanel.tsx` | 组件 | `src/components/dds/canvas-history/` | 分支对比面板 UI |
| `BranchDiffPanel.module.css` | 样式 | `src/components/dds/canvas-history/` | 面板样式 |
| `SnapshotDiffRenderer.tsx` | 组件 | `src/components/dds/canvas-history/` | 节点差异可视化 |

**扩展文件**:
- `canvasHistoryStore.ts` — 新增 `compareBranches()` action
- `historyDB.ts` — 新增 `getLatestSnapshot()` 辅助函数
- `HistoryPanel.tsx` — 新增"对比分支"按钮

### E2: 实时协作活动流面板

| 文件 | 类型 | 位置 | 说明 |
|------|------|------|------|
| `CollabActivityPanel.tsx` | 组件 | `src/components/dds/collab/` | 活动流面板 |
| `CollabActivityPanel.module.css` | 样式 | `src/components/dds/collab/` | 面板样式 |
| `wsActivityHandler.ts` | WS handler | `src/lib/collaboration/ws/` | 活动消息处理器 |

**扩展文件**:
- `presenceStore.ts` — 新增 `recentActivity[]` + `addActivity()` + `clearActivity()`
- `DDSFlow.tsx` — 在节点操作回调中发布 activity 事件
- `CollabWebSocket.ts` — 注册 `user:activity` 消息类型

### E3: 模板画廊使用分析 + AI 推荐

| 文件 | 类型 | 位置 | 说明 |
|------|------|------|------|
| `TemplateAnalytics.tsx` | 组件 | `src/components/dds/templates/` | 分析面板 |
| `TemplateAnalytics.module.css` | 样式 | `src/components/dds/templates/` | 分析面板样式 |

**扩展文件**:
- `templateStore.ts` — 新增 `topTemplates()` / `getCategoryStats()` / `calcRecommendScore()` selectors
- `TemplateGallery.tsx` — 新增"为你推荐" Tab

### E4: 画布快捷键可配置化

| 文件 | 类型 | 位置 | 说明 |
|------|------|------|------|
| `ShortcutEditor.tsx` | 组件 | `src/components/dds/shortcuts/` | 快捷键编辑器 |
| `useKeyRecorder.ts` | Hook | `src/hooks/shortcuts/` | 按键录制 Hook |
| `shortcutEditor.module.css` | 样式 | `src/components/dds/shortcuts/` | 编辑器样式 |

**扩展文件**:
- `shortcutStore.ts` — 新增 `customBindings[]` + CRUD actions + import/export
- `ShortcutSettingsPanel.tsx` — 新增"自定义绑定"区块

### E5: 画布导出增强：PDF/SVG

| 文件 | 类型 | 位置 | 说明 |
|------|------|------|------|
| `PdfExporter.ts` | 服务 | `src/services/export/` | PDF 导出服务 |
| `SvgExporter.ts` | 服务 | `src/services/export/` | SVG 导出服务 |

**扩展文件**:
- `ExportMenu.tsx` — 新增 PDF/SVG 导出选项
- `ExportProgress.tsx` — 扩展 PDF/SVG 进度显示
- `package.json` — 添加 `jspdf` 依赖（如未安装）

---

## DoD Checklist + expect()

### E1: 画布分支快照视觉对比

- [ ] D1.1: `canvasHistoryStore.compareBranches(branchA, branchB)` — 返回 `{nodeId, type, details}`
- [ ] D1.2: `BranchDiffPanel.tsx` — 侧边面板，显示差异列表
- [ ] D1.3: `SnapshotDiffRenderer.tsx` — 节点差异颜色编码（绿/黄/红）
- [ ] D1.4: `HistoryPanel.tsx` — 新增"对比分支"按钮
- [ ] D1.5: `canvasHistoryStore.test.ts` — compareBranches 测试

```typescript
// E1 expect()
expect(compareBranches('main', 'feature-a').length).toBeGreaterThan(0);
expect(compareBranches('main', 'feature-a').every(d => ['added','modified','deleted'].includes(d.type))).toBe(true);
```

### E2: 实时协作活动流面板

- [ ] D2.1: `presenceStore.recentActivity[]` — 最多 20 条活动
- [ ] D2.2: `presenceStore.addActivity(event)` — 添加 + 自动截断
- [ ] D2.3: `CollabActivityPanel.tsx` — 在线用户列表 + 活动时间线
- [ ] D2.4: `user:activity` WS 消息 + 节流（1 msg/sec/用户）
- [ ] D2.5: `DDSFlow.tsx` — 节点操作发布 activity 事件
- [ ] D2.6: 活动图标映射
- [ ] D2.7: `CollabActivityPanel.test.ts`

```typescript
// E2 expect()
expect(store.recentActivity.length).toBeLessThanOrEqual(20);
addActivity({ userId: 'u1', type: 'focus', nodeId: 'n1' });
expect(store.recentActivity[store.recentActivity.length - 1].type).toBe('focus');
```

### E3: 模板画廊使用分析 + AI 推荐

- [ ] D3.1: `topTemplates(n)` — 按使用量排序
- [ ] D3.2: `getUsageStats()` — 分类维度统计
- [ ] D3.3: `TemplateAnalytics.tsx` — 排行榜 + 分类柱状图
- [ ] D3.4: AI 推荐加权评分 (usage×0.5 + tagMatch×0.3 + recency×0.2)
- [ ] D3.5: TemplateGallery "为你推荐" Tab
- [ ] D3.6: 模板卡片 usageCount 徽章
- [ ] D3.7: `TemplateAnalytics.test.ts`

```typescript
// E3 expect()
const top = topTemplates(10);
expect(top[0].stats.usageCount).toBeGreaterThanOrEqual(top[1].stats.usageCount);
expect(calcRecommendScore(templates[0])).toBeGreaterThan(0);
```

### E4: 画布快捷键可配置化

- [ ] D4.1: `shortcutStore.customBindings[]` — 自定义绑定数组
- [ ] D4.2: `addBinding(id, key, action)` — 添加 + 去重
- [ ] D4.3: `removeBinding(id)` — 删除绑定
- [ ] D4.4: `updateBinding(id, newKey)` — 修改绑定
- [ ] D4.5: `importBindings(json)` / `exportBindings()` — 导入导出
- [ ] D4.6: `ShortcutEditor.tsx` — Key Recorder 编辑器
- [ ] D4.7: ShortcutSettingsPanel 新增自定义区块
- [ ] D4.8: 快捷键冲突检测
- [ ] D4.9: localStorage 持久化 `customBindings`
- [ ] D4.10: `shortcutStore.test.ts`

```typescript
// E4 expect()
addBinding('delete-node', 'Delete', 'deleteNode');
expect(store.customBindings.find(b => b.key === 'Delete')?.action).toBe('deleteNode');
expect(() => addBinding('delete-node', 'Backspace', 'deleteNode')).toThrow('Duplicate');
```

### E5: 画布导出增强：PDF/SVG

- [ ] D5.1: `PdfExporter.exportPdf(nodes, options)` — PDF 生成
- [ ] D5.2: `SvgExporter.exportSvg(nodes)` — SVG 字符串
- [ ] D5.3: ExportMenu 新增 PDF 选项（纸张/单多页选择）
- [ ] D5.4: ExportMenu 新增 SVG 选项
- [ ] D5.5: ExportProgress 扩展 PDF/SVG 进度
- [ ] D5.6: `jspdf` 依赖确认
- [ ] D5.7: `PdfExporter.test.ts` + `SvgExporter.test.ts`

```typescript
// E5 expect()
const pdfBlob = await exportPdf(nodes, { paper: 'A4', pages: 'single' });
expect(pdfBlob.type).toBe('application/pdf');
const svgStr = await exportSvg(nodes);
expect(svgStr).toContain('<svg');
expect(svgStr).toContain('<rect');
```

---

## 测试命令

```bash
# E1
npx vitest run canvasHistoryStore --reporter=verbose

# E2
npx vitest run CollabActivityPanel presenceStore --reporter=verbose

# E3
npx vitest run templateStore TemplateAnalytics --reporter=verbose

# E4
npx vitest run shortcutStore --reporter=verbose

# E5
npx vitest run PdfExporter SvgExporter --reporter=verbose

# 全量
npx vitest run --reporter=verbose
```
