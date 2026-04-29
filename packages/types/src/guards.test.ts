/**
 * @fileoverview Unit tests for @vibex/types guard functions
 *
 * Part of: E18-QUALITY-1 test coverage ≥ 80%
 */

// Vitest provides globals; no import needed
import {
  isCardTreeNodeStatus,
  isCardTreeNode,
  isCardTreeNodeChild,
  isCardTreeVisualization,
  isTaskStage,
  isTeamTaskProject,
  isBoundedContextType,
  isContextRelationshipType,
  isContextRelationship,
  isBoundedContext,
  isDedupLevel,
  isDedupCandidate,
  isDedupResult,
  isAppEvent,
  isCardTreeNodeStatusChanged,
  isCardTreeNodeCheckedChanged,
  isCardTreeLoaded,
  isDedupScanStarted,
  isDedupScanCompleted,
} from './guards.js';

describe('CardTree Guards', () => {
  describe('isCardTreeNodeStatus', () => {
    it('returns true for valid statuses', () => {
      expect(isCardTreeNodeStatus('pending')).toBe(true);
      expect(isCardTreeNodeStatus('in-progress')).toBe(true);
      expect(isCardTreeNodeStatus('done')).toBe(true);
      expect(isCardTreeNodeStatus('failed')).toBe(true);
    });

    it('returns false for invalid values', () => {
      expect(isCardTreeNodeStatus('unknown')).toBe(false);
      expect(isCardTreeNodeStatus(null)).toBe(false);
      expect(isCardTreeNodeStatus(undefined)).toBe(false);
      expect(isCardTreeNodeStatus({})).toBe(false);
      expect(isCardTreeNodeStatus('')).toBe(false);
      expect(isCardTreeNodeStatus(123)).toBe(false);
    });
  });

  describe('isCardTreeNode', () => {
    it('returns true for valid CardTreeNode', () => {
      const node = { title: 'Test', status: 'pending', description: 'desc' };
      expect(isCardTreeNode(node)).toBe(true);
    });

    it('returns true for node with optional fields', () => {
      const node = { title: 'Test', status: 'done', description: 'desc', icon: '🎯', children: [] };
      expect(isCardTreeNode(node)).toBe(true);
    });

    it('returns false for null', () => {
      expect(isCardTreeNode(null)).toBe(false);
    });

    it('returns false for undefined', () => {
      expect(isCardTreeNode(undefined)).toBe(false);
    });

    it('returns false for object without title', () => {
      expect(isCardTreeNode({ status: 'pending' })).toBe(false);
    });

    it('returns false for object without status', () => {
      expect(isCardTreeNode({ title: 'Test' })).toBe(false);
    });

    it('returns false for empty object', () => {
      expect(isCardTreeNode({})).toBe(false);
    });

    it('returns false for non-object', () => {
      expect(isCardTreeNode('string')).toBe(false);
      expect(isCardTreeNode(42)).toBe(false);
    });
  });

  describe('isCardTreeNodeChild', () => {
    it('returns true for valid child', () => {
      const child = { id: 'c1', label: 'Label', checked: false };
      expect(isCardTreeNodeChild(child)).toBe(true);
    });

    it('returns true for child with optional description', () => {
      const child = { id: 'c1', label: 'Label', checked: true, description: 'desc' };
      expect(isCardTreeNodeChild(child)).toBe(true);
    });

    it('returns false for null', () => {
      expect(isCardTreeNodeChild(null)).toBe(false);
    });

    it('returns false for object missing id', () => {
      expect(isCardTreeNodeChild({ label: 'Label', checked: false })).toBe(false);
    });

    it('returns false for object missing label', () => {
      expect(isCardTreeNodeChild({ id: 'c1', checked: false })).toBe(false);
    });

    it('returns false for object missing checked', () => {
      expect(isCardTreeNodeChild({ id: 'c1', label: 'Label' })).toBe(false);
    });
  });

  describe('isCardTreeVisualization', () => {
    it('returns true for valid visualization', () => {
      const viz = { nodes: [{ title: 't', status: 'done' }] };
      expect(isCardTreeVisualization(viz)).toBe(true);
    });

    it('returns true with optional fields', () => {
      const viz = { nodes: [], projectId: 'p1', name: 'project' };
      expect(isCardTreeVisualization(viz)).toBe(true);
    });

    it('returns false for missing nodes', () => {
      expect(isCardTreeVisualization({})).toBe(false);
    });

    it('returns false for non-array nodes', () => {
      expect(isCardTreeVisualization({ nodes: 'not-array' })).toBe(false);
      expect(isCardTreeVisualization({ nodes: { 0: 'x' } })).toBe(false);
    });

    it('returns false for null', () => {
      expect(isCardTreeVisualization(null)).toBe(false);
    });
  });
});

