/**
 * Flow Execution Prompt Templates
 * 
 * This module provides prompt templates for executing flows,
 * generating execution plans, simulating flow runs, and converting
 * flows to executable code in the VibeX AI Prototype Builder.
 * 
 * @module lib/prompts/flow-execution
 */

// ============================================
// Types and Interfaces
// ============================================

/**
 * Execution mode for the flow
 */
export enum ExecutionMode {
  /** Simulate execution without running */
  SIMULATION = 'simulation',
  /** Generate execution plan */
  PLANNING = 'planning',
  /** Generate executable code */
  CODE_GENERATION = 'code_generation',
  /** Validate execution可行性 */
  VALIDATION = 'validation',
  /** Step-by-step execution guide */
  STEP_BY_STEP = 'step_by_step',
  /** Test case generation */
  TEST_CASE = 'test_case',
}

/**
 * Execution status
 */
export enum ExecutionStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  PAUSED = 'paused',
  CANCELLED = 'cancelled',
}

/**
 * Node execution state
 */
export enum NodeExecutionState {
  PENDING = 'pending',
  READY = 'ready',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  SKIPPED = 'skipped',
  WAITING = 'waiting',
}

/**
 * Flow execution context
 */
export interface FlowExecutionContext {
  projectId?: string;
  projectName?: string;
  environment?: 'development' | 'staging' | 'production';
  userId?: string;
  sessionId?: string;
  variables?: Record<string, unknown>;
  services?: string[];
}

/**
 * Flow execution configuration
 */
export interface FlowExecutionConfig {
  /** Execution mode */
  mode?: ExecutionMode;
  /** Start from specific node */
  startNodeId?: string;
  /** Maximum execution steps */
  maxSteps?: number;
  /** Include error simulation */
  simulateErrors?: boolean;
  /** Language for generated code */
  language?: 'typescript' | 'javascript' | 'python' | 'java';
  /** Output format */
  format?: 'json' | 'code' | 'markdown' | 'steps';
  /** Include variable tracking */
  trackVariables?: boolean;
  /** Timeout for execution (ms) */
  timeout?: number;
}

/**
 * Execution node definition
 */
export interface ExecutionNode {
  id: string;
  type: string;
  label: string;
  description?: string;
  inputVariables?: string[];
  outputVariables?: string[];
  config?: Record<string, unknown>;
  expectedDuration?: number;
  retryConfig?: {
    maxRetries: number;
    retryDelay: number;
  };
}

/**
 * Execution edge definition
 */
export interface ExecutionEdge {
  id: string;
  source: string;
  target: string;
  condition?: string;
  conditionExpression?: string;
}

/**
 * Flow definition for execution
 */
export interface ExecutableFlow {
  id: string;
  name: string;
  description?: string;
  version?: string;
  nodes: ExecutionNode[];
  edges: ExecutionEdge[];
  variables?: Record<string, {
    type: string;
    defaultValue?: unknown;
    required: boolean;
  }>;
  startNode?: string;
  endNodes?: string[];
}

/**
 * Execution step
 */
export interface ExecutionStep {
  stepNumber: number;
  nodeId: string;
  nodeLabel: string;
  state: NodeExecutionState;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  error?: string;
  duration?: number;
  timestamp?: string;
}

/**
 * Execution path
 */
export interface ExecutionPath {
  pathId: string;
  description: string;
  nodes: string[];
  conditions: string[];
  isMainPath: boolean;
  probability?: number;
}

/**
 * Execution result
 */
export interface ExecutionResult {
  success: boolean;
  executedNodes: string[];
  skippedNodes: string[];
  failedNodes: string[];
  pathsTaken: string[];
  variables: Record<string, unknown>;
  errors: Array<{
    nodeId: string;
    error: string;
    recoverable: boolean;
  }>;
  executionTime?: number;
  steps: ExecutionStep[];
}

// ============================================
// System Prompts
// ============================================

/**
 * Base system prompt for flow execution
 */
