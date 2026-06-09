/**
 * settingsStore.e2-export-import.test.ts — S81-E2: Settings Import/Export Tests
 *
 * Tests: exportSettings() round-trip, importSettings() validation, edge cases
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { useSettingsStore, SETTINGS_VERSION } from '../settingsStore';

describe('settingsStore E2 — Settings Import/Export', () => {
  beforeEach(() => {
    useSettingsStore.getState().reset();
  });

  describe('exportSettings', () => {
    it('should return a valid JSON string', () => {
      const json = useSettingsStore.getState().exportSettings();
      expect(typeof json).toBe('string');
      const parsed = JSON.parse(json);
      expect(parsed).toBeTruthy();
    });

    it('should include correct version field', () => {
      const json = useSettingsStore.getState().exportSettings();
      const parsed = JSON.parse(json);
      expect(parsed.version).toBe(SETTINGS_VERSION);
    });

    it('should include exportedAt timestamp', () => {
      const before = Date.now();
      const json = useSettingsStore.getState().exportSettings();
      const after = Date.now();
      const parsed = JSON.parse(json);
      expect(typeof parsed.exportedAt).toBe('number');
      expect(parsed.exportedAt).toBeGreaterThanOrEqual(before);
      expect(parsed.exportedAt).toBeLessThanOrEqual(after);
    });

    it('should include all required data fields', () => {
      const json = useSettingsStore.getState().exportSettings();
      const parsed = JSON.parse(json);
      const d = parsed.data;
      expect(d).toHaveProperty('backgroundColor');
      expect(d).toHaveProperty('gridSize');
      expect(d).toHaveProperty('gridVariant');
      expect(d).toHaveProperty('defaultZoom');
      expect(d).toHaveProperty('snapToGrid');
      expect(d).toHaveProperty('canvasPresets');
      expect(d).toHaveProperty('activePresetId');
      expect(d).toHaveProperty('canvasBackground');
      expect(d).toHaveProperty('dprMode');
    });

    it('should export current state values', () => {
      useSettingsStore.getState().setBackgroundColor('#ff0000');
      useSettingsStore.getState().setGridSize(32);
      useSettingsStore.getState().setGridVariant('lines');
      useSettingsStore.getState().setDprMode('2x');
      const json = useSettingsStore.getState().exportSettings();
      const parsed = JSON.parse(json);
      expect(parsed.data.backgroundColor).toBe('#ff0000');
      expect(parsed.data.gridSize).toBe(32);
      expect(parsed.data.gridVariant).toBe('lines');
      expect(parsed.data.dprMode).toBe('2x');
    });
  });

  describe('importSettings — valid inputs', () => {
    it('should import valid settings and update state', () => {
      // First set non-default values
      useSettingsStore.getState().setBackgroundColor('#ff0000');
      useSettingsStore.getState().setGridSize(16);
      const json = useSettingsStore.getState().exportSettings();
      // Reset to defaults
      useSettingsStore.getState().reset();
      // Import
      const result = useSettingsStore.getState().importSettings(json);
      expect(result).toBe(true);
      expect(useSettingsStore.getState().backgroundColor).toBe('#ff0000');
      expect(useSettingsStore.getState().gridSize).toBe(16);
    });

    it('should handle minimal valid export JSON', () => {
      const minimal = JSON.stringify({
        version: SETTINGS_VERSION,
        exportedAt: Date.now(),
        data: {
          backgroundColor: '#000000',
          gridSize: 24,
          gridVariant: 'dots',
          defaultZoom: 1.0,
          snapToGrid: true,
          canvasPresets: [],
          activePresetId: null,
          canvasBackground: { variant: 'dots', gap: 24, size: 1, color: '#e5e7eb' },
          dprMode: 'auto',
        },
      });
      const result = useSettingsStore.getState().importSettings(minimal);
      expect(result).toBe(true);
      expect(useSettingsStore.getState().backgroundColor).toBe('#000000');
    });
  });

  describe('importSettings — invalid JSON string', () => {
    it('should return false for malformed JSON', () => {
      expect(useSettingsStore.getState().importSettings('{ invalid json }')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(useSettingsStore.getState().importSettings('')).toBe(false);
    });

    it('should return false for plain text', () => {
      expect(useSettingsStore.getState().importSettings('not a settings file')).toBe(false);
    });

    it('should return false for null', () => {
      expect(useSettingsStore.getState().importSettings('null')).toBe(false);
    });
  });

  describe('importSettings — version mismatch', () => {
    it('should return false when version is wrong', () => {
      const wrongVersion = JSON.stringify({
        version: '99.0.0',
        exportedAt: Date.now(),
        data: {
          backgroundColor: '#ffffff',
          gridSize: 24,
          gridVariant: 'dots',
          defaultZoom: 1.0,
          snapToGrid: false,
          canvasPresets: [],
          activePresetId: null,
          canvasBackground: { variant: 'dots', gap: 24, size: 1, color: '#e5e7eb' },
          dprMode: 'auto',
        },
      });
      expect(useSettingsStore.getState().importSettings(wrongVersion)).toBe(false);
    });
  });

  describe('importSettings — field validation', () => {
    it('should reject invalid backgroundColor (no # prefix)', () => {
      const bad = JSON.stringify({
        version: SETTINGS_VERSION,
        exportedAt: Date.now(),
        data: {
          backgroundColor: 'ffffff', // missing #
          gridSize: 24,
          gridVariant: 'dots',
          defaultZoom: 1.0,
          snapToGrid: false,
          canvasPresets: [],
          activePresetId: null,
          canvasBackground: { variant: 'dots', gap: 24, size: 1, color: '#e5e7eb' },
          dprMode: 'auto',
        },
      });
      expect(useSettingsStore.getState().importSettings(bad)).toBe(false);
    });

    it('should reject invalid gridSize (not in VALID_GRID_SIZES)', () => {
      const bad = JSON.stringify({
        version: SETTINGS_VERSION,
        exportedAt: Date.now(),
        data: {
          backgroundColor: '#ffffff',
          gridSize: 20, // not valid
          gridVariant: 'dots',
          defaultZoom: 1.0,
          snapToGrid: false,
          canvasPresets: [],
          activePresetId: null,
          canvasBackground: { variant: 'dots', gap: 24, size: 1, color: '#e5e7eb' },
          dprMode: 'auto',
        },
      });
      expect(useSettingsStore.getState().importSettings(bad)).toBe(false);
    });

    it('should reject invalid gridVariant', () => {
      const bad = JSON.stringify({
        version: SETTINGS_VERSION,
        exportedAt: Date.now(),
        data: {
          backgroundColor: '#ffffff',
          gridSize: 24,
          gridVariant: 'hexagons', // not valid
          defaultZoom: 1.0,
          snapToGrid: false,
          canvasPresets: [],
          activePresetId: null,
          canvasBackground: { variant: 'dots', gap: 24, size: 1, color: '#e5e7eb' },
          dprMode: 'auto',
        },
      });
      expect(useSettingsStore.getState().importSettings(bad)).toBe(false);
    });

    it('should reject invalid defaultZoom', () => {
      const bad = JSON.stringify({
        version: SETTINGS_VERSION,
        exportedAt: Date.now(),
        data: {
          backgroundColor: '#ffffff',
          gridSize: 24,
          gridVariant: 'dots',
          defaultZoom: 3.0, // not in VALID_ZOOM_VALUES
          snapToGrid: false,
          canvasPresets: [],
          activePresetId: null,
          canvasBackground: { variant: 'dots', gap: 24, size: 1, color: '#e5e7eb' },
          dprMode: 'auto',
        },
      });
      expect(useSettingsStore.getState().importSettings(bad)).toBe(false);
    });
  });

  describe('importSettings — edge cases', () => {
    it('should handle missing optional canvasPresets', () => {
      const minimal = JSON.stringify({
        version: SETTINGS_VERSION,
        exportedAt: Date.now(),
        data: {
          backgroundColor: '#ffffff',
          gridSize: 24,
          gridVariant: 'dots',
          defaultZoom: 1.0,
          snapToGrid: false,
          // canvasPresets omitted
          activePresetId: null,
          canvasBackground: { variant: 'dots', gap: 24, size: 1, color: '#e5e7eb' },
          dprMode: 'auto',
        },
      });
      const result = useSettingsStore.getState().importSettings(minimal);
      expect(result).toBe(true);
      expect(useSettingsStore.getState().canvasPresets).toEqual([]);
    });

    it('should use defaults for invalid canvasBackground', () => {
      const badBg = JSON.stringify({
        version: SETTINGS_VERSION,
        exportedAt: Date.now(),
        data: {
          backgroundColor: '#ffffff',
          gridSize: 24,
          gridVariant: 'dots',
          defaultZoom: 1.0,
          snapToGrid: false,
          canvasPresets: [],
          activePresetId: null,
          canvasBackground: { variant: 'invalid', gap: 24, size: 1, color: '#e5e7eb' },
          dprMode: 'auto',
        },
      });
      const result = useSettingsStore.getState().importSettings(badBg);
      expect(result).toBe(true);
      // Should still import successfully (invalid canvasBackground defaults)
      expect(useSettingsStore.getState().backgroundColor).toBe('#ffffff');
    });

    it('should use defaults for invalid dprMode', () => {
      const badDpr = JSON.stringify({
        version: SETTINGS_VERSION,
        exportedAt: Date.now(),
        data: {
          backgroundColor: '#ffffff',
          gridSize: 24,
          gridVariant: 'dots',
          defaultZoom: 1.0,
          snapToGrid: false,
          canvasPresets: [],
          activePresetId: null,
          canvasBackground: { variant: 'dots', gap: 24, size: 1, color: '#e5e7eb' },
          dprMode: '3x', // invalid
        },
      });
      const result = useSettingsStore.getState().importSettings(badDpr);
      expect(result).toBe(true);
      expect(useSettingsStore.getState().dprMode).toBe('auto');
    });
  });

  describe('round-trip', () => {
    it('should produce identical state after export then import', () => {
      useSettingsStore.getState().setBackgroundColor('#aabbcc');
      useSettingsStore.getState().setGridSize(32);
      useSettingsStore.getState().setGridVariant('lines');
      useSettingsStore.getState().setDefaultZoom(0.75);
      useSettingsStore.getState().setSnapToGrid(true);
      useSettingsStore.getState().setDprMode('1x');

      const json = useSettingsStore.getState().exportSettings();
      useSettingsStore.getState().reset();
      useSettingsStore.getState().importSettings(json);

      const state = useSettingsStore.getState();
      expect(state.backgroundColor).toBe('#aabbcc');
      expect(state.gridSize).toBe(32);
      expect(state.gridVariant).toBe('lines');
      expect(state.defaultZoom).toBe(0.75);
      expect(state.snapToGrid).toBe(true);
      expect(state.dprMode).toBe('1x');
    });
  });
});
