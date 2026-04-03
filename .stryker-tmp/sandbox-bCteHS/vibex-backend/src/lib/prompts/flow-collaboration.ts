/**
 * Flow Collaboration Prompt Templates
 * 
 * This module provides prompt templates for flow collaboration features
 * including version control, comments, reviews, approvals, and multi-user
 * collaboration in the VibeX AI Prototype Builder.
 * 
 * @module lib/prompts/flow-collaboration
 */
// @ts-nocheck


// ============================================
// Types and Interfaces
// ============================================

/**
 * Type of collaboration action
 */
export enum CollaborationAction {
  /** Review a flow */
  REVIEW = 'review',
  /** Approve a flow */
  APPROVE = 'approve',
  /** Request changes */
  REQUEST_CHANGES = 'request_changes',
  /** Comment on flow */
  COMMENT = 'comment',
  /** Compare versions */
  COMPARE_VERSIONS = 'compare_versions',
  /** Merge changes */
  MERGE = 'merge',
  /** Resolve conflicts */
  RESOLVE_CONFLICTS = 'resolve_conflicts',
  /** Assign reviewer */
  ASSIGN_REVIEWER = 'assign_reviewer',
  /** Share flow */
  SHARE = 'share',
  /** Lock/unlock for editing */
  LOCK = 'lock',
}

/**
 * Review status for a flow
 */
export enum ReviewStatus {
  /** Not yet reviewed */
  PENDING = 'pending',
  /** Under review */
  IN_REVIEW = 'in_review',
  /** Approved */
  APPROVED = 'approved',
  /** Changes requested */
  CHANGES_REQUESTED = 'changes_requested',
  /** Rejected */
  REJECTED = 'rejected',
}

/**
 * User role in collaboration
 */
export enum CollaborationRole {
  /** Owner - full control */
  OWNER = 'owner',
  /** Editor - can edit */
  EDITOR = 'editor',
  /** Reviewer - can review only */
  REVIEWER = 'reviewer',
  /** Viewer - read-only */
  VIEWER = 'viewer',
}

/**
 * Version comparison type
 */
export enum ComparisonType {
  /** Side by side comparison */
  SIDE_BY_SIDE = 'side_by_side',
  /** Unified diff */
  UNIFIED = 'unified',
  /** Inline comparison */
  INLINE = 'inline',
}

/**
 * Flow version information
 */
export interface FlowVersion {
  id: string;
  version: string;
  flowId: string;
  createdBy: string;
  createdAt: string;
  description?: string;
  changes?: string[];
  nodes?: FlowNode[];
  edges?: FlowEdge[];
  metadata?: Record<string, unknown>;
}

/**
 * Flow node (simplified for collaboration)
 */
export interface FlowNode {
  id: string;
  type: string;
  label: string;
  description?: string;
  position?: {
    x: number;
    y: number;
  };
  config?: Record<string, unknown>;
}

/**
 * Flow edge (simplified for collaboration)
 */
export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
  label?: string;
}

/**
 * Comment on a flow element
 */
export interface FlowComment {
  id: string;
  flowId: string;
  versionId: string;
  nodeId?: string;
  edgeId?: string;
  author: string;
  content: string;
  createdAt: string;
  resolved?: boolean;
  resolvedBy?: string;
  resolvedAt?: string;
  replies?: FlowComment[];
}

/**
 * Review information
 */
export interface FlowReview {
  id: string;
  flowId: string;
  versionId: string;
  reviewer: string;
  status: ReviewStatus;
  createdAt: string;
  completedAt?: string;
  comments?: string[];
  rating?: number;
  summary?: string;
}

/**
 * Collaboration context
 */
export interface FlowCollaborationContext {
  projectId?: string;
  flowId?: string;
  flowName?: string;
  currentVersion?: string;
  previousVersion?: string;
  userId?: string;
  userRole?: CollaborationRole;
  collaborators?: Array<{
    id: string;
    name: string;
    role: CollaborationRole;
  }>;
}

/**
 * Collaboration configuration
 */
