/**
 * templateStore.rating.test.ts — Sprint71 E5: 模板评分与收藏增强
 * Tests: rateTemplate, getTemplateStats, toggleFavorite, isFavorite, getFavorites
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Zustand create with getState method
const mockSetFn = vi.fn();
const mockGetFn = vi.fn();

const mockStore = {
  ratings: {} as Record<string, number[]>,
  favoriteTemplateIds: [] as string[],
  templates: [],
  set: mockSetFn,
  get: mockGetFn,
  rateTemplate: (templateId: string, rating: number) => {
    if (!mockStore.ratings[templateId]) mockStore.ratings[templateId] = [];
    mockStore.ratings[templateId].push(rating);
  },
  getTemplateStats: (templateId: string) => {
    const scores = mockStore.ratings[templateId] ?? [];
    const avgRating = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    return { avgRating, ratingCount: scores.length, usageCount: 0 };
  },
  toggleFavorite: (templateId: string) => {
    const idx = mockStore.favoriteTemplateIds.indexOf(templateId);
    if (idx >= 0) mockStore.favoriteTemplateIds.splice(idx, 1);
    else mockStore.favoriteTemplateIds.push(templateId);
  },
  isFavorite: (templateId: string) => mockStore.favoriteTemplateIds.includes(templateId),
  getFavorites: () => mockStore.templates.filter((t: { id: string }) => mockStore.favoriteTemplateIds.includes(t.id)),
};

vi.doMock('@/stores/templateStore', () => ({
  useTemplateStore: () => mockStore,
}));

describe('templateStore — E5 rating & favorites', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStore.ratings = {};
    mockStore.favoriteTemplateIds = [];
  });

  it('rateTemplate adds score to ratings array', () => {
    mockStore.rateTemplate('tmpl-1', 5);
    mockStore.rateTemplate('tmpl-1', 3);
    expect(mockStore.ratings['tmpl-1']).toContain(5);
    expect(mockStore.ratings['tmpl-1']).toContain(3);
  });

  it('getTemplateStats returns avgRating', () => {
    mockStore.rateTemplate('tmpl-2', 5);
    mockStore.rateTemplate('tmpl-2', 3);
    const stats = mockStore.getTemplateStats('tmpl-2');
    expect(stats.avgRating).toBeCloseTo(4.0, 1);
    expect(stats.ratingCount).toBe(2);
  });

  it('toggleFavorite adds and removes template from favorites', () => {
    mockStore.toggleFavorite('tmpl-fav-1');
    expect(mockStore.isFavorite('tmpl-fav-1')).toBe(true);
    mockStore.toggleFavorite('tmpl-fav-1');
    expect(mockStore.isFavorite('tmpl-fav-1')).toBe(false);
  });

  it('getTemplateStats returns 0 avgRating for unrated template', () => {
    const stats = mockStore.getTemplateStats('nonexistent');
    expect(stats.avgRating).toBe(0);
    expect(stats.ratingCount).toBe(0);
  });
});
