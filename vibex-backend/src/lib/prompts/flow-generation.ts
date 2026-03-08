/**
 * Flow Generation Prompt Templates
 * 
 * This module provides prompt templates for generating flow diagrams
 * (workflows, process flows, decision trees) in the VibeX AI Prototype Builder.
 * 
 * @module lib/prompts/flow-generation
 */

// ============================================
// Types and Interfaces
// ============================================

/**
 * Type of flow being generated
 */
export enum FlowType {
  /** User interaction workflow */
  WORKFLOW = 'workflow',
  /** Decision tree or branching logic */
  DECISION_TREE = 'decision_tree',
  /** Data processing pipeline */
  DATA_PIPELINE = 'data_pipeline',
  /** Business process model */
  BUSINESS_PROCESS = 'business_process',
  /** User journey map */
  USER_JOURNEY = 'user_journey',
  /** State machine */
  STATE_MACHINE = 'state_machine',
  /** API integration flow */
  API_FLOW = 'api_flow',
  /** General process flow */
  GENERAL = 'general',
}

/**
 * Node types in the flow
 */
export enum FlowNodeType {
  /** Start of flow */
  START = 'start',
  /** End of flow */
  END = 'end',
  /** Action or task node */
  ACTION = 'action',
  /** Decision or condition */
  DECISION = 'decision',
  /** Parallel execution */
  PARALLEL = 'parallel',
  /** Subprocess or subflow */
  SUBFLOW = 'subflow',
  /** Data input */
  INPUT = 'input',
  /** Data output */
  OUTPUT = 'output',
  /** API call */
  API_CALL = 'api_call',
  /** Wait or delay */
  WAIT = 'wait',
  /** User interaction */
  USER_INTERACTION = 'user_interaction',
  /** Error handling */
  ERROR = 'error',
  /** General node */
  GENERIC = 'generic',
}

/**
 * Edge types in the flow
 */
export enum FlowEdgeType {
  /** Standard connection */
  DEFAULT = 'default',
  /** Conditional/branching */
  CONDITIONAL = 'conditional',
  /** True branch */
  TRUE = 'true',
  /** False branch */
  FALSE = 'false',
  /** Success path */
  SUCCESS = 'success',
  /** Error path */
  ERROR = 'error',
}

/**
 * Flow node definition
 */
export interface FlowNode {
  id: string;
  type: FlowNodeType;
  label: string;
  description?: string;
  position?: {
    x: number;
    y: number;
  };
  config?: Record<string, unknown>;
}

/**
 * Flow edge definition
 */
export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  type?: FlowEdgeType;
  label?: string;
  condition?: string;
}

/**
 * Complete flow definition
 */
export interface FlowDefinition {
  id: string;
  name: string;
  description: string;
  type: FlowType;
  nodes: FlowNode[];
  edges: FlowEdge[];
  metadata?: {
    author?: string;
    version?: string;
    tags?: string[];
    createdAt?: string;
  };
}

/**
 * Flow generation context
 */
export interface FlowGenerationContext {
  projectId?: string;
  requirementId?: string;
  entities?: Array<{
    name: string;
    type: string;
    properties?: string[];
  }>;
  existingFlow?: FlowDefinition;
  industry?: string;
  targetPlatform?: 'web' | 'mobile' | 'desktop' | 'api';
}

/**
 * Flow generation configuration
 */
export interface FlowGenerationConfig {
  /** Type of flow to generate */
  flowType?: FlowType;
  /** Maximum number of nodes */
  maxNodes?: number;
  /** Include error handling */
  includeErrorHandling?: boolean;
  /** Include validation steps */
  includeValidation?: boolean;
  /** Detail level */
  detailLevel?: 'brief' | 'standard' | 'detailed';
  /** Output format */
  format?: 'reactflow' | 'json' | 'mermaid';
  /** Language for output */
  language?: string;
}

// ============================================
// System Prompts
// ============================================

/**
 * Base system prompt for flow generation
 */
