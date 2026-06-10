# S78 实现分区 — Sprint78 IMP

**项目**: vibex-proposals-sprint78
**日期**: 2026-06-08

---

## 新增文件清单

### S78-E1: Canvas 分支自动合并

| 文件 | 类型 | 路径 |
|------|------|------|
| `canvasHistoryStore.auto-merge.test.ts` | test | `src/stores/__tests__/` |
| `BranchAutoMergeDialog.tsx` | component | `src/components/dds/canvas-history/` |
| `BranchAutoMergeDialog.module.css` | styles | `src/components/dds/canvas-history/` |

**扩展文件**:
- `src/stores/canvasHistoryStore.ts` — 新增 `autoMergeBranch()`
- `src/components/dds/canvas-history/BranchManager.tsx` — 集成 autoMergeBranch

### S78-E2: 模板市场订阅

| 文件 | 类型 | 路径 |
|------|------|------|
| `templateStore.subscription.test.ts` | test | `src/stores/__tests__/` |

**扩展文件**:
- `src/stores/templateStore.ts` — 新增订阅状态 + actions
- `src/components/dds/templates/TemplateMarketplacePanel.tsx` — 订阅按钮

### S78-E3: 内联评论

| 文件 | 类型 | 路径 |
|------|------|------|
| `collabSessionStore.comments.test.ts` | test | `src/stores/__tests__/` |
| `NodeCommentBadge.tsx` | component | `src/components/dds/canvas/` |
| `NodeCommentPanel.tsx` | component | `src/components/dds/canvas/` |
| `NodeCommentPanel.module.css` | styles | `src/components/dds/canvas/` |

**扩展文件**:
- `src/stores/collabSessionStore.ts` — 新增 `comments` 状态 + actions
- `src/app/DDSCanvasPage.tsx` — 集成 `NodeCommentBadge`

### S78-E4: 定时导出+Webhook

| 文件 | 类型 | 路径 |
|------|------|------|
| `canvasListStore.scheduled-export.test.ts` | test | `src/stores/dds/__tests__/` |
| `ZipExporter.webhook.test.ts` | test | `src/services/export/__tests__/` |
| `ScheduledExportPanel.tsx` | component | `src/components/dds/canvas-dashboard/` |
| `ScheduledExportPanel.module.css` | styles | `src/components/dds/canvas-dashboard/` |

**扩展文件**:
- `src/stores/dds/canvasListStore.ts` — 新增定时任务状态 + actions
- `src/services/export/ZipExporter.ts` — 新增 `exportWithWebhook()`

### S78-E5: 画布关系追踪

| 文件 | 类型 | 路径 |
|------|------|------|
| `canvasListStore.relations.test.ts` | test | `src/stores/dds/__tests__/` |
| `CanvasRelationsPanel.tsx` | component | `src/components/dds/canvas/` |
| `CanvasRelationsPanel.module.css` | styles | `src/components/dds/canvas/` |
| `CanvasRelationBadge.tsx` | component | `src/components/dds/canvas/` |

**扩展文件**:
- `src/stores/dds/canvasListStore.ts` — 扩展 `CanvasMeta` 接口 + 关系 actions
- `src/components/dds/canvas/FolderTree.tsx` — 集成 `CanvasRelationBadge`

---

## DoD 清单（逐 Epic）

### S78-E1 DoD

- [ ] `canvasHistoryStore.ts`: `autoMergeBranch(canvasId, source, target)` 方法实现
- [ ] `BranchAutoMergeDialog.tsx`: 合并预览对话框（auto=绿/manual=黄/conflict=红分类）
- [ ] `BranchManager.tsx`: 集成 autoMergeBranch，冲突时降级到对话框
- [ ] `DDSCanvasPage.tsx`: 合并成功后 reloadFromSnapshot（复用 S70-E1）
- [ ] `canvasHistoryStore.auto-merge.test.ts`: 无冲突/有冲突/非法参数测试
- [ ] vitest: ≥ 6 tests passing

### S78-E2 DoD

- [ ] `templateStore.ts`: `subscribedTemplates` + `subscribedAuthors` + 4 actions + `getTemplateUpdates()`
- [ ] `notificationStore.ts`: `'template_update'` 通知类型注册
- [ ] `TemplateMarketplacePanel.tsx`: 「🔔 订阅」按钮（toggle态切换）
- [ ] `templateStore.subscription.test.ts`: 订阅/退订/更新检测 6 测试
- [ ] vitest: 6/6 passing

### S78-E3 DoD

- [ ] `collabSessionStore.ts`: `comments` Record + 4 actions
- [ ] `NodeCommentBadge.tsx`: 节点 badge（数量>0显示）
- [ ] `NodeCommentPanel.tsx`: 侧边评论面板（列表+回复+输入框）
- [ ] `DDSCanvasPage.tsx`: 节点选中时渲染 `NodeCommentBadge`
- [ ] `collabSessionStore.comments.test.ts`: 8 测试（CRUD+回复线程）
- [ ] vitest: 8/8 passing

### S78-E4 DoD

- [ ] `canvasListStore.ts`: `scheduledExports` + 4 actions + cron 解析
- [ ] `ZipExporter.ts`: `exportWithWebhook(canvasId, options, webhookUrl)`
- [ ] `ScheduledExportPanel.tsx`: 定时任务管理面板
- [ ] `canvasListStore.scheduled-export.test.ts`: 6 测试
- [ ] `ZipExporter.webhook.test.ts`: 4 测试
- [ ] vitest: 10/10 passing

### S78-E5 DoD

- [ ] `canvasListStore.ts`: `CanvasMeta` 扩展 + 5 actions
- [ ] `CanvasRelationsPanel.tsx`: 画布详情「关系」Tab
- [ ] `CanvasRelationBadge.tsx`: FolderTree 关系图标
- [ ] `canvasListStore.relations.test.ts`: 6 测试（含自环检测）
- [ ] vitest: 6/6 passing

---

## Vitest 总计目标

| Epic | 新增测试数 | 目标 |
|------|-----------|------|
| S78-E1 | 6 | auto-merge.test.ts |
| S78-E2 | 6 | subscription.test.ts |
| S78-E3 | 8 | comments.test.ts |
| S78-E4 | 10 | scheduled-export.test.ts + webhook.test.ts |
| S78-E5 | 6 | relations.test.ts |
| **合计** | **36** | — |

---

## 依赖关系

```
S78-E1 (分支自动合并)
  → 依赖: canvasHistoryStore (S70-E1)
  → 扩展: BranchManager (S69-E1)

S78-E2 (模板订阅)
  → 依赖: templateStore (S70-E2)
  → 依赖: notificationStore (S77-E1)
  → 无跨 Epic 依赖

S78-E3 (内联评论)
  → 依赖: collabSessionStore (S75-E4)
  → 依赖: MentionInput (S75-E4)
  → 无跨 Epic 依赖

S78-E4 (定时导出)
  → 依赖: canvasListStore (S76-E3)
  → 依赖: ZipExporter (S70-E3)
  → 无跨 Epic 依赖

S78-E5 (画布关系)
  → 依赖: canvasListStore (S76-E3)
  → 依赖: FolderTree (已有)
  → 无跨 Epic 依赖
```

---

## Epic 开发顺序建议

E1 → E2 → E3 → E4 → E5

**理由**:
1. **E1 最关键**: 分支合并是核心功能，需优先完成验证
2. **E2 依赖 E1**: 模板订阅通知依赖 S77-E1 的通知基础设施，先完成 E1 有利于并行验证
3. **E3/E4/E5 并行**: 三者均独立，可并行开发
