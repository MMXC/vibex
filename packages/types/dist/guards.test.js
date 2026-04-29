"use strict";
/**
 * @fileoverview Unit tests for type guard functions
 */
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const guards_js_1 = require("./guards.js");
(0, globals_1.describe)('CardTree Guards', () => {
    (0, globals_1.describe)('isCardTreeNodeStatus', () => {
        (0, globals_1.it)('returns true for valid statuses', () => {
            (0, globals_1.expect)((0, guards_js_1.isCardTreeNodeStatus)('pending')).toBe(true);
            (0, globals_1.expect)((0, guards_js_1.isCardTreeNodeStatus)('in-progress')).toBe(true);
            (0, globals_1.expect)((0, guards_js_1.isCardTreeNodeStatus)('done')).toBe(true);
            (0, globals_1.expect)((0, guards_js_1.isCardTreeNodeStatus)('failed')).toBe(true);
        });
        (0, globals_1.it)('returns false for invalid values', () => {
            (0, globals_1.expect)((0, guards_js_1.isCardTreeNodeStatus)('unknown')).toBe(false);
            (0, globals_1.expect)((0, guards_js_1.isCardTreeNodeStatus)(null)).toBe(false);
            (0, globals_1.expect)((0, guards_js_1.isCardTreeNodeStatus)(123)).toBe(false);
        });
    });
    (0, globals_1.describe)('isCardTreeNode', () => {
        (0, globals_1.it)('returns true for valid CardTreeNode', () => {
            const node = { title: 'Test', status: 'pending', description: 'desc' };
            (0, globals_1.expect)((0, guards_js_1.isCardTreeNode)(node)).toBe(true);
        });
        (0, globals_1.it)('returns false for null', () => { (0, globals_1.expect)((0, guards_js_1.isCardTreeNode)(null)).toBe(false); });
        (0, globals_1.it)('returns false for object without title', () => {
            (0, globals_1.expect)((0, guards_js_1.isCardTreeNode)({ status: 'pending' })).toBe(false);
        });
        (0, globals_1.it)('returns false for object without status', () => {
            (0, globals_1.expect)((0, guards_js_1.isCardTreeNode)({ title: 'Test' })).toBe(false);
        });
    });
    (0, globals_1.describe)('isCardTreeNodeChild', () => {
        (0, globals_1.it)('returns true for valid child', () => {
            const child = { id: 'c1', label: 'Label', checked: false };
            (0, globals_1.expect)((0, guards_js_1.isCardTreeNodeChild)(child)).toBe(true);
        });
        (0, globals_1.it)('returns false for missing fields', () => {
            (0, globals_1.expect)((0, guards_js_1.isCardTreeNodeChild)({ id: 'c1', label: 'L' })).toBe(false);
            (0, globals_1.expect)((0, guards_js_1.isCardTreeNodeChild)({ id: 'c1', checked: false })).toBe(false);
        });
    });
    (0, globals_1.describe)('isCardTreeVisualization', () => {
        (0, globals_1.it)('returns true for valid visualization', () => {
            const viz = { nodes: [{ title: 't', status: 'done' }] };
            (0, globals_1.expect)((0, guards_js_1.isCardTreeVisualization)(viz)).toBe(true);
        });
        (0, globals_1.it)('returns false for missing nodes array', () => {
            (0, globals_1.expect)((0, guards_js_1.isCardTreeVisualization)({})).toBe(false);
        });
        (0, globals_1.it)('returns false for non-array nodes', () => {
            (0, globals_1.expect)((0, guards_js_1.isCardTreeVisualization)({ nodes: 'not-array' })).toBe(false);
        });
    });
});
(0, globals_1.describe)('Team-Tasks Guards', () => {
    (0, globals_1.describe)('isTaskStage', () => {
        (0, globals_1.it)('returns true for valid TaskStage', () => {
            (0, globals_1.expect)((0, guards_js_1.isTaskStage)({})).toBe(true);
            (0, globals_1.expect)((0, guards_js_1.isTaskStage)({ agent: 'dev', status: 'done' })).toBe(true);
        });
        (0, globals_1.it)('returns false for null', () => { (0, globals_1.expect)((0, guards_js_1.isTaskStage)(null)).toBe(false); });
        (0, globals_1.it)('returns false for non-object', () => {
            (0, globals_1.expect)((0, guards_js_1.isTaskStage)('string')).toBe(false);
            (0, globals_1.expect)((0, guards_js_1.isTaskStage)(42)).toBe(false);
        });
    });
    (0, globals_1.describe)('isTeamTaskProject', () => {
        (0, globals_1.it)('returns true for valid project', () => {
            (0, globals_1.expect)((0, guards_js_1.isTeamTaskProject)({ project: 'canvas' })).toBe(true);
            (0, globals_1.expect)((0, guards_js_1.isTeamTaskProject)({ project: 'canvas', goal: 'build something' })).toBe(true);
        });
        (0, globals_1.it)('returns false for missing project field', () => {
            (0, globals_1.expect)((0, guards_js_1.isTeamTaskProject)({ goal: 'build' })).toBe(false);
        });
        (0, globals_1.it)('returns false for non-string project', () => {
            (0, globals_1.expect)((0, guards_js_1.isTeamTaskProject)({ project: 123 })).toBe(false);
        });
    });
});
(0, globals_1.describe)('API / Domain Guards', () => {
    (0, globals_1.describe)('isBoundedContextType', () => {
        (0, globals_1.it)('returns true for valid types', () => {
            (0, globals_1.expect)((0, guards_js_1.isBoundedContextType)('core')).toBe(true);
            (0, globals_1.expect)((0, guards_js_1.isBoundedContextType)('supporting')).toBe(true);
            (0, globals_1.expect)((0, guards_js_1.isBoundedContextType)('generic')).toBe(true);
            (0, globals_1.expect)((0, guards_js_1.isBoundedContextType)('external')).toBe(true);
        });
        (0, globals_1.it)('returns false for invalid types', () => {
            (0, globals_1.expect)((0, guards_js_1.isBoundedContextType)('invalid')).toBe(false);
            (0, globals_1.expect)((0, guards_js_1.isBoundedContextType)(null)).toBe(false);
        });
    });
    (0, globals_1.describe)('isContextRelationshipType', () => {
        (0, globals_1.it)('returns true for valid types', () => {
            (0, globals_1.expect)((0, guards_js_1.isContextRelationshipType)('upstream')).toBe(true);
            (0, globals_1.expect)((0, guards_js_1.isContextRelationshipType)('downstream')).toBe(true);
            (0, globals_1.expect)((0, guards_js_1.isContextRelationshipType)('symmetric')).toBe(true);
        });
        (0, globals_1.it)('returns false for invalid types', () => {
            (0, globals_1.expect)((0, guards_js_1.isContextRelationshipType)('invalid')).toBe(false);
        });
    });
    (0, globals_1.describe)('isContextRelationship', () => {
        (0, globals_1.it)('returns true for valid relationship', () => {
            const rel = { id: 'r1', fromContextId: 'c1', toContextId: 'c2', type: 'upstream', description: '' };
            (0, globals_1.expect)((0, guards_js_1.isContextRelationship)(rel)).toBe(true);
        });
        (0, globals_1.it)('returns false for invalid', () => {
            (0, globals_1.expect)((0, guards_js_1.isContextRelationship)({ id: 'r1', fromContextId: 'c1', type: 'upstream' })).toBe(false);
            (0, globals_1.expect)((0, guards_js_1.isContextRelationship)(null)).toBe(false);
        });
    });
    (0, globals_1.describe)('isBoundedContext', () => {
        (0, globals_1.it)('returns true for valid BoundedContext', () => {
            const ctx = { id: 'ctx1', name: 'Test', type: 'core', relationships: [], description: '' };
            (0, globals_1.expect)((0, guards_js_1.isBoundedContext)(ctx)).toBe(true);
        });
        (0, globals_1.it)('returns false for missing fields', () => {
            (0, globals_1.expect)((0, guards_js_1.isBoundedContext)({ name: 'Test', type: 'core', relationships: [] })).toBe(false);
            (0, globals_1.expect)((0, guards_js_1.isBoundedContext)(null)).toBe(false);
        });
    });
    (0, globals_1.describe)('isDedupLevel', () => {
        (0, globals_1.it)('returns true for valid levels', () => {
            (0, globals_1.expect)((0, guards_js_1.isDedupLevel)('block')).toBe(true);
            (0, globals_1.expect)((0, guards_js_1.isDedupLevel)('warn')).toBe(true);
            (0, globals_1.expect)((0, guards_js_1.isDedupLevel)('pass')).toBe(true);
        });
        (0, globals_1.it)('returns false for invalid', () => {
            (0, globals_1.expect)((0, guards_js_1.isDedupLevel)('error')).toBe(false);
        });
    });
    (0, globals_1.describe)('isDedupCandidate', () => {
        (0, globals_1.it)('returns true for valid candidate', () => {
            const cand = { name: 'Similar', similarity: 0.85, matchType: 'exact' };
            (0, globals_1.expect)((0, guards_js_1.isDedupCandidate)(cand)).toBe(true);
        });
        (0, globals_1.it)('returns false for invalid', () => {
            (0, globals_1.expect)((0, guards_js_1.isDedupCandidate)({ name: 'Similar' })).toBe(false);
        });
    });
    (0, globals_1.describe)('isDedupResult', () => {
        (0, globals_1.it)('returns true for valid result', () => {
            const result = { level: 'warn', candidates: [], message: 'ok' };
            (0, globals_1.expect)((0, guards_js_1.isDedupResult)(result)).toBe(true);
        });
        (0, globals_1.it)('returns false for invalid', () => {
            (0, globals_1.expect)((0, guards_js_1.isDedupResult)({ level: 'warn', candidates: [] })).toBe(false);
        });
    });
});
(0, globals_1.describe)('Event Guards', () => {
    (0, globals_1.describe)('isAppEvent', () => {
        (0, globals_1.it)('returns true for valid event', () => {
            (0, globals_1.expect)((0, guards_js_1.isAppEvent)({ type: 'test', payload: {} })).toBe(true);
        });
        (0, globals_1.it)('returns false for invalid', () => {
            (0, globals_1.expect)((0, guards_js_1.isAppEvent)({ type: 'test' })).toBe(false);
            (0, globals_1.expect)((0, guards_js_1.isAppEvent)(null)).toBe(false);
        });
    });
    (0, globals_1.describe)('isCardTreeNodeStatusChanged', () => {
        (0, globals_1.it)('returns true for valid event', () => {
            (0, globals_1.expect)((0, guards_js_1.isCardTreeNodeStatusChanged)({ nodeId: 'n1', oldStatus: 'a', newStatus: 'b' })).toBe(true);
        });
        (0, globals_1.it)('returns false for invalid', () => {
            (0, globals_1.expect)((0, guards_js_1.isCardTreeNodeStatusChanged)({ nodeId: 'n1', oldStatus: 'a' })).toBe(false);
        });
    });
    (0, globals_1.describe)('isCardTreeNodeCheckedChanged', () => {
        (0, globals_1.it)('returns true for valid event', () => {
            (0, globals_1.expect)((0, guards_js_1.isCardTreeNodeCheckedChanged)({ nodeId: 'n1', childId: 'c1', checked: true })).toBe(true);
        });
        (0, globals_1.it)('returns false for invalid', () => {
            (0, globals_1.expect)((0, guards_js_1.isCardTreeNodeCheckedChanged)({ nodeId: 'n1', childId: 'c1' })).toBe(false);
        });
    });
    (0, globals_1.describe)('isCardTreeLoaded', () => {
        (0, globals_1.it)('returns true for valid event', () => {
            (0, globals_1.expect)((0, guards_js_1.isCardTreeLoaded)({ nodeCount: 5 })).toBe(true);
            (0, globals_1.expect)((0, guards_js_1.isCardTreeLoaded)({ projectId: 'p1', nodeCount: 5 })).toBe(true);
        });
        (0, globals_1.it)('returns false for invalid', () => {
            (0, globals_1.expect)((0, guards_js_1.isCardTreeLoaded)({})).toBe(false);
        });
    });
    (0, globals_1.describe)('isDedupScanStarted', () => {
        (0, globals_1.it)('returns true for valid event', () => {
            (0, globals_1.expect)((0, guards_js_1.isDedupScanStarted)({ scanPath: '/src', timestamp: '2024-01-01' })).toBe(true);
        });
        (0, globals_1.it)('returns false for invalid', () => {
            (0, globals_1.expect)((0, guards_js_1.isDedupScanStarted)({ scanPath: '/src' })).toBe(false);
        });
    });
    (0, globals_1.describe)('isDedupScanCompleted', () => {
        (0, globals_1.it)('returns true for valid event', () => {
            (0, globals_1.expect)((0, guards_js_1.isDedupScanCompleted)({ scanPath: '/src', results: [] })).toBe(true);
        });
        (0, globals_1.it)('returns false for invalid', () => {
            (0, globals_1.expect)((0, guards_js_1.isDedupScanCompleted)({ scanPath: '/src' })).toBe(false);
        });
    });
});