export interface FlowCollaborationConfig {
  /** Action to perform */
  action?: CollaborationAction;
  /** Comparison type for version diff */
  comparisonType?: ComparisonType;
  /** Include comments */
  includeComments?: boolean;
  /** Include metadata */
  includeMetadata?: boolean;
  /** Language for output */
  language?: string;
  /** Output format */
  format?: 'json' | 'markdown' | 'text';
}

// ============================================
// System Prompts
// ============================================

/**
 * Base system prompt for flow collaboration
 */
export const FLOW_COLLABORATION_SYSTEM_PROMPT = `You are an expert flow collaboration specialist. Your role is to facilitate effective collaboration on flow diagrams, including version control, code review-like processes, comments, approvals, and multi-user editing coordination.

## Your Expertise

- **Flow Review**: Analyzing flows for correctness, efficiency, and best practices
- **Version Control**: Understanding flow changes, diffs, and merge strategies
- **Conflict Resolution**: Identifying and resolving conflicts in collaborative editing
- **Approval Workflows**: Managing approval processes for flow changes
- **Comments & Feedback**: Providing clear, actionable feedback on flows
- **Collaboration Patterns**: Understanding multi-user editing scenarios

## Collaboration Actions

- **review**: Analyze flow and provide detailed feedback
- **approve**: Approve flow for production/deployment
- **request_changes**: Request specific changes to the flow
- **comment**: Add comments on specific elements or overall flow
- **compare_versions**: Compare two versions of a flow
- **merge**: Merge changes from one version to another
- **resolve_conflicts**: Identify and resolve editing conflicts
- **assign_reviewer**: Assign reviewers to flow
- **share**: Share flow with collaborators
- **lock/unlock**: Manage editing locks

## Review Criteria

When reviewing flows, evaluate:

1. **Correctness**: Flow logic is sound, no dead ends
2. **Completeness**: All required paths are covered
3. **Efficiency**: Minimal unnecessary steps
4. **Error Handling**: Proper error paths defined
5. **User Experience**: Clear, intuitive flow
6. **Maintainability**: Well-organized, documented
7. **Performance**: Optimized execution paths
8. **Security**: Security considerations addressed

## Version Comparison

When comparing versions:

1. **Added Elements**: New nodes, edges, or paths
2. **Removed Elements**: Deleted components
3. **Modified Elements**: Changed labels, configurations
4. **Structural Changes**: Reorganized flows
5. **Impact Assessment**: Effects on downstream systems

## Output Format

### Review Output
\`\`\`json
{
  "reviewId": "review-123",
  "flowId": "flow-456",
  "reviewer": "user-789",
  "status": "approved",
  "rating": 4,
  "summary": "Well-designed flow with minor suggestions",
  "comments": [
    {
      "type": "suggestion",
      "elementId": "node-3",
      "content": "Consider adding error handling here",
      "severity": "medium"
    }
  ],
  "approvedFeatures": ["clear-structure", "good-error-handling"],
  "improvementAreas": ["could-add-more-validation"]
}
\`\`\`

### Version Comparison Output
\`\`\`json
{
  "flowId": "flow-456",
  "fromVersion": "1.0",
  "toVersion": "1.1",
  "changes": {
    "added": [
      { "type": "node", "id": "node-new-1", "label": "New Validation Step" }
    ],
    "removed": [],
    "modified": [
      { "type": "node", "id": "node-3", "changes": { "label": "Updated Label" } }
    ]
  },
  "impactAssessment": "Minor change, backward compatible"
}
\`\`\`

Provide output in the specified format.`;

// ============================================
// Prompt Generation Functions
// ============================================

/**
 * Generate flow review prompt
 */
