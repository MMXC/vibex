/**
 * Business Flow Diagram Service
 * 
 * Provides functionality to generate Mermaid stateDiagram-v2 or flowchart syntax
 * from domain entities with state/status fields.
 * 
 * Features:
 * - State/Status field identification from entity properties
 * - Activity/Step field identification
 * - Mermaid stateDiagram-v2 syntax generation
 * - Mermaid flowchart syntax generation
 * - Integration with domain model data
 * - Configurable diagram options
 * 
 * @module services/business-flow
 */
// @ts-nocheck


import {
  DomainEntity,
  parseEntityProperties,
} from '../domain-entities';
import {
  EntityRelation,
  RelationType,
} from '../entity-relations';

// ==================== Types ====================

/**
 * Represents a state field identified from an entity
 */
export interface StateField {
  /** Field name (e.g., 'status', 'state') */
  field: string;
  /** Entity name this state belongs to */
  entityName: string;
  /** Entity ID this state belongs to */
  entityId: string;
  /** Possible state values */
  values: string[];
}

/**
 * Represents an activity field identified from an entity
 */
export interface ActivityField {
  /** Field name (e.g., 'currentStep', 'phase') */
  field: string;
  /** Entity name this activity belongs to */
  entityName: string;
  /** Entity ID this activity belongs to */
  entityId: string;
  /** Possible activity/step values */
  values: string[];
}

/**
 * Business flow node (state or activity)
 */
export interface BusinessFlowNode {
  /** Node ID */
  id: string;
  /** Node label */
  label: string;
  /** Associated entity */
  entityId: string;
  /** Entity name */
  entityName: string;
  /** Node type */
  type: 'state' | 'activity' | 'start' | 'end';
}

/**
 * Business flow transition between nodes
 */
export interface BusinessFlowTransition {
  /** Source node ID */
  from: string;
  /** Target node ID */
  to: string;
  /** Transition label (optional) */
  label?: string;
  /** Transition type */
  type: 'normal' | 'bidirectional' | 'start' | 'end';
}

/**
 * State diagram generation options
 */
export interface StateDiagramOptions {
  /** Show transitions in the diagram */
  showTransitions?: boolean;
  /** Diagram title */
  title?: string;
  /** Use compact notation */
  compact?: boolean;
  /** Custom state value separator */
  stateSeparator?: string;
}

/**
 * Flow diagram generation options
 */
export interface FlowDiagramOptions {
  /** Flow direction: TD, TB, RL, LR */
  direction?: 'TD' | 'TB' | 'RL' | 'LR';
  /** Show connections between nodes */
  showConnections?: boolean;
  /** Diagram title */
  title?: string;
  /** Use standard arrow style */
  standardArrows?: boolean;
  /** Custom state value separator */
  stateSeparator?: string;
}

// ==================== Constants ====================

/**
 * Fields that indicate a state/status field
 */
const STATE_FIELD_PATTERNS = [
  'status',
  'state',
  'status',
  'orderStatus',
  'paymentStatus',
  'fulfillmentStatus',
  'deliveryStatus',
  'workflowState',
  'lifecycleState',
  'recordState',
];

/**
 * Fields that indicate an activity/step field
 */
const ACTIVITY_FIELD_PATTERNS = [
  'step',
  'phase',
  'stage',
  'currentStep',
  'currentPhase',
  'currentStage',
  'action',
  'actions',
  'operation',
  'activity',
];

/**
 * Default state separator
 */
const DEFAULT_STATE_SEPARATOR = '|';

/**
 * Common state transitions for inferring flow
 * Maps current state to possible next states
 */
const COMMON_STATE_TRANSITIONS: Record<string, string[]> = {
  pending: ['processing', 'confirmed', 'cancelled'],
  processing: ['completed', 'failed', 'cancelled'],
  confirmed: ['shipped', 'cancelled'],
  shipped: ['delivered', 'returned'],
  delivered: ['returned', 'completed'],
  completed: [],
  cancelled: [],
  failed: ['pending', 'processing'],
  active: ['inactive', 'completed'],
  inactive: ['active'],
  todo: ['in_progress', 'done'],
  in_progress: ['done', 'todo'],
  done: ['todo'],
  open: ['in_progress', 'closed'],
  closed: ['open'],
  draft: ['submitted', 'cancelled'],
  submitted: ['approved', 'rejected', 'draft'],
  approved: ['published'],
  rejected: ['draft'],
  published: ['archived'],
  archived: [],
};

