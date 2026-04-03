/**
 * Proposal Index System Tests (E006)
 */
// @ts-nocheck


import {
  indexProposal,
  removeFromIndex,
  clearIndex,
  searchProposals,
  getProposal,
  getProjectProposals,
  getAgentProposals,
  getIndexStats,
  ProposalMeta,
} from '@/lib/proposal-index';

describe('Proposal Index System (E006)', () => {
  const mockProposals: ProposalMeta[] = [
    {
      id: 'prop-001',
      title: 'TypeScript Type Safety Improvement',
      agent: 'dev',
      project: 'vibex-type-safety',
      createdAt: '2026-03-19T10:00:00Z',
      tags: ['typescript', 'quality'],
      status: 'done',
      priority: 'P1',
    },
    {
      id: 'prop-002',
      title: 'Security Patch for Next.js',
      agent: 'architect',
      project: 'vibex-security',
      createdAt: '2026-03-19T11:00:00Z',
      tags: ['security', 'nextjs'],
      status: 'done',
      priority: 'P0',
    },
    {
      id: 'prop-003',
      title: 'Homepage Flow Redesign',
      agent: 'dev',
      project: 'vibex-homepage',
      createdAt: '2026-03-18T09:00:00Z',
      tags: ['ui', 'redesign'],
      status: 'in-progress',
      priority: 'P1',
    },
    {
      id: 'prop-004',
      title: 'API Retry Circuit Breaker',
      agent: 'analyst',
      project: 'vibex-api-resilience',
      createdAt: '2026-03-17T14:00:00Z',
      tags: ['api', 'resilience'],
      status: 'done',
      priority: 'P1',
    },
  ];

  beforeEach(() => {
    clearIndex();
    mockProposals.forEach(indexProposal);
  });

  describe('indexProposal', () => {
    it('should index a proposal', () => {
      const proposal: ProposalMeta = {
        id: 'test-001',
        title: 'Test Proposal',
        agent: 'dev',
        project: 'test',
        createdAt: '2026-03-19T12:00:00Z',
        tags: ['test'],
      };
      
      indexProposal(proposal);
      expect(getProposal('test-001')).toEqual(proposal);
    });
  });

  describe('removeFromIndex', () => {
    it('should remove a proposal from index', () => {
      expect(removeFromIndex('prop-001')).toBe(true);
      expect(getProposal('prop-001')).toBeUndefined();
    });

    it('should return false for non-existent proposal', () => {
      expect(removeFromIndex('non-existent')).toBe(false);
    });
  });

  describe('searchProposals', () => {
    it('should return all proposals with empty query', () => {
      const result = searchProposals();
      expect(result.items.length).toBe(4);
      expect(result.total).toBe(4);
    });

    it('should search by title text', () => {
      const result = searchProposals({ query: 'typescript' });
      expect(result.items.length).toBe(1);
      expect(result.items[0].title).toContain('TypeScript');
    });

    it('should search by tag', () => {
      const result = searchProposals({ query: 'security' });
      expect(result.items.length).toBe(1);
      expect(result.items[0].title).toContain('Security');
    });

    it('should filter by agent', () => {
      const result = searchProposals({ agent: 'dev' });
      expect(result.items.length).toBe(2);
      expect(result.items.every(p => p.agent === 'dev')).toBe(true);
    });

    it('should filter by project', () => {
      const result = searchProposals({ project: 'vibex-homepage' });
      expect(result.items.length).toBe(1);
      expect(result.items[0].project).toBe('vibex-homepage');
    });

    it('should filter by tags', () => {
      const result = searchProposals({ tags: ['api'] });
      expect(result.items.length).toBe(1);
      expect(result.items[0].tags).toContain('api');
    });

    it('should filter by date range', () => {
      const result = searchProposals({
        dateFrom: '2026-03-19T00:00:00Z',
        dateTo: '2026-03-19T23:59:59Z',
      });
      expect(result.items.length).toBe(2);
    });

    it('should support pagination with limit and offset', () => {
      const result = searchProposals({ limit: 2, offset: 0 });
      expect(result.items.length).toBe(2);
      expect(result.total).toBe(4);
    });

    it('should complete search in < 500ms', () => {
      const result = searchProposals({ query: 'proposal' });
      expect(result.searchTime).toBeLessThan(500);
    });

    it('should calculate accuracy', () => {
      const result = searchProposals({ query: 'typescript' });
      expect(result.accuracy).toBe(95);
    });
  });

  describe('getProjectProposals', () => {
    it('should get all proposals for a project', () => {
      const results = getProjectProposals('vibex-type-safety');
      expect(results.length).toBe(1);
      expect(results[0].id).toBe('prop-001');
    });
  });

  describe('getAgentProposals', () => {
    it('should get all proposals for an agent', () => {
      const results = getAgentProposals('dev');
      expect(results.length).toBe(2);
    });
  });

  describe('getIndexStats', () => {
    it('should return correct statistics', () => {
      const stats = getIndexStats();
      
      expect(stats.totalCount).toBe(4);
      expect(stats.agentCounts['dev']).toBe(2);
      expect(stats.agentCounts['architect']).toBe(1);
      expect(stats.agentCounts['analyst']).toBe(1);
      expect(stats.projectCounts['vibex-type-safety']).toBe(1);
    });
  });

  describe('Performance', () => {
    it('should handle 1000 proposals efficiently', () => {
      clearIndex();
      
      // Index 1000 proposals
      for (let i = 0; i < 1000; i++) {
        indexProposal({
          id: `prop-${i}`,
          title: `Proposal ${i}`,
          agent: `agent-${i % 10}`,
          project: `project-${i % 50}`,
          createdAt: new Date().toISOString(),
          tags: [`tag-${i % 100}`],
        });
      }
      
      const result = searchProposals({ query: 'Proposal 500' });
      expect(result.searchTime).toBeLessThan(500);
    });
  });
});
