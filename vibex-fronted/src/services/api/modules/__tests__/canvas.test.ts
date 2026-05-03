/**
 * Canvas API Module Tests
 * Wraps canvasApi from @/lib/canvas/api/canvasApi for the api/modules/__tests__ convention.
 *
 * The canonical tests are in src/lib/canvas/api/__tests__/canvasApi.test.ts.
 * This file ensures the api/modules/__tests__/ convention is satisfied per IMPLEMENTATION_PLAN.md T4.3.
 */

import { canvasApi } from '@/lib/canvas/api/canvasApi';

describe('CanvasApi (api/modules/canvas)', () => {
  describe('interface completeness', () => {
    it('should have createProject', () => {
      expect(typeof canvasApi.createProject).toBe('function');
    });

    it('should have generate', () => {
      expect(typeof canvasApi.generate).toBe('function');
    });

    it('should have getStatus', () => {
      expect(typeof canvasApi.getStatus).toBe('function');
    });

    it('should have generateContexts', () => {
      expect(typeof canvasApi.generateContexts).toBe('function');
    });

    it('should have generateFlows', () => {
      expect(typeof canvasApi.generateFlows).toBe('function');
    });

    it('should have generateComponents', () => {
      expect(typeof canvasApi.generateComponents).toBe('function');
    });

    it('should have fetchComponentTree', () => {
      expect(typeof canvasApi.fetchComponentTree).toBe('function');
    });

    it('should have createSnapshot', () => {
      expect(typeof canvasApi.createSnapshot).toBe('function');
    });

    it('should have listSnapshots', () => {
      expect(typeof canvasApi.listSnapshots).toBe('function');
    });

    it('should have getSnapshot', () => {
      expect(typeof canvasApi.getSnapshot).toBe('function');
    });

    it('should have restoreSnapshot', () => {
      expect(typeof canvasApi.restoreSnapshot).toBe('function');
    });

    it('should have getLatestVersion', () => {
      expect(typeof canvasApi.getLatestVersion).toBe('function');
    });
  });
});