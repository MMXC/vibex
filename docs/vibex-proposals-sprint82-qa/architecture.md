# Sprint82 QA 架构审查

**项目**: vibex-proposals-sprint82-qa  
**日期**: 2026-06-09

---

## 1. 整体架构

Sprint82 在 VibeX 前端（`vibex-fronted/`）中引入五个新功能域：

```
vibex-fronted/
├── src/
│   ├── app/gallery/page.tsx              ← E2: /gallery 路由
│   ├── components/
│   │   ├── dds/
│   │   │   ├── gallery/                  ← E2: TemplateCard + TemplateGallery
│   │   │   ├── share/                    ← E3: ShareDialog
│   │   │   ├── canvas-history/           ← E1: MergeHistoryPanel
│   │   │   ├── canvas-dashboard/
│   │   │   │   └── CanvasImportPanel.tsx ← E4: 多格式导入面板
│   │   │   └── DDSCanvasPage.tsx         ← E4: 集成 useFileDrop
│   │   │   └── toolbar/DDSToolbar.tsx    ← E3: 分享按钮
│   │   └── conflict/
│   │       └── ConflictDialog.tsx        ← E5: 冲突解决对话框
│   ├── hooks/
│   │   ├── canvas/useFileDrop.ts         ← E4: 文件拖拽 hook
│   │   └── dds/canvas/useFileDrop.ts     ← E4: DDS 版本
│   ├── lib/collaboration/
│   │   └── wsCollabHandler.ts            ← E5: WS 冲突处理
│   ├── services/
│   │   └── shareService.ts               ← E3: 分享服务
│   └── stores/
│       ├── canvasListStore.ts             ← E3: 分享状态
│       └── dds/canvasHistoryStore.ts      ← E1/E5: 分支+冲突状态
```

---

## 2. Epic 集成关系

### E1 → E5 依赖链
- E1 (MergeHistoryPanel) 是 canvasHistoryStore 的主要使用者
- E5 (ConflictDialog) 依赖 canvasHistoryStore.resolveConflict() 方法

### E3 (Share) 独立
- shareService 独立于核心 store，使用 localStorage
- DDSToolbar 触发 ShareDialog

### E4 (Import) 集成
- useFileDrop hook 在 DDSCanvasPage 中注册
- 拖拽事件 → useFileDrop → onImportReady → DDSCanvasPage → 打开 CanvasImportPanel

### E2 (Gallery) 独立
- /gallery 独立路由
- 使用 templateStore (Zustand)

---

## 3. Epic 文件清单

| Epic | 文件路径 | 类型 |
|------|----------|------|
| E1 | `src/stores/dds/canvasHistoryStore.ts` | store |
| E1 | `src/components/dds/canvas-history/__tests__/MergeHistoryPanel.test.tsx` | test |
| E2 | `src/app/gallery/page.tsx` | route |
| E2 | `src/components/dds/gallery/TemplateCard.tsx` | component |
| E2 | `src/components/dds/gallery/TemplateGallery.tsx` | component |
| E2 | `src/components/dds/gallery/__tests__/TemplateGallery.test.tsx` | test |
| E3 | `src/services/shareService.ts` | service |
| E3 | `src/services/__tests__/shareService.test.ts` | test |
| E3 | `src/stores/canvasListStore.ts` | store |
| E3 | `src/stores/__tests__/canvasListStore.share.test.ts` | test |
| E3 | `src/components/dds/share/ShareDialog.tsx` | component |
| E3 | `src/components/dds/toolbar/DDSToolbar.tsx` | component |
| E4 | `src/hooks/canvas/useFileDrop.ts` | hook |
| E4 | `src/hooks/dds/canvas/useFileDrop.ts` | hook |
| E4 | `src/components/dds/canvas-dashboard/CanvasImportPanel.tsx` | component |
| E4 | `src/components/dds/DDSCanvasPage.tsx` | component |
| E5 | `src/components/conflict/ConflictDialog.tsx` | component |
| E5 | `src/stores/dds/canvasHistoryStore.ts` | store (extended) |
| E5 | `src/lib/collaboration/wsCollabHandler.ts` | handler |

---

## 4. 技术栈

- **框架**: Next.js 15 App Router
- **状态**: Zustand (templateStore, canvasListStore, canvasHistoryStore)
- **样式**: CSS Modules
- **测试**: Vitest
- **WebSocket**: wsCollabHandler (E5 扩展)
