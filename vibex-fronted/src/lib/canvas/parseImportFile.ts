/**
 * parseImportFile — Parse local JSON/YAML/Vibex import files
 * S54-E2: Canvas File Import Enhancement
 *
 * Supports three formats:
 * - .vibex: project archive with chapter data
 * - .json: raw canvas data (ChapterData[] or legacy format)
 * - .yaml / .yml: YAML version of canvas data
 */

import type { ChapterData, DDSCard, DDSEdge } from '@/types/dds';
import { generateId } from '@/lib/canvas/id';

// ==================== Types ====================

export type ImportFormat = 'vibex' | 'json' | 'yaml';

export interface ParsedImportResult {
  format: ImportFormat;
  chapters: ChapterData[];
  totalCards: number;
  totalEdges: number;
  projectName?: string;
}

export interface ParseError {
  message: string;
  code: 'INVALID_JSON' | 'INVALID_YAML' | 'UNSUPPORTED_FORMAT' | 'EMPTY_FILE' | 'SCHEMA_MISMATCH';
}

// ==================== Format Detection ====================

function detectFormat(fileName: string, content: string): ImportFormat {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (ext === 'vibex') return 'vibex';
  if (ext === 'yaml' || ext === 'yml') return 'yaml';
  if (ext === 'json') {
    // Check if it's a vibex archive by content structure
    try {
      const parsed = JSON.parse(content.slice(0, 500));
      if (parsed._format === 'vibex' || parsed._schema === 'vibex') return 'vibex';
      if (Array.isArray(parsed) && parsed[0]?.type) return 'json';
      if (parsed.boundedContexts || parsed.flows || parsed.components) return 'vibex';
    } catch {
      // fall through to json
    }
    return 'json';
  }
  return 'json';
}

// ==================== YAML Parser (pure JS, no external dependency) ====================

/**
 * Minimal YAML parser for key-value and list structures.
 * Handles the subset of YAML used by VibeX export files.
 */
function parseSimpleYAML(content: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const lines = content.split('\n');
  let currentKey = '';
  let currentList: string[] | null = null;
  let inBlock = false;
  let blockIndent = 0;
  const stack: Array<{ obj: Record<string, unknown>; indent: number }> = [{ obj: result, indent: -1 }];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim() || line.trim().startsWith('#')) continue;

    const indent = line.search(/\S/);
    if (indent === -1) continue;

    // List item
    if (line.trim().startsWith('- ')) {
      const value = line.trim().slice(2).trim();
      if (currentList) {
        currentList.push(value);
      }
      continue;
    }

    // Key-value
    const colonIdx = line.indexOf(':');
    if (colonIdx > 0) {
      const key = line.slice(0, colonIdx).trim();
      const value = line.slice(colonIdx + 1).trim();

      // Pop stack to find parent
      while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
        stack.pop();
      }
      const parent = stack[stack.length - 1].obj;

      if (value === '' || value === '|' || value === '>') {
        // Start of block scalar or nested object
        parent[key] = {};
        stack.push({ obj: parent[key] as Record<string, unknown>, indent });
      } else if (value === '[]' || value === '[ ]') {
        parent[key] = [];
      } else {
        parent[key] = value.replace(/^['"]|['"]$/g, '');
      }
    }
  }

  return result;
}

// ==================== Vibex Format Parser ====================

function parseVibexFormat(data: Record<string, unknown>): ParsedImportResult {
  const chapters: ChapterData[] = [];
  let totalCards = 0;
  let totalEdges = 0;

  // Extract project name
  const projectName = typeof data.name === 'string' ? data.name : undefined;

  // Map vibex chapters to internal format
  const chapterMap: Record<string, 'requirement' | 'context' | 'flow' | 'api' | 'business-rules'> = {
    boundedContexts: 'context',
    contexts: 'context',
    flows: 'flow',
    requirements: 'requirement',
    userStories: 'requirement',
    apiEndpoints: 'api',
    endpoints: 'api',
    'business-rules': 'business-rules',
    rules: 'business-rules',
  };

  for (const [key, value] of Object.entries(data)) {
    if (key.startsWith('_') || key === 'name') continue;
    if (!Array.isArray(value)) continue;

    const chapterType = chapterMap[key];
    if (!chapterType) continue;

    const cards: DDSCard[] = value.map((item: Record<string, unknown>, idx: number) => {
      totalCards++;
      return {
        id: typeof item.id === 'string' ? item.id : generateId(),
        type: chapterType === 'context' ? 'bounded-context'
            : chapterType === 'flow' ? 'flow-step'
            : 'user-story',
        title: typeof item.title === 'string' ? item.title
            : typeof item.name === 'string' ? item.name
            : typeof item.stepName === 'string' ? item.stepName
            : `Imported ${idx + 1}`,
        description: typeof item.description === 'string' ? item.description : '',
        position: typeof item.position === 'object' && item.position !== null
          ? (item.position as { x: number; y: number })
          : { x: 100 + (idx % 5) * 200, y: 100 + Math.floor(idx / 5) * 150 },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...item,
      } as DDSCard;
    });

    chapters.push({
      type: chapterType,
      cards,
      edges: [],
      loading: false,
      error: null,
    });
  }

  // If no recognized chapters, try top-level array
  if (chapters.length === 0 && Array.isArray(data.chapters)) {
    for (const ch of data.chapters as ChapterData[]) {
      if (ch.type && ch.cards) {
        totalCards += ch.cards.length;
        chapters.push(ch);
      }
    }
  }

  return { format: 'vibex', chapters, totalCards, totalEdges, projectName };
}

