/**
 * canvasExportStore.test.ts — Vitest tests for canvasExportStore
 * S87-E4: Canvas Export Enhancement
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useCanvasExportStore } from '../canvasExportStore';

describe('canvasExportStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useCanvasExportStore.setState({
      isExporting: false,
      loadingFormat: null,
      exportScale: 2,
      exportError: null,
    });
  });

  describe('initial state', () => {
    it('has correct initial values', () => {
      const state = useCanvasExportStore.getState();
      expect(state.isExporting).toBe(false);
      expect(state.loadingFormat).toBe(null);
      expect(state.exportScale).toBe(2);
      expect(state.exportError).toBe(null);
    });
  });

  describe('setExporting', () => {
    it('sets isExporting true and loadingFormat when format is provided', () => {
      const { setExporting } = useCanvasExportStore.getState();
      setExporting('PNG');
      const state = useCanvasExportStore.getState();
      expect(state.isExporting).toBe(true);
      expect(state.loadingFormat).toBe('PNG');
      expect(state.exportError).toBe(null);
    });

    it('sets isExporting false and loadingFormat null when null is provided', () => {
      const { setExporting } = useCanvasExportStore.getState();
      setExporting('PDF');
      setExporting(null);
      const state = useCanvasExportStore.getState();
      expect(state.isExporting).toBe(false);
      expect(state.loadingFormat).toBe(null);
    });

    it('clears previous error when starting new export', () => {
      const { setExporting, setExportError } = useCanvasExportStore.getState();
      setExportError('Previous error');
      setExporting('JSON');
      const state = useCanvasExportStore.getState();
      expect(state.exportError).toBe(null);
      expect(state.isExporting).toBe(true);
    });

    it('supports all export formats', () => {
      const { setExporting } = useCanvasExportStore.getState();
      const formats = ['JSON', 'Vibex', 'PDF', 'PNG', 'SVG', 'Figma', 'MultiFormat'] as const;
      for (const format of formats) {
        setExporting(format);
        expect(useCanvasExportStore.getState().loadingFormat).toBe(format);
        expect(useCanvasExportStore.getState().isExporting).toBe(true);
        setExporting(null);
      }
    });
  });

  describe('setExportScale', () => {
    it('sets export scale to 1', () => {
      const { setExportScale } = useCanvasExportStore.getState();
      setExportScale(1);
      expect(useCanvasExportStore.getState().exportScale).toBe(1);
    });

    it('sets export scale to 2', () => {
      const { setExportScale } = useCanvasExportStore.getState();
      setExportScale(2);
      expect(useCanvasExportStore.getState().exportScale).toBe(2);
    });

    it('sets export scale to 3', () => {
      const { setExportScale } = useCanvasExportStore.getState();
      setExportScale(3);
      expect(useCanvasExportStore.getState().exportScale).toBe(3);
    });
  });

  describe('setExportError', () => {
    it('sets error and resets exporting state', () => {
      const { setExporting, setExportError } = useCanvasExportStore.getState();
      setExporting('PNG');
      setExportError('Canvas element not found');
      const state = useCanvasExportStore.getState();
      expect(state.exportError).toBe('Canvas element not found');
      expect(state.isExporting).toBe(false);
      expect(state.loadingFormat).toBe(null);
    });

    it('accepts null to clear error', () => {
      const { setExportError } = useCanvasExportStore.getState();
      setExportError('Some error');
      setExportError(null);
      expect(useCanvasExportStore.getState().exportError).toBe(null);
    });
  });

  describe('resetExportState', () => {
    it('resets all state to initial values', () => {
      const { setExporting, setExportScale, setExportError } = useCanvasExportStore.getState();
      setExporting('PDF');
      setExportScale(3);
      setExportError('Some error');

      useCanvasExportStore.getState().resetExportState();

      const state = useCanvasExportStore.getState();
      expect(state.isExporting).toBe(false);
      expect(state.loadingFormat).toBe(null);
      expect(state.exportScale).toBe(2);
      expect(state.exportError).toBe(null);
    });

    it('can be called on already-reset state without issues', () => {
      expect(() => useCanvasExportStore.getState().resetExportState()).not.toThrow();
    });
  });

  describe('store persistence', () => {
    it('changes persist across multiple getState() calls', () => {
      const { setExporting, setExportScale } = useCanvasExportStore.getState();
      setExporting('JSON');
      setExportScale(3);

      const state1 = useCanvasExportStore.getState();
      const state2 = useCanvasExportStore.getState();

      expect(state1.isExporting).toBe(true);
      expect(state2.isExporting).toBe(true);
      expect(state1.exportScale).toBe(3);
      expect(state2.exportScale).toBe(3);
    });

    it('state is isolated from concurrent exports', () => {
      const { setExporting } = useCanvasExportStore.getState();

      setExporting('PNG');
      expect(useCanvasExportStore.getState().loadingFormat).toBe('PNG');

      setExporting('PDF');
      const state = useCanvasExportStore.getState();
      // The second call replaces the first — only the latest format is tracked
      expect(state.loadingFormat).toBe('PDF');
      expect(state.isExporting).toBe(true);
    });
  });
});