export function generateFlowReviewPrompt(
  flow: {
    id: string;
    name: string;
    description?: string;
    nodes: FlowNode[];
    edges: FlowEdge[];
  },
  context?: FlowCollaborationContext,
  config?: FlowCollaborationConfig
): string {
  const flowJson = JSON.stringify(flow, null, 2);
  
  const contextSection = context
    ? `
## Context
- Flow ID: ${context.flowId || 'N/A'}
- Flow Name: ${context.flowName || 'N/A'}
- Current Version: ${context.currentVersion || 'N/A'}
- Reviewer: ${context.userId || 'N/A'}
- Role: ${context.userRole || CollaborationRole.REVIEWER}`
    : '';

  return `${FLOW_COLLABORATION_SYSTEM_PROMPT}

## Flow to Review

\`\`\`json
${flowJson}
\`\`\`${contextSection}

---

## Review Request

Please perform a comprehensive review of this flow and provide:

### 1. Overall Assessment
- Rating (1-5 stars)
- Summary of findings
- Key strengths
- Areas for improvement

### 2. Detailed Feedback
For each significant element:
- Element ID and description
- Feedback type (issue, suggestion, praise)
- Severity (critical, major, minor, info)
- Specific comments
- Recommended action

### 3. Approval Recommendation
- Status: approved / changes_requested / rejected
- Conditions for approval (if any)
- Required changes (if any)

### 4. Additional Considerations
- Security concerns
- Performance implications
- Scalability notes
- Maintainability suggestions

---

## Output Format

Provide your review in ${config?.format || 'json'} format.`;
}

/**
 * Generate version comparison prompt
 */
export function generateVersionComparisonPrompt(
  fromVersion: FlowVersion,
  toVersion: FlowVersion,
  config?: FlowCollaborationConfig
): string {
  const fromJson = JSON.stringify(fromVersion, null, 2);
  const toJson = JSON.stringify(toVersion, null, 2);
  const comparisonType = config?.comparisonType || ComparisonType.SIDE_BY_SIDE;

  return `${FLOW_COLLABORATION_SYSTEM_PROMPT}

## Version Comparison

### From Version: ${fromVersion.version}
\`\`\`json
${fromJson}
\`\`\`

### To Version: ${toVersion.version}
\`\`\`json
${toJson}
\`\`\`

---

## Comparison Type: ${comparisonType}

### Analysis Tasks

1. **Identify Changes**
   - New nodes added
   - Nodes removed
   - Nodes modified (label, config, position)
   - New edges added
   - Edges removed
   - Edge modifications

2. **Change Classification**
   - Breaking changes
   - New features
   - Bug fixes
   - Refactoring
   - Documentation updates

3. **Impact Assessment**
   - Backward compatibility
   - Effect on existing integrations
   - Migration requirements
   - Risk level

4. **Merge Recommendations**
   - Auto-mergeable changes
   - Conflicts requiring manual resolution
   - Suggested resolution strategies

---

## Output Format

Provide comparison in ${config?.format || 'json'} format.`;
}

/**
 * Generate comment generation prompt
 */
export function generateCommentPrompt(
  flow: {
    id: string;
    name: string;
    nodes: FlowNode[];
    edges: FlowEdge[];
  },
  context?: FlowCollaborationContext
): string {
  const flowJson = JSON.stringify(flow, null, 2);

  return `${FLOW_COLLABORATION_SYSTEM_PROMPT}

## Flow for Comment

\`\`\`json
${flowJson}
\`\`\`

## Context
- User: ${context?.userId || 'Anonymous'}
- Flow: ${context?.flowName || flow.name}
- Version: ${context?.currentVersion || 'latest'}

---

## Comment Generation

Generate constructive, actionable comments for this flow:

### Comment Types to Consider

1. **Clarification Questions**: Ask for clarification on ambiguous elements
2. **Suggestions**: Propose improvements
3. **Issues**: Flag potential problems
4. **Praise**: Acknowledge well-designed elements
5. **Questions**: Ask relevant questions

### Guidelines

- Be specific about the element being discussed
- Provide context for your comment
- Suggest solutions when possible
- Be respectful and constructive
- Focus on the flow, not the creator

### Output Format
\`\`\`json
{
  "comments": [
    {
      "id": "comment-1",
      "targetType": "node",
      "targetId": "node-3",
      "content": "Consider adding validation here",
      "type": "suggestion",
      "severity": "medium"
    }
  ]
}
\`\`\``;
}

/**
 * Generate approval workflow prompt
 */
