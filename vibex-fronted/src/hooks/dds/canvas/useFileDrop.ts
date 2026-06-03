/**
 * useFileDrop — Hook for desktop file drag-and-drop import
 * S58-E2: 桌面文件拖拽导入
 *
 * Responsibilities:
 * - Track isDragging state during drag-enter/drag-leave/drag-over
 * - processDrop(): validate + parse dropped files (.vibex, .json, .yaml, .yml)
 * - Expose pendingFiles for FileImportDialog preview
 * - On confirm: append cards to current chapter via ddsChapterActions
 *
 * @module hooks/dds/canvas/useFileDrop
 */

import { useState, useCallback, useRef } from 'react';
import type { DDSCard, ChapterType } from '@/types/dds';
import { ddsChapterActions } from '@/stores/dds';
import { useDDSCanvasStore } from '@/stores/dds';
import { generateId } from '@/lib/canvas/id';

// ==================== Types ====================

export interface ImportedFile {
  file: File;
  /** Parsed cards from the file */
  cards: DDSCard[];
  /** Parsed edges from the file (source/target IDs remapped) */
  edges: Array<{
    id: string;
    source: string;
    target: string;
    sourceChapter?: ChapterType;
    targetChapter?: ChapterType;
  }>;
  /** Error message if parsing failed */
  error?: string;
}

export interface FileDropState {
  isDragging: boolean;
  pendingFiles: ImportedFile[];
  isProcessing: boolean;
  errorMessage: string | null;
}

export interface FileDropActions {
  setDragging: (v: boolean) => void;
  processDrop: (files: FileList) => Promise<void>;
  confirmImport: () => void;
  reset: () => void;
  removeFile: (index: number) => void;
}

export interface UseFileDropReturn extends FileDropState, FileDropActions {}

// ==================== Exported for testing ====================
// (placed at end of file after function definitions)
/** Check if a value looks like a raw {nodes, edges} object (not DDSExportData) */
function isRawNodeEdge(data: unknown): data is { nodes?: unknown[]; edges?: unknown[] } {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  return (
    (Array.isArray(d.nodes) || Array.isArray(d.edges)) &&
    (d.version === undefined || d.version !== 1)
  );
}

/** Parse a .vibex or .json file */
async function parseDDSExportFile(file: File): Promise<{ cards: DDSCard[]; edges: ReturnType<typeof parseEdges> }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const data = JSON.parse(text);

        // DDSExportData format
        if (isRawNodeEdge(data) && (data as { version?: number }).version === 1) {
          // This is a raw {nodes, edges} — treat as raw format
        }

        // Check if it's a full DDSExportData
        if (
          typeof data === 'object' &&
          data !== null &&
          'version' in data &&
          (data as { version: number }).version === 1 &&
          'chapters' in data
        ) {
          const ddsData = data as {
            chapters: Record<string, { cards: DDSCard[]; edges: unknown[] }>;
          };
          const activeChapter = 'requirement' as ChapterType;
          const chapterData = ddsData.chapters[activeChapter];
          if (!chapterData) {
            reject(new Error(`No requirement chapter found in ${file.name}`));
            return;
          }
          const { cards, edges } = parseEdges(chapterData.cards ?? [], chapterData.edges ?? []);
          resolve({ cards, edges });
          return;
        }

        // Raw {nodes, edges} format
        if (isRawNodeEdge(data)) {
          const raw = data as { nodes?: unknown[]; edges?: unknown[] };
          const cards = (raw.nodes ?? []).map((n) => n as DDSCard);
          const edges = parseEdges(cards, raw.edges ?? []);
          resolve({ cards, edges });
          return;
        }

        reject(new Error(`Unsupported file format in ${file.name}`));
      } catch (err) {
        reject(new Error(`Failed to parse ${file.name}: ${err instanceof Error ? err.message : String(err)}`));
      }
    };
    reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
    reader.readAsText(file);
  });
}

/** Parse a .yaml / .yml file using js-yaml */
async function parseYAMLFile(file: File): Promise<{ cards: DDSCard[]; edges: ReturnType<typeof parseEdges> }> {
  // Dynamic import to avoid SSR issues
  const yaml = await import('js-yaml');
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const data = yaml.load(text) as unknown;

        if (isRawNodeEdge(data)) {
          const raw = data as { nodes?: unknown[]; edges?: unknown[] };
          const cards = (raw.nodes ?? []).map((n) => n as DDSCard);
          const edges = parseEdges(cards, raw.edges ?? []);
          resolve({ cards, edges });
          return;
        }

        reject(new Error(`Unsupported YAML format in ${file.name}`));
      } catch (err) {
        reject(new Error(`Failed to parse YAML ${file.name}: ${err instanceof Error ? err.message : String(err)}`));
      }
    };
    reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
    reader.readAsText(file);
  });
}

/**
 * Parse raw edges array, remapping source/target IDs to new generated IDs.
 * Returns edges with old-to-new ID mapping.
 */
