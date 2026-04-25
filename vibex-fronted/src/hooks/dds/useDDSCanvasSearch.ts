'use client';

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useDDSCanvasStore } from '@/stores/dds/DDSCanvasStore';
import type { ChapterType } from '@/types/dds';
import type { DDSCard } from '@/types/dds';

export interface DDSSearchResult {
  card: DDSCard;
  chapter: ChapterType;
  matchedField: 'title' | 'description';
  matchedText: string;
}

interface UseDDSCanvasSearchReturn {
  query: string;
  setQuery: (q: string) => void;
  results: DDSSearchResult[];
  hasResults: boolean;
  isSearching: boolean;
  clearResults: () => void;
}

const DEBOUNCE_MS = 300;

export function useDDSCanvasSearch(): UseDDSCanvasSearchReturn {
  const [query, setQueryState] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<DDSSearchResult[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Read all chapters from store
  const chapters = useDDSCanvasStore((s) => s.chapters);

  // Build flat card list for searching
  const allCards = useMemo(() => {
    const cards: Array<{ card: DDSCard; chapter: ChapterType }> = [];
    (Object.keys(chapters) as ChapterType[]).forEach((chapter) => {
      chapters[chapter].cards.forEach((card) => {
        cards.push({ card, chapter });
      });
    });
    return cards;
  }, [chapters]);

  const search = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    setQueryState(q);

    if (!q.trim()) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    debounceRef.current = setTimeout(() => {
      const normalized = q.toLowerCase().trim();
      const matched: DDSSearchResult[] = [];

      for (const { card, chapter } of allCards) {
        const titleMatch = card.title.toLowerCase().includes(normalized);
        const descMatch = card.description?.toLowerCase().includes(normalized);

        if (titleMatch) {
          matched.push({ card, chapter, matchedField: 'title', matchedText: q });
        } else if (descMatch) {
          matched.push({ card, chapter, matchedField: 'description', matchedText: q });
        }
      }

      setResults(matched);
      setIsSearching(false);
    }, DEBOUNCE_MS);
  }, [allCards]);

  const clearResults = useCallback(() => {
    setQueryState('');
    setResults([]);
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return {
    query,
    setQuery: search,
    results,
    hasResults: results.length > 0,
    isSearching,
    clearResults,
  };
}