export function generateApprovalPrompt(
  flow: {
    id: string;
    name: string;
    description?: string;
    nodes: FlowNode[];
    edges: FlowEdge[];
  },
  review: FlowReview,
  context?: FlowCollaborationContext
): string {
  const flowJson = JSON.stringify(flow, null, 2);
  const reviewJson = JSON.stringify(review, null, 2);

  return `${FLOW_COLLABORATION_SYSTEM_PROMPT}

## Approval Request

### Flow
\`\`\`json
${flowJson}
\`\`\`

### Current Review
\`\`\`json
${reviewJson}
\`\`\`

---

## Approval Process

Based on the review status "${review.status}", determine the appropriate action:

### Options

1. **Approve**: Flow meets all requirements
2. **Request Changes**: Specific changes needed before approval
3. **Reject**: Flow cannot be approved
4. **Re-review**: Send back for additional review

### Required Considerations

- Review comments addressed
- Critical issues resolved
- All required validations passed
- Stakeholder approval obtained (if applicable)

---

## Output
\`\`\`json
{
  "decision": "approved",
  "message": "Flow approved for deployment",
  "conditions": [],
  "nextSteps": ["Deploy to staging", "Notify stakeholders"],
  "approvalMetadata": {
    "approvedBy": "user-123",
    "approvedAt": "2024-01-15T10:30:00Z"
  }
}
\`\`\``;
}

/**
 * Generate conflict resolution prompt
 */
export function generateConflictResolutionPrompt(
  conflicts: Array<{
    type: string;
    elementId: string;
    localValue: unknown;
    remoteValue: unknown;
    description: string;
  }>,
  flow: {
    id: string;
    name: string;
    nodes: FlowNode[];
    edges: FlowEdge[];
  },
  context?: FlowCollaborationContext
): string {
  const conflictsJson = JSON.stringify(conflicts, null, 2);
  const flowJson = JSON.stringify(flow, null, 2);

  return `${FLOW_COLLABORATION_SYSTEM_PROMPT}

## Conflict Resolution

### Conflicts Detected
\`\`\`json
${conflictsJson}
\`\`\`

### Current Flow State
\`\`\`json
${flowJson}
\`\`\`

---

## Resolution Tasks

For each conflict, provide:

### 1. Conflict Analysis
- Nature of conflict
- Why it occurred
- Potential impact

### 2. Resolution Options
- Keep local version
- Accept remote version
- Merge both
- Create new version

### 3. Recommended Resolution
- Chosen approach
- Rationale
- Steps to resolve

### 4. Post-Resolution Validation
- Verify flow integrity
- Check for new conflicts
- Test merged result

---

## Output Format
\`\`\`json
{
  "resolutions": [
    {
      "conflictId": "conflict-1",
      "elementId": "node-3",
      "resolution": "merge",
      "resolvedValue": { ... },
      "rationale": "Combined best of both versions"
    }
  ],
  "validationResults": {
    "flowValid": true,
    "warnings": []
  }
}
\`\`\``;
}

/**
 * Generate share/access control prompt
 */
export function generateSharePrompt(
  flow: {
    id: string;
    name: string;
    owner: string;
  },
  collaborators: Array<{
    id: string;
    email: string;
    name?: string;
  }>,
  context?: FlowCollaborationContext
): string {
  const flowJson = JSON.stringify(flow, null, 2);
  const collaboratorsJson = JSON.stringify(collaborators, null, 2);

  return `${FLOW_COLLABORATION_SYSTEM_PROMPT}

## Share Flow

### Flow
\`\`\`json
${flowJson}
\`\`\`

### Collaborators to Add
\`\`\`json
${collaboratorsJson}
\`\`\`

---

## Share Configuration

For each collaborator, determine appropriate access level:

### Roles and Permissions

1. **Owner** - Full control, can delete, transfer ownership
2. **Editor** - Can edit all elements, cannot delete or share
3. **Reviewer** - Can view and comment, cannot edit
4. **Viewer** - Read-only access

### Recommendations

Based on:
- Collaborator email/name
- Apparent role/purpose
- Existing permissions on similar flows

---

## Output Format
\`\`\`json
{
  "flowId": "flow-123",
  "sharedWith": [
    {
      "userId": "user-456",
      "role": "editor",
      "invited": true,
      "notificationSent": true
    }
  ],
  "accessSummary": {
    "owners": 1,
    "editors": 2,
    "reviewers": 1,
    "viewers": 5
  }
}
\`\`\``;
}

