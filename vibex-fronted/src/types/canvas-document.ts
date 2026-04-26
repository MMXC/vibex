/**
 * canvas-document.ts — E2 Canvas Import/Export Schema Types
 * US-E2.1: JSON Canvas Format
 */

import type { ChapterType, ChapterData } from '@/types/dds';

export interface CanvasDocument {
  schemaVersion: string; // "1.x.x" semver-like
  metadata: {
    name: string;
    createdAt: string; // ISO-8601
    updatedAt: string;
    exportedAt?: string;
  };
  chapters: ChapterData[];
  crossChapterEdges: CanvasCrossChapterEdge[];
}

export interface CanvasCrossChapterEdge {
  id: string;
  sourceChapterId: string;
  targetChapterId: string;
  label?: string;
}

export interface ImportLogEntry {
  id: string;
  timestamp: string; // ISO-8601
  sourceFile: string;
  schemaVersion: string;
  chapterCount: number;
}