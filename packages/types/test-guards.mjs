/**
 * test-guards.mjs — Simple Node.js test runner for @vibex/types guard functions
 *
 * Usage: node test-guards.mjs
 * Requires: guards.js built (pnpm build)
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Dynamically import the built guards
const guards = await import('./dist/guards.js');

// Simple test runner
let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
    passed++;
  } catch (e) {
    console.log(`❌ ${name}: ${e.message}`);
    failed++;
  }
}

function expect(actual) {
  return {
    toBe(expected) {
      if (actual !== expected) throw new Error(`Expected ${expected} but got ${actual}`);
    },
    toBeNull() {
      if (actual !== null) throw new Error(`Expected null but got ${actual}`);
    },
    toBeFalsy() {
      if (actual) throw new Error(`Expected falsy but got ${actual}`);
    },
  };
}

// ============ CardTree Guards ============

console.log('\n=== CardTree Guards ===\n');

test('isCardTreeNodeStatus returns true for valid statuses', () => {
  expect(guards.isCardTreeNodeStatus('pending')).toBe(true);
  expect(guards.isCardTreeNodeStatus('in-progress')).toBe(true);
  expect(guards.isCardTreeNodeStatus('done')).toBe(true);
  expect(guards.isCardTreeNodeStatus('failed')).toBe(true);
});

test('isCardTreeNodeStatus returns false for invalid', () => {
  expect(guards.isCardTreeNodeStatus('invalid')).toBe(false);
  expect(guards.isCardTreeNodeStatus(null)).toBe(false);
  expect(guards.isCardTreeNodeStatus(undefined)).toBe(false);
  expect(guards.isCardTreeNodeStatus('')).toBe(false);
});

test('isCardTreeNode returns true for valid node', () => {
  expect(guards.isCardTreeNode({ title: 'Test', status: 'done' })).toBe(true);
});

test('isCardTreeNode returns false for invalid', () => {
  expect(guards.isCardTreeNode(null)).toBe(false);
  expect(guards.isCardTreeNode({ title: 'Test' })).toBe(false);
  expect(guards.isCardTreeNode({ status: 'done' })).toBe(false);
});

test('isCardTreeNodeChild returns true for valid child', () => {
  expect(guards.isCardTreeNodeChild({ id: 'c1', label: 'L', checked: false })).toBe(true);
});

test('isCardTreeNodeChild returns false for invalid', () => {
  expect(guards.isCardTreeNodeChild(null)).toBe(false);
  expect(guards.isCardTreeNodeChild({ id: 'c1', label: 'L' })).toBe(false);
});

test('isCardTreeVisualization returns true for valid viz', () => {
  expect(guards.isCardTreeVisualization({ nodes: [] })).toBe(true);
  expect(guards.isCardTreeVisualization({ nodes: [{ title: 't', status: 'done' }] })).toBe(true);
});

test('isCardTreeVisualization returns false for invalid', () => {
  expect(guards.isCardTreeVisualization({})).toBe(false);
  expect(guards.isCardTreeVisualization({ nodes: 'not-array' })).toBe(false);
  expect(guards.isCardTreeVisualization(null)).toBe(false);
});

// ============ Team-Tasks Guards ============

console.log('\n=== Team-Tasks Guards ===\n');

test('isTaskStage returns true for valid stage', () => {
  expect(guards.isTaskStage({})).toBe(true);
  expect(guards.isTaskStage({ agent: 'dev', status: 'done' })).toBe(true);
});

test('isTaskStage returns false for non-object', () => {
  expect(guards.isTaskStage('string')).toBe(false);
  expect(guards.isTaskStage(null)).toBe(false);
});

test('isTeamTaskProject returns true for valid project', () => {
  expect(guards.isTeamTaskProject({ project: 'canvas' })).toBe(true);
  expect(guards.isTeamTaskProject({ project: 'canvas', goal: 'build' })).toBe(true);
});

test('isTeamTaskProject returns false for invalid', () => {
  expect(guards.isTeamTaskProject({ goal: 'build' })).toBe(false);
  expect(guards.isTeamTaskProject({ project: 123 })).toBe(false);
  expect(guards.isTeamTaskProject(null)).toBe(false);
});

// ============ API / Domain Guards ============

console.log('\n=== API / Domain Guards ===\n');

test('isBoundedContextType returns true for valid types', () => {
  expect(guards.isBoundedContextType('core')).toBe(true);
  expect(guards.isBoundedContextType('supporting')).toBe(true);
  expect(guards.isBoundedContextType('generic')).toBe(true);
  expect(guards.isBoundedContextType('external')).toBe(true);
});

test('isBoundedContextType returns false for invalid', () => {
  expect(guards.isBoundedContextType('invalid')).toBe(false);
  expect(guards.isBoundedContextType(null)).toBe(false);
  expect(guards.isBoundedContextType('')).toBe(false);
});

test('isContextRelationshipType returns true for valid types', () => {
  expect(guards.isContextRelationshipType('upstream')).toBe(true);
  expect(guards.isContextRelationshipType('downstream')).toBe(true);
  expect(guards.isContextRelationshipType('symmetric')).toBe(true);
});

test('isContextRelationshipType returns false for invalid', () => {
  expect(guards.isContextRelationshipType('invalid')).toBe(false);
  expect(guards.isContextRelationshipType(null)).toBe(false);
});

test('isContextRelationship returns true for valid relationship', () => {
  expect(guards.isContextRelationship({ id: 'r1', fromContextId: 'c1', toContextId: 'c2', type: 'upstream', description: '' })).toBe(true);
});

test('isContextRelationship returns false for invalid', () => {
  expect(guards.isContextRelationship({ id: 'r1', fromContextId: 'c1', type: 'upstream', description: '' })).toBe(false);
  expect(guards.isContextRelationship(null)).toBe(false);
});

test('isBoundedContext returns true for valid context', () => {
  expect(guards.isBoundedContext({ id: 'ctx1', name: 'Test', type: 'core', relationships: [], description: '' })).toBe(true);
});

test('isBoundedContext returns false for invalid', () => {
  expect(guards.isBoundedContext({ name: 'Test', type: 'core', relationships: [], description: '' })).toBe(false);
  expect(guards.isBoundedContext(null)).toBe(false);
});

test('isDedupLevel returns true for valid levels', () => {
  expect(guards.isDedupLevel('block')).toBe(true);
  expect(guards.isDedupLevel('warn')).toBe(true);
  expect(guards.isDedupLevel('pass')).toBe(true);
});

test('isDedupLevel returns false for invalid', () => {
  expect(guards.isDedupLevel('strict')).toBe(false);
  expect(guards.isDedupLevel(null)).toBe(false);
  expect(guards.isDedupLevel('')).toBe(false);
});

test('isDedupCandidate returns true for valid candidate', () => {
  expect(guards.isDedupCandidate({ name: 'Similar', similarity: 0.85, matchType: 'exact' })).toBe(true);
});

test('isDedupCandidate returns false for invalid', () => {
  expect(guards.isDedupCandidate({ name: 'Similar', similarity: 0.85 })).toBe(false);
  expect(guards.isDedupCandidate(null)).toBe(false);
});

test('isDedupResult returns true for valid result', () => {
  expect(guards.isDedupResult({ level: 'warn', candidates: [], message: 'ok' })).toBe(true);
});

test('isDedupResult returns false for invalid', () => {
  expect(guards.isDedupResult({ level: 'warn', candidates: [] })).toBe(false);
  expect(guards.isDedupResult(null)).toBe(false);
});

// ============ Event Guards ============

console.log('\n=== Event Guards ===\n');

test('isAppEvent returns true for valid event', () => {
  expect(guards.isAppEvent({ type: 'test', payload: {} })).toBe(true);
});

test('isAppEvent returns false for invalid', () => {
  expect(guards.isAppEvent({ type: 'test' })).toBe(false);
  expect(guards.isAppEvent(null)).toBe(false);
});

test('isCardTreeNodeStatusChanged returns true for valid event', () => {
  expect(guards.isCardTreeNodeStatusChanged({ nodeId: 'n1', oldStatus: 'a', newStatus: 'b' })).toBe(true);
});

test('isCardTreeNodeStatusChanged returns false for invalid', () => {
  expect(guards.isCardTreeNodeStatusChanged({ nodeId: 'n1', oldStatus: 'a' })).toBe(false);
  expect(guards.isCardTreeNodeStatusChanged(null)).toBe(false);
});

test('isCardTreeNodeCheckedChanged returns true for valid event', () => {
  expect(guards.isCardTreeNodeCheckedChanged({ nodeId: 'n1', childId: 'c1', checked: true })).toBe(true);
});

test('isCardTreeNodeCheckedChanged returns false for invalid', () => {
  expect(guards.isCardTreeNodeCheckedChanged({ nodeId: 'n1', childId: 'c1' })).toBe(false);
  expect(guards.isCardTreeNodeCheckedChanged(null)).toBe(false);
});

test('isCardTreeLoaded returns true for valid event', () => {
  expect(guards.isCardTreeLoaded({ nodeCount: 5 })).toBe(true);
  expect(guards.isCardTreeLoaded({ projectId: 'p1', nodeCount: 5 })).toBe(true);
});

test('isCardTreeLoaded returns false for invalid', () => {
  expect(guards.isCardTreeLoaded({})).toBe(false);
  expect(guards.isCardTreeLoaded(null)).toBe(false);
});

test('isDedupScanStarted returns true for valid event', () => {
  expect(guards.isDedupScanStarted({ scanPath: '/src', timestamp: '2024-01-01' })).toBe(true);
});

test('isDedupScanStarted returns false for invalid', () => {
  expect(guards.isDedupScanStarted({ scanPath: '/src' })).toBe(false);
  expect(guards.isDedupScanStarted(null)).toBe(false);
});

test('isDedupScanCompleted returns true for valid event', () => {
  expect(guards.isDedupScanCompleted({ scanPath: '/src', results: [] })).toBe(true);
});

test('isDedupScanCompleted returns false for invalid', () => {
  expect(guards.isDedupScanCompleted({ scanPath: '/src' })).toBe(false);
  expect(guards.isDedupScanCompleted(null)).toBe(false);
});

// ============ Summary ============

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
process.exit(failed > 0 ? 1 : 0);
