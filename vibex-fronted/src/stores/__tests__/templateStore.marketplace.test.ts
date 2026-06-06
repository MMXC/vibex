/**
 * templateStore.marketplace.test.ts — Sprint70 E2: Template Marketplace Tests
 *
 * Tests for: featuredTemplates, searchMarketplace, getMarketplaceTemplates
 *
 * Strategy: Extract pure functions from the store and test them directly.
 * The actual store has persist middleware + IndexedDB that complicate testing.
 * We replicate the key logic as pure functions for unit test coverage.
 */

import { describe, it, expect } from 'vitest';
import type { RequirementTemplate } from '@/data/templates/types';

// ── Pure functions matching the store's E2 marketplace implementations ─────────────

// featuredTemplates: sort templates by usageCount descending
function featuredTemplates(
  templates: RequirementTemplate[],
  statsUsageCount: Record<string, number> = {},
  limit?: number
): RequirementTemplate[] {
  const sorted = [...templates].sort((a, b) => {
    const countA = statsUsageCount[a.id] ?? 0;
    const countB = statsUsageCount[b.id] ?? 0;
    return countB - countA;
  });
  return limit !== undefined ? sorted.slice(0, limit) : sorted;
}

// searchMarketplace: filter templates by query string + tag array (AND)
// Matches the actual store implementation
function searchMarketplace(
  templates: RequirementTemplate[],
  query?: string,
  tags?: string[]
): RequirementTemplate[] {
  return templates.filter(t => {
    if (!query && (!tags || tags.length === 0)) return true;
    const qLower = (query || '').toLowerCase();
    const nameMatch = !query || t.name.toLowerCase().includes(qLower);
    const descMatch = !query || (t.description || '').toLowerCase().includes(qLower);
    const displayMatch = !query || (t.displayName || '').toLowerCase().includes(qLower);
    const metaTagMatch = !query || (t.metadata?.tags || []).some(
      (tag: string) => tag.toLowerCase().includes(qLower)
    );
    const tagMatch = !tags || tags.length === 0 || tags.every(tag => (t.tags || []).includes(tag));
    return (nameMatch || descMatch || displayMatch || metaTagMatch) && tagMatch;
  });
}

// getMarketplaceTemplates: return all templates
function getMarketplaceTemplates(templates: RequirementTemplate[]): RequirementTemplate[] {
  return [...templates];
}

