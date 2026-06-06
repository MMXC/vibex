/**
 * templateShareStore.ts — S69-E3: 模板市场
 *
 * Manages the share dialog open state and selected template for sharing.
 */

import { create } from 'zustand';
import type { CanvasTemplateData } from '@/lib/canvas/templateStore';

interface ShareState {
  /** Whether the share dialog is open */
  isShareDialogOpen: boolean;
  /** The template being shared */
  sharingTemplate: CanvasTemplateData | null;

  /** Open the share dialog for a given template */
  openShareDialog: (template: CanvasTemplateData) => void;
  /** Close the share dialog */
  closeShareDialog: () => void;

  /** Whether the import-from-URL dialog is open */
  isImportDialogOpen: boolean;
  /** Open the import dialog */
  openImportDialog: () => void;
  /** Close the import dialog */
  closeImportDialog: () => void;
}

export const useTemplateShareStore = create<ShareState>((set) => ({
  isShareDialogOpen: false,
  sharingTemplate: null,

  openShareDialog: (template) =>
    set({ isShareDialogOpen: true, sharingTemplate: template }),

  closeShareDialog: () =>
    set({ isShareDialogOpen: false, sharingTemplate: null }),

  isImportDialogOpen: false,

  openImportDialog: () => set({ isImportDialogOpen: true }),

  closeImportDialog: () => set({ isImportDialogOpen: false }),
}));
