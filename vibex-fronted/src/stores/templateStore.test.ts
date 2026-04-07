/**
 * Template Store Tests
 */

import { useTemplateStore } from '../stores/templateStore';

describe('TemplateStore', () => {
  beforeEach(() => {
    // Reset store
    useTemplateStore.setState({
      selectedTemplate: null,
      selectedCategory: 'all',
      searchQuery: '',
      isSelectorOpen: false,
    });
  });

  describe('initial state', () => {
    it('has default templates', () => {
      const state = useTemplateStore.getState();
      expect(state.templates.length).toBeGreaterThan(0);
    });

    it('starts with all category selected', () => {
      expect(useTemplateStore.getState().selectedCategory).toBe('all');
    });

    it('starts with empty search query', () => {
      expect(useTemplateStore.getState().searchQuery).toBe('');
    });
  });

  describe('category filtering', () => {
    it('setCategory updates selected category', () => {
      const { setCategory } = useTemplateStore.getState();
      setCategory('user-management');
      
      expect(useTemplateStore.getState().selectedCategory).toBe('user-management');
    });

    it('setCategory to all shows all templates', () => {
      const { setCategory } = useTemplateStore.getState();
      setCategory('all');
      
      expect(useTemplateStore.getState().selectedCategory).toBe('all');
    });
  });

  describe('search', () => {
    it('setSearchQuery updates search query', () => {
      const { setSearchQuery } = useTemplateStore.getState();
      setSearchQuery('user');
      
      expect(useTemplateStore.getState().searchQuery).toBe('user');
    });

    it('setSearchQuery clears search', () => {
      const { setSearchQuery } = useTemplateStore.getState();
      setSearchQuery('');
      
      expect(useTemplateStore.getState().searchQuery).toBe('');
    });
  });

  describe('template selection', () => {
    it('selectTemplate sets selected template', () => {
      const { selectTemplate, templates } = useTemplateStore.getState();
      selectTemplate(templates[0]);
      
      expect(useTemplateStore.getState().selectedTemplate).toEqual(templates[0]);
    });

    it('selectTemplate clears selection with null', () => {
      const { selectTemplate, templates } = useTemplateStore.getState();
      selectTemplate(templates[0]);
      selectTemplate(null);
      
      expect(useTemplateStore.getState().selectedTemplate).toBeNull();
    });
  });

  describe('selector open/close', () => {
    it('openSelector sets isSelectorOpen to true', () => {
      const { openSelector } = useTemplateStore.getState();
      openSelector();
      
      expect(useTemplateStore.getState().isSelectorOpen).toBe(true);
    });

    it('closeSelector sets isSelectorOpen to false', () => {
      const { openSelector, closeSelector } = useTemplateStore.getState();
      openSelector();
      closeSelector();
      
      expect(useTemplateStore.getState().isSelectorOpen).toBe(false);
    });
  });

  describe('template application', () => {
    it('applyTemplate returns template content', () => {
      const { applyTemplate, templates } = useTemplateStore.getState();
      const result = applyTemplate(templates[0]);
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });
  });

  describe('stats', () => {
    it('recordUsage increments usage count', () => {
      const { recordUsage } = useTemplateStore.getState();
      recordUsage('template-1');
      
      const stats = useTemplateStore.getState().stats;
      expect(stats.usageCount['template-1']).toBe(1);
    });

    it('getTemplateStats returns stats for template', () => {
      const { getTemplateStats } = useTemplateStore.getState();
      
      const stats = getTemplateStats('template-1');
      expect(stats.usageCount).toBeGreaterThanOrEqual(0);
    });

    it('getPopularTemplates returns sorted templates', () => {
      const { getPopularTemplates } = useTemplateStore.getState();
      const popular = getPopularTemplates(5);
      
      expect(popular.length).toBeLessThanOrEqual(5);
    });

    it('getTopRatedTemplates returns sorted templates', () => {
      const { getTopRatedTemplates } = useTemplateStore.getState();
      const topRated = getTopRatedTemplates(5);
      
      expect(topRated.length).toBeLessThanOrEqual(5);
    });
  });

  describe('filtered templates', () => {
    it('filteredTemplates returns filtered list', () => {
      const state = useTemplateStore.getState();
      expect(state.filteredTemplates.length).toBeLessThanOrEqual(state.templates.length);
    });
  });
});
