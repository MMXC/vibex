/**
 * useAISuggestions — S89-E2 tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAISuggestions } from '../useAISuggestions';
import { useDDSCanvasStore } from '@/stores/dds/DDSCanvasStore';

// Mock DDSCanvasStore with setState
const mockStore = {
  chapters: {
    requirement: { cards: [], edges: [], loading: false, error: null },
    context: { cards: [], edges: [], loading: false, error: null },
    flow: { cards: [], edges: [], loading: false, error: null },
    api: { cards: [], edges: [], loading: false, error: null },
    'business-rules': { cards: [], edges: [], loading: false, error: null },
  },
  setChapters: vi.fn(),
  setState: vi.fn((updater) => {
    if (typeof updater === 'function') {
      Object.assign(mockStore, updater(mockStore));
    } else {
      Object.assign(mockStore, updater);
    }
  }),
};

vi.mock('@/stores/dds/DDSCanvasStore', () => ({
  useDDSCanvasStore: vi.fn((selector?) => {
    if (typeof selector === 'function') return selector(mockStore);
    return mockStore;
  }),
}));

describe('useAISuggestions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset to empty canvas
    mockStore.chapters = {
      requirement: { cards: [], edges: [], loading: false, error: null },
      context: { cards: [], edges: [], loading: false, error: null },
      flow: { cards: [], edges: [], loading: false, error: null },
      api: { cards: [], edges: [], loading: false, error: null },
      'business-rules': { cards: [], edges: [], loading: false, error: null },
    };
  });

  it('returns empty stats for empty canvas', () => {
    const { result } = renderHook(() => useAISuggestions());
    expect(result.current.stats?.totalNodes).toBe(0);
    expect(result.current.stats?.totalEdges).toBe(0);
    expect(result.current.suggestions).toHaveLength(0);
  });

  it('generates grouping suggestion for > 50 nodes', () => {
    mockStore.chapters = {
      requirement: { cards: Array(51).fill(null).map((_, i) => ({ id: `n${i}` })), edges: [], loading: false, error: null },
      context: { cards: [], edges: [], loading: false, error: null },
      flow: { cards: [], edges: [], loading: false, error: null },
      api: { cards: [], edges: [], loading: false, error: null },
      'business-rules': { cards: [], edges: [], loading: false, error: null },
    };
    const { result } = renderHook(() => useAISuggestions());
    expect(result.current.stats?.totalNodes).toBe(51);
    const grouping = result.current.suggestions.find((sg) => sg.type === 'structure');
    expect(grouping).toBeDefined();
  });

  it('generates connection suggestion when chapter has cards but no edges', () => {
    mockStore.chapters = {
      requirement: { cards: [{ id: 'card-1' }], edges: [], loading: false, error: null },
      context: { cards: [], edges: [], loading: false, error: null },
      flow: { cards: [], edges: [], loading: false, error: null },
      api: { cards: [], edges: [], loading: false, error: null },
      'business-rules': { cards: [], edges: [], loading: false, error: null },
    };
    const { result } = renderHook(() => useAISuggestions());
    const connection = result.current.suggestions.find((sg) => sg.type === 'connection');
    expect(connection).toBeDefined();
  });

  it('limits suggestions to 3', () => {
    mockStore.chapters = {
      requirement: { cards: Array(55).fill(null).map((_, i) => ({ id: `n${i}` })), edges: [], loading: false, error: null },
      context: { cards: [{ id: 'card-1' }], edges: [], loading: false, error: null },
      flow: { cards: [{ id: 'card-2' }], edges: [], loading: false, error: null },
      api: { cards: [{ id: 'card-3' }], edges: [], loading: false, error: null },
      'business-rules': { cards: [], edges: [], loading: false, error: null },
    };
    const { result } = renderHook(() => useAISuggestions());
    expect(result.current.suggestions.length).toBeLessThanOrEqual(3);
  });

  it('all suggestions have pending status initially', () => {
    mockStore.chapters = {
      requirement: { cards: [{ id: 'card-1' }], edges: [], loading: false, error: null },
      context: { cards: [], edges: [], loading: false, error: null },
      flow: { cards: [], edges: [], loading: false, error: null },
      api: { cards: [], edges: [], loading: false, error: null },
      'business-rules': { cards: [], edges: [], loading: false, error: null },
    };
    const { result } = renderHook(() => useAISuggestions());
    result.current.suggestions.forEach((sg) => {
      expect(sg.status).toBe('pending');
    });
  });

  it('generates chapter diversity suggestion when only one chapter type is used', () => {
    mockStore.chapters = {
      requirement: { cards: [{ id: 'card-1' }, { id: 'card-2' }, { id: 'card-3' }, { id: 'card-4' }, { id: 'card-5' }, { id: 'card-6' }], edges: [], loading: false, error: null },
      context: { cards: [], edges: [], loading: false, error: null },
      flow: { cards: [], edges: [], loading: false, error: null },
      api: { cards: [], edges: [], loading: false, error: null },
      'business-rules': { cards: [], edges: [], loading: false, error: null },
    };
    const { result } = renderHook(() => useAISuggestions());
    const diversity = result.current.suggestions.find((sg) => sg.title.includes('chapter types'));
    expect(diversity).toBeDefined();
  });
});