export const FLOW_GENERATION_SYSTEM_PROMPT = `You are an expert flow designer and process modeler specializing in creating clear, logical flow diagrams for software applications. Your role is to analyze requirements and generate accurate flow representations that can be visualized using React Flow.

## Your Expertise

- **Process Analysis**: Breaking down complex processes into sequential steps
- **Decision Modeling**: Creating clear decision trees and branching logic
- **Error Handling**: Anticipating failure points and designing recovery flows
- **User Experience**: Designing intuitive user journeys and interactions
- **Technical Implementation**: Understanding how flows translate to code

## Flow Types

- **workflow**: User interaction workflow (forms, wizards, CRUD operations)
- **decision_tree**: Branching logic and conditional paths
- **data_pipeline**: Data processing and transformation flows
- **business_process**: Business process modeling
- **user_journey**: User experience and journey mapping
- **state_machine**: State transitions and state management
- **api_flow**: API integration and data exchange
- **general**: General process flows

## Node Types

- **start**: Flow starting point (green circle)
- **end**: Flow ending point (red circle)
- **action**: Task or operation to perform (rectangle)
- **decision**: Conditional check (diamond)
- **parallel**: Parallel execution branch
- **subflow**: Reusable subprocess
- **input**: Data input point
- **output**: Data output point
- **api_call**: External API request
- **wait**: Delay or waiting state
- **user_interaction**: User input required
- **error**: Error handling
- **generic**: Generic node

## Edge Types

- **default**: Standard flow connection
- **conditional**: Conditional branching with label
- **true**: True branch from decision
- **false**: False branch from decision
- **success**: Success path
- **error**: Error path

## Output Format (React Flow JSON)

You MUST respond with a valid JSON object containing React Flow compatible nodes and edges:

\`\`\`json
{
  "nodes": [
    {
      "id": "node-1",
      "type": "action",
      "data": {
        "label": "User submits form",
        "description": "Collects user input"
      },
      "position": { "x": 0, "y": 0 }
    }
  ],
  "edges": [
    {
      "id": "edge-1",
      "source": "node-1",
      "target": "node-2",
      "type": "default",
      "label": "valid"
    }
  ],
  "metadata": {
    "name": "Form Submission Flow",
    "description": "Flow for handling form submissions",
    "type": "workflow",
    "version": "1.0"
  }
}
\`\`\`

Provide ONLY the JSON, no additional text.`;

/**
 * Brief flow generation prompt
 */
export const BRIEF_FLOW_GENERATION_PROMPT = `Generate a simple flow diagram for the following requirement:

{requirement}

Provide:
1. Flow name
2. Brief description
3. Key nodes (start, main steps, end)
4. Simple connections between nodes

Output as JSON with nodes and edges.`;

/**
 * Detailed flow generation prompt
 */
export const DETAILED_FLOW_GENERATION_PROMPT = `Generate a comprehensive flow diagram for the following requirement. Include all decision points, error handling, validation steps, and user interactions.

Requirement: {requirement}

Context: {context}

Provide:
- Flow name and description
- All node types with labels and descriptions
- Complete edge connections with conditions
- Decision branches (true/false paths)
- Error handling paths
- Validation steps
- User interaction points
- API calls if applicable

Output as detailed JSON in React Flow format.`;

// ============================================
// Prompt Generation Functions
// ============================================

/**
 * Generate a flow from requirement description
 */
export function generateFlowPrompt(
  requirement: string,
  config?: FlowGenerationConfig
): string {
  const systemPrompt = FLOW_GENERATION_SYSTEM_PROMPT;
  
  const flowTypeSection = config?.flowType 
    ? `Flow Type: ${config.flowType}\n` 
    : '';
  
  const detailLevel = config?.detailLevel || 'standard';
  
  let userPrompt: string;
  
  switch (detailLevel) {
    case 'brief':
      userPrompt = BRIEF_FLOW_GENERATION_PROMPT.replace(
        '{requirement}',
        requirement
      );
      break;
    case 'detailed':
      userPrompt = DETAILED_FLOW_GENERATION_PROMPT
        .replace('{requirement}', requirement)
        .replace('{context}', flowTypeSection);
      break;
    default:
      userPrompt = `${systemPrompt}

## Requirement to Model

${requirement}

${flowTypeSection}Provide your flow in the specified JSON format.`;
  }
  
  return userPrompt;
}

/**
 * Generate flow from existing requirement analysis
 */
export function generateFlowFromAnalysisPrompt(
  analysisResult: string,
  context?: FlowGenerationContext
): string {
  const contextSection = context?.entities 
    ? `Entities involved:\n${context.entities.map(e => `- ${e.name} (${e.type})`).join('\n')}\n`
    : '';
  
  const flowTypeSection = context?.industry
    ? `Industry: ${context.industry}\n`
    : '';

  return `${FLOW_GENERATION_SYSTEM_PROMPT}

## Based on Requirement Analysis

${analysisResult}

${contextSection}${flowTypeSection}Generate a detailed flow diagram based on this analysis.

Output as React Flow JSON format.`;
}

