# S70 QA 验证清单 — Sprint70 产出物检查

**Sprint**: vibex-proposals-sprint70-qa
**日期**: 2026-06-07

---

## QA 验证 DoD

### E1: 画布分支合并与冲突处理

- [ ] `mergeBranch(canvasId, source, target)` 方法存在于 `canvasHistoryStore.ts`
- [ ] `pendingConflicts` 状态字段存在
- [ ] `resolveBranchConflict()` / `clearPendingConflicts()` 方法存在
- [ ] `BranchManager.tsx` 包含 `MergeBranchButton` 组件
- [ ] `SnapshotCompareDialog.tsx` 支持 `mode="merge"` 属性
- [ ] `ConflictResolutionDialog.tsx` 包含三按钮实现
- [ ] `DDSCanvasPage.tsx` 调用 `reloadFromSnapshot` 刷新画布
- [ ] `vitest run canvasHistoryStore.e1-merge.test.ts` 全部通过

### E2: 模板市场发现与浏览

- [ ] `templateStore.ts` 包含 `featuredTemplates()` 方法
- [ ] `templateStore.ts` 包含 `searchMarketplace(query?, tags?)` 方法
- [ ] `TemplateMarketplacePanel.tsx` 组件文件存在
- [ ] 包含搜索框、标签云、热门模板网格 UI 结构
- [ ] `TemplateGallery.tsx` discover Tab 打开市场面板
- [ ] `vitest run templateStore.marketplace.test.ts` 20/20 通过

### E3: 多格式批量画布导出

- [ ] ExportMenu 包含多格式导出选项
- [ ] ZIP 打包逻辑可被调用
- [ ] 进度条 UI 存在

### E4: 协作冲突检测与锁升级

- [ ] `presenceStore.ts` 包含 `pendingConflicts` 数组
- [ ] `addConflict()` / `resolveConflict()` / `hasConflict()` 方法存在
- [ ] `useCollabEditing.ts` 包含 `detectConflict()` 5秒窗口检测
- [ ] `CollabConflictDialog.tsx` 组件文件存在
- [ ] DDSCanvasPage 监听 `pendingConflicts` 变化
- [ ] `vitest run presenceStore.conflict.test.ts` 18/18 通过

### E5: 画布设置面板完善

- [ ] `CanvasSettingsDrawer.tsx` 组件文件存在
- [ ] 包含 4 个 Tab（预设/画布/节点/协作）
- [ ] DDSToolbar 齿轮按钮绑定 open handler
- [ ] ESC 键关闭抽屉逻辑存在

---

## Vitest 测试验收

```bash
cd /root/.openclaw/vibex/vibex-fronted

# E1 测试
npx vitest run canvasHistoryStore.e1-merge.test.ts --reporter=verbose

# E2 测试
npx vitest run templateStore.marketplace.test.ts --reporter=verbose

# E4 测试
npx vitest run presenceStore.conflict.test.ts --reporter=verbose
```

期望结果：所有 E1/E2/E4 相关测试 100% 通过。

---

## 验收报告格式

```markdown
## QA 验收报告 — Sprint70

### E1: ✅/❌
- [逐项勾选 DoD]
- Vitest: X/Y 通过
- 问题: [如有]

### E2: ✅/❌
...

## 总体结论
- 通过: X/5 Epic
- 需修复: Y Epic
```

---

## 附加检查

- [ ] CHANGELOG.md 和 vibex-fronted/CHANGELOG.md 均包含 S70-E1 到 S70-E5 条目
- [ ] 所有 5 个 Epic commit 均在 `origin/main`
- [ ] `vitest run --reporter=verbose` 整体测试套件无新增失败
