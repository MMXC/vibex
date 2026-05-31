/**
 * clipboardStore — Clipboard for DDS canvas nodes
 *
 * Responsibilities:
 * - Store copied DDSCard[] with 5-minute TTL in localStorage
 * - Provide copy/paste actions for canvas nodes
 * - Track source chapter for paste feedback
 *
 * S46-E3: 画布节点复制/粘贴
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DDSCard, ChapterType } from '@/types/dds';

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
    }),
    {
      name: 'vibex-dds-clipboard',
      // Only persist the entry — no need to persist actions
      partialize: (state) => ({ entry: state.entry }),
    }
  )
);