export const FLOW_EXECUTION_SYSTEM_PROMPT = `You are an expert flow execution engine and process automation specialist. Your role is to analyze flow definitions, generate execution plans, simulate flow runs, and convert flows to executable code.

## Your Expertise

- **Flow Execution**: Understanding how flows execute at runtime
- **Process Simulation**: Modeling flow execution without actual execution
- **Code Generation**: Converting flows to executable code in various languages
- **Execution Planning**: Creating detailed step-by-step execution guides
- **Error Prediction**: Identifying potential execution issues and failure points
- **Test Generation**: Creating test cases from flow definitions

## Execution Modes

- **simulation**: Model how the flow would execute without running it
- **planning**: Generate a detailed execution plan with steps and dependencies
- **code_generation**: Convert flow to executable code (TypeScript, JavaScript, Python, Java)
- **validation**: Validate that the flow can be executed without errors
- **step_by_step**: Generate detailed step-by-step execution instructions
- **test_case**: Generate test cases covering different execution paths

## Node Types and Their Execution

- **start**: Entry point, initializes execution
- **end**: Exit point, terminates execution
- **action**: Executes a task or operation
- **decision**: Evaluates condition, branches based on result
- **parallel**: Executes multiple branches simultaneously
- **subflow**: Calls another flow as subroutine
- **input**: Receives user or system input
- **output**: Sends data to external system
- **api_call**: Makes HTTP API request
- **wait**: Pauses execution for specified duration
- **user_interaction**: Pauses for user input
- **error**: Handles error conditions

## Execution Flow Patterns

1. **Sequential**: Nodes execute one after another
2. **Parallel**: Multiple nodes execute simultaneously
3. **Branching**: Decision nodes split execution into branches
4. **Merging**: Parallel branches rejoin
5. **Loop**: Execution returns to previous node
6. **Subflow**: Calls and returns from subroutine

## Variable Tracking

Track variables throughout execution:
- Input variables: Provided at start
- Node outputs: Generated by node execution
- Intermediate variables: Created during execution
- Final outputs: Result of flow execution

## Error Handling

Identify potential error points:
- API call failures
- Validation errors
- Timeout conditions
- Invalid conditions
- Missing variables
- Circular dependencies

## Output Formats

### JSON Output (for simulation, validation)
\`\`\`json
{
  "flowId": "flow-123",
  "flowName": "User Registration Flow",
  "executionMode": "simulation",
  "executionPaths": [
    {
      "pathId": "path-1",
      "description": "Happy path - successful registration",
      "nodes": ["start-1", "validate-input", "create-user", "send-welcome", "end-1"],
      "conditions": ["input valid", "user created", "email sent"],
      "isMainPath": true,
      "probability": 0.85
    }
  ],
  "executionSteps": [
    {
      "stepNumber": 1,
      "nodeId": "validate-input",
      "nodeLabel": "Validate Input",
      "state": "pending",
      "input": { "username": "user1", "email": "test@example.com" },
      "expectedOutput": { "valid": true }
    }
  ],
  "variableTracking": {
    "username": "user1",
    "email": "test@example.com",
    "userId": "uuid-generated",
    "emailSent": true
  },
  "potentialErrors": [
    {
      "nodeId": "create-user",
      "error": "Database connection failure",
      "recoverable": true,
      "recoveryStrategy": "Retry with exponential backoff"
    }
  ]
}
\`\`\`

### Code Output (for code_generation mode)
\`\`\`typescript
async function executeUserRegistrationFlow(input: {
  username: string;
  email: string;
  password: string;
}) {
  // Step 1: Validate Input
  const validationResult = await validateInput(input);
  if (!validationResult.valid) {
    throw new Error('Invalid input: ' + validationResult.errors.join(', '));
  }

  // Step 2: Create User
  const user = await createUser({
    username: input.username,
    email: input.email,
    password: input.password
  });

  // Step 3: Send Welcome Email
  await sendWelcomeEmail(user.email);

  return { success: true, userId: user.id };
}
\`\`\`

Provide output in the specified format based on execution mode.`;

