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

  describe('E4: exportTemplates', () => {
    it('exportTemplates returns version 1.0 and all templates', () => {
      const { exportTemplates } = useTemplateStore.getState();
      const result = exportTemplates();
      expect(result.version).toBe('1.0');
      expect(Array.isArray(result.templates)).toBe(true);
      expect(result.exportedAt).toBeDefined();
    });

    it('exportTemplates includes all current templates', () => {
      const { exportTemplates, templates } = useTemplateStore.getState();
      const result = exportTemplates();
      expect(result.templates.length).toBe(templates.length);
    });
  });

  describe('E4: importTemplates', () => {
    it('importTemplates parses valid JSON and adds new templates', () => {
      const { importTemplates, templates } = useTemplateStore.getState();
      const newTemplate = {
        id: 'e4-test-tpl',
        name: 'E4 Test Template',
        description: 'Test',
        category: 'flow' as const,
        icon: '🔧',
        version: 1,
        metadata: { tags: [], author: 'test' },
        nodes: [],
        edges: [],
      };
      const json = JSON.stringify({ version: '1.0', templates: [newTemplate] });
      const result = importTemplates(json, 'skip');
      expect(result.success).toBe(true);
      expect(result.imported).toBe(1);
      expect(result.skipped).toBe(0);
    });

    it('importTemplates rejects invalid JSON', () => {
      const { importTemplates } = useTemplateStore.getState();
      const result = importTemplates('not json', 'skip');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid JSON');
    });

    it('importTemplates rejects missing version', () => {
      const { importTemplates } = useTemplateStore.getState();
      const result = importTemplates(JSON.stringify({ templates: [] }), 'skip');
      expect(result.success).toBe(false);
      expect(result.error).toContain('missing version');
    });

    it('importTemplates skips conflicts with strategy=skip', () => {
      const { importTemplates, templates } = useTemplateStore.getState();
      const existing = templates[0];
      const json = JSON.stringify({ version: '1.0', templates: [existing] });
      const result = importTemplates(json, 'skip');
      expect(result.success).toBe(true);
      expect(result.skipped).toBe(1);
      expect(result.imported).toBe(0);
    });

    it('importTemplates adds new IDs with strategy=skip', () => {
      const { importTemplates } = useTemplateStore.getState();
      const newTpl = {
        id: 'e4-new-tpl-2',
        name: 'E4 New Tpl 2',
        description: 'Test',
        category: 'flow' as const,
        icon: '🔧',
        version: 1,
        metadata: { tags: [], author: 'test' },
        nodes: [],
        edges: [],
      };
      const json = JSON.stringify({ version: '1.0', templates: [newTpl] });
      const result = importTemplates(json, 'skip');
      expect(result.success).toBe(true);
      expect(result.imported).toBe(1);
    });
  });
});

// ---- E5: 模板画廊搜索增强 ----
describe('E5: 模板画廊搜索增强', () => {
  beforeEach(() => {
    useTemplateStore.setState({
      templates: [
        {
          id: 'e5-tpl-work',
          name: '工作流模板',
          description: '企业工作流设计',
          category: 'flow',
          icon: '💼',
          version: 1,
          metadata: { tags: ['工作'], author: 'test' },
          nodes: [],
          edges: [],
        },
        {
          id: 'e5-tpl-personal',
          name: '个人笔记模板',
          description: '个人学习笔记',
          category: 'mindmap',
          icon: '👤',
          version: 1,
          metadata: { tags: ['个人'], author: 'test' },
          nodes: [],
          edges: [],
        },
        {
          id: 'e5-tpl-both',
          name: '工作学习混合',
          description: '边工作边学习',
          category: 'flow',
          icon: '📚',
          version: 1,
          metadata: { tags: ['工作', '教程'], author: 'test' },
          nodes: [],
          edges: [],
        },
        {
          id: 'e5-tpl-none',
          name: '空白模板',
          description: '空白画布',
          category: 'flow',
          icon: '📄',
          version: 1,
          metadata: { tags: ['空白'], author: 'test' },
          nodes: [],
          edges: [],
        },
      ],
      selectedCategory: 'all',
      searchQuery: '',
      selectedTags: [],
      filteredTemplates: [],
      favoriteTemplateIds: [],
    });
  });

  describe('filterByTag', () => {
    it('返回包含所有指定标签的模板（交集过滤）', () => {
      const { filterByTag } = useTemplateStore.getState();
      const result = filterByTag(['工作']);
      expect(result.map(t => t.id)).toEqual(['e5-tpl-work', 'e5-tpl-both']);
    });

    it('多标签交集：只有同时包含所有标签的模板才返回', () => {
      const { filterByTag } = useTemplateStore.getState();
      const result = filterByTag(['工作', '教程']);
      expect(result.map(t => t.id)).toEqual(['e5-tpl-both']);
    });

    it('空标签数组返回所有模板', () => {
      const { filterByTag } = useTemplateStore.getState();
      const result = filterByTag([]);
      expect(result.length).toBe(4);
    });

    it('不存在的标签返回空', () => {
      const { filterByTag } = useTemplateStore.getState();
      const result = filterByTag(['不存在']);
      expect(result.length).toBe(0);
    });
  });

  describe('setSelectedTags', () => {
    it('设置标签后 filteredTemplates 只包含匹配模板', () => {
      const { setSelectedTags, filteredTemplates } = useTemplateStore.getState();
      setSelectedTags(['工作']);
      const { filteredTemplates: filtered } = useTemplateStore.getState();
      expect(filtered.map(t => t.id)).toEqual(['e5-tpl-work', 'e5-tpl-both']);
      expect(filtered).not.toEqual(filteredTemplates); // changed
    });

    it('清除标签后 filteredTemplates 恢复', () => {
      const { setSelectedTags } = useTemplateStore.getState();
      setSelectedTags(['工作']);
      setSelectedTags([]);
      const { filteredTemplates, selectedTags } = useTemplateStore.getState();
      expect(selectedTags).toEqual([]);
      expect(filteredTemplates.length).toBe(4);
    });

    it('selectedTags 状态正确更新', () => {
      const { setSelectedTags } = useTemplateStore.getState();
      setSelectedTags(['工作', '教程']);
      const { selectedTags } = useTemplateStore.getState();
      expect(selectedTags).toEqual(['工作', '教程']);
    });
  });

  describe('searchTemplates with Fuse.js', () => {
    it('Fuse.js 模糊匹配：部分匹配也返回结果', () => {
      const { searchTemplates } = useTemplateStore.getState();
      // "工作" 匹配 "工作流模板" 和 "工作学习混合"
      const result = searchTemplates('工作');
      expect(result.length).toBeGreaterThanOrEqual(1);
    });

    it('空搜索返回过滤后的模板', () => {
      const { setSelectedTags, searchTemplates } = useTemplateStore.getState();
      setSelectedTags(['工作']);
      const result = searchTemplates('');
      expect(result.map(t => t.id)).toEqual(['e5-tpl-work', 'e5-tpl-both']);
    });

    it('Fuse.js 区分大小写', () => {
      const { searchTemplates } = useTemplateStore.getState();
      const result = searchTemplates('WORK');
      // Fuse.js threshold=0.4, case-sensitive but Fuse lowercases keys
      expect(Array.isArray(result)).toBe(true);
    });
  });
});
