/**
 * ImportService Tests
 * E3-U3: Round-trip 验证
 */
import { describe, it, expect } from 'vitest';
import {
  parseJSON,
  parseYAML,
  parseFile,
  roundTripTest,
  type CanvasExportData,
} from '../ImportService';

describe('ImportService', () => {
  const validExportData: CanvasExportData = {
    exportedAt: '2026-04-16T00:00:00.000Z',
    version: '1.0.0',
    projectId: 'test-project',
    phase: 'clarification',
    contextNodes: [
      { id: 'ctx-1', name: 'Test Context', description: 'A test context', type: 'core' as const, isActive: true },
    ],
    flowNodes: [
      { id: 'flow-1', name: 'Test Flow', contextId: 'ctx-1', steps: [], isActive: true },
    ],
    componentNodes: [
      { id: 'comp-1', name: 'Test Component', type: 'page' as const, isActive: true },
    ],
  };

  describe('parseJSON', () => {
    it('should parse valid JSON', () => {
      const json = JSON.stringify(validExportData);
      const result = parseJSON(json);
      expect(result.success).toBe(true);
      expect(result.data?.contextNodes).toHaveLength(1);
      expect(result.data?.flowNodes).toHaveLength(1);
      expect(result.data?.componentNodes).toHaveLength(1);
    });

    it('should handle empty content', () => {
      const result = parseJSON('');
      expect(result.success).toBe(false);
      expect(result.error?.type).toBe('PARSE_ERROR');
    });

    it('should handle invalid JSON', () => {
      const result = parseJSON('not json');
      expect(result.success).toBe(false);
      expect(result.error?.type).toBe('PARSE_ERROR');
    });

    it('should reject data without version', () => {
      const result = parseJSON(JSON.stringify({ foo: 'bar' }));
      expect(result.success).toBe(false);
      expect(result.error?.type).toBe('VALIDATION_ERROR');
    });
  });

  describe('parseYAML', () => {
    it('should parse valid YAML', () => {
      const yaml = `
exportedAt: '2026-04-16T00:00:00.000Z'
version: '1.0.0'
contextNodes:
  - id: ctx-1
    name: Test Context
    type: core
flowNodes: []
componentNodes: []
`;
      const result = parseYAML(yaml);
      expect(result.success).toBe(true);
      expect(result.data?.contextNodes).toHaveLength(1);
    });

    it('should handle empty content', () => {
      const result = parseYAML('');
      expect(result.success).toBe(false);
      expect(result.error?.type).toBe('PARSE_ERROR');
    });

    it('should reject data without version', () => {
      const result = parseYAML('foo: bar');
      expect(result.success).toBe(false);
      expect(result.error?.type).toBe('VALIDATION_ERROR');
    });
  });

  describe('parseFile', () => {
    it('should detect JSON by extension', () => {
      const result = parseFile(JSON.stringify(validExportData), 'export.json');
      expect(result.success).toBe(true);
    });

    it('should detect YAML by extension', () => {
      const result = parseFile("version: '1.0.0'\nexportedAt: '2026-04-16'", 'export.yaml');
      expect(result.success).toBe(true);
    });

    it('should default to JSON for unknown extension', () => {
      const result = parseFile(JSON.stringify(validExportData), 'export.txt');
      expect(result.success).toBe(true);
    });
  });

  describe('roundTripTest', () => {
    it('should pass for valid export data', () => {
      const result = roundTripTest(validExportData);
      expect(result).toBe(true);
    });

    it('should handle empty trees', () => {
      const emptyData: CanvasExportData = {
        exportedAt: '2026-04-16T00:00:00.000Z',
        version: '1.0.0',
        contextNodes: [],
        flowNodes: [],
        componentNodes: [],
      };
      const result = roundTripTest(emptyData);
      expect(result).toBe(true);
    });

    it('should handle missing optional fields', () => {
      const minimal: CanvasExportData = {
        exportedAt: '2026-04-16T00:00:00.000Z',
        version: '1.0.0',
      };
      const result = roundTripTest(minimal);
      expect(result).toBe(true);
    });
  });
});