/**
 * Generate decision tree prompt
 */
export function generateDecisionTreePrompt(
  condition: string,
  options: string[]
): string {
  return `Create a decision tree for the following condition:

Condition: ${condition}

Options: ${options.join(', ')}

Output as JSON with:
- Decision node at root
- Branches for each option
- End nodes for each outcome
- Appropriate edge labels`;
}

/**
 * Generate user journey flow prompt
 */
export function generateUserJourneyPrompt(
  userGoal: string,
  userPersona?: string
): string {
  const personaSection = userPersona 
    ? `User Persona: ${userPersona}\n` 
    : '';

  return `Design a user journey flow for achieving this goal:

Goal: ${userGoal}

${personaSection}Include:
- Initial entry point
- All user interactions
- Decision points
- Success and failure paths
- Final outcome

Output as React Flow JSON.`;
}

/**
 * Generate CRUD operation flow prompt
 */
export function generateCRUDFlowPrompt(
  entityName: string,
  operations: Array<'create' | 'read' | 'update' | 'delete'>
): string {
  const opsList = operations.join(', ').toUpperCase();
  
  return `Generate a flow for ${opsList} operations on "${entityName}":

Operations: ${opsList}

Include:
- List/Browse (for read)
- Create form and submission
- Read/Detail view
- Update form and submission
- Delete confirmation
- Success/Error handling
- Navigation between views

Output as React Flow JSON.`;
}

/**
 * Generate API integration flow prompt
 */
export function generateAPIFlowPrompt(
  apiPurpose: string,
  endpoint?: string
): string {
  const endpointSection = endpoint 
    ? `Endpoint: ${endpoint}\n` 
    : '';

  return `Create an API integration flow:

Purpose: ${apiPurpose}
${endpointSection}Include:
- API request setup
- Authentication if needed
- Request payload
- Success response handling
- Error handling
- Response parsing
- Data storage if applicable

Output as React Flow JSON.`;
}

/**
 * Generate state machine flow prompt
 */
export function generateStateMachinePrompt(
  entityName: string,
  states: string[],
  transitions: Array<{ from: string; to: string; trigger: string }>
): string {
  const transitionsList = transitions
    .map(t => `- ${t.from} -> ${t.to} (${t.trigger})`)
    .join('\n');

  return `Design a state machine flow for "${entityName}":

States: ${states.join(', ')}

Transitions:
${transitionsList}

Output as React Flow JSON with:
- State nodes
- Transition edges with trigger labels
- Start and end states clearly marked`;
}

/**
 * Generate validation flow prompt
 */
export function generateValidationFlowPrompt(
  formName: string,
  fields: Array<{ name: string; rules: string[] }>
): string {
  const fieldsList = fields
    .map(f => `- ${f.name}: ${f.rules.join(', ')}`)
    .join('\n');

  return `Create a validation flow for "${formName}":

Fields and validation rules:
${fieldsList}

Include:
- Form input nodes
- Individual field validation
- Form-level validation
- Error display
- Success path

Output as React Flow JSON.`;
}

// ============================================
// Helper Functions
// ============================================

/**
 * Validate flow output
 */
