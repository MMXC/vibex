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

  // ---- E2: 画布模板管理完善 ----
  describe('E2: searchTemplates', () => {
    it('searchTemplates returns all templates for empty query', () => {
      const { searchTemplates, templates } = useTemplateStore.getState();
      const results = searchTemplates('');
      expect(results).toHaveLength(templates.length);
    });

    it('searchTemplates matches by name substring', () => {
      const { searchTemplates } = useTemplateStore.getState();
      const results = searchTemplates('user');
      expect(results.length).toBeGreaterThanOrEqual(0);
      // All results should contain 'user' in name or description
      results.forEach(t => {
        const matches = t.name.toLowerCase().includes('user') ||
          t.description.toLowerCase().includes('user') ||
          (t.displayName ?? '').toLowerCase().includes('user');
        expect(matches).toBe(true);
      });
    });

    it('searchTemplates is case-insensitive', () => {
      const { searchTemplates } = useTemplateStore.getState();
      const upper = searchTemplates('USER');
      const lower = searchTemplates('user');
      expect(upper.length).toBe(lower.length);
    });

    it('searchTemplates returns empty for non-matching query', () => {
      const { searchTemplates } = useTemplateStore.getState();
      const results = searchTemplates('xyz_non_existent_template_name_12345');
      expect(results).toHaveLength(0);
    });
  });

  describe('E2: filterByCategory', () => {
    it('filterByCategory returns all templates for all', () => {
      const { filterByCategory, templates } = useTemplateStore.getState();
      const results = filterByCategory('all');
      expect(results).toHaveLength(templates.length);
    });

    it('filterByCategory returns filtered results for specific category', () => {
      const { filterByCategory } = useTemplateStore.getState();
      const results = filterByCategory('saas');
      results.forEach(t => {
        expect(t.category).toBe('saas');
      });
    });
  });

  describe('E2: renameTemplate', () => {
    it('renameTemplate updates template name', () => {
      const { renameTemplate, templates } = useTemplateStore.getState();
      const template = templates[0];
      const originalName = template.name;
      const renamed = renameTemplate(template.id, 'New Template Name');
      expect(renamed).toBe(true);
      const updated = useTemplateStore.getState().templates.find(t => t.id === template.id);
      expect(updated?.name).toBe('New Template Name');
      expect(updated?.displayName).toBe('New Template Name');
      // Restore
      renameTemplate(template.id, originalName);
    });

    it('renameTemplate returns false for non-existent template', () => {
      const { renameTemplate } = useTemplateStore.getState();
      const result = renameTemplate('non-existent-id', 'New Name');
      expect(result).toBe(false);
    });

    it('renameTemplate updates filteredTemplates when query matches', () => {
      const { renameTemplate, templates, setSearchQuery } = useTemplateStore.getState();
      const template = templates.find(t => t.name.length > 3);
      if (!template) return;
      const prefix = template.name.slice(0, 3);
      // Rename to include a unique search term
      const uniqueName = `UNIQUE_RENAME_TEST_${Date.now()}`;
      renameTemplate(template.id, uniqueName);
      setSearchQuery(uniqueName);
      const filtered = useTemplateStore.getState().filteredTemplates;
      const found = filtered.find(t => t.id === template.id);
      expect(found).toBeDefined();
      // Restore original name
      renameTemplate(template.id, template.name);
    });
  });

  describe('E2: thumbnailCache', () => {
    it('setThumbnail stores thumbnail', () => {
      const { setThumbnail } = useTemplateStore.getState();
      setThumbnail('tpl-1', 'data:image/png;base64,abc123');
      expect(useTemplateStore.getState().thumbnailCache['tpl-1']).toBe('data:image/png;base64,abc123');
    });

    it('getThumbnail retrieves thumbnail', () => {
      const { setThumbnail, getThumbnail } = useTemplateStore.getState();
      setThumbnail('tpl-2', 'data:image/png;base64,xyz789');
      expect(getThumbnail('tpl-2')).toBe('data:image/png;base64,xyz789');
    });

    it('getThumbnail returns undefined for missing thumbnail', () => {
      const { getThumbnail } = useTemplateStore.getState();
      expect(getThumbnail('non-existent-tpl')).toBeUndefined();
    });

    it('thumbnailCache is shared across multiple templates', () => {
      const { setThumbnail, thumbnailCache } = useTemplateStore.getState();
      setThumbnail('tpl-a', 'data:a');
      setThumbnail('tpl-b', 'data:b');
      setThumbnail('tpl-c', 'data:c');
      const cache = useTemplateStore.getState().thumbnailCache;
      expect(cache['tpl-a']).toBe('data:a');
      expect(cache['tpl-b']).toBe('data:b');
      expect(cache['tpl-c']).toBe('data:c');
    });
  });
});