// ==================== Helper Functions ====================

/**
 * Check if a field name indicates a state/status field
 */
function isStateField(fieldName: string): boolean {
  const normalizedName = fieldName.toLowerCase().replace(/[_-]/g, '');
  return STATE_FIELD_PATTERNS.some(pattern => 
    normalizedName === pattern.toLowerCase().replace(/[_-]/g, '')
  );
}

/**
 * Check if a field name indicates an activity/step field
 */
function isActivityField(fieldName: string): boolean {
  const normalizedName = fieldName.toLowerCase().replace(/[_-]/g, '');
  return ACTIVITY_FIELD_PATTERNS.some(pattern => 
    normalizedName === pattern.toLowerCase().replace(/[_-]/g, '')
  );
}

/**
 * Parse state values from a field value string
 * Handles formats like: "pending | processing | completed"
 * or: "pending,processing,completed"
 * or: "['pending', 'processing', 'completed']"
 */
function parseStateValues(value: unknown, separator: string = DEFAULT_STATE_SEPARATOR): string[] {
  if (typeof value === 'string') {
    // Handle pipe-separated values
    if (value.includes('|')) {
      return value.split('|').map(v => v.trim()).filter(Boolean);
    }
    // Handle comma-separated values
    if (value.includes(',')) {
      return value.split(',').map(v => v.trim()).filter(Boolean);
    }
    // Handle array-like strings
    if (value.startsWith('[') && value.endsWith(']')) {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          return parsed.map(v => String(v).trim()).filter(Boolean);
        }
      } catch {
        // Not a valid JSON array, treat as single value
      }
    }
    // Handle space-separated values (less common)
    if (value.includes(' ')) {
      return value.split(/\s+/).map(v => v.trim()).filter(Boolean);
    }
    // Single value
    return [value.trim()].filter(Boolean);
  }
  
  if (Array.isArray(value)) {
    return value.map(v => String(v).trim()).filter(Boolean);
  }
  
  return [];
}

/**
 * Clean state value for use as node ID/label
 * Preserves underscores and hyphens, removes other special characters
 */
function cleanStateValue(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9_\-]/g, '')
    .trim();
}

/**
 * Infer transitions between states based on common patterns
 */
function inferTransitions(states: string[]): string[][] {
  const transitions: string[][] = [];
  const stateSet = new Set(states.map(s => s.toLowerCase()));

  for (const state of states) {
    const cleanState = state.toLowerCase();
    const possibleNextStates = COMMON_STATE_TRANSITIONS[cleanState] || [];

    for (const nextState of possibleNextStates) {
      // Only add transition if the next state exists in our states
      if (stateSet.has(nextState)) {
        transitions.push([state, nextState]);
      }
    }
  }

  // If no common transitions found, create sequential flow
  if (transitions.length === 0 && states.length > 1) {
    for (let i = 0; i < states.length - 1; i++) {
      transitions.push([states[i], states[i + 1]]);
    }
  }

  return transitions;
}

// ==================== Main Functions ====================

/**
 * Identify state fields from a domain entity
 * 
 * @param entity Domain entity to analyze
 * @returns Array of identified state fields
 */
export function identifyStates(entity: DomainEntity): StateField[] {
  const states: StateField[] = [];
  const properties = parseEntityProperties(entity);

  if (!properties) {
    return states;
  }

  for (const [fieldName, fieldValue] of Object.entries(properties)) {
    if (isStateField(fieldName) && fieldValue) {
      const values = parseStateValues(fieldValue);
      if (values.length > 0) {
        states.push({
          field: fieldName,
          entityName: entity.name,
          entityId: entity.id,
          values,
        });
      }
    }
  }

  return states;
}

/**
 * Identify activity/step fields from a domain entity
 * 
 * @param entity Domain entity to analyze
 * @returns Array of identified activity fields
 */
