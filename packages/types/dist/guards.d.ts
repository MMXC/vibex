/**
 * @fileoverview Type Guards for @vibex/types
 *
 * Provides runtime type checking for TypeScript types.
 * Each guard is a type predicate function.
 */
import type { CardTreeNode, CardTreeNodeChild, CardTreeNodeStatus, CardTreeVisualization, TeamTaskProject, TaskStage, BoundedContext, BoundedContextType, ContextRelationshipType, ContextRelationship, DedupLevel, DedupCandidate, DedupResult, AppEvent, CardTreeNodeStatusChanged, CardTreeNodeCheckedChanged, CardTreeLoaded, DedupScanStarted, DedupScanCompleted } from './index.js';
/** Check if a value is a valid CardTreeNodeStatus */
export declare function isCardTreeNodeStatus(value: unknown): value is CardTreeNodeStatus;
/** Check if a value is a valid CardTreeNode */
export declare function isCardTreeNode(value: unknown): value is CardTreeNode;
/** Check if a value is a valid CardTreeNodeChild */
export declare function isCardTreeNodeChild(value: unknown): value is CardTreeNodeChild;
/** Check if a value is a valid CardTreeVisualization */
export declare function isCardTreeVisualization(value: unknown): value is CardTreeVisualization;
/** Check if a value is a valid TaskStage */
export declare function isTaskStage(value: unknown): value is TaskStage;
/** Check if a value is a valid TeamTaskProject */
export declare function isTeamTaskProject(value: unknown): value is TeamTaskProject;
/** Check if a value is a valid BoundedContextType */
export declare function isBoundedContextType(value: unknown): value is BoundedContextType;
/** Check if a value is a valid ContextRelationshipType */
export declare function isContextRelationshipType(value: unknown): value is ContextRelationshipType;
/** Check if a value is a valid ContextRelationship */
export declare function isContextRelationship(value: unknown): value is ContextRelationship;
/** Check if a value is a valid BoundedContext */
export declare function isBoundedContext(value: unknown): value is BoundedContext;
/** Check if a value is a valid DedupLevel */
export declare function isDedupLevel(value: unknown): value is DedupLevel;
/** Check if a value is a valid DedupCandidate */
export declare function isDedupCandidate(value: unknown): value is DedupCandidate;
/** Check if a value is a valid DedupResult */
export declare function isDedupResult(value: unknown): value is DedupResult;
/** Check if a value is a valid AppEvent */
export declare function isAppEvent(value: unknown): value is AppEvent;
/** Check if a value is a valid CardTreeNodeStatusChanged event */
export declare function isCardTreeNodeStatusChanged(value: unknown): value is CardTreeNodeStatusChanged;
/** Check if a value is a valid CardTreeNodeCheckedChanged event */
export declare function isCardTreeNodeCheckedChanged(value: unknown): value is CardTreeNodeCheckedChanged;
/** Check if a value is a valid CardTreeLoaded event */
export declare function isCardTreeLoaded(value: unknown): value is CardTreeLoaded;
/** Check if a value is a valid DedupScanStarted event */
export declare function isDedupScanStarted(value: unknown): value is DedupScanStarted;
/** Check if a value is a valid DedupScanCompleted event */
export declare function isDedupScanCompleted(value: unknown): value is DedupScanCompleted;
//# sourceMappingURL=guards.d.ts.map