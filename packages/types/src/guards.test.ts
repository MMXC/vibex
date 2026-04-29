/**
 * @fileoverview Unit tests for type guard functions
 */

import { describe, it, expect } from '@jest/globals';
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
      expect(isCardTreeNodeStatus(123)).toBe(false);
    });
  });

  describe('isCardTreeNode', () => {
    it('returns true for valid CardTreeNode', () => {
      const node = { title: 'Test', status: 'pending', description: 'desc' };
      expect(isCardTreeNode(node)).toBe(true);
    });
    it('returns false for null', () => { expect(isCardTreeNode(null)).toBe(false); });
    it('returns false for object without title', () => {
      expect(isCardTreeNode({ status: 'pending' })).toBe(false);
    });
    it('returns false for object without status', () => {
      expect(isCardTreeNode({ title: 'Test' })).toBe(false);
    });
  });

  describe('isCardTreeNodeChild', () => {
    it('returns true for valid child', () => {
      const child = { id: 'c1', label: 'Label', checked: false };
      expect(isCardTreeNodeChild(child)).toBe(true);
    });
    it('returns false for missing fields', () => {
      expect(isCardTreeNodeChild({ id: 'c1', label: 'L' })).toBe(false);
      expect(isCardTreeNodeChild({ id: 'c1', checked: false })).toBe(false);
    });
  });

  describe('isCardTreeVisualization', () => {
    it('returns true for valid visualization', () => {
      const viz = { nodes: [{ title: 't', status: 'done' }] };
      expect(isCardTreeVisualization(viz)).toBe(true);
    });
    it('returns false for missing nodes array', () => {
      expect(isCardTreeVisualization({})).toBe(false);
    });
    it('returns false for non-array nodes', () => {
      expect(isCardTreeVisualization({ nodes: 'not-array' })).toBe(false);
    });
  });
});

describe('Team-Tasks Guards', () => {
  describe('isTaskStage', () => {
    it('returns true for valid TaskStage', () => {
      expect(isTaskStage({})).toBe(true);
      expect(isTaskStage({ agent: 'dev', status: 'done' })).toBe(true);
    });
    it('returns false for null', () => { expect(isTaskStage(null)).toBe(false); });
    it('returns false for non-object', () => {
      expect(isTaskStage('string')).toBe(false);
      expect(isTaskStage(42)).toBe(false);
    });
  });

  describe('isTeamTaskProject', () => {
    it('returns true for valid project', () => {
      expect(isTeamTaskProject({ project: 'canvas' })).toBe(true);
      expect(isTeamTaskProject({ project: 'canvas', goal: 'build something' })).toBe(true);
    });
    it('returns false for missing project field', () => {
      expect(isTeamTaskProject({ goal: 'build' })).toBe(false);
    });
    it('returns false for non-string project', () => {
      expect(isTeamTaskProject({ project: 123 })).toBe(false);
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
    });
  });

  describe('isContextRelationship', () => {
    it('returns true for valid relationship', () => {
      const rel = { id: 'r1', fromContextId: 'c1', toContextId: 'c2', type: 'upstream', description: '' };
      expect(isContextRelationship(rel)).toBe(true);
    });
    it('returns false for invalid', () => {
      expect(isContextRelationship({ id: 'r1', fromContextId: 'c1', type: 'upstream' })).toBe(false);
      expect(isContextRelationship(null)).toBe(false);
    });
  });

  describe('isBoundedContext', () => {
    it('returns true for valid BoundedContext', () => {
      const ctx = { id: 'ctx1', name: 'Test', type: 'core', relationships: [], description: '' };
      expect(isBoundedContext(ctx)).toBe(true);
    });
    it('returns false for missing fields', () => {
      expect(isBoundedContext({ name: 'Test', type: 'core', relationships: [] })).toBe(false);
      expect(isBoundedContext(null)).toBe(false);
    });
  });

  describe('isDedupLevel', () => {
    it('returns true for valid levels', () => {
      expect(isDedupLevel('block')).toBe(true);
      expect(isDedupLevel('warn')).toBe(true);
      expect(isDedupLevel('pass')).toBe(true);
    });
    it('returns false for invalid', () => {
      expect(isDedupLevel('error')).toBe(false);
    });
  });

  describe('isDedupCandidate', () => {
    it('returns true for valid candidate', () => {
      const cand = { name: 'Similar', similarity: 0.85, matchType: 'exact' };
      expect(isDedupCandidate(cand)).toBe(true);
    });
    it('returns false for invalid', () => {
      expect(isDedupCandidate({ name: 'Similar' })).toBe(false);
    });
  });

  describe('isDedupResult', () => {
    it('returns true for valid result', () => {
      const result = { level: 'warn', candidates: [], message: 'ok' };
      expect(isDedupResult(result)).toBe(true);
    });
    it('returns false for invalid', () => {
      expect(isDedupResult({ level: 'warn', candidates: [] })).toBe(false);
    });
  });
});

describe('Event Guards', () => {
  describe('isAppEvent', () => {
    it('returns true for valid event', () => {
      expect(isAppEvent({ type: 'test', payload: {} })).toBe(true);
    });
    it('returns false for invalid', () => {
      expect(isAppEvent({ type: 'test' })).toBe(false);
      expect(isAppEvent(null)).toBe(false);
    });
  });

  describe('isCardTreeNodeStatusChanged', () => {
    it('returns true for valid event', () => {
      expect(isCardTreeNodeStatusChanged({ nodeId: 'n1', oldStatus: 'a', newStatus: 'b' })).toBe(true);
    });
    it('returns false for invalid', () => {
      expect(isCardTreeNodeStatusChanged({ nodeId: 'n1', oldStatus: 'a' })).toBe(false);
    });
  });

  describe('isCardTreeNodeCheckedChanged', () => {
    it('returns true for valid event', () => {
      expect(isCardTreeNodeCheckedChanged({ nodeId: 'n1', childId: 'c1', checked: true })).toBe(true);
    });
    it('returns false for invalid', () => {
      expect(isCardTreeNodeCheckedChanged({ nodeId: 'n1', childId: 'c1' })).toBe(false);
    });
  });

  describe('isCardTreeLoaded', () => {
    it('returns true for valid event', () => {
      expect(isCardTreeLoaded({ nodeCount: 5 })).toBe(true);
      expect(isCardTreeLoaded({ projectId: 'p1', nodeCount: 5 })).toBe(true);
    });
    it('returns false for invalid', () => {
      expect(isCardTreeLoaded({})).toBe(false);
    });
  });

  describe('isDedupScanStarted', () => {
    it('returns true for valid event', () => {
      expect(isDedupScanStarted({ scanPath: '/src', timestamp: '2024-01-01' })).toBe(true);
    });
    it('returns false for invalid', () => {
      expect(isDedupScanStarted({ scanPath: '/src' })).toBe(false);
    });
  });

  describe('isDedupScanCompleted', () => {
    it('returns true for valid event', () => {
      expect(isDedupScanCompleted({ scanPath: '/src', results: [] })).toBe(true);
    });
    it('returns false for invalid', () => {
      expect(isDedupScanCompleted({ scanPath: '/src' })).toBe(false);
    });
  });
});
