/**
 * CanvasImporter — Parse .flow.json and .flow.zip canvas import files
 * S81-E1: 画布导入格式支持
 *
 * .flow.json: Plain JSON with CanvasDocument-like structure
 * .flow.zip:  ZIP archive containing manifest.json + canvas.json + optional assets/
 */

import JSZip from 'jszip';
import type { ChapterData } from '@/types/dds';
import { deserializeCanvasFromJSON } from '@/lib/canvas/serialize';
import type { CanvasDocument } from '@/types/canvas-document';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ImportConflictAction = 'cover' | 'rename' | 'cancel';

/** Result of successful import parsing */
export interface ParsedCanvas {
  name: string;
  chapters: ChapterData[];
  warnings: string[];
  rawDoc: CanvasDocument;
  sourceFile: string;
}

/** Conflict info when a canvas with the same name already exists */
export interface ImportConflict {
  /** The incoming canvas name that conflicts */
  incomingName: string;
  /** The existing canvas ID in the store */
  existingCanvasId: string;
  /** The existing canvas name */
  existingName: string;
}

/** Result of parse attempt */
export type ParseResult =
  | { ok: true; data: ParsedCanvas }
  | { ok: false; error: string };

// ─── CanvasImporter Class ─────────────────────────────────────────────────────

/**
 * CanvasImporter — handles parsing of .flow.json and .flow.zip canvas files.
 *
 * Usage:
 *   const importer = new CanvasImporter();
 *   const result = await importer.importFile(file);
 *   if (result.ok) { ... use result.data ... }
 */
export class CanvasImporter {
  /**
   * Parse a File object (.flow.json or .flow.zip) into a ParsedCanvas.
   * Throws on unrecoverable errors; returns ParseResult on format/validation errors.
   */
  async importFile(file: File): Promise<ParseResult> {
    const fileName = file.name.toLowerCase();

    if (fileName.endsWith('.flow.zip')) {
      return this.parseFlowZip(file);
    } else if (fileName.endsWith('.flow.json')) {
      return this.parseFlowJson(file);
    } else {
      return {
        ok: false,
        error: `不支持的文件格式：${file.name}。请使用 .flow.json 或 .flow.zip 文件。`,
      };
    }
  }

  /**
   * Parse a .flow.json file.
   * Expected format: { name: string, schemaVersion: string, chapters: ChapterData[], crossChapterEdges?: ... }
   */
  async parseFlowJson(file: File): Promise<ParseResult> {
    let content: string;
    try {
      content = await file.text();
    } catch {
      return { ok: false, error: '文件读取失败，请检查文件完整性' };
    }

    let doc: Partial<CanvasDocument>;
    try {
      doc = JSON.parse(content) as Partial<CanvasDocument>;
    } catch {
      return { ok: false, error: '无效的 JSON 格式' };
    }

    if (!doc.schemaVersion) {
      return { ok: false, error: '无效的画布文件：缺少 schemaVersion 字段' };
    }
    if (!Array.isArray(doc.chapters)) {
      return { ok: false, error: '无效的画布文件：缺少 chapters 数组' };
    }
    if (!doc.metadata?.name) {
      return { ok: false, error: '无效的画布文件：缺少 metadata.name' };
    }

    const fullDoc: CanvasDocument = doc as CanvasDocument;
    const { chapters, warnings } = deserializeCanvasFromJSON(fullDoc);

    return {
      ok: true,
      data: {
        name: fullDoc.metadata.name,
        chapters,
        warnings,
        rawDoc: fullDoc,
        sourceFile: file.name,
      },
    };
  }

  /**
   * Parse a .flow.zip file.
   * Expected structure:
   *   manifest.json    — { name: string, schemaVersion: string, ... }
   *   canvas.json      — the full CanvasDocument JSON (or inline in manifest)
   *   assets/          — optional subdirectory for embedded images etc.
   */
  async parseFlowZip(file: File): Promise<ParseResult> {
    let zip: JSZip;
    try {
      const buffer = await file.arrayBuffer();
      zip = await JSZip.loadAsync(buffer);
    } catch {
      return { ok: false, error: '无法解压 ZIP 文件，文件可能已损坏' };
    }

    // Read manifest.json (required)
    const manifestFile = zip.file('manifest.json');
    if (!manifestFile) {
      return { ok: false, error: 'ZIP 文件缺少 manifest.json' };
    }

    let manifest: Partial<CanvasDocument>;
    try {
      const manifestContent = await manifestFile.async('string');
      manifest = JSON.parse(manifestContent) as Partial<CanvasDocument>;
    } catch {
      return { ok: false, error: 'manifest.json 格式无效' };
    }

    // Read canvas.json if present (not inline in manifest)
    let fullDoc: CanvasDocument;
    if (manifest.chapters) {
      // Canvas data inline in manifest
      fullDoc = manifest as CanvasDocument;
    } else {
      const canvasFile = zip.file('canvas.json');
      if (!canvasFile) {
        return { ok: false, error: 'ZIP 文件缺少 canvas.json' };
      }
      try {
        const canvasContent = await canvasFile.async('string');
        fullDoc = JSON.parse(canvasContent) as CanvasDocument;
      } catch {
        return { ok: false, error: 'canvas.json 格式无效' };
      }
    }

    // Validate
    if (!fullDoc.schemaVersion) {
      return { ok: false, error: 'ZIP 内画布文件缺少 schemaVersion' };
    }
    if (!Array.isArray(fullDoc.chapters)) {
      return { ok: false, error: 'ZIP 内画布文件缺少 chapters 数组' };
    }
    if (!fullDoc.metadata?.name) {
      return { ok: false, error: 'ZIP 内画布文件缺少 metadata.name' };
    }

    const { chapters, warnings } = deserializeCanvasFromJSON(fullDoc);

    return {
      ok: true,
      data: {
        name: fullDoc.metadata.name,
        chapters,
        warnings,
        rawDoc: fullDoc,
        sourceFile: file.name,
      },
    };
  }

  /**
   * Check if an incoming canvas name conflicts with existing canvas names.
   * Returns conflict info if there is a match (case-insensitive), null otherwise.
   */
  checkConflict(
    incomingName: string,
    existingCanvases: Array<{ id: string; name: string }>
  ): ImportConflict | null {
    const normalized = incomingName.toLowerCase().trim();
    const match = existingCanvases.find(
      (c) => c.name.toLowerCase().trim() === normalized
    );
    if (match) {
      return {
        incomingName: incomingName.trim(),
        existingCanvasId: match.id,
        existingName: match.name,
      };
    }
    return null;
  }
}
