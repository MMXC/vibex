/**
 * settingsStore.test.ts — S69-E5: Canvas View Presets
 *
 * Tests for: saveAsPreset, applyPreset, deletePreset, renamePreset,
 * getPreset, getActivePreset, $presetsReset, and activePresetId tracking.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useSettingsStore, type CanvasSettings } from '../dds/settingsStore';

// Mock localStorage for Zustand persist middleware
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

const DARK_SETTINGS: CanvasSettings = {
  backgroundColor: '#1f2937',
  gridSize: 16,
  gridVariant: 'lines',
  defaultZoom: 0.75,
  snapToGrid: true,
};

const LIGHT_SETTINGS: CanvasSettings = {
  backgroundColor: '#ffffff',
  gridSize: 24,
  gridVariant: 'dots',
  defaultZoom: 1.0,
  snapToGrid: false,
};

describe('SettingsStore — E5 Canvas Presets', () => {
  beforeEach(() => {
    localStorageMock.clear();
    useSettingsStore.setState({
      backgroundColor: '#ffffff',
      gridSize: 24,
      gridVariant: 'dots',
      defaultZoom: 1.0,
      snapToGrid: false,
      canvasPresets: [],
      activePresetId: null,
    });
  });

  describe('saveAsPreset', () => {
    it('should save a preset and return an id', () => {
      const { saveAsPreset } = useSettingsStore.getState();
      const id = saveAsPreset('深色模式', DARK_SETTINGS);

      expect(id).toMatch(/^preset-\d+-[a-z0-9]+$/);
      const state = useSettingsStore.getState();
      expect(state.canvasPresets).toHaveLength(1);
      expect(state.canvasPresets[0].name).toBe('深色模式');
      expect(state.canvasPresets[0].settings.backgroundColor).toBe('#1f2937');
      expect(state.canvasPresets[0].settings.gridSize).toBe(16);
    });

    it('should fill defaults for partial settings', () => {
      const { saveAsPreset } = useSettingsStore.getState();
      const id = saveAsPreset('minimal', { backgroundColor: '#000000' });

      const preset = useSettingsStore.getState().canvasPresets.find((p) => p.id === id);
      expect(preset!.settings.backgroundColor).toBe('#000000');
      expect(preset!.settings.gridSize).toBe(24); // default
      expect(preset!.settings.gridVariant).toBe('dots'); // default
    });

    it('should trim preset name', () => {
      const { saveAsPreset } = useSettingsStore.getState();
      saveAsPreset('  演示模式  ', LIGHT_SETTINGS);

      const preset = useSettingsStore.getState().canvasPresets[0];
      expect(preset.name).toBe('演示模式');
    });

    it('should allow saving multiple presets', () => {
      const { saveAsPreset } = useSettingsStore.getState();
      saveAsPreset('preset-a', LIGHT_SETTINGS);
      saveAsPreset('preset-b', DARK_SETTINGS);

      expect(useSettingsStore.getState().canvasPresets).toHaveLength(2);
    });
  });

  describe('applyPreset', () => {
    it('should apply preset settings and set activePresetId', () => {
      const { saveAsPreset, applyPreset } = useSettingsStore.getState();
      const id = saveAsPreset('dark', DARK_SETTINGS);

      applyPreset(id);

      const state = useSettingsStore.getState();
      expect(state.backgroundColor).toBe('#1f2937');
      expect(state.gridSize).toBe(16);
      expect(state.gridVariant).toBe('lines');
      expect(state.defaultZoom).toBe(0.75);
      expect(state.snapToGrid).toBe(true);
      expect(state.activePresetId).toBe(id);
    });

    it('should do nothing for unknown preset id', () => {
      const { applyPreset } = useSettingsStore.getState();
      const stateBefore = useSettingsStore.getState();
      applyPreset('non-existent-id');

      const stateAfter = useSettingsStore.getState();
      expect(stateAfter.backgroundColor).toBe(stateBefore.backgroundColor);
      expect(stateAfter.activePresetId).toBeNull();
    });
  });

  describe('deletePreset', () => {
    it('should delete a preset', () => {
      const { saveAsPreset, deletePreset } = useSettingsStore.getState();
      const id = saveAsPreset('temp', LIGHT_SETTINGS);
      expect(useSettingsStore.getState().canvasPresets).toHaveLength(1);

      deletePreset(id);

      expect(useSettingsStore.getState().canvasPresets).toHaveLength(0);
    });

    it('should clear activePresetId if deleted preset was active', () => {
      const { saveAsPreset, applyPreset, deletePreset } = useSettingsStore.getState();
      const id = saveAsPreset('to-delete', DARK_SETTINGS);
      applyPreset(id);
      expect(useSettingsStore.getState().activePresetId).toBe(id);

      deletePreset(id);

      expect(useSettingsStore.getState().activePresetId).toBeNull();
    });

    it('should not affect activePresetId if deleted preset was not active', () => {
      const { saveAsPreset, applyPreset, deletePreset } = useSettingsStore.getState();
      const id1 = saveAsPreset('first', LIGHT_SETTINGS);
      const id2 = saveAsPreset('second', DARK_SETTINGS);
      applyPreset(id1);
      expect(useSettingsStore.getState().activePresetId).toBe(id1);

      deletePreset(id2);

      expect(useSettingsStore.getState().activePresetId).toBe(id1);
    });
  });

  describe('renamePreset', () => {
    it('should rename a preset', () => {
      const { saveAsPreset, renamePreset } = useSettingsStore.getState();
      const id = saveAsPreset('old-name', LIGHT_SETTINGS);
      const before = useSettingsStore.getState().canvasPresets[0].updatedAt;

      // Wait a tiny bit so updatedAt differs
      renamePreset(id, 'new-name');

      const preset = useSettingsStore.getState().canvasPresets[0];
      expect(preset.name).toBe('new-name');
      expect(preset.updatedAt).toBeGreaterThanOrEqual(before);
    });

    it('should trim new name', () => {
      const { saveAsPreset, renamePreset } = useSettingsStore.getState();
      const id = saveAsPreset('original', LIGHT_SETTINGS);

      renamePreset(id, '  trimmed  ');

      expect(useSettingsStore.getState().canvasPresets[0].name).toBe('trimmed');
    });
  });

  describe('getPreset / getActivePreset', () => {
    it('should get a preset by id', () => {
      const { saveAsPreset, getPreset } = useSettingsStore.getState();
      const id = saveAsPreset('test', DARK_SETTINGS);

      const preset = getPreset(id);

      expect(preset).toBeDefined();
      expect(preset!.name).toBe('test');
    });

    it('should return undefined for unknown id', () => {
      const { getPreset } = useSettingsStore.getState();
      expect(getPreset('unknown')).toBeUndefined();
    });

    it('should get the active preset', () => {
      const { saveAsPreset, applyPreset, getActivePreset } = useSettingsStore.getState();
      const id = saveAsPreset('active', LIGHT_SETTINGS);
      applyPreset(id);

      const active = getActivePreset();
      expect(active).toBeDefined();
      expect(active!.id).toBe(id);
    });

    it('should return undefined for getActivePreset when none active', () => {
      const { getActivePreset } = useSettingsStore.getState();
      expect(getActivePreset()).toBeUndefined();
    });
  });

  describe('activePresetId tracking', () => {
    it('should clear activePresetId when settings are manually changed', () => {
      const { saveAsPreset, applyPreset, setBackgroundColor } = useSettingsStore.getState();
      const id = saveAsPreset('my-preset', DARK_SETTINGS);
      applyPreset(id);
      expect(useSettingsStore.getState().activePresetId).toBe(id);

      setBackgroundColor('#cccccc');

      expect(useSettingsStore.getState().activePresetId).toBeNull();
    });
  });

  describe('$presetsReset', () => {
    it('should reset presets state only', () => {
      const { saveAsPreset, applyPreset, $presetsReset } = useSettingsStore.getState();
      saveAsPreset('p1', DARK_SETTINGS);
      saveAsPreset('p2', LIGHT_SETTINGS);
      applyPreset(useSettingsStore.getState().canvasPresets[0].id);

      $presetsReset();

      const state = useSettingsStore.getState();
      expect(state.canvasPresets).toHaveLength(0);
      expect(state.activePresetId).toBeNull();
      // Settings should be preserved
      expect(state.backgroundColor).toBe('#1f2937');
    });
  });
});
