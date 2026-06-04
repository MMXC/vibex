/**
 * undoRedoStore — Collaboration-aware undo/redo coordination
 * S62-E4: 协作 Undo/Redo
 *
 * Wraps canvasHistoryStore undo/redo with:
 * - Operator tracking: currentOperator for UI display
 * - Conflict detection: checks presenceStore.editingNodeIds before undo
 * - WebSocket broadcast: collab:undo/collab:redo via wsCollabHandler
 *
 * API consumed by DDSToolbar.tsx (lines 230-233, 443-471).
 */

import { create } from 'zustand';
import { usePresenceStore } from '@/lib/collaboration/presenceStore';
import { useCanvasHistoryStore } from '@/stores/dds/canvasHistoryStore';
import { broadcastUndo, broadcastRedo } from '@/lib/collaboration/wsCollabHandler';

/** S62-E4: Current operator tracking */
export interface OperatorInfo {
  userId: string;
  userName: string;
  avatar: string;
  action: 'undo' | 'redo';
  timestamp: number;
}

/** S62-E4: Conflict dialog state */
export interface ConflictDialogState {
  open: boolean;
  conflictingUserName: string;
  conflictingUserId: string;
  nodeId: string;
}

interface UndoRedoState {
  /** S62-E4: Who performed the last undo/redo operation (for operator badge display) */
  currentOperator: OperatorInfo | null;

  /** S62-E4: Conflict dialog shown when undo target is being edited by another user */
  conflictDialog: ConflictDialogState;

  // Actions
  setCurrentOperator: (op: OperatorInfo) => void;
  clearOperator: () => void;

  /**
   * D4.4: Conflict detection — checks presenceStore.editingNodeIds.
   * Returns true if nodeId is being edited by someone other than ownerUserId.
   */
  checkConflict: (nodeId: string, ownerUserId: string) => boolean;

  /** Show conflict dialog */
  showConflict: (conflictingUserName: string, conflictingUserId: string, nodeId: string) => void;

  /** Dismiss conflict dialog */
  dismissConflict: () => void;

  /**
   * D2.2: Resolve conflict dialog — user chose one of three options.
   * @param choice 'undo-mine' | 'keep-theirs' | 'cancel'
   */
  resolveConflict: (choice: 'undo-mine' | 'keep-theirs' | 'cancel') => void;

  /**
   * D4.1 + D4.2: Collaborative undo — sets operator, calls canvasHistoryStore.undo(),
   * broadcasts collab:undo via wsCollabHandler.
   */
  performUndo: (userId: string, userName: string, canvasId: string) => void;

  /**
   * D4.1 + D4.2: Collaborative redo — sets operator, calls canvasHistoryStore.redo(),
   * broadcasts collab:redo via wsCollabHandler.
   */
  performRedo: (userId: string, userName: string, canvasId: string) => void;
}

export const useUndoRedoStore = create<UndoRedoState>((set, _get) => ({
  currentOperator: null,
  conflictDialog: {
    open: false,
    conflictingUserName: '',
    conflictingUserId: '',
    nodeId: '',
  },

  setCurrentOperator: (op: OperatorInfo) => set({ currentOperator: op }),

  clearOperator: () => set({ currentOperator: null }),

  /**
   * D4.4: Check if a node is being edited by another user.
   */
  checkConflict: (nodeId: string, ownerUserId: string) => {
    const editor = usePresenceStore.getState().getEditor(nodeId);
    if (!editor) return false;
    return editor.userId !== ownerUserId;
  },

  showConflict: (conflictingUserName: string, conflictingUserId: string, nodeId: string) =>
    set({
      conflictDialog: {
        open: true,
        conflictingUserName,
        conflictingUserId,
        nodeId,
      },
    }),

  dismissConflict: () =>
    set((state) => ({
      conflictDialog: { ...state.conflictDialog, open: false },
    })),

  /**
   * D4.1 + D4.2: Collaborative undo — sets operator, calls canvasHistoryStore.undo(),
   * broadcasts collab:undo via wsCollabHandler.
   */
  performUndo: (userId: string, userName: string, canvasId: string) => {
    set({ currentOperator: { userId, userName, avatar: '', action: 'undo', timestamp: Date.now() } });
    useCanvasHistoryStore.getState().undo();
    broadcastUndo(null, userId, userName, canvasId);
  },

  /**
   * D4.1 + D4.2: Collaborative redo — sets operator, calls canvasHistoryStore.redo(),
   * broadcasts collab:redo via wsCollabHandler.
   */
  performRedo: (userId: string, userName: string, canvasId: string) => {
    set({ currentOperator: { userId, userName, avatar: '', action: 'redo', timestamp: Date.now() } });
    useCanvasHistoryStore.getState().redo();
    broadcastRedo(null, userId, userName, canvasId);
  },

  /**
   * D2.2: Resolve collaborative undo/redo conflict.
   *
   * - 'undo-mine': force-perform the undo even though another user is editing
   * - 'keep-theirs': abandon this undo, keep the other user's changes
   * - 'cancel': dismiss dialog, take no action
   *
   * S63-E2: 协作撤销冲突对话框
   */
  resolveConflict: (choice: 'undo-mine' | 'keep-theirs' | 'cancel') => {
    const { conflictDialog } = _get();
    if (!conflictDialog.open) return;

    // Always close the dialog first
    set((state) => ({
      conflictDialog: { ...state.conflictDialog, open: false },
    }));

    if (choice === 'undo-mine') {
      // Force-undo: get the top of the undo stack and execute it regardless of presence
      const history = useCanvasHistoryStore.getState();
      if (history.canUndo()) {
        history.undo();
      }
    }
    // 'keep-theirs' and 'cancel': do nothing — dialog already dismissed above
  },
}));
