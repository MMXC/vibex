# Sprint95 Implementation Partition

**Project**: vibex-proposals-sprint95
**Sprint**: S95
**Epic 列表**: E1-Analytics-Dashboard,E2-Public-Canvas-Portal,E3-Node-Edit-Locking,E4-Export-Profile-Templates

---

## Phase2 Epic 分区

| Epic | 名称 | 主要文件 | 测试框架 |
|------|------|----------|----------|
| E1 | Canvas Analytics Dashboard | backend: `canvas/[id]/analytics/route.ts`, frontend: `AnalyticsDashboard.tsx`, `analyticsStore.ts` | Vitest (frontend), Jest (backend) |
| E2 | Public Canvas Portal | backend: `canvas/[id]/visibility/route.ts`, `public/canvas/[slug]/route.ts`, `canvas/public/route.ts`, frontend: `PublicVisibilitySection.tsx`, `PublicCanvasPage.tsx`, `PublicGallerySection.tsx` | Vitest + Jest |
| E3 | Node Edit Locking | backend: `canvas/[id]/nodes/[nodeId]/lock/route.ts`, frontend: `CollaboratorEditorBadge.tsx`, `LockIndicator.tsx`, `nodeLockStore.ts` | Vitest |
| E4 | Export Profile Templates | backend: `canvas/[id]/export-profiles/route.ts`, frontend: `ExportProfilePanel.tsx`, `exportProfileStore.ts` | Vitest + Jest |

---

## E1: Canvas Analytics Dashboard

### Backend (vibex-backend)
- [ ] `src/app/api/canvas/[id]/analytics/route.ts` — GET analytics
- [ ] `src/app/api/canvas/[id]/analytics/route.test.ts` — 7 Jest tests
- [ ] Migrations: `0025_audit_logs_performance_index.sql`

### Frontend (vibex-fronted)
- [ ] `src/stores/analyticsStore.ts` — Zustand store
- [ ] `src/stores/analyticsStore.test.ts` — 6 Vitest
- [ ] `src/components/dds/AnalyticsDashboard.tsx` — 面板组件
- [ ] `src/components/dds/AnalyticsDashboard.module.css`
- [ ] `src/components/dds/__tests__/AnalyticsDashboard.test.tsx` — 8 Vitest
- [ ] `src/lib/api/analytics.ts` — API client
- [ ] 集成到 `DDSCanvasPage.tsx` settings tab

---

## E2: Public Canvas Portal

### Backend (vibex-backend)
- [ ] `src/app/api/canvas/[id]/visibility/route.ts` — PATCH visibility
- [ ] `src/app/api/canvas/[id]/visibility/route.test.ts` — 7 Jest tests
- [ ] `src/app/api/public/canvas/[slug]/route.ts` — GET public canvas
- [ ] `src/app/api/public/canvas/[slug]/route.test.ts` — 7 Jest tests
- [ ] `src/app/api/canvas/public/route.ts` — GET public list
- [ ] `src/app/api/canvas/public/route.test.ts` — 5 Jest tests
- [ ] Migration: `0026_public_canvas_visibility.sql`

### Frontend (vibex-fronted)
- [ ] `src/components/dds/PublicVisibilitySection.tsx` — 公开开关
- [ ] `src/components/dds/PublicVisibilitySection.module.css`
- [ ] `src/components/dds/__tests__/PublicVisibilitySection.test.tsx` — 6 Vitest
- [ ] `src/app/public/[slug]/page.tsx` — 公开只读页
- [ ] `src/app/public/[slug]/PublicCanvasView.tsx` — 只读画布组件
- [ ] `src/app/public/[slug]/__tests__/PublicCanvasView.test.tsx` — 6 Vitest
- [ ] `src/app/canvas/public/page.tsx` — 公开画布发现页
- [ ] `src/app/canvas/public/PublicGallery.tsx` — 画廊组件
- [ ] `src/app/canvas/public/__tests__/PublicGallery.test.tsx` — 8 Vitest
- [ ] 集成 PublicVisibilitySection 到 DDSCanvasPage settings tab

---

## E3: Node Edit Locking

### Backend (vibex-backend)
- [ ] `src/app/api/canvas/[id]/nodes/[nodeId]/lock/route.ts` — POST/DELETE lock
- [ ] `src/app/api/canvas/[id]/nodes/[nodeId]/lock/route.test.ts` — 7 Jest tests

### Frontend (vibex-fronted)
- [ ] `src/stores/nodeLockStore.ts` — Zustand store
- [ ] `src/stores/__tests__/nodeLockStore.test.ts` — 8 Vitest
- [ ] `src/components/dds/CollaboratorEditorBadge.tsx` — 节点锁定徽章
- [ ] `src/components/dds/CollaboratorEditorBadge.module.css`
- [ ] `src/components/dds/__tests__/CollaboratorEditorBadge.test.tsx` — 6 Vitest
- [ ] `src/components/dds/LockIndicator.tsx` — 锁状态图标
- [ ] WebSocket: `node_lock_acquired` / `node_lock_released` 消息处理
- [ ] 集成到 DDSCanvasPage 节点渲染区域

---

## E4: Export Profile Templates

### Backend (vibex-backend)
- [ ] `src/app/api/canvas/[id]/export-profiles/route.ts` — GET/POST/DELETE
- [ ] `src/app/api/canvas/[id]/export-profiles/route.test.ts` — 7 Jest tests
- [ ] Migration: `0027_canvas_export_profiles.sql`

### Frontend (vibex-fronted)
- [ ] `src/stores/exportProfileStore.ts` — Zustand store
- [ ] `src/stores/__tests__/exportProfileStore.test.ts` — 8 Vitest
- [ ] `src/components/dds/ExportProfilePanel.tsx` — 模板管理面板
- [ ] `src/components/dds/ExportProfilePanel.module.css`
- [ ] `src/components/dds/__tests__/ExportProfilePanel.test.tsx` — 8 Vitest
- [ ] 修改 `ExportMenu.tsx` — 增加"使用模板"选项
- [ ] 集成 ExportProfilePanel 到 DDSCanvasPage settings tab
