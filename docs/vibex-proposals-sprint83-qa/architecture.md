# Sprint83 QA Verification — architecture.md

**项目**: vibex-proposals-sprint83-qa
**阶段**: QA架构验证 — Sprint83 跨 Epic 集成与技术债务分析

---

## Sprint83 Epic 集成关系

```
S83-E1: VersionTimeline
  └── E1 提供: canvasTimelineStore.setActiveBranch / setZoomLevel
  └── E1 依赖: canvasHistoryStore (上游版本存储)

S83-E2: ImportShareDialog  
  └── E2 依赖: E1 Timeline (导入后跳转查看版本历史)
  └── E2 依赖: canvasShare API (backend)

S83-E3: ConflictConfirmToast
  └── E3 依赖: E2 Import (导入可能触发冲突)
  └── E3 依赖: ConflictResolutionDialog.onAutoResolved

S83-E4: TagSelector (Template Gallery)
  └── E4 依赖: templateStore (独立的 FilterOptions)
  └── E4 无跨 Epic 依赖

S83-E5: BatchExport
  └── E5 依赖: E4 TemplateGallery (批量导出来源)
  └── E5 依赖: ExportMenu (已有) / ZipExporter (新增)
```

---

## 关键技术决策

### E2: vi.mock Pattern D
ImportShareDialog.test.tsx 使用 Pattern D（mock fn 外置）避免 vitest hoisting TDZ：
```typescript
const mockValidateShareToken = vi.fn();
const mockImportCanvas = vi.fn();
vi.mock('@/lib/api/canvas-share', () => ({
  validateShareToken: mockValidateShareToken,
  importCanvas: mockImportCanvas,
}));
```

### E3: Variant W'' Epic Branch Merge
E3 commit `de82ec690` 最初在 `origin/epic/s83-e3-conflict-confirm-toast` 而非 main，通过 git cherry-pick 合入。验证确认 CHANGELOG 条目在 main 上均存在。

### E5: BatchExport 并发
ZipExporter 使用 `Promise.all` 并发处理多个 canvas 导出，每个 canvas 独立 PDF/PNG/SVG 生成。

---

## 已知技术债务

1. **S83-E1 没有独立测试文件**: `canvasTimelineStore.ts` 无独立 `.test.ts` 文件 — 依赖 VersionTimeline 组件测试间接覆盖
2. **S83-E4 没有 DateRangePicker 测试**: `DateRangePicker.tsx` 无独立 vitest 测试，仅通过 TagSelector 组件测试间接覆盖
3. **S83-E5 ExportProgress**: ExportProgress 组件无独立测试

---

## 质量评估

| Epic | 测试覆盖率 | 技术债务 | 风险 |
|------|-----------|---------|------|
| E1 | 中 (VersionTimeline 组件测试) | canvasTimelineStore 无独立 UT | 低 |
| E2 | 高 (Pattern D 独立测试) | 无 | 低 |
| E3 | 高 (ConflictConfirmToast 11 tests) | 无 | 低 |
| E4 | 中 (TagSelector 8 tests) | DateRangePicker 无 UT | 低 |
| E5 | 高 (ZipExporter 31 + VersionDiff 11) | ExportProgress 无 UT | 低 |

**整体风险**: 低 — 所有 Epic 代码已推送 main，88 vitest 测试通过
