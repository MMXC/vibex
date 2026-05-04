/**
 * useProjectSearch — Unit Tests
 * E4: Sprint 25 Dashboard 项目搜索与过滤
 */
import { renderHook, act } from '@testing-library/react';
import { useProjectSearch } from '../useProjectSearch';
import type { Project } from '@/services/api/types/project';

// ─── Test Data Factory ───────────────────────────────────────────────────────

function makeProject(overrides: Partial<Project> = {}): Project {
  return {
    id: 'p1',
    name: 'Test Project',
    userId: 'u1',
    description: 'A test project',
    createdAt: '2026-04-01T00:00:00.000Z',
    updatedAt: '2026-05-01T00:00:00.000Z',
    deletedAt: null,
    pages: [],
    ...overrides,
  };
}

const now = new Date();
const nowMs = now.getTime();
const p7d = new Date(nowMs - 6 * 86_400_000).toISOString();   // 6 days ago → within 7d
const p8d = new Date(nowMs - 8 * 86_400_000).toISOString();   // 8 days ago → outside 7d
const p31d = new Date(nowMs - 31 * 86_400_000).toISOString(); // 31 days ago → outside 30d

const projects: Project[] = [
  makeProject({ id: 'p1', name: 'Alpha Project', userId: 'u1', updatedAt: p7d }),
  makeProject({ id: 'p2', name: 'Beta Project', userId: 'u2', updatedAt: p8d, description: 'A beta test app' }),
  makeProject({ id: 'p3', name: 'Gamma', userId: 'u1', updatedAt: p31d, description: 'Gamma framework' }),
  makeProject({ id: 'p4', name: 'Delta Portal', userId: 'u2', description: null, updatedAt: now.toISOString() }),
  makeProject({ id: 'p5', name: 'Old Archived', userId: 'u1', updatedAt: undefined, description: 'archived stuff' }),
];

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('useProjectSearch', () => {
  describe('search', () => {
    it('returns all projects when search is empty', () => {
      const { result } = renderHook(() => useProjectSearch(projects));
      expect(result.current.filtered).toHaveLength(5);
    });

    it('filters by name (case-insensitive)', () => {
      const { result } = renderHook(() => useProjectSearch(projects));
      act(() => { result.current.setSearch('alpha'); });
      expect(result.current.filtered.map((p) => p.id)).toEqual(['p1']);
    });

    it('filters by description', () => {
      const { result } = renderHook(() => useProjectSearch(projects));
      act(() => { result.current.setSearch('test'); });
      expect(result.current.filtered.map((p) => p.id)).toEqual(['p1', 'p2']);
    });

    it('returns empty array when no match', () => {
      const { result } = renderHook(() => useProjectSearch(projects));
      act(() => { result.current.setSearch('nonexistent'); });
      expect(result.current.filtered).toHaveLength(0);
    });

    it('searching flag is set when query is non-empty', () => {
      const { result } = renderHook(() => useProjectSearch(projects));
      expect(result.current.searching).toBe(false);
      act(() => { result.current.setSearch('alpha'); });
      expect(result.current.searching).toBe(true);
      act(() => { result.current.setSearch(''); });
      expect(result.current.searching).toBe(false);
    });

    it('handles null description gracefully', () => {
      const { result } = renderHook(() => useProjectSearch(projects));
      act(() => { result.current.setSearch('delta'); });
      expect(result.current.filtered.map((p) => p.id)).toEqual(['p4']);
    });
  });

  describe('filter', () => {
    it('all — returns all projects', () => {
      const { result } = renderHook(() => useProjectSearch(projects));
      act(() => { result.current.setFilter('all'); });
      expect(result.current.filtered).toHaveLength(5);
    });

    it('7d — excludes projects older than 7 days', () => {
      const { result } = renderHook(() => useProjectSearch(projects));
      act(() => { result.current.setFilter('7d'); });
      const ids = result.current.filtered.map((p) => p.id);
      expect(ids).toContain('p1'); // 6 days ago → within
      expect(ids).not.toContain('p2'); // 8 days ago → outside
      expect(ids).not.toContain('p3'); // 31 days ago → outside
    });

    it('30d — excludes projects older than 30 days', () => {
      const { result } = renderHook(() => useProjectSearch(projects));
      act(() => { result.current.setFilter('30d'); });
      const ids = result.current.filtered.map((p) => p.id);
      expect(ids).toContain('p1');
      expect(ids).toContain('p2'); // 8 days ago → within 30d
      expect(ids).not.toContain('p3'); // 31 days ago → outside
    });

    it('mine — returns only current user projects', () => {
      const { result } = renderHook(() => useProjectSearch(projects, 'u1'));
      act(() => { result.current.setFilter('mine'); });
      const ids = result.current.filtered.map((p) => p.id);
      expect(ids).toEqual(['p1', 'p3', 'p5']);
    });

    it('mine with no currentUserId returns empty when no user context', () => {
      // No currentUserId → filter is a no-op, all projects returned
      const { result } = renderHook(() => useProjectSearch(projects));
      act(() => { result.current.setFilter('mine'); });
      expect(result.current.filtered).toHaveLength(0);
    });

    it('null updatedAt is handled gracefully in time filters', () => {
      const { result } = renderHook(() => useProjectSearch(projects));
      act(() => { result.current.setFilter('7d'); });
      // project with null updatedAt should not crash, just be excluded from 7d filter
      const ids = result.current.filtered.map((p) => p.id);
      expect(ids).not.toContain('p5');
    });
  });

  describe('sort', () => {
    it('updatedAt-desc — newest first (null updatedAt treated as oldest)', () => {
      const { result } = renderHook(() => useProjectSearch(projects));
      act(() => { result.current.setSort('updatedAt-desc'); });
      // p4=now, p1=6d, p2=8d, p3=31d, p5=undefined(0)
      expect(result.current.filtered[0].id).toBe('p4'); // now
      expect(result.current.filtered[4].id).toBe('p5'); // undefined → treated as 0 → last
    });

    it('updatedAt-asc — oldest first (null updatedAt treated as oldest)', () => {
      const { result } = renderHook(() => useProjectSearch(projects));
      act(() => { result.current.setSort('updatedAt-asc'); });
      expect(result.current.filtered[0].id).toBe('p5'); // undefined → 0 → first
      expect(result.current.filtered[4].id).toBe('p4'); // now → last
    });

    it('name-asc — alphabetical', () => {
      const { result } = renderHook(() => useProjectSearch(projects));
      act(() => { result.current.setSort('name-asc'); });
      expect(result.current.filtered.map((p) => p.name)).toEqual([
        'Alpha Project',
        'Beta Project',
        'Delta Portal',
        'Gamma',
        'Old Archived',
      ]);
    });

    it('name-desc — reverse alphabetical', () => {
      const { result } = renderHook(() => useProjectSearch(projects));
      act(() => { result.current.setSort('name-desc'); });
      expect(result.current.filtered[0].name).toBe('Old Archived');
      expect(result.current.filtered[4].name).toBe('Alpha Project');
    });
  });

  describe('combined', () => {
    it('combined: search + filter + sort', () => {
      const { result } = renderHook(() => useProjectSearch(projects, 'u1'));
      act(() => { result.current.setSearch('project'); });
      act(() => { result.current.setFilter('7d'); });
      act(() => { result.current.setSort('name-asc'); });
      // userId=u1 + contains 'project' + within 7d = Alpha Project (p1)
      expect(result.current.filtered.map((p) => p.id)).toEqual(['p1']);
    });

    it('default state is all/updatedAt-desc', () => {
      const { result } = renderHook(() => useProjectSearch(projects));
      expect(result.current.filter).toBe('all');
      expect(result.current.sort).toBe('updatedAt-desc');
    });
  });
});
