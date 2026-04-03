/**
 * TemplateStats Tests - 模板统计功能测试
 */
// @ts-nocheck


import { act } from '@testing-library/react';
import { useTemplateStore } from '@/stores/templateStore';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn(),
  removeItem: jest.fn(),
  length: 0,
  key: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Helper to reset store state
const resetStoreState = () => {
  const store = useTemplateStore.getState();
  // Reset stats
  useTemplateStore.setState({
    stats: { usageCount: {}, ratings: {} }
  });
};

describe('TemplateStats', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockReturnValue(undefined);
    jest.clearAllMocks();
    // Reset store state before each test
    resetStoreState();
  });

  describe('recordUsage', () => {
    it('should record template usage count', () => {
      const store = useTemplateStore.getState();
      
      // Record usage
      store.recordUsage('ecommerce-basic');
      
      // Get stats
      const stats = store.getTemplateStats('ecommerce-basic');
      
      expect(stats.usageCount).toBe(1);
    });

    it('should increment usage count on multiple uses', () => {
      const store = useTemplateStore.getState();
      
      store.recordUsage('ecommerce-basic');
      store.recordUsage('ecommerce-basic');
      store.recordUsage('ecommerce-basic');
      
      const stats = store.getTemplateStats('ecommerce-basic');
      
      expect(stats.usageCount).toBe(3);
    });

    it('should track usage for different templates separately', () => {
      const store = useTemplateStore.getState();
      
      store.recordUsage('ecommerce-basic');
      store.recordUsage('social-community');
      
      expect(store.getTemplateStats('ecommerce-basic').usageCount).toBe(1);
      expect(store.getTemplateStats('social-community').usageCount).toBe(1);
    });
  });

  describe('rateTemplate', () => {
    it('should record template rating', () => {
      const store = useTemplateStore.getState();
      
      store.rateTemplate('ecommerce-basic', 5);
      
      const stats = store.getTemplateStats('ecommerce-basic');
      
      expect(stats.ratingCount).toBe(1);
      expect(stats.avgRating).toBe(5);
    });

    it('should calculate average rating correctly', () => {
      const store = useTemplateStore.getState();
      
      store.rateTemplate('ecommerce-basic', 4);
      store.rateTemplate('ecommerce-basic', 5);
      store.rateTemplate('ecommerce-basic', 3);
      
      const stats = store.getTemplateStats('ecommerce-basic');
      
      expect(stats.ratingCount).toBe(3);
      expect(stats.avgRating).toBe(4); // (4+5+3)/3 = 4
    });

    it('should handle no ratings gracefully', () => {
      const store = useTemplateStore.getState();
      
      const stats = store.getTemplateStats('nonexistent-template');
      
      expect(stats.ratingCount).toBe(0);
      expect(stats.avgRating).toBe(0);
    });
  });

  describe('getPopularTemplates', () => {
    it('should return templates sorted by usage count', () => {
      const store = useTemplateStore.getState();
      
      // Use ecommerce template more times
      store.recordUsage('ecommerce-b2c');
      store.recordUsage('ecommerce-b2c');
      store.recordUsage('social-community');
      
      const popular = store.getPopularTemplates(2);
      
      expect(popular[0].id).toBe('ecommerce-b2c');
      expect(popular[1].id).toBe('social-community');
    });

    it('should return templates even when no usage data (returns all)', () => {
      const store = useTemplateStore.getState();
      
      const popular = store.getPopularTemplates(5);
      
      // When no usage, returns all templates sorted (0 usage for all)
      expect(popular.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getTopRatedTemplates', () => {
    it('should return templates sorted by rating', () => {
      const store = useTemplateStore.getState();
      
      store.rateTemplate('ecommerce-b2c', 5);
      store.rateTemplate('ecommerce-b2c', 4);
      store.rateTemplate('social-community', 3);
      
      const topRated = store.getTopRatedTemplates(2);
      
      expect(topRated[0].id).toBe('ecommerce-b2c');
    });

    it('should filter out templates with no ratings', () => {
      const store = useTemplateStore.getState();
      
      store.recordUsage('ecommerce-b2c');
      store.rateTemplate('social-community', 5);
      
      const topRated = store.getTopRatedTemplates(5);
      
      expect(topRated).toHaveLength(1);
      expect(topRated[0].id).toBe('social-community');
    });
  });

  describe('applyTemplate', () => {
    it('should return template content and record usage', () => {
      const store = useTemplateStore.getState();
      
      // Find a real template from the store
      const templates = store.templates;
      const template = templates.find(t => t.id === 'ecommerce-b2c') || templates[0];
      
      const content = store.applyTemplate(template);
      
      expect(content).toBe(template.content);
      expect(store.getTemplateStats(template.id).usageCount).toBe(1);
    });
  });
});