describe('Team-Tasks Guards', () => {
  describe('isTaskStage', () => {
    it('returns true for empty object', () => {
      expect(isTaskStage({})).toBe(true);
    });

    it('returns true for valid TaskStage', () => {
      const stage = { agent: 'dev', status: 'done', task: 'build', startedAt: '2024-01-01' };
      expect(isTaskStage(stage)).toBe(true);
    });

    it('returns false for null', () => {
      expect(isTaskStage(null)).toBe(false);
    });

    it('returns false for non-object', () => {
      expect(isTaskStage('string')).toBe(false);
      expect(isTaskStage(42)).toBe(false);
    });

    it('returns true for arrays (arrays are objects in JS)', () => {
      expect(isTaskStage([])).toBe(true);
    });
  });

  describe('isTeamTaskProject', () => {
    it('returns true for minimal valid project', () => {
      expect(isTeamTaskProject({ project: 'canvas' })).toBe(true);
    });

    it('returns true for full project', () => {
      const proj = { project: 'canvas', goal: 'build', status: 'active', mode: 'parallel' };
      expect(isTeamTaskProject(proj)).toBe(true);
    });

    it('returns false for missing project field', () => {
      expect(isTeamTaskProject({ goal: 'build' })).toBe(false);
    });

    it('returns false for non-string project', () => {
      expect(isTeamTaskProject({ project: 123 })).toBe(false);
      expect(isTeamTaskProject({ project: null })).toBe(false);
    });

    it('returns false for null', () => {
      expect(isTeamTaskProject(null)).toBe(false);
    });
  });
});