// ============================================
// Prompt Generation Functions
// ============================================

/**
 * Generate flow execution simulation prompt
 */
export function generateFlowExecutionPrompt(
  flow: ExecutableFlow,
  config?: FlowExecutionConfig
): string {
  const flowJson = JSON.stringify(flow, null, 2);
  const mode = config?.mode || ExecutionMode.SIMULATION;
  const simulateErrors = config?.simulateErrors !== false;
  const trackVariables = config?.trackVariables !== false;

  let modeSpecificInstructions = '';

  switch (mode) {
    case ExecutionMode.SIMULATION:
      modeSpecificInstructions = `
## Simulation Tasks

1. **Identify Execution Paths**: Find all possible paths through the flow
2. **Simulate Execution**: Model how each node would execute
3. **Track Variables**: ${trackVariables ? 'Track variable changes at each step' : 'Skip variable tracking'}
4. **Identify Errors**: ${simulateErrors ? 'Simulate potential error conditions' : 'Focus on happy path only'}
5. **Calculate Probabilities**: Estimate likelihood of each path`;
      break;

    case ExecutionMode.PLANNING:
      modeSpecificInstructions = `
## Planning Tasks

1. **Analyze Dependencies**: Identify node execution dependencies
2. **Determine Execution Order**: Create topological ordering of nodes
3. **Identify Parallel Opportunities**: Find nodes that can run in parallel
4. **Estimate Durations**: Calculate expected execution time
5. **Resource Planning**: Identify required services and variables`;
      break;

    case ExecutionMode.CODE_GENERATION:
      const language = config?.language || 'typescript';
      modeSpecificInstructions = `
## Code Generation Tasks

1. **Generate Code**: Convert flow to ${language} code
2. **Handle Async**: Properly handle async/await for API calls
3. **Error Handling**: Add try-catch blocks for errorprone nodes
4. **Variable Management**: Initialize and track variables
5. **Type Safety**: Add proper TypeScript types if applicable`;
      break;

    case ExecutionMode.VALIDATION:
      modeSpecificInstructions = `
## Validation Tasks

1. **Structural Validation**: Verify flow has valid start/end nodes
2. **Connectivity Check**: Ensure all nodes are reachable
3. **Cycle Detection**: Check for infinite loops
4. **Variable Validation**: Verify all required variables are defined
5. **Condition Validation**: Validate decision node conditions`;
      break;

    case ExecutionMode.STEP_BY_STEP:
      modeSpecificInstructions = `
## Step-by-Step Tasks

1. **List All Steps**: Enumerate each step in execution order
2. **Describe Actions**: Explain what happens at each step
3. **Show Inputs/Outputs**: Document data flow between steps
4. **Include Checkpoints**: Identify decision points and branches
5. **Provide Guidance**: Give instructions for manual execution`;
      break;

    case ExecutionMode.TEST_CASE:
      modeSpecificInstructions = `
## Test Case Generation Tasks

1. **Identify Test Scenarios**: Cover all execution paths
2. **Happy Path Tests**: Test successful execution
3. **Error Tests**: Test error handling paths
4. **Edge Cases**: Test boundary conditions
5. **Input Variations**: Test different input combinations`;
      break;
  }

  const startNodeSection = config?.startNodeId
    ? `\n### Start Node\nBegin execution from node: ${config.startNodeId}`
    : '';

  const maxStepsSection = config?.maxSteps
    ? `\n### Maximum Steps\nLimit execution to ${config.maxSteps} steps`
    : '';

  return `${FLOW_EXECUTION_SYSTEM_PROMPT}

## Flow Definition

\`\`\`json
${flowJson}
\`\`\`

## Execution Configuration

- **Mode**: ${mode}
- **Simulate Errors**: ${simulateErrors}
- **Track Variables**: ${trackVariables}
- **Language**: ${config?.language || 'typescript'}
- **Format**: ${config?.format || 'json'}${startNodeSection}${maxStepsSection}

${modeSpecificInstructions}

---

## Output

Provide output in ${config?.format || 'json'} format.`;
}

