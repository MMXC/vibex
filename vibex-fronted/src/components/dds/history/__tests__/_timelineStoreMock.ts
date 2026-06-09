/**
 * Mock for @/stores/dds/canvasTimelineStore
 * Must be imported at top of test files before the component under test.
 */
import type { Snapshot } from '@/stores/dds/canvasHistoryStore';

export const mockTimelineStoreState = {
  zoomLevel: 'day' as const,
  setZoomLevel: () => {},
  zoomIn: () => {},
  zoomOut: () => {},
  activeBranch: null as string | null,
  setActiveBranch: () => {},
  selectedRange: null,
  setSelectedRange: () => {},
  previewSnapshotId: null,
  setPreviewSnapshotId: () => {},
  snapshots: [] as Snapshot[],
};

export function createMockStore(overrides: Partial<typeof mockTimelineStoreState> = {}) {
  return { ...mockTimelineStoreState, ...overrides };
}