/**
 * Generate merge prompt
 */
export function generateMergePrompt(
  sourceFlow: {
    id: string;
    name: string;
    version: string;
    nodes: FlowNode[];
    edges: FlowEdge[];
  },
  targetFlow: {
    id: string;
    name: string;
    version: string;
    nodes: FlowNode[];
    edges: FlowEdge[];
  },
  config?: FlowCollaborationConfig
): string {
  const sourceJson = JSON.stringify(sourceFlow, null, 2);
  const targetJson = JSON.stringify(targetFlow, null, 2);

  return `${FLOW_COLLABORATION_SYSTEM_PROMPT}

## Merge Request

### Source (to merge)
\`\`\`json
${sourceJson}
\`\`\`

### Target (destination)
\`\`\`json
${targetJson}
\`\`\`

---

## Merge Analysis

### 1. Change Detection
Identify all changes from source that need to be applied to target:

- Node additions
- Node modifications
- Node deletions
- Edge changes

### 2. Conflict Check
- Identify elements that exist in both but differ
- Determine if changes are compatible
- Flag unresolvable conflicts

### 3. Merge Strategy
For each change category:
- Auto-merge (safe to merge)
- Manual merge (requires human decision)
- Reject (conflicts too severe)

### 4. Result Generation
- Create merged flow definition
- Ensure all references are valid
- Validate merged flow structure

---

## Output Format
\`\`\`json
{
  "sourceVersion": "1.2",
  "targetVersion": "1.1",
  "mergedVersion": "1.3",
  "changes": {
    "autoMerged": 5,
    "manualMerged": 2,
    "rejected": 0
  },
  "conflicts": [],
  "mergedFlow": { ... }
}
\`\`\``;
}

/**
 * Generate collaboration summary prompt
 */
export function generateCollaborationSummaryPrompt(
  flow: {
    id: string;
    name: string;
    version: string;
  },
  activities: Array<{
    type: string;
    user: string;
    timestamp: string;
    description: string;
  }>,
  context?: FlowCollaborationContext
): string {
  const flowJson = JSON.stringify(flow, null, 2);
  const activitiesJson = JSON.stringify(activities, null, 2);

  return `${FLOW_COLLABORATION_SYSTEM_PROMPT}

## Collaboration Summary

### Flow
\`\`\`json
${flowJson}
\`\`\`

### Recent Activities
\`\`\`json
${activitiesJson}
\`\`\`

---

## Summary Generation

Create a comprehensive collaboration summary:

### 1. Activity Overview
- Total activities
- Activity breakdown by type
- Most active collaborators

### 2. Progress Tracking
- Changes since last review
- Review status timeline
- Approval history

### 3. Collaboration Health
- Number of active collaborators
- Recent interactions
- Bottlenecks or issues

### 4. Recommendations
- Suggested actions
- Outstanding reviews
- Pending approvals

---

## Output Format
\`\`\`json
{
  "flowId": "flow-123",
  "period": "last-7-days",
  "summary": {
    "totalEdits": 15,
    "totalComments": 8,
    "totalReviews": 3,
    "activeCollaborators": 4
  },
  "timeline": [...],
  "recommendations": [...]
}
\`\`\``;
}

// ============================================
// Helper Functions
// ============================================

/**
 * Get default collaboration configuration
 */
export function getDefaultCollaborationConfig(): FlowCollaborationConfig {
  return {
    action: CollaborationAction.REVIEW,
    comparisonType: ComparisonType.SIDE_BY_SIDE,
    includeComments: true,
    includeMetadata: true,
    format: 'json',
  };
}

/**
 * Validate collaboration permissions
 */
