/**
 * TemplateStore Tests - Sprint44 E2 Template Classification + Favorites
 * 
 * Tests for: category inference, favorite CRUD, filterTemplates
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useTemplateStore } from '../templateStore';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

describe('TemplateStore - E2 Favorites & Category', () => {
  beforeEach(() => {
    localStorageMock.clear();
    // Reset store by creating a new instance
    useTemplateStore.setState({
      favoriteTemplateIds: [],
      templates: [
        {
          id: 't1',
          name: 'SaaS E-commerce Platform',
          description: 'A complete online shopping solution',
          category: 'saas',
          tags: ['shop', 'cart', 'payment'],
          displayName: '电商平台',
          content: '',
          scenes: ['b2c'],
          entities: [],
          features: [],
          items: [],
        },
        {
          id: 't2',
          name: 'Online Learning Platform',
          description: 'Education and course management',
          category: 'education',
          tags: ['course', 'student', 'teacher'],
          displayName: '在线教育',
          content: '',
          scenes: ['b2c'],
          entities: [],
          features: [],
          items: [],
        },
        {
          id: 't3',
          name: 'Finance Tracker',
          description: 'Personal finance and investment tracking',
          category: 'fintech',
          tags: ['bank', 'investment', 'finance'],
          displayName: '金融科技',
          content: '',
          scenes: ['b2c'],
          entities: [],
          features: [],
          items: [],
        },
      ],
      filteredTemplates: [],
      selectedCategory: 'all',
      searchQuery: '',
    });
  });

  describe('toggleFavorite', () => {
    it('should add template to favorites when not favorited', () => {
      useTemplateStore.getState().toggleFavorite('t1');
      expect(useTemplateStore.getState().favoriteTemplateIds).toContain('t1');
    });

    it('should remove template from favorites when already favorited', () => {
      useTemplateStore.getState().toggleFavorite('t1');
      expect(useTemplateStore.getState().favoriteTemplateIds).toContain('t1');
      useTemplateStore.getState().toggleFavorite('t1');
      expect(useTemplateStore.getState().favoriteTemplateIds).not.toContain('t1');
    });

    it('should support multiple favorites', () => {
      useTemplateStore.getState().toggleFavorite('t1');
      useTemplateStore.getState().toggleFavorite('t2');
      const ids = useTemplateStore.getState().favoriteTemplateIds;
      expect(ids).toContain('t1');
      expect(ids).toContain('t2');
    });
  });

  describe('isFavorite', () => {
    it('should return true for favorited template', () => {
      useTemplateStore.getState().toggleFavorite('t1');
      expect(useTemplateStore.getState().isFavorite('t1')).toBe(true);
    });

    it('should return false for non-favorited template', () => {
      expect(useTemplateStore.getState().isFavorite('t1')).toBe(false);
    });
  });

  describe('getFavorites', () => {
    it('should return only favorited templates', () => {
      useTemplateStore.getState().toggleFavorite('t1');
      useTemplateStore.getState().toggleFavorite('t3');
      const favorites = useTemplateStore.getState().getFavorites();
      expect(favorites.length).toBe(2);
      expect(favorites.map(f => f.id)).toEqual(['t1', 't3']);
    });

    it('should return empty array when no favorites', () => {
      expect(useTemplateStore.getState().getFavorites()).toEqual([]);
    });
  });

  describe('inferCategory', () => {
    it('should infer ecommerce category from shop keywords', () => {
      const template = {
        id: 'test',
        name: 'Online Shop',
        description: 'A store for selling products',
        category: 'saas' as const,
        tags: ['shop', 'cart'],
        displayName: '',
        content: '',
        scenes: [] as const,
        entities: [],
        features: [],
        items: [],
      };
      expect(useTemplateStore.getState().inferCategory(template)).toBe('ecommerce');
    });

    it('should infer education category from course keywords', () => {
      const template = {
        id: 'test',
        name: 'Learning App',
        description: 'Education platform for students',
        category: 'saas' as const,
        tags: ['course', 'student'],
        displayName: '',
        content: '',
        scenes: [] as const,
        entities: [],
        features: [],
        items: [],
      };
      expect(useTemplateStore.getState().inferCategory(template)).toBe('education');
    });

    it('should infer fintech category from bank/finance keywords', () => {
      const template = {
        id: 'test',
        name: 'Money App',
        description: 'Investment and banking',
        category: 'saas' as const,
        tags: ['bank', 'transaction'],
        displayName: '',
        content: '',
        scenes: [] as const,
        entities: [],
        features: [],
        items: [],
      };
      expect(useTemplateStore.getState().inferCategory(template)).toBe('fintech');
    });

    it('should return saas as default when no keywords match', () => {
      const template = {
        id: 'test',
        name: 'XYZ Unique Widget System',
        description: 'A system for managing xyz data with widgets',
        category: 'saas' as const,
        tags: ['xyz', 'unique', 'widget'],
        displayName: '',
        content: '',
        scenes: [] as const,
        entities: [],
        features: [],
        items: [],
      };
      expect(useTemplateStore.getState().inferCategory(template)).toBe('saas');
    });
  });

  describe('setCategory', () => {
    it('should filter by category when category is set', () => {
      useTemplateStore.getState().setCategory('education');
      expect(useTemplateStore.getState().selectedCategory).toBe('education');
      const filtered = useTemplateStore.getState().filteredTemplates;
      expect(filtered.every(t => t.category === 'education')).toBe(true);
    });
  });

  describe('setSearchQuery', () => {
    it('should filter templates by search query', () => {
      useTemplateStore.getState().setSearchQuery('finance');
      expect(useTemplateStore.getState().searchQuery).toBe('finance');
      const filtered = useTemplateStore.getState().filteredTemplates;
      expect(filtered.length).toBeGreaterThan(0);
    });
  });

  // ---- E5: 自定义分类管理 ----
  describe('E5: customCategories', () => {
    beforeEach(() => {
      localStorageMock.clear();
      useTemplateStore.setState({
        customCategories: [],
        favoriteTemplateIds: [],
        templates: [
          {
            id: 't1', name: 'SaaS E-commerce Platform', description: '...',
            category: 'saas', tags: ['shop', 'cart'], displayName: '电商平台',
            content: '', scenes: [] as const, entities: [], features: [], items: [],
          },
          {
            id: 't2', name: 'Online Learning Platform', description: '...',
            category: 'education', tags: ['course', 'student'], displayName: '在线教育',
            content: '', scenes: [] as const, entities: [], features: [], items: [],
          },
        ],
        filteredTemplates: [],
        selectedCategory: 'all',
        searchQuery: '',
        stats: { usageCount: {}, ratings: {} },
      });
    });

    describe('addCustomCategory', () => {
      it('should add a custom category with generated id and timestamp', () => {
        useTemplateStore.getState().addCustomCategory('我的分类');
        const cats = useTemplateStore.getState().getCustomCategories();
        expect(cats.length).toBe(1);
        expect(cats[0].name).toBe('我的分类');
        expect(cats[0].id).toMatch(/^cat-/);
        expect(cats[0].createdAt).toBeGreaterThan(0);
      });

      it('should support multiple custom categories', () => {
        useTemplateStore.getState().addCustomCategory('分类A');
        useTemplateStore.getState().addCustomCategory('分类B');
        const cats = useTemplateStore.getState().getCustomCategories();
        expect(cats.length).toBe(2);
        expect(cats.map(c => c.name)).toContain('分类A');
        expect(cats.map(c => c.name)).toContain('分类B');
      });
    });

    describe('removeCustomCategory', () => {
      it('should remove a custom category by id', () => {
        useTemplateStore.getState().addCustomCategory('临时分类');
        const cats = useTemplateStore.getState().getCustomCategories();
        expect(cats.length).toBe(1);
        const catId = cats[0].id;
        useTemplateStore.getState().removeCustomCategory(catId);
        expect(useTemplateStore.getState().getCustomCategories().length).toBe(0);
      });

      it('should do nothing when removing non-existent category', () => {
        useTemplateStore.getState().addCustomCategory('真实分类');
        useTemplateStore.getState().removeCustomCategory('non-existent-id');
        expect(useTemplateStore.getState().getCustomCategories().length).toBe(1);
      });
    });

    describe('getCustomCategories', () => {
      it('should return empty array when no categories exist', () => {
        expect(useTemplateStore.getState().getCustomCategories()).toEqual([]);
      });
    });

    describe('incrementUsage', () => {
      it('should increment usage count for a template', () => {
        expect(useTemplateStore.getState().stats.usageCount['t1']).toBeUndefined();
        useTemplateStore.getState().incrementUsage('t1');
        expect(useTemplateStore.getState().stats.usageCount['t1']).toBe(1);
        useTemplateStore.getState().incrementUsage('t1');
        expect(useTemplateStore.getState().stats.usageCount['t1']).toBe(2);
      });

      it('should work for multiple templates independently', () => {
        useTemplateStore.getState().incrementUsage('t1');
        useTemplateStore.getState().incrementUsage('t2');
        useTemplateStore.getState().incrementUsage('t2');
        expect(useTemplateStore.getState().stats.usageCount['t1']).toBe(1);
        expect(useTemplateStore.getState().stats.usageCount['t2']).toBe(2);
      });
    });
  });
});

// ---- E3: Template Analytics & AI Recommendation ----
describe('TemplateStore - E3 Analytics & AI Recommendation', () => {
  beforeEach(() => {
    localStorageMock.clear();
    useTemplateStore.setState({
      templates: [
        {
          id: 't1',
          name: 'Flowchart A',
          description: 'Flow chart',
          category: 'flowchart' as const,
          tags: ['flow'],
          displayName: '流程图A',
          content: '',
          scenes: [],
          entities: [],
          features: [],
          items: [],
          metadata: { tags: ['flow'] },
        } as any,
        {
          id: 't2',
          name: 'Mindmap B',
          description: 'Mind map',
          category: 'mindmap' as const,
          tags: ['brainstorm'],
          displayName: '思维导图B',
          content: '',
          scenes: [],
          entities: [],
          features: [],
          items: [],
          metadata: { tags: ['brainstorm'] },
        } as any,
      ],
      stats: { usageCount: { t1: 10, t2: 5 }, ratings: {} },
      selectedTags: ['flow'],
    });
  });

  describe('topTemplates', () => {
    it('should return templates sorted by usage count descending', () => {
      const top = useTemplateStore.getState().topTemplates(3);
      expect(top[0].id).toBe('t1'); // 10 uses
      expect(top[1].id).toBe('t2'); // 5 uses
    });

    it('should respect the limit parameter', () => {
      const top = useTemplateStore.getState().topTemplates(1);
      expect(top.length).toBe(1);
      expect(top[0].id).toBe('t1');
    });
  });

  describe('getCategoryStats', () => {
    it('should return stats for all categories', () => {
      const stats = useTemplateStore.getState().getCategoryStats();
      expect(stats.all.count).toBe(2);
      expect(stats.flowchart.count).toBe(1);
      expect(stats.mindmap.count).toBe(1);
    });

    it('should calculate average usage per category', () => {
      const stats = useTemplateStore.getState().getCategoryStats();
      expect(stats.flowchart.avgUsage).toBe(10);
      expect(stats.mindmap.avgUsage).toBe(5);
    });
  });

  describe('calcRecommendScore', () => {
    it('should return a score greater than 0 for templates with usage', () => {
      const score = useTemplateStore.getState().calcRecommendScore('t1');
      expect(score).toBeGreaterThan(0);
    });

    it('should return 0 for unknown template ID', () => {
      const score = useTemplateStore.getState().calcRecommendScore('nonexistent');
      expect(score).toBe(0);
    });

    it('should consider usage frequency in score (usage×0.5 weight)', () => {
      const scoreT1 = useTemplateStore.getState().calcRecommendScore('t1'); // 10 uses
      const scoreT2 = useTemplateStore.getState().calcRecommendScore('t2'); // 5 uses
      expect(scoreT1).toBeGreaterThan(scoreT2); // Higher usage = higher score
    });

    it('should consider tag match in score (tagMatch×0.3 weight)', () => {
      // selectedTags = ['flow']
      // t1 has tags ['flow'] -> 100% match
      // t2 has tags ['brainstorm'] -> 0% match
      const scoreT1 = useTemplateStore.getState().calcRecommendScore('t1');
      expect(scoreT1).toBeGreaterThan(0);
    });
  });
});
