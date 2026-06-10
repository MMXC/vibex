
# S85-E4 前置发现（Coord 心跳自发现）

## 关键发现：E4 DoD 存在"假缺失"

### `canvasHistoryStore.ts` — `mergeBranch()` + `rollback()` 已存在

- `mergeBranch(canvasId, sourceBranch, targetBranch, userId)` → 存在于 S70-E1 (commit `096bf8ca8`)
  - 在 `vibex-fronted/src/stores/dds/canvasHistoryStore.ts` line 935
  - 操作 IndexedDB（`mergeBranchInDB`）
- `restoreSnapshot(canvasId, snapshotId)` → 存在于 S64 (commit `b1ca8b5b0`)
  - 在 `canvasHistoryStore.ts` line 718
  - 从 IndexedDB 恢复快照
- `rollback` 作为 `CommandMeta` 接口的方法存在（S82 添加，line 35）
- `HistoryPanel.tsx` 已有合并按钮 + BranchMergeDialog（S66-E1 起就有）

### 真正的 E4 实施范围（仅 6 项）

1. `/api/canvas/:id/merge` POST → 后端 D1 持久化（新增）
2. `/api/canvas/:id/rollback` POST → 后端 D1 持久化（新增）
3. `MergePreviewPanel.tsx` → 前端合并预览面板（新增）
4. `VersionTimeline.tsx` 右键菜单 → 新增"合并到当前分支"+"回滚到此版本"（owner only）（新增）
5. vitest ≥ 8 cases（新增）
6. dual CHANGELOG S85-F04 entry（新增）

### 依赖检查

- `mergeBranchInDB` 存在于 `vibex-fronted/src/lib/canvas/historyDB.ts`
- 无 DDS 右键菜单组件 → 需要在 VersionTimeline.tsx 中直接实现 `onContextMenu`
- D1 schema：可能需要新增 `canvas_branch_events` 表记录 merge/rollback 事件

### E4 实施策略

- Variant W' self-impl：如果 dev ghost 了，参照此范围执行
- 已有基础设施（mergeBranch + restoreSnapshot + BranchMergeDialog）→ 只需添加 API + 新组件
- 权限检查：使用 `canvasPermissionsStore.getBranchPermission()` (S85-E1) 检查 owner

## 时间戳
2026-06-25 02:50 UTC

---

# S85-E5 前置发现（Coord 心跳自发现）

## 关键发现：E5 DoD 存在"假缺失"

### `templateStore.ts` — 部分方法已存在

- `rateTemplate(templateId, rating)` → 存在于 line 103/378 ✅ (CHANGELOG E5.3 已有)
- `getTemplateStats(templateId)` → 存在于 line 104/393 ✅
- `publishTemplate()` → **不存在** ❌ (DoD item: 新增)
- `createTemplate()` / `deleteTemplate()` → 不存在

### 已存在（历史 Sprint 基础设施）

| 文件 | 状态 | 来源 Sprint |
|------|------|-------------|
| `templateStore.ts` | ✅ store 存在，部分方法缺失 | 多 Sprint |
| `templateStore.rating.test.ts` | ✅ 已有 4 rating 测试 | S83-E3 |
| `TemplateRating.tsx` | ✅ 评分展示组件存在 | S83-E3 |
| `TemplateDetail.tsx` | ✅ 模板详情页存在 | S83-E3 |
| `/api/templates/route.ts` | ✅ GET 列表 API 存在 | ? |
| `/api/templates/marketplace/route.ts` | ✅ marketplace API 存在 | ? |
| `/api/templates/favorites/route.ts` | ✅ favorites API 存在 | S84-E4 |
| `TemplateGallery.tsx` | ✅ gallery 存在（已有评分/使用量展示） | S84-E4 |

### 真正的 E5 实施范围

1. `templateStore.ts` 新增 `publishTemplate()` 方法
2. D1 schema 新增 `templates` + `template_ratings` 表
3. `/api/templates` POST（发布模板）/ GET（已有但需扩展）
4. `/api/templates/:id/rate` POST（评分）
5. `PublishTemplateDialog.tsx`（新增）
6. `TemplateGallery.tsx` 增加排序选项（评分/使用量）— 可能已部分实现
7. vitest ≥ 6 cases
8. dual CHANGELOG S85-F05 entry

## 时间戳
2026-06-25 02:55 UTC
