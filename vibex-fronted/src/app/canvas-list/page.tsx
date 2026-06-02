/**
 * src/app/canvas-list/page.tsx — Sprint55 E3: Canvas Dashboard Route
 *
 * Route: /canvas-list
 * Shows all canvases as a grid dashboard with create/delete/rename.
 * Uses the CanvasDashboard component which wraps canvasListStore.
 */

import { CanvasDashboard } from '@/components/dds/canvas-dashboard/CanvasDashboard';

export const metadata = {
  title: '画布列表 — VibeX',
  description: '管理所有画布：创建、删除、重命名',
};

export default function CanvasListPage() {
  return <CanvasDashboard />;
}