export function validateFlowOutput(output: unknown): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (!output || typeof output !== 'object') {
    errors.push('Output must be an object');
    return { isValid: false, errors, warnings };
  }
  
  const obj = output as Record<string, unknown>;
  
  // Check for nodes
  if (!obj.nodes || !Array.isArray(obj.nodes)) {
    errors.push('Missing nodes array');
  } else {
    if (obj.nodes.length === 0) {
      warnings.push('No nodes in flow');
    }
    
    // Validate each node
    const nodeIds = new Set<string>();
    for (const node of obj.nodes) {
      if (typeof node !== 'object' || node === null) {
        errors.push('Node must be an object');
        continue;
      }
      
      const nodeObj = node as Record<string, unknown>;
      if (!nodeObj.id) {
        errors.push('Node missing id');
      } else {
        if (nodeIds.has(nodeObj.id as string)) {
          errors.push(`Duplicate node id: ${nodeObj.id}`);
        }
        nodeIds.add(nodeObj.id as string);
      }
    }
  }
  
  // Check for edges
  if (!obj.edges || !Array.isArray(obj.edges)) {
    errors.push('Missing edges array');
  } else {
    const nodeIds = new Set<string>();
    if (Array.isArray(obj.nodes)) {
      for (const node of obj.nodes) {
        if (typeof node === 'object' && node !== null) {
          const nodeObj = node as Record<string, unknown>;
          if (nodeObj.id) {
            nodeIds.add(nodeObj.id as string);
          }
        }
      }
    }
    
    // Validate edges
    for (const edge of obj.edges) {
      if (typeof edge !== 'object' || edge === null) {
        errors.push('Edge must be an object');
        continue;
      }
      
      const edgeObj = edge as Record<string, unknown>;
      
      if (!edgeObj.source) {
        errors.push('Edge missing source');
      } else if (!nodeIds.has(edgeObj.source as string)) {
        warnings.push(`Edge references unknown source: ${edgeObj.source}`);
      }
      
      if (!edgeObj.target) {
        errors.push('Edge missing target');
      } else if (!nodeIds.has(edgeObj.target as string)) {
        warnings.push(`Edge references unknown target: ${edgeObj.target}`);
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Get default flow structure
 */
export function getDefaultFlow(): FlowDefinition {
  return {
    id: 'flow-default',
    name: 'New Flow',
    description: 'Empty flow',
    type: FlowType.GENERAL,
    nodes: [
      {
        id: 'start-1',
        type: FlowNodeType.START,
        label: 'Start',
        position: { x: 250, y: 0 },
      },
    ],
    edges: [],
    metadata: {
      version: '1.0',
    },
  };
}

/**
 * Get node type label
 */
export function getNodeTypeLabel(type: FlowNodeType): string {
  const labels: Record<FlowNodeType, string> = {
    [FlowNodeType.START]: 'Start',
    [FlowNodeType.END]: 'End',
    [FlowNodeType.ACTION]: 'Action',
    [FlowNodeType.DECISION]: 'Decision',
    [FlowNodeType.PARALLEL]: 'Parallel',
    [FlowNodeType.SUBFLOW]: 'Subflow',
    [FlowNodeType.INPUT]: 'Input',
    [FlowNodeType.OUTPUT]: 'Output',
    [FlowNodeType.API_CALL]: 'API Call',
    [FlowNodeType.WAIT]: 'Wait',
    [FlowNodeType.USER_INTERACTION]: 'User Interaction',
    [FlowNodeType.ERROR]: 'Error',
    [FlowNodeType.GENERIC]: 'Node',
  };
  return labels[type] || 'Unknown';
}

/**
 * Calculate optimal node positions
 */
export function calculateNodePositions(
  nodes: FlowNode[],
  horizontalGap: number = 200,
  verticalGap: number = 100
): FlowNode[] {
  const startX = 250;
  const startY = 50;
  
  return nodes.map((node, index) => ({
    ...node,
    position: {
      x: startX,
      y: startY + index * verticalGap,
    },
  }));
}

/**
 * Convert flow to Mermaid diagram
 */
export function flowToMermaid(flow: FlowDefinition): string {
  const lines: string[] = ['graph TD'];
  
  // Add nodes
  for (const node of flow.nodes) {
    const label = node.label.replace(/"/g, "'");
    lines.push(`  ${node.id}["${label}"]`);
  }
  
  // Add edges
  for (const edge of flow.edges) {
    const label = edge.label ? `|${edge.label}|` : '';
    lines.push(`  ${edge.source}${label}${edge.target}`);
  }
  
  return lines.join('\n');
}

/**
 * Get flow type from requirement
 */
export function inferFlowType(requirement: string): FlowType {
  const lower = requirement.toLowerCase();
  
  if (lower.includes('decision') || lower.includes('if') || lower.includes('condition')) {
    return FlowType.DECISION_TREE;
  }
  if (lower.includes('journey') || lower.includes('user experience') || lower.includes('ux')) {
    return FlowType.USER_JOURNEY;
  }
  if (lower.includes('api') || lower.includes('integration') || lower.includes('fetch')) {
    return FlowType.API_FLOW;
  }
  if (lower.includes('state') || lower.includes('status') || lower.includes('transition')) {
    return FlowType.STATE_MACHINE;
  }
  if (lower.includes('data') || lower.includes('pipeline') || lower.includes('process')) {
    return FlowType.DATA_PIPELINE;
  }
  if (lower.includes('crud') || lower.includes('create') || lower.includes('update') || lower.includes('delete')) {
    return FlowType.WORKFLOW;
  }
  if (lower.includes('business') || lower.includes('process')) {
    return FlowType.BUSINESS_PROCESS;
  }
  
  return FlowType.GENERAL;
}