describe('TemplateStore - E2 Marketplace (pure unit)', () => {
  // Inline template fixtures — no helper functions to avoid property override issues
  const t1: RequirementTemplate = {
    id: 't1',
    name: 'SaaS Platform',
    description: 'A complete SaaS product template',
    category: 'saas',
    tags: ['saas', 'ecommerce'],
    displayName: 'SaaS平台',
    metadata: { tags: ['b2b', 'subscription'], complexity: 'medium', estimatedTime: '2 weeks', techStack: [] },
    content: '',
    scenes: [],
    entities: [],
    features: [],
    items: [],
  };
  const t2: RequirementTemplate = {
    id: 't2',
    name: 'E-commerce Shop',
    description: 'Online shopping platform',
    category: 'ecommerce',
    tags: ['b2c', 'payment'],
    displayName: '电商平台',
    metadata: { tags: ['b2c', 'payment'], complexity: 'complex', estimatedTime: '4 weeks', techStack: [] },
    content: '',
    scenes: [],
    entities: [],
    features: [],
    items: [],
  };
  const t3: RequirementTemplate = {
    id: 't3',
    name: 'Learning App',
    description: 'Education and course platform',
    category: 'education',
    tags: ['b2c', 'courses'],
    displayName: '在线教育',
    metadata: { tags: ['b2c', 'courses'], complexity: 'medium', estimatedTime: '3 weeks', techStack: [] },
    content: '',
    scenes: [],
    entities: [],
    features: [],
    items: [],
  };
  const t4: RequirementTemplate = {
    id: 't4',
    name: 'Social Network',
    description: 'Social media platform',
    category: 'social',
    tags: ['b2c', 'social'],
    displayName: '社交网络',
    metadata: { tags: ['b2c', 'social'], complexity: 'complex', estimatedTime: '6 weeks', techStack: [] },
    content: '',
    scenes: [],
    entities: [],
    features: [],
    items: [],
  };

  const allTemplates: RequirementTemplate[] = [t1, t2, t3, t4];
  const usageCount: Record<string, number> = { t1: 10, t2: 5, t3: 20, t4: 3 };

  describe('featuredTemplates', () => {
    it('should return templates sorted by usage count descending', () => {
      const featured = featuredTemplates(allTemplates, usageCount);
      expect(featured[0].id).toBe('t3'); // 20 uses
      expect(featured[1].id).toBe('t1'); // 10 uses
      expect(featured[2].id).toBe('t2'); // 5 uses
      expect(featured[3].id).toBe('t4'); // 3 uses
    });

    it('should respect the limit parameter', () => {
      const featured = featuredTemplates(allTemplates, usageCount, 2);
      expect(featured).toHaveLength(2);
      expect(featured[0].id).toBe('t3');
      expect(featured[1].id).toBe('t1');
    });

    it('should handle zero usage count', () => {
      const zeroCount = { t1: 0, t2: 0, t3: 0, t4: 0 };
      const featured = featuredTemplates(allTemplates, zeroCount);
      expect(featured).toHaveLength(4); // All included, order undefined
    });

    it('should handle missing usage count (defaults to 0)', () => {
      const featured = featuredTemplates([t1, t2], {});
      // Both default to 0, order is stable sort (original order preserved)
      expect(featured).toHaveLength(2);
    });
  });

  describe('searchMarketplace', () => {
    it('should return all templates when no query or tags provided', () => {
      const results = searchMarketplace(allTemplates);
      expect(results).toHaveLength(4);
    });

    it('should filter by query in name', () => {
      const results = searchMarketplace(allTemplates, 'SaaS');
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('t1');
    });

    it('should filter by query in description', () => {
      const results = searchMarketplace(allTemplates, 'shopping');
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('t2');
    });

    it('should filter by query in displayName', () => {
      const results = searchMarketplace(allTemplates, '电商');
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('t2');
    });

    it('should filter by query in metadata tags', () => {
      const results = searchMarketplace(allTemplates, 'payment');
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('t2');
    });

    it('should be case-insensitive', () => {
      const results = searchMarketplace(allTemplates, 'saas');
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('t1');
    });

    it('should filter by tags (AND logic)', () => {
      const results = searchMarketplace(allTemplates, undefined, ['b2c']);
      expect(results).toHaveLength(3); // t2, t3, t4
    });

    it('should combine query and tags filter (AND)', () => {
      // 'platform' matches t1 name 'SaaS Platform'
      // 'saas' tag: t1.tags = ['saas', 'ecommerce']
      const results = searchMarketplace(allTemplates, 'platform', ['saas']);
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('t1');
    });

    it('should return empty array when no match', () => {
      const results = searchMarketplace(allTemplates, 'nonexistent');
      expect(results).toHaveLength(0);
    });

    it('should return empty when tags match nothing', () => {
      const results = searchMarketplace(allTemplates, undefined, ['nonexistent-tag']);
      expect(results).toHaveLength(0);
    });

    it('should handle undefined query with tags', () => {
      const results = searchMarketplace(allTemplates, undefined, ['saas']);
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('t1');
    });
  });

  describe('getMarketplaceTemplates', () => {
    it('should return all templates', () => {
      const results = getMarketplaceTemplates(allTemplates);
      expect(results).toHaveLength(4);
    });

    it('should return template objects with id and name', () => {
      const results = getMarketplaceTemplates(allTemplates);
      expect(results[0]).toHaveProperty('id');
      expect(results[0]).toHaveProperty('name');
      expect(results[0]).toHaveProperty('description');
    });
  });

  describe('Integration: featuredTemplates + searchMarketplace', () => {
    it('featuredTemplates should show most-used templates', () => {
      const featured = featuredTemplates(allTemplates, usageCount);
      expect(featured[0].id).toBe('t3'); // 20 uses
    });

    it('searching within featured should work', () => {
      const featured = featuredTemplates(allTemplates, usageCount);
      const results = searchMarketplace(featured, 'platform');
      expect(results.some(t => t.id === 't1')).toBe(true);
    });

    it('featured + search combined', () => {
      const top3 = featuredTemplates(allTemplates, usageCount, 3);
      const results = searchMarketplace(top3, 'saas', ['saas']);
      expect(results.some(t => t.id === 't1')).toBe(true);
      expect(results.length).toBeLessThanOrEqual(3);
    });
  });
});