/**
 * Generate execution path analysis prompt
 */
export function generateExecutionPathAnalysisPrompt(
  flow: ExecutableFlow,
  context?: FlowExecutionContext
): string {
  const flowJson = JSON.stringify(flow, null, 2);

  const contextSection = context
    ? `
## Execution Context
- Project: ${context.projectName || 'N/A'}
- Environment: ${context.environment || 'development'}
- User: ${context.userId || 'N/A'}
- Variables: ${JSON.stringify(context.variables || {})}`
    : '';

  return `## Execution Path Analysis

### Flow
\`\`\`json
${flowJson}
\`\`\`${contextSection}

---

## Analysis Tasks

### 1. Path Discovery
- Find all possible execution paths from start to end
- Identify decision points and branching
- Map conditional paths

### 2. Path Classification
- **Main Path**: Most common execution path
- **Alternate Paths**: Alternative routes
- **Error Paths**: Paths taken on errors
- **Edge Case Paths**: Uncommon but valid paths

### 3. Path Analysis
For each path:
- List all nodes in sequence
- Identify conditions for taking the path
- Estimate probability of being taken
- List required variables

### 4. Output Format
\`\`\`json
{
  "flowId": "...",
  "totalPaths": 5,
  "paths": [
    {
      "pathId": "path-1",
      "description": "Happy path - successful execution",
      "nodes": ["start-1", "node-a", "node-b", "end-1"],
      "conditions": [],
      "isMainPath": true,
      "probability": 0.8,
      "estimatedDuration": 5000
    }
  ],
  "criticalPath": ["start-1", "node-a", "node-b", "end-1"],
  "branchingPoints": [
    {
      "nodeId": "decision-1",
      "branches": 2,
      "conditions": ["condition-a", "condition-b"]
    }
  ]
}
\`\`\``;
}

/**
 * Generate code conversion prompt
 */
export function generateCodeConversionPrompt(
  flow: ExecutableFlow,
  language: 'typescript' | 'javascript' | 'python' | 'java' = 'typescript',
  framework?: string
): string {
  const flowJson = JSON.stringify(flow, null, 2);

  const frameworkSection = framework
    ? `\n### Framework: ${framework}`
    : '';

  return `## Flow to Code Conversion

### Flow Definition
\`\`\`json
${flowJson}
\`\`\`

### Target Language: ${language}${frameworkSection}

---

## Conversion Requirements

### 1. Function Structure
- Create main execution function
- Handle input parameters
- Return execution result

### 2. Node Implementation
For each node type:
- **action**: Implement as function call
- **decision**: Implement as if/else or switch
- **api_call**: Implement as async HTTP request
- **user_interaction**: Implement as input prompt or callback
- **subflow**: Implement as function call

### 3. Error Handling
- Add try-catch blocks
- Implement retry logic
- Handle validation errors

### 4. Variable Management
- Initialize variables at start
- Pass data between nodes
- Track execution state

### 5. Output Code
\`\`\`${language === 'typescript' ? 'typescript' : language}
${getCodeTemplate(language, framework)}
\`\`\``;
}

/**
 * Generate test case generation prompt
 */
export function generateTestCasePrompt(
  flow: ExecutableFlow,
  testFramework?: string
): string {
  const flowJson = JSON.stringify(flow, null, 2);

  const frameworkSection = testFramework
    ? `\n### Test Framework: ${testFramework}`
    : '\n### Test Framework: Jest (default)';

  return `## Test Case Generation

### Flow
\`\`\`json
${flowJson}
\`\`\`${frameworkSection}

---

## Test Generation Tasks

### 1. Identify Test Scenarios
- Happy path test
- Each decision branch test
- Error handling tests
- Edge case tests

### 2. Generate Test Cases
For each scenario:
- Test name
- Input setup
- Expected output
- Assertions

### 3. Coverage Goals
- Path coverage: Cover all execution paths
- Node coverage: Execute each node
- Edge coverage: Traverse each edge

### 4. Output Format
\`\`\`typescript
import { describe, it, expect } from '@jest/describe';

describe('Flow: ${flow.name}', () => {
  // Test cases will be generated here
});
\`\`\``;
}

