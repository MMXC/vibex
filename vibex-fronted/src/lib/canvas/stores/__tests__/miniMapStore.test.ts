/**
 * miniMapStore unit tests — P005-E3
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { useMiniMapStore } from '../miniMapStore';

describe('useMiniMapStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useMiniMapStore.setState({
      panelOpen: false,
      viewport: { x: 0, y: 0, zoom: 1 },
    });
  });

  it('initializes with panel closed and default viewport', () => {
    const state = useMiniMapStore.getState();
    expect(state.panelOpen).toBe(false);
    expect(state.viewport).toEqual({ x: 0, y: 0, zoom: 1 });
  });

  it('togglePanel flips panelOpen state', () => {
    const { togglePanel } = useMiniMapStore.getState();
    expect(useMiniMapStore.getState().panelOpen).toBe(false);

    togglePanel();
    expect(useMiniMapStore.getState().panelOpen).toBe(true);

    togglePanel();
    expect(useMiniMapStore.getState().panelOpen).toBe(false);
  });

  it('setPanelOpen sets panel to specific value', () => {
    const { setPanelOpen } = useMiniMapStore.getState();

    setPanelOpen(true);
    expect(useMiniMapStore.getState().panelOpen).toBe(true);

    setPanelOpen(false);
    expect(useMiniMapStore.getState().panelOpen).toBe(false);
  });

  it('setViewport updates viewport state', () => {
    const { setViewport } = useMiniMapStore.getState();

    const newViewport = { x: -100, y: -200, zoom: 0.5 };
    setViewport(newViewport);

    expect(useMiniMapStore.getState().viewport).toEqual(newViewport);
  });

  it('setViewport does not affect panelOpen', () => {
    const { setPanelOpen, setViewport } = useMiniMapStore.getState();

    setPanelOpen(true);
    expect(useMiniMapStore.getState().panelOpen).toBe(true);

    setViewport({ x: 50, y: 50, zoom: 2 });
    expect(useMiniMapStore.getState().panelOpen).toBe(true); // unchanged
  });
});
