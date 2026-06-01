/**
 * templateSearch.ts — Fuse.js fuzzy search for canvas templates
 * Sprint52 E4: 模板管理增强
 *
 * Uses Fuse.js with threshold 0.3 for fuzzy template matching.
 * Searches across name, description, and tags.
 */

import Fuse from 'fuse.js';
import type { RequirementTemplate } from '@/data/templates';

export interface SearchResult {
  id: string;
  name: string;
  description: string;
  tags: string[];
  score?: number;
}

/**
 * Fuse.js fuzzy search for templates.
 * Returns templates matching the query with threshold 0.3.
 * Returns all templates if query is empty.
 */
export async function searchTemplates(
  query: string,
  templates: RequirementTemplate[]
): Promise<SearchResult[]> {
  if (!query.trim()) {
    return templates.map(({ id, name, description, tags }) => ({
      id,
      name,
      description,
      tags: tags || [],
    }));
  }

  const fuse = new Fuse(templates, {
    keys: [
      { name: 'name', weight: 0.5 },
      { name: 'description', weight: 0.3 },
      { name: 'tags', weight: 0.2 },
    ],
    threshold: 0.3,
    includeScore: true,
  });

  const results = fuse.search(query);

  // Deduplicate by id
  const seen = new Set<string>();
  const deduped: SearchResult[] = [];
  for (const { item, score } of results) {
    if (!seen.has(item.id)) {
      seen.add(item.id);
      deduped.push({ id: item.id, name: item.name, description: item.description, tags: item.tags || [], score });
    }
  }

  return deduped;
}