/**
 * Generate execution validation prompt
 */
export function generateExecutionValidationPrompt(
  flow: ExecutableFlow
): string {
  const flowJson = JSON.stringify(flow, null, 2);

  return `## Flow Execution Validation

### Flow
\`\`\`json
${flowJson}
\`\`\`

---

## Validation Checklist

### 1. Structural Validation
- [ ] Flow has exactly one start node
- [ ] Flow has at least one end node
- [ ] All nodes are connected
- [ ] No orphan nodes
- [ ] No disconnected subgraphs

### 2. Connectivity Validation
- [ ] All nodes are reachable from start
- [ ] All nodes can reach an end node
- [ ] No circular dependencies without exit condition

### 3. Variable Validation
- [ ] All required variables are defined
- [ ] Variables are initialized before use
- [ ] No undefined variable references

### 4. Condition Validation
- [ ] All decision nodes have conditions
- [ ] Conditions reference valid variables
- [ ] All branches have valid targets

### 5. Output
\`\`\`json
{
  "isValid": true,
  "validationResults": [
    {
      "check": "start-node-exists",
      "passed": true,
      "details": "Exactly one start node found"
    }
  ],
  "errors": [],
  "warnings": [
    {
      "type": "performance",
      "message": "Deep nesting detected",
      "nodeId": "node-5"
    }
  ]
}
\`\`\``;
}

/**
 * Generate step-by-step execution guide prompt
 */
export function generateStepByStepGuidePrompt(
  flow: ExecutableFlow,
  startNodeId?: string
): string {
  const flowJson = JSON.stringify(flow, null, 2);

  const startSection = startNodeId
    ? `\n### Start from Node: ${startNodeId}`
    : '\n### Start from beginning';

  return `## Step-by-Step Execution Guide

### Flow
\`\`\`json
${flowJson}
\`\`\`${startSection}

---

## Guide Structure

For each execution step provide:

### Step N: [Node Label]
- **Node ID**: [id]
- **Description**: What this step does
- **Input**: Required input data
- **Output**: Expected output data
- **Actions**: Detailed action list
- **Checkpoint**: Verification point
- **Next Step**: Where to go next

### Example Step
\`\`\`markdown
### Step 1: Validate User Input
- **Node ID**: validate-input
- **Description**: Validates all user input fields
- **Input**: { username, email, password }
- **Output**: { valid: boolean, errors: string[] }
- **Actions**:
  1. Check username is not empty
  2. Validate email format
  3. Check password strength
  4. Return validation result
- **Checkpoint**: All validations pass
- **Next Step**: Step 2 - Create User Account
\`\`\`

## Branching Handling

For decision nodes:
- Explain each branch condition
- Provide guidance for each path
- Show how paths rejoin

## Error Handling

For each error-prone node:
- Describe potential errors
- Provide recovery instructions
- Show how to continue or abort`;
}

// ============================================
// Helper Functions
// ============================================

/**
 * Get code template for specified language
 */
