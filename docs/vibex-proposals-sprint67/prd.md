# VibeX Sprint67 产品需求文档

**Sprint**: vibex-proposals-sprint67  
**版本**: 1.0  
**日期**: 2026-06-06  
**负责人**: pm (phantom ghost — coord self-impl)  
**上游**: vibex-proposals-sprint67/analyze-requirements

---

## 执行摘要

S67 聚焦于让 S66 的五大功能（分支操作、冲突检测、视图预设、模板搜索、会话回放）更加完整和可用。S67 交付 5 个 Epic，涵盖分支对比、实时活动流、模板分析、快捷键配置、导出增强。

### Epic × Priority Table

| Epic | Feature | Priority | Sprint Focus |
|------|---------|----------|-------------|
| E1 | 画布分支快照视觉对比 | P0 | 分支差异可视化 |
| E2 | 实时协作活动流面板 | P0 | 协作透明度 |
| E3 | 模板画廊使用分析 + AI 推荐 | P1 | 数据驱动推荐 |
| E4 | 画布快捷键可配置化 | P1 | 自定义绑定管理 |
| E5 | 画布导出增强：PDF/SVG | P1 | 导出格式扩展 |

---

## E1: 画布分支快照视觉对比

### User Story
作为协作者，我希望直观看到两个分支之间的差异，以便安全地合并分支并理解变更内容。

### DoD Checklist
- [ ] D1.1: `canvasHistoryStore.compareBranches(branchA, branchB)` — 返回节点差异数组 `{nodeId, type: 'added'|'modified'|'deleted', details}`
- [ ] D1.2: `BranchDiffPanel.tsx` — 侧边面板 UI，接收 branchA/branchB props，显示差异列表
- [ ] D1.3: `SnapshotDiffRenderer` — 节点差异可视化组件，颜色编码（绿=新增，黄=修改，红=删除）
- [ ] D1.4: `HistoryPanel.tsx` — 新增"对比分支"按钮，点击弹出分支选择器 + BranchDiffPanel
- [ ] D1.5: `canvasHistoryStore.test.ts` — compareBranches 测试（边界：无差异/单侧差异/双侧差异）

### expect() Assertions
```typescript
// E1: Branch Comparison
expect(compareBranches('main', 'feature-a').filter(d => d.type === 'added').length).toBeGreaterThan(0);
expect(compareBranches('main', 'main').filter(d => d.type === 'modified').length).toBe(0);
expect(() => compareBranches('nonexistent', 'main')).toThrow('Branch not found');
```

### vitest Acceptance
```bash
npx vitest run canvasHistoryStore --reporter=verbose
# Expected: compareBranches 3 tests pass
```

---

## E2: 实时协作活动流面板

### User Story
作为协作者，我希望实时看到谁在线以及他们的操作活动，以便更高效地协调工作。

### DoD Checklist
- [ ] D2.1: `presenceStore.recentActivity[]` — 最近 20 条活动数组，每条 `{userId, userName, type, nodeId?, timestamp}`
- [ ] D2.2: `presenceStore.addActivity(event)` — 添加活动，自动清理超出 20 条的旧记录
- [ ] D2.3: `CollabActivityPanel.tsx` — 活动流面板 UI，显示在线用户列表 + 活动时间线
- [ ] D2.4: WebSocket 消息扩展 — `user:activity` 消息类型，节流广播（每用户 1 msg/sec）
- [ ] D2.5: `DDSFlow.tsx` — 在节点操作时发布 activity 事件（focus/blur/drag/edit）
- [ ] D2.6: 活动图标映射 — join/leave/focus/edit/lock/unlock 各有图标
- [ ] D2.7: `CollabActivityPanel.test.ts` — 面板渲染测试

### expect() Assertions
```typescript
// E2: Activity Stream
expect(store.recentActivity.length).toBeLessThanOrEqual(20);
expect(addActivity({ userId: 'u1', type: 'focus', nodeId: 'n1' }).length).toBe(store.recentActivity.length + 1);
expect(store.recentActivity[store.recentActivity.length - 1].type).toBe('focus');
```

### vitest Acceptance
```bash
npx vitest run CollabActivityPanel --reporter=verbose
# Expected: panel renders with online users + activity items
```

---

## E3: 模板画廊使用分析 + AI 推荐

### User Story
作为用户，我希望看到模板使用数据和智能推荐，以便快速找到最适合自己的模板。

### DoD Checklist
- [ ] D3.1: `templateStore.selectors.topTemplates(n)` — 返回使用量 Top-N 模板
- [ ] D3.2: `templateStore.selectors.getUsageStats()` — 返回分类维度使用量统计
- [ ] D3.3: `TemplateAnalytics.tsx` — 分析面板，含排行榜（Top 10 模板）、分类柱状图、使用趋势
- [ ] D3.4: AI 推荐逻辑 — 基于 `usageCount` × 0.5 + `tagMatchScore` × 0.3 + `recencyScore` × 0.2 的加权评分
- [ ] D3.5: TemplateGallery 新增"为你推荐" Tab，显示 AI 推荐列表
- [ ] D3.6: 每个模板卡片显示 `stats.usageCount` 徽章
- [ ] D3.7: `TemplateAnalytics.test.ts` — 分析组件测试

