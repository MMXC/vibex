/**
 * useChapterURLSync — URL ↔ Store activeChapter 双向同步
 * Epic 2: F2.3.1 URL sync
 *
 * Reads ?chapter= from URL and syncs with DDSCanvasStore.activeChapter.
 * Updates URL when activeChapter changes.
 *
 * @module hooks/dds/useChapterURLSync
 */

'use client';

import { useEffect, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useDDSCanvasStore } from '@/stores/dds';
import type { ChapterType } from '@/types/dds';

const VALID_CHAPTERS: ChapterType[] = ['requirement', 'context', 'flow'];
const DEFAULT_CHAPTER: ChapterType = 'requirement';

export function useChapterURLSync(): void {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const { activeChapter, setActiveChapter } = useDDSCanvasStore();

  // ---- URL → Store: Read ?chapter= on mount ----
  useEffect(() => {
    const urlChapter = searchParams.get('chapter') as ChapterType | null;
    if (urlChapter && VALID_CHAPTERS.includes(urlChapter) && urlChapter !== activeChapter) {
      setActiveChapter(urlChapter);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only on mount

  // ---- Store → URL: Update URL when activeChapter changes ----
  const updateURL = useCallback(
    (chapter: ChapterType) => {
      if (typeof window === 'undefined') return; // SSR guard
      const params = new URLSearchParams(window.location.search);
      const current = params.get('chapter');

      if (chapter === DEFAULT_CHAPTER) {
        if (current) params.delete('chapter');
      } else {
        params.set('chapter', chapter);
      }

      const newSearch = params.toString();
      const newURL = newSearch ? `${pathname}?${newSearch}` : pathname;

      // Replace (not push) to avoid history spam on every scroll
      router.replace(newURL, { scroll: false });
    },
    [pathname, router]
  );

  useEffect(() => {
    updateURL(activeChapter);
  }, [activeChapter, updateURL]);
}
