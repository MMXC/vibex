/**
 * @fileoverview Type Guards for @vibex/types
 *
 * Provides runtime type checking for TypeScript types.
 * Each guard is a type predicate function.
 */

import type {
  CardTreeNode,
  CardTreeNodeChild,
  CardTreeNodeStatus,
  CardTreeVisualization,
  TeamTaskProject,
  TaskStage,
  BoundedContext,
  BoundedContextType,
  ContextRelationshipType,
  ContextRelationship,
  DedupLevel,
  DedupCandidate,
  DedupResult,
  AppEvent,
  CardTreeNodeStatusChanged,
  CardTreeNodeCheckedChanged,
  CardTreeLoaded,
  DedupScanStarted,
  DedupScanCompleted,
} from './index.js';

// ==================== CardTree Guards ====================

/** Check if a value is a valid CardTreeNodeStatus */
export function isCardTreeNodeStatus(value: unknown): value is CardTreeNodeStatus {
  return ['pending', 'in-progress', 'done', 'failed'].includes(value as string);
}

/** Check if a value is a valid CardTreeNode */
export function isCardTreeNode(value: unknown): value is CardTreeNode {
  return (
    typeof value === 'object' &&
    value !== null &&
    'title' in value &&
    'status' in value
  );
}

/** Check if a value is a valid CardTreeNodeChild */
export function isCardTreeNodeChild(value: unknown): value is CardTreeNodeChild {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'label' in value &&
    'checked' in value
  );
}

/** Check if a value is a valid CardTreeVisualization */
export function isCardTreeVisualization(value: unknown): value is CardTreeVisualization {
  return (
    typeof value === 'object' &&
    value !== null &&
    'nodes' in value &&
    Array.isArray((value as Record<string, unknown>).nodes)
  );
}

// ==================== Team-Tasks Guards ====================

/** Check if a value is a valid TaskStage */
export function isTaskStage(value: unknown): value is TaskStage {
  return typeof value === 'object' && value !== null;
}

/** Check if a value is a valid TeamTaskProject */
export function isTeamTaskProject(value: unknown): value is TeamTaskProject {
  return (
    typeof value === 'object' &&
    value !== null &&
    'project' in value &&
    typeof (value as Record<string, unknown>).project === 'string'
  );
}

// ==================== API / Domain Guards ====================

/** Check if a value is a valid BoundedContextType */
export function isBoundedContextType(value: unknown): value is BoundedContextType {
  return ['core', 'supporting', 'generic', 'external'].includes(value as string);
}

/** Check if a value is a valid ContextRelationshipType */
export function isContextRelationshipType(value: unknown): value is ContextRelationshipType {
  return ['upstream', 'downstream', 'symmetric'].includes(value as string);
}

/** Check if a value is a valid ContextRelationship */
export function isContextRelationship(value: unknown): value is ContextRelationship {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'fromContextId' in value &&
    'toContextId' in value &&
    'type' in value
  );
}

/** Check if a value is a valid BoundedContext */
export function isBoundedContext(value: unknown): value is BoundedContext {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'name' in value &&
    'type' in value &&
    'relationships' in value
  );
}

/** Check if a value is a valid DedupLevel */
export function isDedupLevel(value: unknown): value is DedupLevel {
  return ['block', 'warn', 'pass'].includes(value as string);
}

/** Check if a value is a valid DedupCandidate */
export function isDedupCandidate(value: unknown): value is DedupCandidate {
  return (
    typeof value === 'object' &&
    value !== null &&
    'name' in value &&
    'similarity' in value &&
    'matchType' in value
  );
}

/** Check if a value is a valid DedupResult */
export function isDedupResult(value: unknown): value is DedupResult {
  return (
    typeof value === 'object' &&
    value !== null &&
    'level' in value &&
    'candidates' in value &&
    'message' in value
  );
}

// ==================== Event Guards ====================

/** Check if a value is a valid AppEvent */
export function isAppEvent(value: unknown): value is AppEvent {
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    'payload' in value
  );
}

/** Check if a value is a valid CardTreeNodeStatusChanged event */
export function isCardTreeNodeStatusChanged(value: unknown): value is CardTreeNodeStatusChanged {
  return (
    typeof value === 'object' &&
    value !== null &&
    'nodeId' in value &&
    'oldStatus' in value &&
    'newStatus' in value
  );
}

/** Check if a value is a valid CardTreeNodeCheckedChanged event */
export function isCardTreeNodeCheckedChanged(value: unknown): value is CardTreeNodeCheckedChanged {
  return (
    typeof value === 'object' &&
    value !== null &&
    'nodeId' in value &&
    'childId' in value &&
    'checked' in value
  );
}

/** Check if a value is a valid CardTreeLoaded event */
export function isCardTreeLoaded(value: unknown): value is CardTreeLoaded {
  return (
    typeof value === 'object' &&
    value !== null &&
    'nodeCount' in value
  );
}

/** Check if a value is a valid DedupScanStarted event */
export function isDedupScanStarted(value: unknown): value is DedupScanStarted {
  return (
    typeof value === 'object' &&
    value !== null &&
    'scanPath' in value &&
    'timestamp' in value
  );
}

/** Check if a value is a valid DedupScanCompleted event */
export function isDedupScanCompleted(value: unknown): value is DedupScanCompleted {
  return (
    typeof value === 'object' &&
    value !== null &&
    'scanPath' in value &&
    'results' in value
  );
}
