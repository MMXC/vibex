"use strict";
/**
 * @fileoverview Type Guards for @vibex/types
 *
 * Provides runtime type checking for TypeScript types.
 * Each guard is a type predicate function.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isCardTreeNodeStatus = isCardTreeNodeStatus;
exports.isCardTreeNode = isCardTreeNode;
exports.isCardTreeNodeChild = isCardTreeNodeChild;
exports.isCardTreeVisualization = isCardTreeVisualization;
exports.isTaskStage = isTaskStage;
exports.isTeamTaskProject = isTeamTaskProject;
exports.isBoundedContextType = isBoundedContextType;
exports.isContextRelationshipType = isContextRelationshipType;
exports.isContextRelationship = isContextRelationship;
exports.isBoundedContext = isBoundedContext;
exports.isDedupLevel = isDedupLevel;
exports.isDedupCandidate = isDedupCandidate;
exports.isDedupResult = isDedupResult;
exports.isAppEvent = isAppEvent;
exports.isCardTreeNodeStatusChanged = isCardTreeNodeStatusChanged;
exports.isCardTreeNodeCheckedChanged = isCardTreeNodeCheckedChanged;
exports.isCardTreeLoaded = isCardTreeLoaded;
exports.isDedupScanStarted = isDedupScanStarted;
exports.isDedupScanCompleted = isDedupScanCompleted;
// ==================== CardTree Guards ====================
/** Check if a value is a valid CardTreeNodeStatus */
function isCardTreeNodeStatus(value) {
    return ['pending', 'in-progress', 'done', 'failed'].includes(value);
}
/** Check if a value is a valid CardTreeNode */
function isCardTreeNode(value) {
    return (typeof value === 'object' &&
        value !== null &&
        'title' in value &&
        'status' in value);
}
/** Check if a value is a valid CardTreeNodeChild */
function isCardTreeNodeChild(value) {
    return (typeof value === 'object' &&
        value !== null &&
        'id' in value &&
        'label' in value &&
        'checked' in value);
}
/** Check if a value is a valid CardTreeVisualization */
function isCardTreeVisualization(value) {
    return (typeof value === 'object' &&
        value !== null &&
        'nodes' in value &&
        Array.isArray(value.nodes));
}
// ==================== Team-Tasks Guards ====================
/** Check if a value is a valid TaskStage */
function isTaskStage(value) {
    return typeof value === 'object' && value !== null;
}
/** Check if a value is a valid TeamTaskProject */
function isTeamTaskProject(value) {
    return (typeof value === 'object' &&
        value !== null &&
        'project' in value &&
        typeof value.project === 'string');
}
// ==================== API / Domain Guards ====================
/** Check if a value is a valid BoundedContextType */
function isBoundedContextType(value) {
    return ['core', 'supporting', 'generic', 'external'].includes(value);
}
/** Check if a value is a valid ContextRelationshipType */
function isContextRelationshipType(value) {
    return ['upstream', 'downstream', 'symmetric'].includes(value);
}
/** Check if a value is a valid ContextRelationship */
function isContextRelationship(value) {
    return (typeof value === 'object' &&
        value !== null &&
        'id' in value &&
        'fromContextId' in value &&
        'toContextId' in value &&
        'type' in value);
}
/** Check if a value is a valid BoundedContext */
function isBoundedContext(value) {
    return (typeof value === 'object' &&
        value !== null &&
        'id' in value &&
        'name' in value &&
        'type' in value &&
        'relationships' in value);
}
/** Check if a value is a valid DedupLevel */
function isDedupLevel(value) {
    return ['block', 'warn', 'pass'].includes(value);
}
/** Check if a value is a valid DedupCandidate */
function isDedupCandidate(value) {
    return (typeof value === 'object' &&
        value !== null &&
        'name' in value &&
        'similarity' in value &&
        'matchType' in value);
}
/** Check if a value is a valid DedupResult */
function isDedupResult(value) {
    return (typeof value === 'object' &&
        value !== null &&
        'level' in value &&
        'candidates' in value &&
        'message' in value);
}
// ==================== Event Guards ====================
/** Check if a value is a valid AppEvent */
function isAppEvent(value) {
    return (typeof value === 'object' &&
        value !== null &&
        'type' in value &&
        'payload' in value);
}
/** Check if a value is a valid CardTreeNodeStatusChanged event */
function isCardTreeNodeStatusChanged(value) {
    return (typeof value === 'object' &&
        value !== null &&
        'nodeId' in value &&
        'oldStatus' in value &&
        'newStatus' in value);
}
/** Check if a value is a valid CardTreeNodeCheckedChanged event */
function isCardTreeNodeCheckedChanged(value) {
    return (typeof value === 'object' &&
        value !== null &&
        'nodeId' in value &&
        'childId' in value &&
        'checked' in value);
}
/** Check if a value is a valid CardTreeLoaded event */
function isCardTreeLoaded(value) {
    return (typeof value === 'object' &&
        value !== null &&
        'nodeCount' in value);
}
/** Check if a value is a valid DedupScanStarted event */
function isDedupScanStarted(value) {
    return (typeof value === 'object' &&
        value !== null &&
        'scanPath' in value &&
        'timestamp' in value);
}
/** Check if a value is a valid DedupScanCompleted event */
function isDedupScanCompleted(value) {
    return (typeof value === 'object' &&
        value !== null &&
        'scanPath' in value &&
        'results' in value);
}
