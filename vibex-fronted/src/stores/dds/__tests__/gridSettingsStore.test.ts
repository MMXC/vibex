/**
 * gridSettingsStore Tests
 * S88-E1: Canvas Zoom & Navigation Enhancement
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { useGridSettingsStore, GRID_SIZES, type GridSize } from '../gridSettingsStore';

describe('gridSettingsStore', () => {
  beforeEach(() => {
    useGridSettingsStore.getState().setGridSize('medium');
  });

  describe('initial state', () => {
    it('defaults to medium grid', () => {
      expect(useGridSettingsStore.getState().gridSize).toBe('medium');
    });
  });

  describe('setGridSize', () => {
    it('sets grid size to small', () => {
      useGridSettingsStore.getState().setGridSize('small');
      expect(useGridSettingsStore.getState().gridSize).toBe('small');
    });

    it('sets grid size to large', () => {
      useGridSettingsStore.getState().setGridSize('large');
      expect(useGridSettingsStore.getState().gridSize).toBe('large');
    });

    it('sets grid size to none', () => {
      useGridSettingsStore.getState().setGridSize('none');
      expect(useGridSettingsStore.getState().gridSize).toBe('none');
    });
  });

  describe('cycleGridSize', () => {
    it('cycles from medium → small → large → none → medium', () => {
      const store = useGridSettingsStore.getState();

      store.setGridSize('medium');
      expect(store.gridSize).toBe('medium');

      store.cycleGridSize();
      expect(useGridSettingsStore.getState().gridSize).toBe('small');

      store.cycleGridSize();
      expect(useGridSettingsStore.getState().gridSize).toBe('large');

      store.cycleGridSize();
      expect(useGridSettingsStore.getState().gridSize).toBe('none');

      store.cycleGridSize();
      expect(useGridSettingsStore.getState().gridSize).toBe('medium');
    });
  });
});

describe('GRID_SIZES constant', () => {
  it('maps small to 10px', () => {
    expect(GRID_SIZES.small).toBe(10);
  });

  it('maps medium to 20px', () => {
    expect(GRID_SIZES.medium).toBe(20);
  });

  it('maps large to 40px', () => {
    expect(GRID_SIZES.large).toBe(40);
  });

  it('maps none to null', () => {
    expect(GRID_SIZES.none).toBeNull();
  });
});