describe('API / Domain Guards', () => {
  describe('isBoundedContextType', () => {
    it('returns true for valid types', () => {
      expect(isBoundedContextType('core')).toBe(true);
      expect(isBoundedContextType('supporting')).toBe(true);
      expect(isBoundedContextType('generic')).toBe(true);
      expect(isBoundedContextType('external')).toBe(true);
    });

    it('returns false for invalid types', () => {
      expect(isBoundedContextType('invalid')).toBe(false);
      expect(isBoundedContextType(null)).toBe(false);
      expect(isBoundedContextType(undefined)).toBe(false);
      expect(isBoundedContextType('')).toBe(false);
      expect(isBoundedContextType(123)).toBe(false);
    });
  });

  describe('isContextRelationshipType', () => {
    it('returns true for valid types', () => {
      expect(isContextRelationshipType('upstream')).toBe(true);
      expect(isContextRelationshipType('downstream')).toBe(true);
      expect(isContextRelationshipType('symmetric')).toBe(true);
    });

    it('returns false for invalid types', () => {
      expect(isContextRelationshipType('invalid')).toBe(false);
      expect(isContextRelationshipType(null)).toBe(false);
      expect(isContextRelationshipType(undefined)).toBe(false);
      expect(isContextRelationshipType('')).toBe(false);
    });
  });

  describe('isContextRelationship', () => {
    it('returns true for valid relationship', () => {
      const rel = { id: 'r1', fromContextId: 'c1', toContextId: 'c2', type: 'upstream', description: '' };
      expect(isContextRelationship(rel)).toBe(true);
    });

    it('returns false for missing toContextId', () => {
      const rel = { id: 'r1', fromContextId: 'c1', type: 'upstream', description: '' };
      expect(isContextRelationship(rel)).toBe(false);
    });

    it('returns false for null', () => {
      expect(isContextRelationship(null)).toBe(false);
    });

    it('returns false for non-object', () => {
      expect(isContextRelationship('string')).toBe(false);
    });
  });

  describe('isBoundedContext', () => {
    it('returns true for valid BoundedContext', () => {
      const ctx = { id: 'ctx1', name: 'Test', type: 'core', relationships: [], description: '' };
      expect(isBoundedContext(ctx)).toBe(true);
    });

    it('returns false for missing id', () => {
      const ctx = { name: 'Test', type: 'core', relationships: [], description: '' };
      expect(isBoundedContext(ctx)).toBe(false);
    });

    it('returns false for missing name', () => {
      const ctx = { id: 'ctx1', type: 'core', relationships: [], description: '' };
      expect(isBoundedContext(ctx)).toBe(false);
    });

    it('returns false for missing type', () => {
      const ctx = { id: 'ctx1', name: 'Test', relationships: [], description: '' };
      expect(isBoundedContext(ctx)).toBe(false);
    });

    it('returns false for missing relationships', () => {
      const ctx = { id: 'ctx1', name: 'Test', type: 'core', description: '' };
      expect(isBoundedContext(ctx)).toBe(false);
    });

    it('returns false for null', () => {
      expect(isBoundedContext(null)).toBe(false);
    });
  });

  describe('isDedupLevel', () => {
    it('returns true for valid levels', () => {
      expect(isDedupLevel('block')).toBe(true);
      expect(isDedupLevel('warn')).toBe(true);
      expect(isDedupLevel('pass')).toBe(true);
    });

    it('returns false for invalid levels', () => {
      expect(isDedupLevel('strict')).toBe(false);
      expect(isDedupLevel('error')).toBe(false);
      expect(isDedupLevel(null)).toBe(false);
      expect(isDedupLevel('')).toBe(false);
    });
  });

  describe('isDedupCandidate', () => {
    it('returns true for valid candidate', () => {
      const cand = { name: 'Similar', similarity: 0.85, matchType: 'exact' };
      expect(isDedupCandidate(cand)).toBe(true);
    });

    it('returns true for candidate with optional reason', () => {
      const cand = { name: 'Similar', similarity: 0.85, matchType: 'exact', reason: 'exact match' };
      expect(isDedupCandidate(cand)).toBe(true);
    });

    it('returns false for missing name', () => {
      expect(isDedupCandidate({ similarity: 0.85, matchType: 'exact' })).toBe(false);
    });

    it('returns false for missing similarity', () => {
      expect(isDedupCandidate({ name: 'Similar', matchType: 'exact' })).toBe(false);
    });

    it('returns false for missing matchType', () => {
      expect(isDedupCandidate({ name: 'Similar', similarity: 0.85 })).toBe(false);
    });

    it('returns false for null', () => {
      expect(isDedupCandidate(null)).toBe(false);
    });
  });

  describe('isDedupResult', () => {
    it('returns true for valid result', () => {
      const result = { level: 'warn', candidates: [], message: 'ok' };
      expect(isDedupResult(result)).toBe(true);
    });

    it('returns false for missing level', () => {
      expect(isDedupResult({ candidates: [], message: 'ok' })).toBe(false);
    });

    it('returns false for missing candidates', () => {
      expect(isDedupResult({ level: 'warn', message: 'ok' })).toBe(false);
    });

    it('returns false for missing message', () => {
      expect(isDedupResult({ level: 'warn', candidates: [] })).toBe(false);
    });

    it('returns false for null', () => {
      expect(isDedupResult(null)).toBe(false);
    });
  });
});