function parseEdges(cards: DDSCard[], rawEdges: unknown[]): Array<{ id: string; source: string; target: string }> {
  if (!Array.isArray(rawEdges)) return [];

  // Build card ID map (old → new)
  const oldToNew: Record<string, string> = {};
  cards.forEach((card) => {
    oldToNew[card.id] = generateId();
  });

  return rawEdges
    .map((e) => e as { id?: string; source?: string; target?: string })
    .filter((e) => e && e.source && e.target)
    .map((e) => ({
      id: generateId(),
      source: oldToNew[e.source!] ?? generateId(),
      target: oldToNew[e.target!] ?? generateId(),
    }));
}

// ==================== Supported Extensions ====================

const VALID_EXTENSIONS = ['.vibex', '.json', '.yaml', '.yml'];

/** Check if a file extension is supported */
function isSupportedExtension(filename: string): boolean {
  return VALID_EXTENSIONS.some((ext) => filename.toLowerCase().endsWith(ext));
}

// ==================== Hook ====================

const INITIAL_STATE: FileDropState = {
  isDragging: false,
  pendingFiles: [],
  isProcessing: false,
  errorMessage: null,
};

/**
 * useFileDrop — manages drag-drop file import state and logic.
 *
 * Usage:
 * ```
 * const { isDragging, pendingFiles, processDrop, confirmImport, reset } = useFileDrop();
 * ```
 */
export function useFileDrop(): UseFileDropReturn {
  const [state, setState] = useState<FileDropState>(INITIAL_STATE);

  const setDragging = useCallback((v: boolean) => {
    setState((prev) => ({ ...prev, isDragging: v }));
  }, []);

  /** Process a drop event: validate files, parse content, store in pendingFiles */
  const processDrop = useCallback(async (files: FileList) => {
    setState((prev) => ({ ...prev, isProcessing: true, errorMessage: null }));

    const results: ImportedFile[] = [];
    let hasUnsupported = false;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const filename = file.name.toLowerCase();

      // Check extension
      if (!isSupportedExtension(filename)) {
        results.push({ file, cards: [], edges: [], error: `Unsupported file type: ${file.name} — supported: .vibex, .json, .yaml, .yml` });
        hasUnsupported = true;
        continue;
      }

      try {
        let parsed: { cards: DDSCard[]; edges: ReturnType<typeof parseEdges> };
        if (filename.endsWith('.yaml') || filename.endsWith('.yml')) {
          parsed = await parseYAMLFile(file);
        } else {
          parsed = await parseDDSExportFile(file);
        }
        results.push({ file, ...parsed });
      } catch (err) {
        results.push({
          file,
          cards: [],
          edges: [],
          error: err instanceof Error ? err.message : `Failed to parse ${file.name}`,
        });
      }
    }

    setState((prev) => ({
      ...prev,
      pendingFiles: results,
      isProcessing: false,
      isDragging: false,
      errorMessage: hasUnsupported ? 'Some files have unsupported formats. Only .vibex, .json, .yaml, .yml are supported.' : null,
    }));
  }, []);

  /** Confirm import: append all parsed cards + edges to current chapter */
  const confirmImport = useCallback(() => {
    const activeChapter = useDDSCanvasStore.getState().activeChapter;
    let totalCards = 0;

    for (const imported of state.pendingFiles) {
      if (imported.error) continue;

      // Generate new IDs and offset positions
      const oldToNew: Record<string, string> = {};
      const newCards: DDSCard[] = imported.cards.map((card) => {
        const newId = generateId();
        oldToNew[card.id] = newId;
        return {
          ...card,
          id: newId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      });

      // Offset all cards by 30px per file to avoid stacking
      const offset = state.pendingFiles.indexOf(imported) * 30;
      const offsetCards = newCards.map((c) => ({
        ...c,
        position: {
          x: ((c as { position?: { x: number; y: number } }).position?.x ?? 0) + offset,
          y: ((c as { position?: { x: number; y: number } }).position?.y ?? 0) + offset,
        },
      }));

      // Add edges with remapped IDs
      const newEdges = imported.edges.map((e) => ({
        id: generateId(),
        source: oldToNew[e.source] ?? generateId(),
        target: oldToNew[e.target] ?? generateId(),
        type: 'smoothstep' as const,
      }));

      // Add cards to store
      offsetCards.forEach((card) => {
        ddsChapterActions.addCard(activeChapter, card);
      });

      // Add edges
      newEdges.forEach((edge) => {
        ddsChapterActions.addEdge(activeChapter, edge as { id: string; source: string; target: string; type: 'smoothstep' });
      });

      totalCards += offsetCards.length;
    }

    setState(INITIAL_STATE);

    // Return count for callers (could trigger a toast in future)
    console.info(`[useFileDrop] Imported ${totalCards} cards to ${activeChapter}`);
  }, [state.pendingFiles]);

  const reset = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  const removeFile = useCallback((index: number) => {
    setState((prev) => ({
      ...prev,
      pendingFiles: prev.pendingFiles.filter((_, i) => i !== index),
    }));
  }, []);

  return {
    ...state,
    setDragging,
    processDrop,
    confirmImport,
    reset,
    removeFile,
  };
}

// ==================== Exported for testing ====================
export { parseDDSExportFile, parseYAMLFile, parseEdges };