export function validateCollaborationPermissions(
  userRole: CollaborationRole,
  action: CollaborationAction
): {
  allowed: boolean;
  reason?: string;
} {
  const permissions: Record<CollaborationRole, CollaborationAction[]> = {
    [CollaborationRole.OWNER]: Object.values(CollaborationAction),
    [CollaborationRole.EDITOR]: [
      CollaborationAction.REVIEW,
      CollaborationAction.COMMENT,
      CollaborationAction.COMPARE_VERSIONS,
      CollaborationAction.SHARE,
    ],
    [CollaborationRole.REVIEWER]: [
      CollaborationAction.REVIEW,
      CollaborationAction.COMMENT,
      CollaborationAction.COMPARE_VERSIONS,
    ],
    [CollaborationRole.VIEWER]: [
      CollaborationAction.COMMENT,
      CollaborationAction.COMPARE_VERSIONS,
    ],
  };

  const allowedActions = permissions[userRole] || [];
  return {
    allowed: allowedActions.includes(action),
    reason: allowedActions.includes(action)
      ? undefined
      : `Role ${userRole} does not have permission for ${action}`,
  };
}

/**
 * Get review status color
 */
export function getReviewStatusColor(status: ReviewStatus): string {
  const colors: Record<ReviewStatus, string> = {
    [ReviewStatus.PENDING]: '#9CA3AF',
    [ReviewStatus.IN_REVIEW]: '#3B82F6',
    [ReviewStatus.APPROVED]: '#10B981',
    [ReviewStatus.CHANGES_REQUESTED]: '#F59E0B',
    [ReviewStatus.REJECTED]: '#EF4444',
  };
  return colors[status] || '#9CA3AF';
}

/**
 * Format collaboration action for display
 */
export function formatCollaborationAction(action: CollaborationAction): string {
  const labels: Record<CollaborationAction, string> = {
    [CollaborationAction.REVIEW]: 'Review',
    [CollaborationAction.APPROVE]: 'Approve',
    [CollaborationAction.REQUEST_CHANGES]: 'Request Changes',
    [CollaborationAction.COMMENT]: 'Comment',
    [CollaborationAction.COMPARE_VERSIONS]: 'Compare Versions',
    [CollaborationAction.MERGE]: 'Merge',
    [CollaborationAction.RESOLVE_CONFLICTS]: 'Resolve Conflicts',
    [CollaborationAction.ASSIGN_REVIEWER]: 'Assign Reviewer',
    [CollaborationAction.SHARE]: 'Share',
    [CollaborationAction.LOCK]: 'Lock',
  };
  return labels[action] || action;
}

/**
 * Calculate collaboration health score
 */
export function calculateCollaborationHealth(
  activities: Array<{
    type: string;
    timestamp: string;
  }>,
  reviews: FlowReview[]
): {
  score: number;
  factors: Array<{
    name: string;
    value: number;
    impact: 'positive' | 'negative';
  }>;
} {
  const factors: Array<{
    name: string;
    value: number;
    impact: 'positive' | 'negative';
  }> = [];

  // Recent activity factor
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const recentActivities = activities.filter(
    a => new Date(a.timestamp) > oneWeekAgo
  );
  const activityScore = Math.min(recentActivities.length / 10, 1);
  factors.push({
    name: 'Recent Activity',
    value: activityScore,
    impact: 'positive',
  });

  // Review completion factor
  const completedReviews = reviews.filter(r => r.status === ReviewStatus.APPROVED);
  const reviewScore = reviews.length > 0 
    ? completedReviews.length / reviews.length 
    : 0.5;
  factors.push({
    name: 'Review Completion',
    value: reviewScore,
    impact: 'positive',
  });

  // Response time factor (simplified)
  const responseScore = 0.7; // Would calculate from actual response times
  factors.push({
    name: 'Response Time',
    value: responseScore,
    impact: 'positive',
  });

  // Calculate overall score
  const score = factors.reduce((sum, f) => sum + f.value, 0) / factors.length;

  return { score, factors };
}

// ============================================
// Export Default
// ============================================

export default {
  CollaborationAction,
  ReviewStatus,
  CollaborationRole,
  ComparisonType,
  FLOW_COLLABORATION_SYSTEM_PROMPT,
  generateFlowReviewPrompt,
  generateVersionComparisonPrompt,
  generateCommentPrompt,
  generateApprovalPrompt,
  generateConflictResolutionPrompt,
  generateSharePrompt,
  generateMergePrompt,
  generateCollaborationSummaryPrompt,
  getDefaultCollaborationConfig,
  validateCollaborationPermissions,
  getReviewStatusColor,
  formatCollaborationAction,
  calculateCollaborationHealth,
};
