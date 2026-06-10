# Sprint82 QA PRD — 质量验收标准

**项目**: vibex-proposals-sprint82-qa  
**日期**: 2026-06-09  
**Sprint**: S82 — 画布协作与模板系统

---

## 质量目标

- vitest 全通过: **84/84**
- E1–E5 Epic 功能完整
- 交互验收: /gallery、分享、冲突解决、拖拽

---

## E1 — 画布版本分支管理 UI

### DoD (Definition of Done)
- [ ] MergeHistoryPanel 组件在 `src/components/dds/canvas-history/` 下存在
- [ ] `switchBranch`, `diffBranches`, `loadBranch` 方法存在于 `canvasHistoryStore.ts`
- [ ] vitest 15/15 通过
- [ ] 代码已合并到 `origin/main`

### 质量阈值
- vitest: 15 passed, 0 failed

---

## E2 — 模板 Gallery UI

### DoD
- [ ] `/gallery` 路由在 `src/app/gallery/page.tsx` 存在
- [ ] `TemplateCard` + `TemplateGallery` 组件存在
- [ ] vitest 12/12 通过
- [ ] 代码已合并到 `origin/main`

### 质量阈值
- vitest: 12 passed, 0 failed

---

## E3 — 画布分享与隐私

### DoD
- [ ] `shareService.ts` 存在且包含 generate/revoke/list/validateShareLink 方法
- [ ] `ShareDialog.tsx` 组件存在
- [ ] `DDSToolbar` 包含分享按钮
- [ ] vitest 29/29 通过 (shareService 16 + canvasListStore.share 13)
- [ ] 代码已合并到 `origin/main`

### 质量阈值
- vitest: 29 passed, 0 failed

---

## E4 — 文件拖拽导入

### DoD
- [ ] `useFileDrop` hook 存在（`src/hooks/canvas/useFileDrop.ts`）
- [ ] `CanvasImportPanel` 支持多格式 (.vibex/.json/.yaml/.yml/.flow.json/.flow.zip)
- [ ] `DDSCanvasPage` 集成 useFileDrop
- [ ] vitest 8/8 通过
- [ ] 代码已合并到 `origin/main`

### 质量阈值
- vitest: 8 passed, 0 failed

---

## E5 — 协作冲突增强

### DoD
- [ ] `ConflictDialog` 支持 auto-resolve 三策略 (auto-merge / keep-mine / keep-theirs)
- [ ] `resolveConflict(branchId, strategy)` 方法存在于 `canvasHistoryStore.ts`
- [ ] `wsCollabHandler` 包含 `collab:conflict` 处理逻辑
- [ ] vitest 20/20 通过 (ConflictDialog.e5 14 + canvasHistoryStore.e5 6)
- [ ] 代码已合并到 `origin/main`

### 质量阈值
- vitest: 20 passed, 0 failed

---

## 交互验收测试场景

| Epic | 场景 | 预期结果 |
|------|------|----------|
| E1 | 打开 MergeHistoryPanel | 显示分支历史，可切换/比较分支 |
| E2 | 访问 /gallery | 模板 Gallery 展示，支持分类/搜索 |
| E3 | 点击分享按钮 | ShareDialog 打开，支持生成/复制/撤销链接 |
| E4 | 拖拽 .vibex 文件到画布 | CanvasImportPanel 打开 |
| E5 | 模拟协作冲突 | ConflictDialog 出现，显示三策略按钮 |

---

## Vitest 验收总表

| Epic | 测试命令 | 预期 | 实际 |
|------|----------|------|------|
| E1 | `npx vitest run .../MergeHistoryPanel.test.tsx` | 15 pass | 15 pass ✅ |
| E2 | `npx vitest run .../TemplateGallery.test.tsx` | 12 pass | 12 pass ✅ |
| E3 | `npx vitest run .../shareService.test.ts` | 16 pass | 16 pass ✅ |
| E3 | `npx vitest run .../canvasListStore.share.test.ts` | 13 pass | 13 pass ✅ |
| E4 | `npx vitest run .../useFileDrop.test.ts` | 8 pass | 8 pass ✅ |
| E5 | `npx vitest run .../ConflictDialog.e5.test.tsx` | 14 pass | 14 pass ✅ |
| E5 | `npx vitest run .../canvasHistoryStore.e5.test.ts` | 6 pass | 6 pass ✅ |
| **合计** | | **84 pass** | **84 pass** |

---

## 质量结论

所有 Epic 满足 DoD，vitest 84/84 通过，代码已在 `origin/main`。建议进行交互验收测试。
