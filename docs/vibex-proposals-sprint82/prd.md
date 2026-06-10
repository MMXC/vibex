# Sprint82 PRD — VibeX Sprint82

**Sprint**: Sprint82  
**版本**: 1.0  
**日期**: 2026-06-09  
**项目**: vibex-proposals-sprint82

---

## 执行摘要

Sprint82 聚焦于画布版本管理与协作体验增强。基于 S80（Settings/Presence/Notification）和 S81（Import/Export/Performance）的完成情况，识别出 5 个关键缺口：画布分支管理 UI、模板 Gallery UI、画布分享、文件拖拽导入、冲突增强。覆盖 Data/CanvasUX/Template/Collaboration 四类。

---

## Epic-Story Table

| Epic | 功能 | DoD | 验收测试 |
|------|------|------|---------|
| **E1** | 画布版本分支管理 UI | 1. `MergeHistoryPanel.tsx` 渲染分支列表 | `MergeHistoryPanel.test.tsx` ≥8 个测试 |
| | | 2. `canvasHistoryStore.switchBranch(branchId)` 切换成功 | `canvasHistoryStore.sprint82-e1.test.ts` ≥6 个测试 |
| | | 3. `canvasHistoryStore.diffBranches(a, b)` 返回 `BranchDiffResult` | |
| | | 4. 分支切换后画布节点/边重新加载 | |
| **E2** | 模板 Gallery UI | 1. `TemplateGallery.tsx` 渲染缩略图网格 | `TemplateGallery.test.tsx` ≥6 个测试 |
| | | 2. 分类/标签筛选联动 `templateStore.filterTemplates` | `templateStore.sprint82-e2.test.ts` ≥4 个测试 |
| | | 3. 点击卡片弹出预览并可插入画布 | |
| | | 4. 搜索框按名称过滤 | |
| **E3** | 画布分享与隐私 | 1. `shareService.ts` 实现 `generateShareLink()` / `revokeShareLink()` | `shareService.test.ts` ≥10 个测试 |
| | | 2. `ShareDialog.tsx` 渲染分享面板 | `ShareDialog.test.tsx` ≥5 个测试 |
| | | 3. DDSToolbar 添加分享按钮（icon + aria-label） | `DDSToolbar.e3.test.tsx` ≥3 个测试 |
| | | 4. 权限 (view/edit) 可切换 | |
| **E4** | 文件拖拽导入 | 1. `useFileDrop.ts` 监听 dragover/drop 事件 | `useFileDrop.test.ts` ≥8 个测试 |
| | | 2. 拖拽 .flow.json/.flow.zip 触发 `canvasListStore.createCanvas()` | `canvasListStore.e4.test.ts` ≥4 个测试 |
| | | 3. 导入冲突时复用 `ImportConflictDialog` | `ImportMenu.e4.test.ts` ≥3 个测试 |
| | | 4. 成功/失败 Toast 提示 | |
| **E5** | 协作冲突增强 | 1. `ConflictDialog.tsx` 添加 auto-resolve 策略选择 | `ConflictDialog.e5.test.tsx` ≥8 个测试 |
| | | 2. `canvasHistoryStore.resolveConflict(branchId, strategy)` | `canvasHistoryStore.e5.test.ts` ≥5 个测试 |
| | | 3. 冲突节点高亮（红色边框 + 背景色） | |
| | | 4. WS 冲突消息触发 ConflictDialog | |

---

## Cross-Epic Integration Table

| 集成点 | E1 ↔ E5 | E2 ↔ E1 | E3 ↔ E1 | E4 ↔ E1 |
|--------|---------|---------|---------|---------|
| `canvasHistoryStore` | E1 添加分支方法，E5 使用 | — | E1 提供分支权限 | — |
| `ConflictDialog` | E5 扩展冲突处理 | — | — | — |
| `DDSToolbar` | — | — | E3 添加分享按钮 | — |
| `ImportConflictDialog` | — | — | — | E4 复用 |
| `canvasListStore` | — | — | E3 分享链接持久化 | E4 调用 createCanvas |

---

## 依赖关系

- E2 (Template Gallery) 依赖: `templateStore.ts` (S80-E2, ✅ on main)
- E1 (Branch UI) 依赖: `canvasHistoryStore.ts` types (S80-E3, ✅ on main)
- E3 (Share) 依赖: 无 — 全新实现
- E4 (File Drop) 依赖: `ImportConflictDialog.tsx` (S81-E1, ✅ on main)
- E5 (Conflict) 依赖: `ConflictDialog.tsx` (S81-E1, ✅ on main)

---

## expect() 断言示例

```typescript
// E1: switchBranch
expect(canvasHistoryStore.getState().currentBranchId).toBe('branch-uuid');

// E2: filterTemplates
const results = templateStore.getState().filterTemplates({ category: 'flow', tags: ['poc'] });
expect(results.length).toBeGreaterThan(0);
expect(results.every(t => t.category === 'flow')).toBe(true);

// E3: generateShareLink
const link = shareService.generateShareLink('canvas-1', 'edit');
expect(link).toMatch(/^https:\/\/vibex\.app\/share\//);
expect(link).toContain('token=');

// E4: useFileDrop
const store = canvasListStore.getState();
const prevCount = store.canvases.length;
store.createCanvas({ name: 'dropped-canvas', nodes: [] });
expect(canvasListStore.getState().canvases.length).toBe(prevCount + 1);

// E5: resolveConflict
const result = canvasHistoryStore.getState().resolveConflict('branch-1', 'last-write-wins');
expect(result.resolved).toBe(true);
```
