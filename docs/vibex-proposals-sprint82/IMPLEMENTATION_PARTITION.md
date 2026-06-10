# Sprint82 Implementation Partition

**Sprint**: Sprint82  
**日期**: 2026-06-09  
**项目**: vibex-proposals-sprint82

---

## E1: 画布版本分支管理 UI

### DoD Checklist
- [ ] `MergeHistoryPanel.tsx` 渲染分支列表
- [ ] `canvasHistoryStore.switchBranch(branchId)` 切换成功
- [ ] `canvasHistoryStore.diffBranches(a, b)` 返回 `BranchDiffResult`
- [ ] 分支切换后画布节点/边重新加载
- [ ] `MergeHistoryPanel.test.tsx` ≥8 个测试

### 新增文件
| 文件路径 | 说明 |
|----------|------|
| `src/components/dds/canvas-dashboard/MergeHistoryPanel.tsx` | 分支管理面板组件 |
| `src/components/dds/canvas-dashboard/MergeHistoryPanel.module.css` | 样式 |

### 扩展文件
| 文件路径 | 变更 |
|----------|------|
| `src/stores/dds/canvasHistoryStore.ts` | 添加 `switchBranch(branchId)`, `diffBranches(a, b)`, `loadBranch(branchId)` |

### 测试
```bash
cd vibex-fronted
npx vitest run MergeHistoryPanel --reporter=verbose
npx vitest run canvasHistoryStore.sprint82-e1 --reporter=verbose
```

---

## E2: 模板 Gallery UI

### DoD Checklist
- [ ] `TemplateGallery.tsx` 渲染缩略图网格
- [ ] 分类/标签筛选联动 `templateStore.filterTemplates`
- [ ] 点击卡片弹出预览并可插入画布
- [ ] 搜索框按名称过滤
- [ ] `TemplateGallery.test.tsx` ≥6 个测试

### 新增文件
| 文件路径 | 说明 |
|----------|------|
| `src/app/gallery/page.tsx` | Gallery 独立页面 |
| `src/components/dds/gallery/TemplateGallery.tsx` | Gallery 主体组件 |
| `src/components/dds/gallery/TemplateCard.tsx` | 单个模板卡片组件 |
| `src/components/dds/gallery/TemplateGallery.module.css` | 样式 |

### 测试
```bash
npx vitest run TemplateGallery --reporter=verbose
npx vitest run templateStore.sprint82-e2 --reporter=verbose
```

---

## E3: 画布分享与隐私

### DoD Checklist
- [ ] `shareService.ts` 实现 `generateShareLink()` / `revokeShareLink()`
- [ ] `ShareDialog.tsx` 渲染分享面板
- [ ] DDSToolbar 添加分享按钮（icon + aria-label）
- [ ] 权限 (view/edit) 可切换
- [ ] `shareService.test.ts` ≥10 个测试
- [ ] `ShareDialog.test.tsx` ≥5 个测试

### 新增文件
| 文件路径 | 说明 |
|----------|------|
| `src/services/shareService.ts` | 分享服务 (generateShareLink/revokeShareLink/listShareLinks) |
| `src/components/dds/share/ShareDialog.tsx` | 分享弹窗组件 |
| `src/components/dds/share/ShareDialog.module.css` | 样式 |

### 扩展文件
| 文件路径 | 变更 |
|----------|------|
| `src/components/dds/toolbar/DDSToolbar.tsx` | 添加 ShareButton 按钮 |
| `src/stores/dds/canvasListStore.ts` | 添加 `shareLinks[]` 到 canvas metadata |

### 测试
```bash
npx vitest run shareService --reporter=verbose
npx vitest run ShareDialog --reporter=verbose
npx vitest run DDSToolbar.e3 --reporter=verbose
```

---

## E4: 文件拖拽导入

### DoD Checklist
- [ ] `useFileDrop.ts` 监听 dragover/drop 事件
- [ ] 拖拽 .flow.json/.flow.zip 触发 `canvasListStore.createCanvas()`
- [ ] 导入冲突时复用 `ImportConflictDialog`
- [ ] 成功/失败 Toast 提示
- [ ] `useFileDrop.test.ts` ≥8 个测试

### 新增文件
| 文件路径 | 说明 |
|----------|------|
| `src/hooks/canvas/useFileDrop.ts` | 拖拽导入 hook |
| `src/hooks/canvas/__tests__/useFileDrop.test.ts` | 测试 |

### 测试
```bash
npx vitest run useFileDrop --reporter=verbose
npx vitest run canvasListStore.e4 --reporter=verbose
```

---

## E5: 协作冲突增强

### DoD Checklist
- [ ] `ConflictDialog.tsx` 添加 auto-resolve 策略选择
- [ ] `canvasHistoryStore.resolveConflict(branchId, strategy)`
- [ ] 冲突节点高亮（红色边框 + 背景色）
- [ ] WS 冲突消息触发 ConflictDialog
- [ ] `ConflictDialog.e5.test.tsx` ≥8 个测试

### 扩展文件
| 文件路径 | 变更 |
|----------|------|
| `src/components/dds/canvas-dashboard/ConflictDialog.tsx` | 添加 StrategySelector + 冲突节点高亮 |
| `src/stores/dds/canvasHistoryStore.ts` | 添加 `resolveConflict(branchId, strategy)` |
| `src/components/dds/canvas-dashboard/ConflictDialog.test.tsx` | 扩展测试 |

### 测试
```bash
npx vitest run ConflictDialog.e5 --reporter=verbose
npx vitest run canvasHistoryStore.e5 --reporter=verbose
```

---

## 新增/扩展文件汇总

| 状态 | Epic | 文件 |
|------|------|------|
| 新建 | E1 | `src/components/dds/canvas-dashboard/MergeHistoryPanel.tsx` |
| 新建 | E1 | `src/components/dds/canvas-dashboard/MergeHistoryPanel.module.css` |
| 扩展 | E1 | `src/stores/dds/canvasHistoryStore.ts` |
| 新建 | E2 | `src/app/gallery/page.tsx` |
| 新建 | E2 | `src/components/dds/gallery/TemplateGallery.tsx` |
| 新建 | E2 | `src/components/dds/gallery/TemplateCard.tsx` |
| 新建 | E2 | `src/components/dds/gallery/TemplateGallery.module.css` |
| 新建 | E3 | `src/services/shareService.ts` |
| 新建 | E3 | `src/components/dds/share/ShareDialog.tsx` |
| 新建 | E3 | `src/components/dds/share/ShareDialog.module.css` |
| 扩展 | E3 | `src/components/dds/toolbar/DDSToolbar.tsx` |
| 扩展 | E3 | `src/stores/dds/canvasListStore.ts` |
| 新建 | E4 | `src/hooks/canvas/useFileDrop.ts` |
| 扩展 | E5 | `src/components/dds/canvas-dashboard/ConflictDialog.tsx` |
| 扩展 | E5 | `src/stores/dds/canvasHistoryStore.ts` |