export function identifyActivities(entity: DomainEntity): ActivityField[] {
  const activities: ActivityField[] = [];
  const properties = parseEntityProperties(entity);

  if (!properties) {
    return activities;
  }

  for (const [fieldName, fieldValue] of Object.entries(properties)) {
    if (isActivityField(fieldName) && fieldValue) {
      const values = parseStateValues(fieldValue);
      if (values.length > 0) {
        activities.push({
          field: fieldName,
          entityName: entity.name,
          entityId: entity.id,
          values,
        });
      }
    }
  }

  return activities;
}

/**
 * Parse entity properties helper (re-exported for testing)
 */
export { parseEntityProperties } from '../domain-entities';

/**
 * Generate Mermaid stateDiagram-v2 syntax from domain entities
 * 
 * @param entities Domain entities to include in the diagram
 * @param relations Entity relations (for future use with cross-entity flows)
 * @param options Diagram generation options
 * @returns Mermaid stateDiagram-v2 syntax string
 */
export function generateStateDiagram(
  entities: DomainEntity[],
  relations: EntityRelation[],
  options: StateDiagramOptions = {}
): string {
  const {
    showTransitions = true,
    title,
    compact = false,
    stateSeparator = DEFAULT_STATE_SEPARATOR,
  } = options;

  const lines: string[] = [];

  // Header
  lines.push('stateDiagram-v2');
  
  // Add title comment if provided
  if (title) {
    lines.push(`    %% ${title}`);
  }

  // Collect all states from all entities
  const allStates = new Map<string, { entityName: string; values: string[] }>();

  for (const entity of entities) {
    const states = identifyStates(entity);
    
    for (const stateField of states) {
      const key = `${entity.name}:${stateField.field}`;
      allStates.set(key, {
        entityName: entity.name,
        values: stateField.values,
      });
    }
  }

  if (allStates.size === 0) {
    // No states found, return basic diagram
    if (title) {
      return lines.join('\n');
    }
    return lines.join('\n');
  }

  // Generate state definitions and transitions
  const processedStates = new Set<string>();

  for (const [key, stateInfo] of allStates) {
    if (compact) {
      // Compact notation: state: value1 | value2 | value3
      const valuesStr = stateInfo.values.join(stateSeparator);
      lines.push(`    ${stateInfo.entityName}: ${valuesStr}`);
    } else {
      // Detailed notation with separate states
      for (const value of stateInfo.values) {
        const stateId = cleanStateValue(value);
        
        if (!processedStates.has(stateId)) {
          lines.push(`    ${stateId}`);
          processedStates.add(stateId);
        }
      }
    }

    // Generate transitions between states
    if (showTransitions && stateInfo.values.length > 1) {
      const transitions = inferTransitions(stateInfo.values);
      
      for (const [from, to] of transitions) {
        const fromId = cleanStateValue(from);
        const toId = cleanStateValue(to);
        lines.push(`    ${fromId} --> ${toId}`);
      }
    }
  }

  // Add start state
  if (processedStates.size > 0) {
    const firstState = Array.from(processedStates)[0];
    lines.push(`    [*] --> ${firstState}`);
    
    // Add end state
    const lastStates = Array.from(processedStates).slice(-1);
    for (const lastState of lastStates) {
      lines.push(`    ${lastState} --> [*]`);
    }
  }

  return lines.join('\n');
}

/**
 * Generate Mermaid flowchart syntax from domain entities
 * 
 * @param entities Domain entities to include in the diagram
 * @param relations Entity relations (for future use with cross-entity flows)
 * @param options Diagram generation options
 * @returns Mermaid flowchart syntax string
 */
