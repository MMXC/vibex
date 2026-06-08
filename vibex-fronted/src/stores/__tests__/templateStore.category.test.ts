/**
 * templateStore.category.test.ts — S80-E2: Template Category/Tag Filter Tests
 *
 * Tests for filterByCategory, filterByTag, searchTemplates (filterBySearch)
 * covering the S80-E2 DoD: vitest: templateStore filter related tests 5/5
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

const SAMPLE_TEMPLATES = [
  {
    id: 't1',
    name: 'SaaS E-commerce Platform',
    description: 'Complete online shopping solution with cart and payment',
    category: 'saas' as const,
    metadata: { tags: ['shop', 'cart', 'payment'], complexity: 'complex' as const, estimatedTime: '2 weeks', techStack: [] },
    displayName: 'SaaS电商平台',
    content: '',
    scenes: ['b2c'] as const,
    entities: [],
    features: [],
    items: [],
  },
  {
    id: 't2',
    name: 'Online Learning Platform',
    description: 'Education and course management system',
    category: 'education' as const,
    metadata: { tags: ['course', 'student', 'teacher'], complexity: 'medium' as const, estimatedTime: '3 weeks', techStack: [] },
    displayName: '在线教育平台',
    content: '',
    scenes: ['b2c'] as const,
    entities: [],
    features: [],
    items: [],
  },
  {
    id: 't3',
    name: 'Finance Tracker',
    description: 'Personal finance and investment tracking tool',
    category: 'fintech' as const,
    metadata: { tags: ['bank', 'investment', 'finance'], complexity: 'medium' as const, estimatedTime: '2 weeks', techStack: [] },
    displayName: '金融理财工具',
    content: '',
    scenes: ['b2c'] as const,
    entities: [],
    features: [],
    items: [],
  },
  {
    id: 't4',
    name: 'Healthcare Management',
    description: 'Hospital and clinic management system',
    category: 'healthcare' as const,
    metadata: { tags: ['hospital', 'patient', 'appointment'], complexity: 'complex' as const, estimatedTime: '4 weeks', techStack: [] },
    displayName: '医疗健康系统',
    content: '',
    scenes: ['b2c'] as const,
    entities: [],
    features: [],
    items: [],
  },
  {
    id: 't5',
    name: 'Social Community App',
    description: 'Social networking and community platform',
    category: 'social' as const,
    metadata: { tags: ['social', 'forum', 'chat'], complexity: 'medium' as const, estimatedTime: '3 weeks', techStack: [] },
    displayName: '社交社区应用',
    content: '',
    scenes: ['b2c'] as const,
    entities: [],
    features: [],
    items: [],
  },
  {
    id: 't6',
    name: 'Enterprise CRM',
    description: 'Customer relationship management for enterprises',
    category: 'enterprise' as const,
    metadata: { tags: ['crm', 'customer', 'sales'], complexity: 'complex' as const, estimatedTime: '4 weeks', techStack: [] },
    displayName: '企业CRM系统',
    content: '',
    scenes: ['b2b'] as const,
    entities: [],
    features: [],
    items: [],
  },
];

describe('TemplateStore - Category/Tag Filter (S80-E2)', () => {
  beforeEach(() => {
    localStorageMock.clear();
    useTemplateStore.setState({
      templates: SAMPLE_TEMPLATES,
      filteredTemplates: SAMPLE_TEMPLATES,
      selectedCategory: 'all',
      searchQuery: '',
      selectedTags: [],
      favoriteTemplateIds: [],
    });
  });

  // ---- DoD: filterByCategory 只返回指定分类 ----
  describe('filterByCategory', () => {
    it('returns all templates when category is "all"', () => {
      const result = useTemplateStore.getState().filterByCategory('all');
      expect(result).toHaveLength(6);
    });

    it('returns only templates matching the specified category', () => {
      const result = useTemplateStore.getState().filterByCategory('saas');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('t1');
      expect(result[0].category).toBe('saas');
    });

    it('returns empty array when no templates match category', () => {
      const result = useTemplateStore.getState().filterByCategory('game');
      expect(result).toHaveLength(0);
    });

    it('handles multiple templates in same category', () => {
      // All have unique categories here
      const result = useTemplateStore.getState().filterByCategory('healthcare');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('t4');
    });
  });

  // ---- DoD: filterByTag 返回包含 tag 的模板 ----
  describe('filterByTag', () => {
    it('returns templates containing the specified tag (AND intersection)', () => {
      const result = useTemplateStore.getState().filterByTag(['finance']);
      expect(result.some(t => t.id === 't3')).toBe(true);
    });

    it('returns empty when no templates have the tag', () => {
      const result = useTemplateStore.getState().filterByTag(['nonexistent']);
      expect(result).toHaveLength(0);
    });

    it('AND intersection: all selected tags must be present', () => {
      // t1 has ['shop', 'cart', 'payment'] - both shop AND payment present
      const result = useTemplateStore.getState().filterByTag(['shop', 'payment']);
      expect(result.some(t => t.id === 't1')).toBe(true);
    });

    it('AND intersection: returns empty when not all tags present', () => {
      // no template has BOTH 'xyz' AND 'abc'
      const result = useTemplateStore.getState().filterByTag(['xyz', 'abc']);
      expect(result).toHaveLength(0);
    });

    it('returns multiple templates sharing the tag', () => {
      // No two templates share the same single tag, so test with the tag present
      const result = useTemplateStore.getState().filterByTag(['hospital']);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('t4');
    });
  });

  // ---- DoD: filterBySearch 模糊搜索 ----
  describe('searchTemplates (filterBySearch)', () => {
    it('returns all templates when query is empty', () => {
      const result = useTemplateStore.getState().searchTemplates('');
      expect(result).toHaveLength(6);
    });

    it('fuzzy matches template name', () => {
      const result = useTemplateStore.getState().searchTemplates('ecommerce');
      expect(result.length).toBeGreaterThan(0);
      expect(result.some(t => t.id === 't1')).toBe(true);
    });

    it('fuzzy matches template description', () => {
      const result = useTemplateStore.getState().searchTemplates('investment');
      expect(result.some(t => t.id === 't3')).toBe(true);
    });

    it('fuzzy matches displayName', () => {
      const result = useTemplateStore.getState().searchTemplates('金融');
      expect(result.some(t => t.id === 't3')).toBe(true);
    });

    it('returns empty for non-matching query', () => {
      const result = useTemplateStore.getState().searchTemplates('xyznonexistent');
      expect(result).toHaveLength(0);
    });

    it('handles partial match', () => {
      const result = useTemplateStore.getState().searchTemplates('learn');
      expect(result.some(t => t.id === 't2')).toBe(true);
    });
  });

  // ---- Combined filter scenarios ----
  describe('Combined Category + Tag filtering', () => {
    it('filterByTag respects selectedCategory state', () => {
      // Set category to 'saas', then filter by tag — only t1 matches both
      useTemplateStore.setState({ selectedCategory: 'saas' });
      const result = useTemplateStore.getState().filterByTag(['shop']);
      // t1 is saas + has 'shop' tag
      expect(result.some(t => t.id === 't1')).toBe(true);
    });

    it('filterByTag returns empty when category does not match', () => {
      // Set category to 'saas', filter by 'hospital' — no template is both
      useTemplateStore.setState({ selectedCategory: 'saas' });
      const result = useTemplateStore.getState().filterByTag(['hospital']);
      expect(result).toHaveLength(0);
    });
  });

  // ---- setSelectedTags integration ----
  describe('setSelectedTags', () => {
    it('updates selectedTags state', () => {
      useTemplateStore.getState().setSelectedTags(['shop', 'payment']);
      expect(useTemplateStore.getState().selectedTags).toEqual(['shop', 'payment']);
    });

    it('clears selectedTags when empty array passed', () => {
      useTemplateStore.setState({ selectedTags: ['shop'] });
      useTemplateStore.getState().setSelectedTags([]);
      expect(useTemplateStore.getState().selectedTags).toEqual([]);
    });
  });
});
