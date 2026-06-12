/**
 * canvasExportStore — Zustand store for canvas export state management
 * S87-E4: Canvas Export Enhancement
 * S89-E5: Advanced Export Formats — extended with exportHistory
 *
 * Manages export UI state: loading format, PNG scale, error messages,
 * and export history (up to 10 entries).
 */

import { create } from 'zustand';

export type ExportFormat = 'JSON' | 'Vibex' | 'PDF' | 'PNG' | 'SVG' | 'Figma' | 'MultiFormat' | 'PPT' | 'MARKDOWN';

export interface ExportHistoryEntry {
  id: string;
  format: ExportFormat;
  scale?: number;
  timestamp: number;
  canvasName: string;
}

export interface CanvasExportState {
  /** Currently exporting format (null = idle) */
  isExporting: boolean;
  /** The format currently being exported */
  loadingFormat: ExportFormat | null;
  /** PNG export resolution scale (1x/2x/3x) */
  exportScale: 1 | 2 | 3;
  /** Last export error message */
  exportError: string | null;
  /** Export history — up to 10 most recent exports */
  exportHistory: ExportHistoryEntry[];
}

export interface CanvasExportActions {
  /** Start exporting with a given format */
  setExporting: (format: ExportFormat | null) => void;
  /** Set PNG export resolution scale */
  setExportScale: (scale: 1 | 2 | 3) => void;
  /** Set export error message */
  setExportError: (error: string | null) => void;
  /** Reset all export state to idle */
  resetExportState: () => void;
  /** Add an entry to export history */
  addExportHistory: (entry: Omit<ExportHistoryEntry, 'id'>) => void;
  /** Clear all export history */
  clearExportHistory: () => void;
  /** Remove a specific history entry by id */
  removeExportHistory: (id: string) => void;
}

const initialState: CanvasExportState = {
  isExporting: false,
  loadingFormat: null,
  exportScale: 2,
  exportError: null,
  exportHistory: [],
};

let historyIdCounter = 0;
function generateHistoryId(): string {
  return `export-history-${Date.now()}-${++historyIdCounter}`;
}

export const useCanvasExportStore = create<CanvasExportState & CanvasExportActions>()(
  (set) => ({
    ...initialState,

    setExporting: (format) =>
      set({
        isExporting: format !== null,
        loadingFormat: format,
        exportError: null,
      }),

    setExportScale: (scale) =>
      set({ exportScale: scale }),

    setExportError: (error) =>
      set({
        exportError: error,
        isExporting: false,
        loadingFormat: null,
      }),

    resetExportState: () =>
      set({
        isExporting: false,
        loadingFormat: null,
        exportError: null,
        exportScale: 2,
      }),

    addExportHistory: (entry) =>
      set((state) => {
        const newEntry: ExportHistoryEntry = {
          ...entry,
          id: generateHistoryId(),
        };
        const updated = [newEntry, ...state.exportHistory].slice(0, 10);
        return { exportHistory: updated };
      }),

    clearExportHistory: () =>
      set({ exportHistory: [] }),

    removeExportHistory: (id) =>
      set((state) => ({
        exportHistory: state.exportHistory.filter((e) => e.id !== id),
      })),
  })
);
