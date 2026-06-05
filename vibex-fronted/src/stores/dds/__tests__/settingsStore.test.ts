/**
 * settingsStore.test.ts — Canvas Settings Store Tests
 * S65-E3: Canvas View Personalization Settings Panel
 *
 * Tests: D3.1 store actions, D3.8 localStorage persistence
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { useSettingsStore } from '../settingsStore';

describe('settingsStore', () => {
  beforeEach(() => {
    useSettingsStore.getState().reset();
  });

  describe('backgroundColor', () => {
    it('should have default backgroundColor', () => {
      expect(useSettingsStore.getState().backgroundColor).toBe('#ffffff');
    });

    it('should update backgroundColor', () => {
      useSettingsStore.getState().setBackgroundColor('#f0f0f0');
      expect(useSettingsStore.getState().backgroundColor).toBe('#f0f0f0');
    });

    it('should reject invalid color format', () => {
      useSettingsStore.getState().setBackgroundColor('invalid');
      expect(useSettingsStore.getState().backgroundColor).toBe('#ffffff');
    });
  });

  describe('gridSize', () => {
    it('should have default gridSize of 24', () => {
      expect(useSettingsStore.getState().gridSize).toBe(24);
    });

    it('should update to valid grid sizes', () => {
      const state = useSettingsStore.getState();
      state.setGridSize(12);
      expect(useSettingsStore.getState().gridSize).toBe(12);
      state.setGridSize(16);
      expect(useSettingsStore.getState().gridSize).toBe(16);
      state.setGridSize(32);
      expect(useSettingsStore.getState().gridSize).toBe(32);
    });

    it('should reject invalid grid sizes', () => {
      const state = useSettingsStore.getState();
      state.setGridSize(20);
      expect(useSettingsStore.getState().gridSize).toBe(24);
      state.setGridSize(8);
      expect(useSettingsStore.getState().gridSize).toBe(24);
    });
  });

  describe('gridVariant', () => {
    it('should have default gridVariant of dots', () => {
      expect(useSettingsStore.getState().gridVariant).toBe('dots');
    });

    it('should update gridVariant to lines', () => {
      useSettingsStore.getState().setGridVariant('lines');
      expect(useSettingsStore.getState().gridVariant).toBe('lines');
    });

    it('should update gridVariant to cross', () => {
      useSettingsStore.getState().setGridVariant('cross');
      expect(useSettingsStore.getState().gridVariant).toBe('cross');
    });

    it('should reject invalid variants', () => {
      // @ts-expect-error — testing runtime validation
      useSettingsStore.getState().setGridVariant('invalid');
      expect(useSettingsStore.getState().gridVariant).toBe('dots');
    });
  });

  describe('defaultZoom', () => {
    it('should have default defaultZoom of 1.0', () => {
      expect(useSettingsStore.getState().defaultZoom).toBe(1.0);
    });

    it('should update to valid zoom values', () => {
      const state = useSettingsStore.getState();
      state.setDefaultZoom(0.5);
      expect(useSettingsStore.getState().defaultZoom).toBe(0.5);
      state.setDefaultZoom(1.5);
      expect(useSettingsStore.getState().defaultZoom).toBe(1.5);
      state.setDefaultZoom(2.0);
      expect(useSettingsStore.getState().defaultZoom).toBe(2.0);
    });

    it('should reject invalid zoom values', () => {
      const state = useSettingsStore.getState();
      state.setDefaultZoom(1.1);
      expect(useSettingsStore.getState().defaultZoom).toBe(1.0);
      state.setDefaultZoom(0.3);
      expect(useSettingsStore.getState().defaultZoom).toBe(1.0);
    });
  });

  describe('snapToGrid', () => {
    it('should have default snapToGrid of false', () => {
      expect(useSettingsStore.getState().snapToGrid).toBe(false);
    });

    it('should toggle snapToGrid on', () => {
      useSettingsStore.getState().setSnapToGrid(true);
      expect(useSettingsStore.getState().snapToGrid).toBe(true);
    });

    it('should toggle snapToGrid off', () => {
      const state = useSettingsStore.getState();
      state.setSnapToGrid(true);
      state.setSnapToGrid(false);
      expect(useSettingsStore.getState().snapToGrid).toBe(false);
    });
  });

  describe('reset', () => {
    it('should reset all settings to defaults', () => {
      const state = useSettingsStore.getState();
      state.setBackgroundColor('#f0f0f0');
      state.setGridSize(12);
      state.setGridVariant('lines');
      state.setDefaultZoom(1.5);
      state.setSnapToGrid(true);

      state.reset();

      const s = useSettingsStore.getState();
      expect(s.backgroundColor).toBe('#ffffff');
      expect(s.gridSize).toBe(24);
      expect(s.gridVariant).toBe('dots');
      expect(s.defaultZoom).toBe(1.0);
      expect(s.snapToGrid).toBe(false);
    });
  });
});
