'use client';

/**
 * canvasTimelineStore — Timeline zoom/branch state (S83-E1) + diff state (S84-E1)
 *
 * Manages timeline-specific UI state:
 * - Zoom level: hour | day | week | month (controls how many snapshots visible)
 * - Branch filter: which branch to show (null = all)
 * - Time range: selected time range for the current view
 * - Snapshot preview: which snapshot is being previewed
 * - Diff state: version comparison panel (S84-E1)
 */

import { create } from 'zustand';

// ─── S84-E1: Diff Types ────────────────────────────────────────────────────────

export type DiffMode = 'unidirectional' | 'bidirectional';

export interface DiffNode {
  nodeId: string;
  name: string;
  type: string;
  changeType: 'added' | 'removed' | 'modified';
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
}

export interface CanvasDiff {
  fromSnapshotId: string;
  toSnapshotId: string;
  mode: DiffMode;
  fromName: string | null;
  toName: string | null;
  fromVersion: number;
  toVersion: number;
  diff: {
    added: DiffNode[];
    removed: DiffNode[];
    modified: DiffNode[];
    unchanged: number;
    stats: {
      added: number;
      removed: number;
      modified: number;
      unchanged: number;
    };
  };
}

export type TimelineZoomLevel = 'hour' | 'day' | 'week' | 'month';

export interface TimelineTimeRange {
  start: number;
  end: number;
}

interface TimelineState {
  /** Current zoom level — controls snapshot density display */
  zoomLevel: TimelineZoomLevel;
  /** Set zoom level directly */
  setZoomLevel: (level: TimelineZoomLevel) => void;
  /** Zoom in one level (finer granularity) */
  zoomIn: () => void;
  /** Zoom out one level (coarser granularity) */
  zoomOut: () => void;

  /** Active branch filter — null means show all branches */
  activeBranch: string | null;
  /** Set active branch filter */
  setActiveBranch: (branch: string | null) => void;

  /** Selected time range for the current view */
  selectedRange: TimelineTimeRange | null;
  /** Set the selected time range */
  setSelectedRange: (range: TimelineTimeRange | null) => void;

  /** Snapshot currently being previewed in the timeline panel */
  previewSnapshotId: string | null;
  /** Set the snapshot being previewed */
  setPreviewSnapshotId: (id: string | null) => void;

  // ─── S84-E1: Diff State ──────────────────────────────────────────────────────

  /** Whether the diff panel is open */
  isDiffPanelOpen: boolean;
  /** Open the diff panel */
  openDiffPanel: () => void;
  /** Close the diff panel */
  closeDiffPanel: () => void;

  /** The snapshot to compare against current */
  compareSnapshotId: string | null;
  /** Set the snapshot to compare */
  setCompareSnapshotId: (id: string | null) => void;

  /** Diff result data */
  diffData: CanvasDiff | null;
  /** Set diff result data */
  setDiffData: (data: CanvasDiff | null) => void;

  /** Diff mode */
  diffMode: DiffMode;
  /** Set diff mode */
  setDiffMode: (mode: DiffMode) => void;
}

const ZOOM_LEVELS: TimelineZoomLevel[] = ['hour', 'day', 'week', 'month'];

/** Convert zoom level to milliseconds for filtering */
function zoomToMs(level: TimelineZoomLevel): number {
  switch (level) {
    case 'hour': return 60 * 60 * 1000;
    case 'day': return 24 * 60 * 60 * 1000;
    case 'week': return 7 * 24 * 60 * 60 * 1000;
    case 'month': return 30 * 24 * 60 * 60 * 1000;
  }
}

export const useCanvasTimelineStore = create<TimelineState>((set, get) => ({
  zoomLevel: 'day',
  setZoomLevel: (level) => set({ zoomLevel: level }),
  
  zoomIn: () => {
    const current = get().zoomLevel;
    const idx = ZOOM_LEVELS.indexOf(current);
    if (idx > 0) {
      set({ zoomLevel: ZOOM_LEVELS[idx - 1] });
    }
  },
  
  zoomOut: () => {
    const current = get().zoomLevel;
    const idx = ZOOM_LEVELS.indexOf(current);
    if (idx < ZOOM_LEVELS.length - 1) {
      set({ zoomLevel: ZOOM_LEVELS[idx + 1] });
    }
  },

  activeBranch: null,
  setActiveBranch: (branch) => set({ activeBranch: branch }),

  selectedRange: null,
  setSelectedRange: (range) => set({ selectedRange: range }),

  previewSnapshotId: null,
  setPreviewSnapshotId: (id) => set({ previewSnapshotId: id }),

  // S84-E1: Diff state
  isDiffPanelOpen: false,
  openDiffPanel: () => set({ isDiffPanelOpen: true }),
  closeDiffPanel: () => set({ isDiffPanelOpen: false, diffData: null, compareSnapshotId: null }),

  compareSnapshotId: null,
  setCompareSnapshotId: (id) => set({ compareSnapshotId: id }),

  diffData: null,
  setDiffData: (data) => set({ diffData: data }),

  diffMode: 'unidirectional',
  setDiffMode: (mode) => set({ diffMode: mode }),
}));

/** Helper: filter snapshots by the current zoom level */
export function filterSnapshotsByZoom<T extends { timestamp: number; branchName?: string }>(
  snapshots: T[],
  zoomLevel: TimelineZoomLevel,
  activeBranch: string | null,
): T[] {
  const now = Date.now();
  const windowMs = zoomToMs(zoomLevel);
  const cutoff = now - windowMs;

  return snapshots.filter((snap) => {
    if (snap.timestamp < cutoff) return false;
    if (activeBranch && snap.branchName && snap.branchName !== activeBranch) return false;
    return true;
  });
}

/** Get all unique branch names from a list of snapshots */
export function getUniqueBranches<T extends { branchName?: string }>(snapshots: T[]): string[] {
  const branches = new Set<string>();
  for (const snap of snapshots) {
    if (snap.branchName) branches.add(snap.branchName);
  }
  return Array.from(branches).sort();
}

/** Tick width in pixels per zoom level (for rendering the time axis) */
export function getTickWidth(zoomLevel: TimelineZoomLevel): number {
  switch (zoomLevel) {
    case 'hour': return 60;
    case 'day': return 80;
    case 'week': return 100;
    case 'month': return 120;
  }
}
