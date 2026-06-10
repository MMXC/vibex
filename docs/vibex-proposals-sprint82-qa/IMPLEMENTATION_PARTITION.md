# Sprint82 QA — 验证任务分配

**项目**: vibex-proposals-sprint82-qa  
**日期**: 2026-06-09

---

## 验证任务总览

所有 Epic 代码已在 `origin/main`。本阶段为 QA 验证任务，按 Epic 分配验证点。

---

## E1 — 画布版本分支管理 UI

**代码路径**: `vibex-fronted/src/`
**提交**: `bf245cd87`

### Vitest 验证
```bash
cd /root/.openclaw/vibex/vibex-fronted
npx vitest run src/components/dds/canvas-history/__tests__/MergeHistoryPanel.test.tsx --reporter=verbose
```
**预期**: 15 passed

### 验证清单
- [ ] MergeHistoryPanel.tsx 存在
- [ ] canvasHistoryStore 包含 switchBranch/diffBranches/loadBranch 方法
- [ ] vitest 15/15 通过

---

## E2 — 模板 Gallery UI

**代码路径**: `vibex-fronted/src/`
**提交**: `258891e1f`

### Vitest 验证
```bash
cd /root/.openclaw/vibex/vibex-fronted
npx vitest run src/components/dds/gallery/__tests__/TemplateGallery.test.tsx --reporter=verbose
```
**预期**: 12 passed

### 验证清单
- [ ] /gallery 路由存在
- [ ] TemplateCard.tsx + TemplateGallery.tsx 存在
- [ ] vitest 12/12 通过

---

## E3 — 画布分享与隐私

**代码路径**: `vibex-fronted/src/`
**提交**: `7697f7da3`

### Vitest 验证
```bash
cd /root/.openclaw/vibex/vibex-fronted
npx vitest run src/services/__tests__/shareService.test.ts --reporter=verbose
npx vitest run src/stores/__tests__/canvasListStore.share.test.ts --reporter=verbose
npx vitest run src/components/dds/share/__tests__/ShareDialog.test.tsx --reporter=verbose
npx vitest run src/components/canvas/features/__tests__/ShareDialog.test.tsx --reporter=verbose
```
**预期**: 29 passed (16 + 13)

### 验证清单
- [ ] shareService.ts 包含 generateShareLink/revokeShareLink/listShareLinks/validateShareToken
- [ ] ShareDialog.tsx 存在
- [ ] DDSToolbar.tsx 包含分享按钮
- [ ] vitest 29/29 通过

---

## E4 — 文件拖拽导入

**代码路径**: `vibex-fronted/src/`
**提交**: `c00b7fdfe`

### Vitest 验证
```bash
cd /root/.openclaw/vibex/vibex-fronted
npx vitest run src/hooks/dds/canvas/__tests__/useFileDrop.test.ts --reporter=verbose
```
**预期**: 8 passed

### 验证清单
- [ ] useFileDrop.ts 存在，支持 .vibex/.json/.yaml/.yml/.flow.json/.flow.zip
- [ ] CanvasImportPanel.tsx 存在且支持多格式
- [ ] DDSCanvasPage.tsx 集成 useFileDrop
- [ ] vitest 8/8 通过

---

## E5 — 协作冲突增强

**代码路径**: `vibex-fronted/src/`
**提交**: `2ed0d149b`

### Vitest 验证
```bash
cd /root/.openclaw/vibex/vibex-fronted
npx vitest run src/components/conflict/__tests__/ConflictDialog.e5.test.tsx --reporter=verbose
npx vitest run src/stores/dds/__tests__/canvasHistoryStore.e5.test.ts --reporter=verbose
```
**预期**: 20 passed (14 + 6)

### 验证清单
- [ ] ConflictDialog.tsx 包含 auto-resolve 策略按钮
- [ ] canvasHistoryStore.ts 包含 resolveConflict(branchId, strategy) 方法
- [ ] wsCollabHandler.ts 包含 collab:conflict 处理
- [ ] vitest 20/20 通过

---

## Vitest 汇总

| Epic | 命令 | 预期 |
|------|------|------|
| E1 | `npx vitest run .../MergeHistoryPanel.test.tsx` | 15 pass |
| E2 | `npx vitest run .../TemplateGallery.test.tsx` | 12 pass |
| E3 | `npx vitest run .../shareService.test.ts` | 16 pass |
| E3 | `npx vitest run .../canvasListStore.share.test.ts` | 13 pass |
| E4 | `npx vitest run .../useFileDrop.test.ts` | 8 pass |
| E5 | `npx vitest run .../ConflictDialog.e5.test.tsx` | 14 pass |
| E5 | `npx vitest run .../canvasHistoryStore.e5.test.ts` | 6 pass |
| **合计** | | **84 pass** |

---

## 交互验收检查单

### E1 — MergeHistoryPanel
- [ ] 分支切换: 点击分支可切换当前画布版本
- [ ] 分支比较: diffBranches 可展示两个分支差异

### E2 — Template Gallery
- [ ] 路由: /gallery 可访问
- [ ] 分类: 点击分类标签正确过滤
- [ ] 搜索: 搜索框可搜索模板

### E3 — Share Dialog
- [ ] 打开: 点击工具栏分享按钮打开 ShareDialog
- [ ] 生成: 点击"生成链接"生成有效分享链接
- [ ] 复制: 点击复制按钮，链接已复制到剪贴板

### E4 — File Drop Import
- [ ] 拖拽: 将 .vibex 文件拖入画布区域，CanvasImportPanel 打开
- [ ] 多格式: .json/.yaml/.flow.json 均触发导入

### E5 — Conflict Resolution
- [ ] 冲突出现: 模拟协作冲突，ConflictDialog 弹出
- [ ] 三策略: auto-merge / keep-mine / keep-theirs 三按钮均可用
- [ ] 冲突解决: 选择策略后，冲突解决，画布恢复正常