// ==================== ChapterData[] Format Parser ====================

function parseChapterDataFormat(data: ChapterData[]): ParsedImportResult {
  let totalCards = 0;
  let totalEdges = 0;

  for (const ch of data) {
    totalCards += (ch.cards?.length ?? 0);
    totalEdges += (ch.edges?.length ?? 0);
  }

  return {
    format: 'json',
    chapters: data,
    totalCards,
    totalEdges,
  };
}

// ==================== Legacy Format Parser ====================

function parseLegacyFormat(data: Record<string, unknown>): ParsedImportResult {
  // { boundedContexts?, flows?, components? } — old API format
  const chapters: ChapterData[] = [];
  let totalCards = 0;
  let totalEdges = 0;

  const mapping: Array<{ key: string; type: ChapterData['type'] }> = [
    { key: 'boundedContexts', type: 'context' },
    { key: 'contexts', type: 'context' },
    { key: 'flows', type: 'flow' },
    { key: 'components', type: 'api' },
    { key: 'userStories', type: 'requirement' },
    { key: 'requirements', type: 'requirement' },
  ];

  for (const { key, type } of mapping) {
    if (!Array.isArray(data[key])) continue;
    const cards: DDSCard[] = (data[key] as Array<Record<string, unknown>>).map(
      (item: Record<string, unknown>, idx: number) => {
        totalCards++;
        return {
          id: typeof item.id === 'string' ? item.id : generateId(),
          type: type === 'context' ? 'bounded-context'
              : type === 'flow' ? 'flow-step'
              : 'user-story',
          title: typeof item.title === 'string' ? item.title
              : typeof item.name === 'string' ? item.name
              : `Imported ${idx + 1}`,
          description: typeof item.description === 'string' ? item.description : '',
          position: { x: 100 + (idx % 5) * 200, y: 100 + Math.floor(idx / 5) * 150 },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as DDSCard;
      }
    );
    chapters.push({ type, cards, edges: [], loading: false, error: null });
  }

  return { format: 'vibex', chapters, totalCards, totalEdges };
}

// ==================== Main Parser ====================

export function parseImportFile(fileName: string, content: string): ParsedImportResult | ParseError {
  if (!content.trim()) {
    return { message: 'File is empty', code: 'EMPTY_FILE' };
  }

  const format = detectFormat(fileName, content);

  try {
    let data: Record<string, unknown>;

    if (format === 'yaml') {
      data = parseSimpleYAML(content);
    } else {
      data = JSON.parse(content);
    }

    // ChapterData[] array format
    if (Array.isArray(data)) {
      const valid = data.filter(
        (item): item is ChapterData =>
          typeof item === 'object' && item !== null && 'type' in item && 'cards' in item
      );
      if (valid.length > 0) {
        return parseChapterDataFormat(valid);
      }
      return { message: 'No valid chapter data found in array', code: 'SCHEMA_MISMATCH' };
    }

    // Check for legacy format
    if (typeof data === 'object' && data !== null) {
      const legacyKeys = ['boundedContexts', 'contexts', 'flows', 'components', 'userStories'];
      if (legacyKeys.some((k) => k in data)) {
        return parseLegacyFormat(data);
      }
      // Vibex archive
      return parseVibexFormat(data);
    }

    return { message: 'Unsupported file structure', code: 'SCHEMA_MISMATCH' };
  } catch (err) {
    if (err instanceof SyntaxError) {
      return { message: 'Invalid JSON syntax', code: 'INVALID_JSON' };
    }
    return { message: 'Failed to parse file', code: 'INVALID_JSON' };
  }
}

/**
 * Read a File object as text and parse it.
 */
export async function parseFile(file: File): Promise<ParsedImportResult | ParseError> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const content = reader.result as string;
        const result = parseImportFile(file.name, content);
        resolve(result);
      } catch {
        resolve({ message: 'Failed to read file', code: 'INVALID_JSON' });
      }
    };
    reader.onerror = () => {
      resolve({ message: 'FileReader error', code: 'INVALID_JSON' });
    };
    reader.readAsText(file);
  });
}