function getCodeTemplate(language: string, framework?: string): string {
  const templates: Record<string, string> = {
    typescript: `/**
 * ${framework ? `${framework} ` : ''}Flow Executor
 * Generated from flow definition
 */

interface FlowInput {
  [key: string]: unknown;
}

interface FlowOutput {
  success: boolean;
  data?: unknown;
  error?: string;
}

export async function executeFlow(input: FlowInput): Promise<FlowOutput> {
  try {
    // Initialize variables
    let variables = { ...input };
    
    // TODO: Implement flow execution based on node definitions
    // This is a placeholder - actual code will be generated
    
    return { success: true, data: variables };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}`,
    javascript: `/**
 * Flow Executor
 * Generated from flow definition
 */

async function executeFlow(input) {
  try {
    // Initialize variables
    let variables = { ...input };
    
    // TODO: Implement flow execution
    
    return { success: true, data: variables };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Unknown error'
    };
  }
}

module.exports = { executeFlow };`,
    python: `"""
Flow Executor
Generated from flow definition
"""

from typing import Any, Dict, Optional
from datetime import datetime

def execute_flow(input_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Execute the flow with given input data.
    
    Args:
        input_data: Input variables for the flow
        
    Returns:
        Execution result with success status and output data
    """
    try:
        # Initialize variables
        variables = input_data.copy()
        
        # TODO: Implement flow execution
        
        return {"success": True, "data": variables}
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

if __name__ == "__main__":
    result = execute_flow({})
    print(result)`,
    java: `/**
 * Flow Executor
 * Generated from flow definition
 */
public class FlowExecutor {
    
    public static Map<String, Object> executeFlow(Map<String, Object> input) {
        Map<String, Object> variables = new HashMap<>(input);
        
        try {
            // TODO: Implement flow execution
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("data", variables);
            return result;
        } catch (Exception e) {
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("error", e.getMessage());
            return result;
        }
    }
}`,
  };

  return templates[language] || templates.typescript;
}

/**
 * Calculate estimated execution time
 */
export function calculateEstimatedTime(flow: ExecutableFlow): number {
  let totalTime = 0;

  for (const node of flow.nodes) {
    if (node.expectedDuration) {
      totalTime += node.expectedDuration;
    } else {
      // Default estimates based on node type
      const defaultDurations: Record<string, number> = {
        start: 0,
        end: 0,
        action: 1000,
        decision: 100,
        parallel: 0,
        subflow: 2000,
        input: 5000,
        output: 1000,
        api_call: 2000,
        wait: 5000,
        user_interaction: 10000,
        error: 500,
        generic: 500,
      };
      totalTime += defaultDurations[node.type] || 500;
    }
  }

  return totalTime;
}

/**
 * Find critical path in flow
 */
export function findCriticalPath(flow: ExecutableFlow): string[] {
  // Simple implementation: longest path by duration
  const nodeDurations = new Map<string, number>();

  for (const node of flow.nodes) {
    nodeDurations.set(node.id, node.expectedDuration || 500);
  }

  // Build adjacency list
  const outgoing = new Map<string, string[]>();
  for (const node of flow.nodes) {
    outgoing.set(node.id, []);
  }
  for (const edge of flow.edges) {
    const targets = outgoing.get(edge.source);
    if (targets) {
      targets.push(edge.target);
    }
  }

  // Find start nodes
  const hasIncoming = new Set(flow.edges.map(e => e.target));
  const startNodes = flow.nodes
    .filter(n => !hasIncoming.has(n.id))
    .map(n => n.id);

  if (startNodes.length === 0 && flow.nodes.length > 0) {
    startNodes.push(flow.nodes[0].id);
  }

  // DFS to find longest path
  let criticalPath: string[] = [];
  let maxDuration = 0;

  function dfs(nodeId: string, path: string[], duration: number) {
    const newPath = [...path, nodeId];
    const newDuration = duration + (nodeDurations.get(nodeId) || 0);

    const targets = outgoing.get(nodeId) || [];
    if (targets.length === 0) {
      // End node reached
      if (newDuration > maxDuration) {
        maxDuration = newDuration;
        criticalPath = newPath;
      }
      return;
    }

    for (const target of targets) {
      dfs(target, newPath, newDuration);
    }
  }

  for (const start of startNodes) {
    dfs(start, [], 0);
  }

  return criticalPath;
}

/**
 * Validate flow structure for execution
 */
