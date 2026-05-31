/**
 * clipboardStore — Clipboard for DDS canvas nodes
 *
 * Responsibilities:
 * - Store copied DDSCard[] with 5-minute TTL in localStorage
 * - Provide copy/paste actions for canvas nodes
 * - Track source chapter for paste feedback
 *
 * S46-E3: 画布节点复制/粘贴
 * S48-E5: crossCanvasPaste — paste to a different canvas
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DDSCard, ChapterType } from '@/types/dds';
import { generateId } from '@/lib/canvas/id';
import { quickSave, quickLoad } from '@/services/dds/ddsPersistence';
import { canvasStoreRegistry } from '@/lib/canvas/canvasStoreRegistry';
import type { CanvasChapterData } from '@/lib/canvas/canvasStoreRegistry';

const CLIPBOARD_TTL_MS = 5 * 60 * 1000; // 5 minutes

export interface ClipboardEntry {
  cards: DDSCard[];
  sourceChapter: ChapterType;
  timestamp: number;
  /** Offset for pasting multiple times (cascade) */
  pasteCount: number;
}

interface ClipboardStore {
  entry: ClipboardEntry | null;
  copyCards: (cards: DDSCard[], sourceChapter: ChapterType) => void;
  pasteCards: () => ClipboardEntry | null;
  clearClipboard: () => void;
  /** Returns true if clipboard is still valid (not expired) */
  isValid: () => boolean;
  /**
   * [S48-E5] Paste clipboard cards to a different canvas (cross-canvas paste).
   * Cards are added to the target canvas's requirement chapter.
   * Returns the number of cards pasted, or 0 if clipboard is empty/expired.
   */
  crossCanvasPaste: (targetCanvasId: string, targetCanvasName: string) => number;
}

export const useClipboardStore = create<ClipboardStore>()(
  persist(
    (set, get) => ({
      entry: null,

      copyCards: (cards, sourceChapter) => {
        set({
          entry: {
            cards: cards.map((c) => ({ ...c })),
            sourceChapter,
            timestamp: Date.now(),
            pasteCount: 0,
          },
        });
      },

      pasteCards: () => {
        const { entry } = get();
        if (!entry) return null;

        // Check TTL
        if (Date.now() - entry.timestamp > CLIPBOARD_TTL_MS) {
          set({ entry: null });
          return null;
        }

        // Increment paste count (used for offset)
        const updated: ClipboardEntry = {
          ...entry,
          pasteCount: entry.pasteCount + 1,
          timestamp: Date.now(), // refresh TTL on paste
        };
        set({ entry: updated });
        return updated;
      },

      clearClipboard: () => set({ entry: null }),

      isValid: () => {
        const { entry } = get();
        if (!entry) return false;
        return Date.now() - entry.timestamp < CLIPBOARD_TTL_MS;
      },

      crossCanvasPaste: (targetCanvasId, targetCanvasName) => {
        const entry = get().entry;
        if (!entry) return 0;
        if (Date.now() - entry.timestamp > CLIPBOARD_TTL_MS) return 0;

        // Get or load chapter data for target canvas
        let canvasData = canvasStoreRegistry.get(targetCanvasId);
        if (!canvasData) {
          const loaded = quickLoad(targetCanvasId);
          if (loaded) {
            canvasData = { chapters: loaded.chapters };
          } else {
            // Canvas not found — create empty chapter structure
            canvasData = {
              chapters: {
                requirement: { cards: [], edges: [], loading: false, error: null, type: 'requirement' },
                context: { cards: [], edges: [], loading: false, error: null, type: 'context' },
                flow: { cards: [], edges: [], loading: false, error: null, type: 'flow' },
                api: { cards: [], edges: [], loading: false, error: null, type: 'api' },
                'business-rules': { cards: [], edges: [], loading: false, error: null, type: 'business-rules' },
              },
            };
          }
          canvasStoreRegistry.set(targetCanvasId, canvasData);
        }

        // Generate new card IDs and apply paste offset
        const oldToNew: Record<string, string> = {};
        const pasteCount = entry.pasteCount;
        const offset = pasteCount * 30;

        const newCards: DDSCard[] = entry.cards.map((c) => {
          const newId = generateId();
          oldToNew[c.id] = newId;
          return {
            ...c,
            id: newId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            position: {
              x: (c.position?.x ?? 0) + offset,
              y: (c.position?.y ?? 0) + offset,
            },
          };
        });

        // Update requirement chapter with new cards
        const updatedChapter = {
          ...canvasData.chapters.requirement,
          cards: [...canvasData.chapters.requirement.cards, ...newCards],
        };

        const updatedData: CanvasChapterData = {
          chapters: {
            ...canvasData.chapters,
            requirement: updatedChapter,
          },
        };

        canvasStoreRegistry.set(targetCanvasId, updatedData);

        // Persist to localStorage
        try {
          quickSave(
            targetCanvasId,
            targetCanvasName,
            updatedData.chapters,
            []
          );
        } catch (err) {
          console.error('[clipboardStore] crossCanvasPaste: quickSave failed', err);
        }

        return newCards.length;
      },
    }),
    {
      name: 'vibex-dds-clipboard',
      // Only persist the entry — no need to persist actions
      partialize: (state) => ({ entry: state.entry }),
    }
  )
);
