/**
 * serialize.ts — 三树数据序列化/反序列化
 * E4-U2: 三树数据序列化
 * E2: Canvas Import/Export
 */
import type { BoundedContextNode, BusinessFlowNode, ComponentNode } from '@/lib/canvas/types';
import { useContextStore } from '@/lib/canvas/stores/contextStore';
import { useFlowStore } from '@/lib/canvas/stores/flowStore';
import { useComponentStore } from '@/lib/canvas/stores/componentStore';
import type { ChapterData, DDSEdge } from '@/types/dds';
import type { CanvasDocument } from '@/types/canvas-document';

// ─── Shared Constants ─────────────────────────────────────────────────────────

/** 当前 DDS Canvas schema 版本 (E2) */
export const CURRENT_SCHEMA_VERSION = '1.2.0' as const;

// ─── DDS Canvas Serialization (E2: Import/Export) ────────────────────────────

/**
 * 序列化章节数据为 CanvasDocument
 */
export function serializeCanvasToJSON(chapters: ChapterData[], crossChapterEdges: DDSEdge[]): CanvasDocument {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    metadata: {
      name: 'VibeX Canvas',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      exportedAt: new Date().toISOString(),
    },
    chapters,
    crossChapterEdges: crossChapterEdges.map((e) => ({
      id: e.id,
      sourceChapterId: e.source,
      targetChapterId: e.target,
      label: e.label,
    })),
  };
}

/**
 * 反序列化 CanvasDocument 为章节数据
 * Forward-compat: 跳过未知字段，警告而非抛出
 */
export function deserializeCanvasFromJSON(
  doc: CanvasDocument
): { chapters: ChapterData[]; warnings: string[] } {
  const warnings: string[] = [];

  // Schema version check (warn, don't throw)
  if (doc.schemaVersion && !doc.schemaVersion.startsWith('1.')) {
    warnings.push(`Unknown schema version "${doc.schemaVersion}", expected 1.x.x. Proceeding anyway.`);
  }

  // Metadata forward-compat: warn on unknown fields
  if (doc.metadata) {
    const knownMetaFields = ['name', 'createdAt', 'updatedAt', 'exportedAt'];
    const metaKeys = Object.keys(doc.metadata);
    for (const key of metaKeys) {
      if (!knownMetaFields.includes(key)) {
        warnings.push(`Unknown metadata field "${key}" will be ignored.`);
      }
    }
  }

  // Chapters: validate type and warn on unknown extra fields per chapter
  const chapters: ChapterData[] = [];
  const validChapterTypes = ['requirement', 'context', 'flow', 'api', 'business-rules'];

  if (Array.isArray(doc.chapters)) {
    for (let i = 0; i < doc.chapters.length; i++) {
      const ch = doc.chapters[i] as unknown as Record<string, unknown>;
      if (!validChapterTypes.includes(ch.type as string)) {
        warnings.push(`Unknown chapter type "${ch.type}" at index ${i}. Skipping.`);
        continue;
      }
      // Forward-compat: strip unknown fields, keep known ones
      chapters.push({
        type: ch.type as ChapterData['type'],
        cards: Array.isArray(ch.cards) ? ch.cards : [],
        edges: Array.isArray(ch.edges) ? ch.edges : [],
        loading: false,
        error: null,
      });
    }
  }

  return { chapters, warnings };
}

/**
 * 将 CanvasDocument 序列化为 JSON 字符串（可读格式）
 */
export function serializeCanvasDocumentToJSON(doc: CanvasDocument): string {
  return JSON.stringify(doc, null, 2);
}

// ─── Three-Tree Serialization (E4-U2 legacy) ────────────────────────────────

/** 三树快照数据结构 */
export interface CanvasSnapshotData {
  version: number;
  savedAt: string;
  contextNodes: BoundedContextNode[];
  flowNodes: BusinessFlowNode[];
  componentNodes: ComponentNode[];
}

/**
 * 从当前 Zustand stores 序列化三树
 * 用于保存时打包数据
 */
export function serializeThreeTrees(): CanvasSnapshotData {
  const contextNodes = useContextStore.getState().contextNodes;
  const flowNodes = useFlowStore.getState().flowNodes;
  const componentNodes = useComponentStore.getState().componentNodes;

  return {
    version: 1,
    savedAt: new Date().toISOString(),
    contextNodes,
    flowNodes,
    componentNodes,
  };
}

/**
 * 反序列化 JSON 字符串为 CanvasSnapshotData
 * @throws Error 不支持的数据版本
 */
export function deserializeThreeTrees(jsonStr: string): CanvasSnapshotData {
  const data = JSON.parse(jsonStr) as CanvasSnapshotData;

  if (typeof data.version !== 'number') {
    throw new Error('不支持的数据格式：缺少 version 字段');
  }

  if (data.version !== 1) {
    throw new Error(`不支持的数据版本: ${data.version}（仅支持 version 1）`);
  }

  return {
    version: data.version,
    savedAt: data.savedAt ?? new Date().toISOString(),
    contextNodes: Array.isArray(data.contextNodes) ? data.contextNodes : [],
    flowNodes: Array.isArray(data.flowNodes) ? data.flowNodes : [],
    componentNodes: Array.isArray(data.componentNodes) ? data.componentNodes : [],
  };
}

/**
 * 将 CanvasSnapshotData 恢复到 Zustand stores
 * 用于从快照加载时恢复状态
 */
export function restoreStore(data: CanvasSnapshotData): void {
  const setContextNodes = useContextStore.getState().setContextNodes;
  const setFlowNodes = useFlowStore.getState().setFlowNodes;
  const setComponentNodes = useComponentStore.getState().setComponentNodes;

  setContextNodes(data.contextNodes ?? []);
  setFlowNodes(data.flowNodes ?? []);
  setComponentNodes(data.componentNodes ?? []);
}

/**
 * 将 CanvasSnapshotData 序列化为 JSON 字符串
 */
export function serializeToJson(data: CanvasSnapshotData): string {
  return JSON.stringify(data);
}