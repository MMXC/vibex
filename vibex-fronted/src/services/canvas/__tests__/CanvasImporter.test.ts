/**
 * CanvasImporter.test.ts — S81-E1: 画布导入格式支持
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { CanvasImporter } from '../CanvasImporter';

describe('CanvasImporter', () => {
  let importer: CanvasImporter;

  beforeEach(() => {
    importer = new CanvasImporter();
  });

  // ─── importFile format routing ──────────────────────────────────────────────

  describe('importFile', () => {
    it('rejects unsupported file extensions', async () => {
      const file = new File(['{}'], 'canvas.txt', { type: 'text/plain' });
      const result = await importer.importFile(file);
      expect(result.ok).toBe(false);
      expect(result.error).toContain('不支持的文件格式');
    });

    it('dispatches .flow.json to parseFlowJson', async () => {
      const validDoc = {
        schemaVersion: '1.0.0',
        metadata: { name: 'Test Canvas', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
        chapters: [],
        crossChapterEdges: [],
      };
      const file = new File([JSON.stringify(validDoc)], 'test.canvas.flow.json', { type: 'application/json' });
      const result = await importer.importFile(file);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.name).toBe('Test Canvas');
        expect(result.data.sourceFile).toBe('test.canvas.flow.json');
      }
    });

    it('dispatches .flow.zip to parseFlowZip', async () => {
      // Create a minimal zip with manifest.json + canvas.json
      const { default: JSZip } = await import('jszip');
      const zip = new JSZip();
      const manifest = {
        schemaVersion: '1.0.0',
        metadata: { name: 'Zipped Canvas', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
        chapters: [],
        crossChapterEdges: [],
      };
      zip.file('manifest.json', JSON.stringify(manifest));
      zip.file('canvas.json', JSON.stringify(manifest));
      const blob = await zip.generateAsync({ type: 'blob' });
      const file = new File([blob], 'canvas.flow.zip', { type: 'application/zip' });
      const result = await importer.importFile(file);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.name).toBe('Zipped Canvas');
        expect(result.data.sourceFile).toBe('canvas.flow.zip');
      }
    });
  });

  // ─── parseFlowJson ──────────────────────────────────────────────────────────

  describe('parseFlowJson', () => {
    it('parses a valid .flow.json file', async () => {
      const validDoc = {
        schemaVersion: '1.0.0',
        metadata: { name: 'My Canvas', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
        chapters: [
          { id: 'ch1', type: 'context' as const, title: 'Context Chapter', cards: [], position: { x: 0, y: 0 } },
        ],
        crossChapterEdges: [],
      };
      const file = new File([JSON.stringify(validDoc)], 'canvas.flow.json', { type: 'application/json' });
      const result = await importer.parseFlowJson(file);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.name).toBe('My Canvas');
        expect(result.data.chapters).toHaveLength(1);
        expect(result.data.chapters[0].type).toBe('context');
      }
    });

    it('rejects a file that is not valid JSON', async () => {
      const file = new File(['not json at all'], 'canvas.flow.json', { type: 'application/json' });
      const result = await importer.parseFlowJson(file);
      expect(result.ok).toBe(false);
      expect(result.error).toBe('无效的 JSON 格式');
    });

    it('rejects missing schemaVersion', async () => {
      const doc = { metadata: { name: 'No Schema' }, chapters: [] };
      const file = new File([JSON.stringify(doc)], 'canvas.flow.json', { type: 'application/json' });
      const result = await importer.parseFlowJson(file);
      expect(result.ok).toBe(false);
      expect(result.error).toContain('schemaVersion');
    });

    it('rejects missing chapters array', async () => {
      const doc = { schemaVersion: '1.0.0', metadata: { name: 'No Chapters' } };
      const file = new File([JSON.stringify(doc)], 'canvas.flow.json', { type: 'application/json' });
      const result = await importer.parseFlowJson(file);
      expect(result.ok).toBe(false);
      expect(result.error).toContain('chapters');
    });

    it('rejects missing metadata.name', async () => {
      const doc = { schemaVersion: '1.0.0', metadata: { createdAt: '2026-01-01' }, chapters: [] };
      const file = new File([JSON.stringify(doc)], 'canvas.flow.json', { type: 'application/json' });
      const result = await importer.parseFlowJson(file);
      expect(result.ok).toBe(false);
      expect(result.error).toContain('metadata.name');
    });

    it('returns warnings for unknown schema version', async () => {
      const doc = {
        schemaVersion: '99.0.0',
        metadata: { name: 'Unknown Version', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
        chapters: [],
        crossChapterEdges: [],
      };
      const file = new File([JSON.stringify(doc)], 'canvas.flow.json', { type: 'application/json' });
      const result = await importer.parseFlowJson(file);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.warnings.length).toBeGreaterThan(0);
      }
    });
  });

  // ─── parseFlowZip ───────────────────────────────────────────────────────────

  describe('parseFlowZip', () => {
    it('parses a valid .flow.zip with inline manifest', async () => {
      const { default: JSZip } = await import('jszip');
      const zip = new JSZip();
      const doc = {
        schemaVersion: '1.0.0',
        metadata: { name: 'Inline Canvas', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
        chapters: [{ id: 'ch1', type: 'context' as const, title: 'Inline', cards: [], position: { x: 0, y: 0 } }],
        crossChapterEdges: [],
      };
      zip.file('manifest.json', JSON.stringify(doc));
      const blob = await zip.generateAsync({ type: 'blob' });
      const file = new File([blob], 'canvas.flow.zip', { type: 'application/zip' });
      const result = await importer.parseFlowZip(file);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.name).toBe('Inline Canvas');
        expect(result.data.chapters).toHaveLength(1);
      }
    });

    it('parses a valid .flow.zip with separate manifest + canvas.json', async () => {
      const { default: JSZip } = await import('jszip');
      const zip = new JSZip();
      const manifest = {
        schemaVersion: '1.0.0',
        metadata: { name: 'Separate Canvas', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
        chapters: [],
        crossChapterEdges: [],
      };
      zip.file('manifest.json', JSON.stringify(manifest));
      zip.file('canvas.json', JSON.stringify(manifest));
      const blob = await zip.generateAsync({ type: 'blob' });
      const file = new File([blob], 'canvas.flow.zip', { type: 'application/zip' });
      const result = await importer.parseFlowZip(file);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.name).toBe('Separate Canvas');
      }
    });

    it('rejects a zip without manifest.json', async () => {
      const { default: JSZip } = await import('jszip');
      const zip = new JSZip();
      zip.file('canvas.json', '{}');
      const blob = await zip.generateAsync({ type: 'blob' });
      const file = new File([blob], 'canvas.flow.zip', { type: 'application/zip' });
      const result = await importer.parseFlowZip(file);
      expect(result.ok).toBe(false);
      expect(result.error).toContain('manifest.json');
    });

    it('rejects a corrupted zip', async () => {
      const file = new File(['not a zip at all'], 'canvas.flow.zip', { type: 'application/zip' });
      const result = await importer.parseFlowZip(file);
      expect(result.ok).toBe(false);
      expect(result.error).toContain('无法解压');
    });

    it('rejects manifest.json that is not valid JSON', async () => {
      const { default: JSZip } = await import('jszip');
      const zip = new JSZip();
      zip.file('manifest.json', 'not json');
      const blob = await zip.generateAsync({ type: 'blob' });
      const file = new File([blob], 'canvas.flow.zip', { type: 'application/zip' });
      const result = await importer.parseFlowZip(file);
      expect(result.ok).toBe(false);
      expect(result.error).toContain('manifest.json');
    });

    it('rejects canvas.json that is not valid JSON', async () => {
      const { default: JSZip } = await import('jszip');
      const zip = new JSZip();
      // manifest WITHOUT chapters → will try to read canvas.json
      zip.file('manifest.json', JSON.stringify({ schemaVersion: '1.0.0', metadata: { name: 'X', createdAt: '2026', updatedAt: '2026' } }));
      zip.file('canvas.json', 'broken');
      const blob = await zip.generateAsync({ type: 'blob' });
      const file = new File([blob], 'canvas.flow.zip', { type: 'application/zip' });
      const result = await importer.parseFlowZip(file);
      expect(result.ok).toBe(false);
      expect(result.error).toContain('canvas.json');
    });
  });

  // ─── checkConflict ──────────────────────────────────────────────────────────

  describe('checkConflict', () => {
    it('returns null when no canvas matches', () => {
      const result = importer.checkConflict('New Canvas', [
        { id: 'id1', name: 'Existing Canvas' },
      ]);
      expect(result).toBeNull();
    });

    it('detects exact name match', () => {
      const result = importer.checkConflict('Existing Canvas', [
        { id: 'id1', name: 'Existing Canvas' },
      ]);
      expect(result).not.toBeNull();
      expect(result!.incomingName).toBe('Existing Canvas');
      expect(result!.existingCanvasId).toBe('id1');
      expect(result!.existingName).toBe('Existing Canvas');
    });

    it('detects case-insensitive match', () => {
      const result = importer.checkConflict('EXISTING CANVAS', [
        { id: 'id1', name: 'Existing Canvas' },
      ]);
      expect(result).not.toBeNull();
      expect(result!.existingCanvasId).toBe('id1');
    });

    it('trims whitespace before comparison', () => {
      const result = importer.checkConflict('  Existing Canvas  ', [
        { id: 'id1', name: 'Existing Canvas' },
      ]);
      expect(result).not.toBeNull();
    });

    it('returns null for empty existing list', () => {
      const result = importer.checkConflict('Any Canvas', []);
      expect(result).toBeNull();
    });
  });

  // ─── handleConflict callback ────────────────────────────────────────────────
  // Covered by ImportConflictDialog component tests (separate test file)
});
