/**
 * viewPresetsStore.test.ts — Sprint66 E3: Canvas View Presets
 *
 * Tests for: savePreset, deletePreset, loadPreset, updatePreset, getPreset
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useViewPresetsStore, type ViewPresetSettings } from '../viewPresetsStore';

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

const DEFAULT_SETTINGS: ViewPresetSettings = {
  backgroundColor: '#ffffff',
  gridSize: 24,
  gridVariant: 'dots',
  defaultZoom: 1.0,
  snapToGrid: false,
};

describe('ViewPresetsStore', () => {
  beforeEach(() => {
    localStorageMock.clear();
    useViewPresetsStore.setState({
      presets: [],
      currentPresetId: null,
      isLoading: false,
    });
  });

  it('should have empty initial state', () => {
    const state = useViewPresetsStore.getState();
    expect(state.presets).toHaveLength(0);
    expect(state.currentPresetId).toBeNull();
    expect(state.isLoading).toBe(false);
  });

  describe('savePreset', () => {
    it('should save a new preset', () => {
      const { savePreset } = useViewPresetsStore.getState();
      const preset = savePreset('深色模式', {
        backgroundColor: '#1f2937',
        gridSize: 16,
        gridVariant: 'lines',
        defaultZoom: 0.75,
        snapToGrid: true,
      });

      expect(preset.name).toBe('深色模式');
      expect(preset.settings.backgroundColor).toBe('#1f2937');
      expect(preset.settings.gridSize).toBe(16);
      expect(preset.settings.gridVariant).toBe('lines');
      expect(preset.settings.defaultZoom).toBe(0.75);
      expect(preset.settings.snapToGrid).toBe(true);
      expect(preset.id).toMatch(/^preset-\d+-[a-z0-9]+$/);
      expect(preset.fitViewOnLoad).toBe(true);
      expect(preset.createdAt).toBeGreaterThan(0);
    });

    it('should fill default settings for partial input', () => {
      const { savePreset } = useViewPresetsStore.getState();
      const preset = savePreset('minimal', { backgroundColor: '#000' });

      expect(preset.settings.backgroundColor).toBe('#000');
      expect(preset.settings.gridSize).toBe(DEFAULT_SETTINGS.gridSize);
      expect(preset.settings.gridVariant).toBe(DEFAULT_SETTINGS.gridVariant);
      expect(preset.settings.defaultZoom).toBe(DEFAULT_SETTINGS.defaultZoom);
      expect(preset.settings.snapToGrid).toBe(DEFAULT_SETTINGS.snapToGrid);
    });

    it('should trim preset name', () => {
      const { savePreset } = useViewPresetsStore.getState();
      const preset = savePreset('  明亮主题  ', { backgroundColor: '#fff' });
      expect(preset.name).toBe('明亮主题');
    });

    it('should use fallback name for empty string', () => {
      const { savePreset } = useViewPresetsStore.getState();
      const preset = savePreset('', { backgroundColor: '#fff' });
      expect(preset.name).toBe('未命名预设');
    });

    it('should add preset to the list', () => {
      const { savePreset } = useViewPresetsStore.getState();
      savePreset('preset-a', { backgroundColor: '#aaa' });
      savePreset('preset-b', { backgroundColor: '#bbb' });
      savePreset('preset-c', { backgroundColor: '#ccc' });

      const { presets } = useViewPresetsStore.getState();
      expect(presets).toHaveLength(3);
      expect(presets[0].name).toBe('preset-a');
      expect(presets[1].name).toBe('preset-b');
      expect(presets[2].name).toBe('preset-c');
    });
  });

  describe('deletePreset', () => {
    it('should remove preset by id', () => {
      const { savePreset, deletePreset } = useViewPresetsStore.getState();
      const p1 = savePreset('p1', { backgroundColor: '#111' });
      const p2 = savePreset('p2', { backgroundColor: '#222' });

      deletePreset(p1.id);

      const { presets } = useViewPresetsStore.getState();
      expect(presets).toHaveLength(1);
      expect(presets[0].id).toBe(p2.id);
    });

    it('should clear currentPresetId when deleting active preset', () => {
      const { savePreset, deletePreset, loadPreset } = useViewPresetsStore.getState();
      const preset = savePreset('active', { backgroundColor: '#123' });
      loadPreset(preset.id);

      deletePreset(preset.id);

      const { currentPresetId } = useViewPresetsStore.getState();
      expect(currentPresetId).toBeNull();
    });

    it('should do nothing for non-existent id', () => {
      const { savePreset, deletePreset } = useViewPresetsStore.getState();
      savePreset('p1', { backgroundColor: '#111' });
      deletePreset('non-existent-id');

      const { presets } = useViewPresetsStore.getState();
      expect(presets).toHaveLength(1);
    });
  });

  describe('loadPreset', () => {
    it('should set currentPresetId and return preset', () => {
      const { savePreset, loadPreset } = useViewPresetsStore.getState();
      const preset = savePreset('test', { backgroundColor: '#abc' });

      const loaded = loadPreset(preset.id);

      expect(loaded).not.toBeNull();
      expect(loaded?.id).toBe(preset.id);
      expect(useViewPresetsStore.getState().currentPresetId).toBe(preset.id);
    });

    it('should return null for non-existent id', () => {
      const { loadPreset } = useViewPresetsStore.getState();
      const result = loadPreset('non-existent');
      expect(result).toBeNull();
    });

    it('should update currentPresetId when loading a different preset', () => {
      const { savePreset, loadPreset } = useViewPresetsStore.getState();
      const p1 = savePreset('p1', { backgroundColor: '#111' });
      const p2 = savePreset('p2', { backgroundColor: '#222' });

      loadPreset(p1.id);
      expect(useViewPresetsStore.getState().currentPresetId).toBe(p1.id);

      loadPreset(p2.id);
      expect(useViewPresetsStore.getState().currentPresetId).toBe(p2.id);
    });
  });

  describe('updatePreset', () => {
    it('should update preset name', () => {
      const { savePreset, updatePreset } = useViewPresetsStore.getState();
      const preset = savePreset('old-name', { backgroundColor: '#111' });

      const updated = updatePreset(preset.id, { name: 'new-name' });

      expect(updated).not.toBeNull();
      expect(updated?.name).toBe('new-name');
      expect(useViewPresetsStore.getState().presets[0].name).toBe('new-name');
    });

    it('should update preset settings', () => {
      const { savePreset, updatePreset } = useViewPresetsStore.getState();
      const preset = savePreset('test', { backgroundColor: '#111', gridSize: 24 });

      const updated = updatePreset(preset.id, {
        settings: { backgroundColor: '#222', gridSize: 32 },
      });

      expect(updated?.settings.backgroundColor).toBe('#222');
      expect(updated?.settings.gridSize).toBe(32);
      // Preserves other settings
      expect(updated?.settings.gridVariant).toBe('dots');
    });

    it('should update fitViewOnLoad', () => {
      const { savePreset, updatePreset } = useViewPresetsStore.getState();
      const preset = savePreset('test', { backgroundColor: '#111' });

      const updated = updatePreset(preset.id, { fitViewOnLoad: false });
      expect(updated?.fitViewOnLoad).toBe(false);
    });

    it('should return null for non-existent id', () => {
      const { updatePreset } = useViewPresetsStore.getState();
      const result = updatePreset('non-existent', { name: 'x' });
      expect(result).toBeNull();
    });

    it('should update updatedAt timestamp', () => {
      const { savePreset, updatePreset } = useViewPresetsStore.getState();
      const preset = savePreset('test', { backgroundColor: '#111' });
      const originalUpdatedAt = preset.updatedAt;

      // Small delay to ensure timestamp difference
      const updated = updatePreset(preset.id, { name: 'updated' });
      expect(updated!.updatedAt).toBeGreaterThanOrEqual(originalUpdatedAt);
    });
  });

  describe('getPreset', () => {
    it('should return preset by id', () => {
      const { savePreset, getPreset } = useViewPresetsStore.getState();
      const preset = savePreset('test', { backgroundColor: '#111' });

      const found = getPreset(preset.id);
      expect(found?.id).toBe(preset.id);
      expect(found?.name).toBe('test');
    });

    it('should return undefined for non-existent id', () => {
      const { getPreset } = useViewPresetsStore.getState();
      expect(getPreset('non-existent')).toBeUndefined();
    });
  });

  describe('$reset', () => {
    it('should clear all presets', () => {
      const { savePreset, $reset } = useViewPresetsStore.getState();
      savePreset('p1', { backgroundColor: '#111' });
      savePreset('p2', { backgroundColor: '#222' });

      $reset();

      const state = useViewPresetsStore.getState();
      expect(state.presets).toHaveLength(0);
      expect(state.currentPresetId).toBeNull();
    });
  });
});