describe('Event Guards', () => {
  describe('isAppEvent', () => {
    it('returns true for valid event', () => {
      expect(isAppEvent({ type: 'test', payload: {} })).toBe(true);
    });

    it('returns true with optional fields', () => {
      expect(isAppEvent({ type: 'test', payload: {}, timestamp: '2024-01-01', source: 'dev' })).toBe(true);
    });

    it('returns false for missing type', () => {
      expect(isAppEvent({ payload: {} })).toBe(false);
    });

    it('returns false for missing payload', () => {
      expect(isAppEvent({ type: 'test' })).toBe(false);
    });

    it('returns false for null', () => {
      expect(isAppEvent(null)).toBe(false);
    });
  });

  describe('isCardTreeNodeStatusChanged', () => {
    it('returns true for valid event', () => {
      const ev = { nodeId: 'n1', oldStatus: 'pending', newStatus: 'done' };
      expect(isCardTreeNodeStatusChanged(ev)).toBe(true);
    });

    it('returns true with optional projectId', () => {
      const ev = { nodeId: 'n1', oldStatus: 'pending', newStatus: 'done', projectId: 'p1' };
      expect(isCardTreeNodeStatusChanged(ev)).toBe(true);
    });

    it('returns false for missing nodeId', () => {
      expect(isCardTreeNodeStatusChanged({ oldStatus: 'a', newStatus: 'b' })).toBe(false);
    });

    it('returns false for missing oldStatus', () => {
      expect(isCardTreeNodeStatusChanged({ nodeId: 'n1', newStatus: 'b' })).toBe(false);
    });

    it('returns false for missing newStatus', () => {
      expect(isCardTreeNodeStatusChanged({ nodeId: 'n1', oldStatus: 'a' })).toBe(false);
    });
  });

  describe('isCardTreeNodeCheckedChanged', () => {
    it('returns true for valid event', () => {
      const ev = { nodeId: 'n1', childId: 'c1', checked: true };
      expect(isCardTreeNodeCheckedChanged(ev)).toBe(true);
    });

    it('returns false for missing nodeId', () => {
      expect(isCardTreeNodeCheckedChanged({ childId: 'c1', checked: true })).toBe(false);
    });

    it('returns false for missing childId', () => {
      expect(isCardTreeNodeCheckedChanged({ nodeId: 'n1', checked: true })).toBe(false);
    });

    it('returns false for missing checked', () => {
      expect(isCardTreeNodeCheckedChanged({ nodeId: 'n1', childId: 'c1' })).toBe(false);
    });
  });

  describe('isCardTreeLoaded', () => {
    it('returns true with nodeCount', () => {
      expect(isCardTreeLoaded({ nodeCount: 5 })).toBe(true);
    });

    it('returns true with optional projectId', () => {
      expect(isCardTreeLoaded({ projectId: 'p1', nodeCount: 5 })).toBe(true);
    });

    it('returns false for empty object', () => {
      expect(isCardTreeLoaded({})).toBe(false);
    });

    it('returns false for null', () => {
      expect(isCardTreeLoaded(null)).toBe(false);
    });
  });

  describe('isDedupScanStarted', () => {
    it('returns true for valid event', () => {
      const ev = { scanPath: '/src', timestamp: '2024-01-01T00:00:00Z' };
      expect(isDedupScanStarted(ev)).toBe(true);
    });

    it('returns false for missing scanPath', () => {
      expect(isDedupScanStarted({ timestamp: '2024-01-01' })).toBe(false);
    });

    it('returns false for missing timestamp', () => {
      expect(isDedupScanStarted({ scanPath: '/src' })).toBe(false);
    });

    it('returns false for null', () => {
      expect(isDedupScanStarted(null)).toBe(false);
    });
  });

  describe('isDedupScanCompleted', () => {
    it('returns true for valid event', () => {
      const ev = { scanPath: '/src', results: [] };
      expect(isDedupScanCompleted(ev)).toBe(true);
    });

    it('returns false for missing scanPath', () => {
      expect(isDedupScanCompleted({ results: [] })).toBe(false);
    });

    it('returns false for missing results', () => {
      expect(isDedupScanCompleted({ scanPath: '/src' })).toBe(false);
    });

    it('returns false for null', () => {
      expect(isDedupScanCompleted(null)).toBe(false);
    });
  });
});