export function generateFlowDiagram(
  entities: DomainEntity[],
  relations: EntityRelation[],
  options: FlowDiagramOptions = {}
): string {
  const {
    direction = 'TD',
    showConnections = true,
    title,
    standardArrows = true,
    stateSeparator = DEFAULT_STATE_SEPARATOR,
  } = options;

  const lines: string[] = [];

  // Header
  lines.push(`flowchart ${direction}`);
  
  // Add title comment if provided
  if (title) {
    lines.push(`    %% ${title}`);
  }

  // Collect all states from all entities
  const allStates = new Map<string, { entityName: string; values: string[] }>();

  for (const entity of entities) {
    const states = identifyStates(entity);
    
    for (const stateField of states) {
      const key = `${entity.name}:${stateField.field}`;
      allStates.set(key, {
        entityName: entity.name,
        values: stateField.values,
      });
    }
  }

  if (allStates.size === 0) {
    // No states found, return basic diagram
    return lines.join('\n');
  }

  // Generate node definitions
  const processedStates = new Set<string>();
  const arrow = standardArrows ? '-->' : '->';

  for (const [key, stateInfo] of allStates) {
    for (const value of stateInfo.values) {
      const stateId = cleanStateValue(value);
      
      if (!processedStates.has(stateId)) {
        lines.push(`    ${stateId}["${value}"]`);
        processedStates.add(stateId);
      }
    }
  }

  // Generate connections between nodes
  if (showConnections) {
    for (const [key, stateInfo] of allStates) {
      if (stateInfo.values.length > 1) {
        const transitions = inferTransitions(stateInfo.values);
        
        for (const [from, to] of transitions) {
          const fromId = cleanStateValue(from);
          const toId = cleanStateValue(to);
          lines.push(`    ${fromId} ${arrow} ${toId}`);
        }
      }
    }
  }

  // Add start and end nodes
  if (processedStates.size > 0) {
    const firstState = Array.from(processedStates)[0];
    lines.push(`    start(("Start")) ${arrow} ${firstState}`);
    
    const lastStates = Array.from(processedStates).slice(-1);
    for (const lastState of lastStates) {
      lines.push(`    ${lastState} ${arrow} end(("End"))`);
    }
  }

  return lines.join('\n');
}

/**
 * Generate business flow diagram from project data
 * This is the main entry point that would typically fetch data from database
 * 
 * @param projectId Project ID to generate diagram for
 * @param env Cloudflare environment
 * @param options Diagram generation options
 * @returns Object containing state and flow diagram syntax strings
 */
export async function generateFlowDiagramsFromProject(
  projectId: string,
  env: unknown,
  options: {
    stateDiagram?: StateDiagramOptions;
    flowDiagram?: FlowDiagramOptions;
  } = {}
): Promise<{ stateDiagram: string; flowDiagram: string }> {
  // Import DB functions dynamically to avoid circular dependencies
  const { queryDB } = await import('@/lib/db');
  
  // Fetch entities for the project
  const entities = await queryDB<DomainEntity>(
    env as never,
    'SELECT * FROM DomainEntity WHERE projectId = ? ORDER BY createdAt DESC',
    [projectId]
  );

  // Fetch relations for the project
  const relations = await queryDB<EntityRelation>(
    env as never,
    'SELECT * FROM EntityRelation WHERE projectId = ? ORDER BY createdAt DESC',
    [projectId]
  );

  const stateDiagram = generateStateDiagram(entities, relations, options.stateDiagram);
  const flowDiagram = generateFlowDiagram(entities, relations, options.flowDiagram);

  return { stateDiagram, flowDiagram };
}

/**
 * Get business flow metadata for frontend rendering
 */
export interface BusinessFlowMetadata {
  entityCount: number;
  stateFieldCount: number;
  activityFieldCount: number;
  totalStates: number;
  entitiesWithStates: string[];
  entitiesWithActivities: string[];
}

export function getBusinessFlowMetadata(
  entities: DomainEntity[]
): BusinessFlowMetadata {
  let stateFieldCount = 0;
  let activityFieldCount = 0;
  const entitiesWithStates: string[] = [];
  const entitiesWithActivities: string[] = [];
  let totalStates = 0;

  for (const entity of entities) {
    const states = identifyStates(entity);
    const activities = identifyActivities(entity);

    if (states.length > 0) {
      entitiesWithStates.push(entity.name);
      stateFieldCount += states.length;
      for (const state of states) {
        totalStates += state.values.length;
      }
    }

    if (activities.length > 0) {
      entitiesWithActivities.push(entity.name);
      activityFieldCount += activities.length;
    }
  }

  return {
    entityCount: entities.length,
    stateFieldCount,
    activityFieldCount,
    totalStates,
    entitiesWithStates,
    entitiesWithActivities,
  };
}

// ==================== Export types ====================

export type {
  DomainEntity,
  EntityRelation,
};