### expect() Assertions
```typescript
// E3: Template Analytics
expect(topTemplates(10).length).toBeLessThanOrEqual(10);
expect(topTemplates(10)[0].stats.usageCount).toBeGreaterThanOrEqual(topTemplates(10)[1].stats.usageCount);
// AI recommendation scoring
const score = calcRecommendScore({ usageCount: 100, tagMatch: 0.8, recency: 0.9 });
expect(score).toBeGreaterThan(0);
```

### vitest Acceptance
```bash
npx vitest run templateStore --reporter=verbose
# Expected: analytics selectors + recommendation scoring tests pass
```

---

## E4: 画布快捷键可配置化

### User Story
作为高级用户，我希望自定义画布快捷键配置并导入/导出，以便在不同设备上保持一致的操作习惯。

### DoD Checklist
- [ ] D4.1: `shortcutStore.customBindings[]` — 自定义绑定数组，每条 `{id, key, action, description}`
- [ ] D4.2: `shortcutStore.addBinding(id, key, action)` — 添加新绑定，自动去重
- [ ] D4.3: `shortcutStore.removeBinding(id)` — 删除自定义绑定
- [ ] D4.4: `shortcutStore.updateBinding(id, newKey)` — 修改已有绑定
- [ ] D4.5: `shortcutStore.importBindings(json)` / `exportBindings()` — JSON 导入导出
- [ ] D4.6: `ShortcutEditor.tsx` — 快捷键编辑器，支持 key recorder（监听按键输入）
- [ ] D4.7: ShortcutSettingsPanel 新增"自定义绑定"区块（添加/编辑/删除/导入/导出）
- [ ] D4.8: 快捷键冲突检测 — 添加冲突绑定时显示警告
- [ ] D4.9: localStorage 持久化 `customBindings`
- [ ] D4.10: `shortcutStore.test.ts` — 自定义绑定 CRUD 测试

### expect() Assertions
```typescript
// E4: Custom Bindings
expect(addBinding('delete-node', 'Delete', 'deleteNode').length).toBe(store.customBindings.length + 1);
expect(() => addBinding('delete-node', 'Backspace', 'deleteNode')).toThrow('Duplicate binding');
expect(exportBindings()).toBeValidJSON();
```

### vitest Acceptance
```bash
npx vitest run shortcutStore --reporter=verbose
# Expected: customBindings CRUD + import/export tests pass
```

---

## E5: 画布导出增强：PDF/SVG

### User Story
作为用户，我希望将画布导出为 PDF 和 SVG 格式，以便用于汇报文档和设计交付。

### DoD Checklist
- [ ] D5.1: `PdfExporter.ts` — PDF 导出服务，支持 A4/Letter 纸张、单页/多页、边距配置
- [ ] D5.2: `SvgExporter.ts` — SVG 导出服务，遍历画布节点生成 SVG 字符串
- [ ] D5.3: ExportMenu.tsx 新增 PDF 导出选项（纸张大小/单多页选择器）
- [ ] D5.4: ExportMenu.tsx 新增 SVG 导出选项
- [ ] D5.5: `ExportProgress.tsx` 扩展支持 PDF/SVG 导出进度
- [ ] D5.6: package.json 确认 `jspdf` 依赖（添加如未安装）
- [ ] D5.7: `PdfExporter.test.ts` + `SvgExporter.test.ts` — 导出服务测试

### expect() Assertions
```typescript
// E5: Export Formats
expect(await pdfExporter.export(nodes, { paper: 'A4', pages: 'single' })).toBeInstanceOf(Blob);
expect(await svgExporter.export(nodes)).toContain('<svg');
expect(await svgExporter.export(nodes)).toContain('<rect'); // node rect elements
```

### vitest Acceptance
```bash
npx vitest run PdfExporter SvgExporter --reporter=verbose
# Expected: export service tests pass
```

---

## 跨 Epic 集成表

| 集成点 | 源 Epic | 目标 | 接口 |
|--------|---------|------|------|
| BranchDiffPanel | E1 | HistoryPanel (S66-E1) | `compareBranches()` selector |
| CollabActivityPanel | E2 | presenceStore (S66-E2) | `recentActivity[]` + WS messages |
| TemplateAnalytics | E3 | TemplateGallery (S66-E4) | `topTemplates()` selector + "推荐" Tab |
| ShortcutEditor | E4 | ShortcutSettingsPanel (S52-E5) | `customBindings[]` |
| PdfExporter/SvgExporter | E5 | ExportMenu (S54-E4) | `export()` method |

---

## 技术风险表

| 风险 | 严重度 | 缓解方案 |
|------|--------|----------|
| P001 分支 diff 遍历所有快照开销大 | Medium | 仅比较最新快照，后续迭代扩展 |
| P002 活动流消息量大导致网络拥塞 | Medium | 节流每用户 1 msg/sec，本地聚合 |
| P003 AI 推荐算法简单，精度有限 | Low | MVP 使用加权评分，非 LLM |
| P004 快捷键冲突检测复杂度 | Medium | 冲突时警告，确认覆盖 |
| P005 PDF 大画布分页渲染性能 | Medium | 分页渲染 + 取消支持 |

---

## 质量阈值

- 所有 Epic vitest 测试通过率 ≥ 95%
- PDF 导出 ≤ 10s（A4 单页）
- SVG 导出 ≤ 5s（100 节点以内）
- 活动流消息节流：每用户 1 msg/sec
- localStorage 持久化成功率 100%