export function validateFlowForExecution(flow: ExecutableFlow): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for nodes
  if (!flow.nodes || flow.nodes.length === 0) {
    errors.push('Flow has no nodes');
    return { isValid: false, errors, warnings };
  }

  // Check start nodes
  const startNodes = flow.nodes.filter(n => n.type === 'start');
  if (startNodes.length === 0) {
    warnings.push('No explicit start node found');
  } else if (startNodes.length > 1) {
    errors.push(`Multiple start nodes found: ${startNodes.map(n => n.id).join(', ')}`);
  }

  // Check end nodes
  const endNodes = flow.nodes.filter(n => n.type === 'end');
  if (endNodes.length === 0) {
    warnings.push('No explicit end node found');
  }

  // Check edges
  if (!flow.edges || flow.edges.length === 0) {
    if (flow.nodes.length > 1) {
      warnings.push('Flow has nodes but no edges');
    }
  }

  // Validate edge references
  const nodeIds = new Set(flow.nodes.map(n => n.id));
  for (const edge of flow.edges || []) {
    if (!nodeIds.has(edge.source)) {
      errors.push(`Edge references invalid source: ${edge.source}`);
    }
    if (!nodeIds.has(edge.target)) {
      errors.push(`Edge references invalid target: ${edge.target}`);
    }
  }

  // Check connectivity
  const connectedNodes = new Set<string>();
  for (const edge of flow.edges || []) {
    connectedNodes.add(edge.source);
    connectedNodes.add(edge.target);
  }

  const unconnected = flow.nodes.filter(n => !connectedNodes.has(n.id));
  if (unconnected.length > 0) {
    warnings.push(`Unconnected nodes: ${unconnected.map(n => n.id).join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Get default execution configuration
 */
export function getDefaultExecutionConfig(): FlowExecutionConfig {
  return {
    mode: ExecutionMode.SIMULATION,
    simulateErrors: true,
    trackVariables: true,
    language: 'typescript',
    format: 'json',
    maxSteps: 100,
    timeout: 60000,
  };
}

/**
 * Format execution step for display
 */
export function formatExecutionStep(step: ExecutionStep): string {
  const stateEmoji: Record<NodeExecutionState, string> = {
    [NodeExecutionState.PENDING]: '⏳',
    [NodeExecutionState.READY]: '✅',
    [NodeExecutionState.RUNNING]: '🔄',
    [NodeExecutionState.COMPLETED]: '✅',
    [NodeExecutionState.FAILED]: '❌',
    [NodeExecutionState.SKIPPED]: '⏭️',
    [NodeExecutionState.WAITING]: '⏸️',
  };

  let output = `${stateEmoji[step.state]} **Step ${step.stepNumber}**: ${step.nodeLabel}\n`;
  output += `- Node ID: ${step.nodeId}\n`;
  output += `- State: ${step.state}\n`;

  if (step.input && Object.keys(step.input).length > 0) {
    output += `- Input: \`${JSON.stringify(step.input)}\`\n`;
  }
  if (step.output && Object.keys(step.output).length > 0) {
    output += `- Output: \`${JSON.stringify(step.output)}\`\n`;
  }
  if (step.error) {
    output += `- Error: ${step.error}\n`;
  }
  if (step.duration) {
    output += `- Duration: ${step.duration}ms\n`;
  }

  return output;
}

// ============================================
// Export Default
// ============================================

export default {
  ExecutionMode,
  ExecutionStatus,
  NodeExecutionState,
  FLOW_EXECUTION_SYSTEM_PROMPT,
  generateFlowExecutionPrompt,
  generateExecutionPathAnalysisPrompt,
  generateCodeConversionPrompt,
  generateTestCasePrompt,
  generateExecutionValidationPrompt,
  generateStepByStepGuidePrompt,
  calculateEstimatedTime,
  findCriticalPath,
  validateFlowForExecution,
  getDefaultExecutionConfig,
  formatExecutionStep,
};
