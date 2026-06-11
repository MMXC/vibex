'use client';
/**
 * CanvasSearchDialog.tsx — Sprint87 E2: Canvas 全文搜索
 *
 * Re-export of CanvasSearchPanel as a dialog-style overlay.
 * The actual search panel was built in S65-E4 (search/CanvasSearchPanel.tsx)
 * and S73-E1 (canvas/CanvasSearchPanel.tsx). This file provides the
 * Dialog naming variant as specified by the DoD.
 *
 * Integration: DDSCanvasPage.tsx renders the panel via Ctrl+F / Cmd+F.
 * See: S65-E4 CanvasSearchPanel.tsx (search/) and S73-E1 (canvas/).
 */

export { CanvasSearchPanel } from '@/components/dds/search/CanvasSearchPanel';
export type { CanvasSearchPanelProps } from '@/components/dds/search/CanvasSearchPanel';
