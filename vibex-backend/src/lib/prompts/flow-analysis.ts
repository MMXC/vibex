/**
 * Flow Analysis Prompt Templates
 * 
 * This module provides prompt templates for analyzing existing flows,
 * identifying issues, bottlenecks, optimization opportunities, and validating
 * flow logic in the VibeX AI Prototype Builder.
 * 
 * @module lib/prompts/flow-analysis
 */

// ============================================
// Types and Interfaces
// ============================================

/**
 * Type of flow being analyzed
 */
export enum FlowAnalysisType {
  /** General workflow analysis */
  WORKFLOW = 'workflow',
  /** Decision tree analysis */
  DECISION_TREE = 'decision_tree',
  /** Data pipeline analysis */
  DATA_PIPELINE = 'data_pipeline',
  /** Business process analysis */
  BUSINESS_PROCESS = 'business_process',
  /** User journey analysis */
  USER_JOURNEY = 'user_journey',
  /** State machine analysis */
  STATE_MACHINE = 'state_machine',
  /** API flow analysis */
  API_FLOW = 'api_flow',
}

/**
 * Analysis categories for flow evaluation
 */
export enum FlowAnalysisCategory {
  /** Logic and correctness */
  LOGIC = 'logic',
  /** Performance and efficiency */
  PERFORMANCE = 'performance',
  /** User experience */
  UX = 'ux',
  /** Error handling */
  ERROR_HANDLING = 'error_handling',
  /** Completeness */
  COMPLETENESS = 'completeness',
  /** Security */
  SECURITY = 'security',
  /** Maintainability */
  MAINTAINABILITY = 'maintainability',
}

/**
 * Severity levels for identified issues
 */
export enum IssueSeverity {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  INFO = 'info',
}

/**
 * Flow node issue
 */
export interface FlowIssue {
  id: string;
  severity: IssueSeverity;
  category: FlowAnalysisCategory;
  title: string;
  description: string;
  nodeId?: string;
  edgeId?: string;
  suggestion: string;
  impactedNodes?: string[];
}

/**
 * Flow optimization opportunity
 */
export interface FlowOptimization {
  id: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'high' | 'medium' | 'low';
  suggestion: string;
  affectedNodes?: string[];
}

/**
 * Flow analysis context
 */
export interface FlowAnalysisContext {
  projectId?: string;
  projectName?: string;
  industry?: string;
  targetPlatform?: 'web' | 'mobile' | 'desktop' | 'api';
  userRoles?: string[];
  compliance?: string[];
}

/**
 * Flow analysis configuration
 */
export interface FlowAnalysisConfig {
  /** Types of analysis to perform */
  analysisTypes?: FlowAnalysisType[];
  /** Categories to focus on */
  focusCategories?: FlowAnalysisCategory[];
  /** Include optimization suggestions */
  includeOptimizations?: boolean;
  /** Include validation results */
  includeValidation?: boolean;
  /** Detail level */
  detailLevel?: 'brief' | 'standard' | 'detailed';
  /** Language for output */
  language?: string;
}

/**
 * Flow node for analysis
 */
export interface AnalysisFlowNode {
  id: string;
  type: string;
  label: string;
  description?: string;
  config?: Record<string, unknown>;
}

/**
 * Flow edge for analysis
 */
export interface AnalysisFlowEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
  label?: string;
  condition?: string;
}

/**
 * Flow definition for analysis
 */
export interface AnalysisFlowDefinition {
  id: string;
  name: string;
  description?: string;
  type: FlowAnalysisType;
  nodes: AnalysisFlowNode[];
  edges: AnalysisFlowEdge[];
}

// ============================================
// System Prompts
// ============================================

/**
 * Base system prompt for flow analysis
 */
export const FLOW_ANALYSIS_SYSTEM_PROMPT = `You are an expert flow analyst and process consultant specializing in analyzing flow diagrams, workflows, and process models. Your role is to thoroughly examine flows for correctness, efficiency, completeness, and identify improvement opportunities.

## Your Expertise

- **Flow Logic Analysis**: Verifying flow correctness and identifying logical errors
- **Process Optimization**: Finding bottlenecks and optimization opportunities
- **Error Handling Evaluation**: Assessing error handling completeness
- **User Experience Review**: Evaluating user journey clarity and smoothness
- **Security Analysis**: Identifying security vulnerabilities in flows
- **Compliance Checking**: Ensuring flows meet regulatory requirements

## Analysis Categories

### 1. Logic Analysis
- Verify all paths lead to appropriate endpoints
- Check for infinite loops or unreachable states
- Validate decision logic and conditions
- Ensure proper branching and merging

### 2. Performance Analysis
- Identify unnecessary steps or redundancy
- Find sequential operations that could be parallel
- Detect bottlenecks and wait states
- Evaluate API call efficiency

### 3. User Experience Analysis
- Assess flow clarity and intuitiveness
- Check for unnecessary user interactions
- Evaluate feedback and progress indicators
- Verify user control and transparency

### 4. Error Handling Analysis
- Identify missing error handling paths
- Check for unhandled edge cases
- Evaluate error recovery strategies
- Assess validation completeness

### 5. Completeness Analysis
- Verify all scenarios are covered
- Check for missing validation steps
- Ensure all user roles are accommodated
- Verify business requirements are met

### 6. Security Analysis
- Identify authentication/authorization gaps
- Check for data exposure risks
- Validate secure data handling
- Assess input validation

### 7. Maintainability Analysis
- Evaluate complexity and readability
- Check for proper modularization
- Verify clear naming and documentation
- Assess testability

## Issue Severity Levels

- **Critical**: Flow-breaking issue, immediate fix required
- **High**: Significant problem affecting functionality
- **Medium**: Notable issue that should be addressed
- **Low**: Minor improvement suggestion
- **Info**: Observation or best practice recommendation

## Output Format

You MUST respond with a valid JSON object:

\`\`\`json
{
  "flowId": "flow-123",
  "flowName": "Example Flow",
  "analysisDate": "2024-01-01T00:00:00Z",
  "summary": {
    "totalNodes": 10,
    "totalEdges": 12,
    "issuesFound": 5,
    "optimizationsFound": 3,
    "overallScore": 7.5
  },
  "issues": [
    {
      "id": "issue-1",
      "severity": "high",
      "category": "logic",
      "title": "Missing Error Handling",
      "description": "The API call node does not handle failure responses",
      "nodeId": "node-3",
      "suggestion": "Add error handling edge with retry logic"
    }
  ],
  "optimizations": [
    {
      "id": "opt-1",
      "title": "Parallel Data Fetching",
      "description": "Two independent API calls could run in parallel",
      "impact": "medium",
      "effort": "low",
      "suggestion": "Use parallel branch for nodes 4 and 5"
    }
  ],
  "validation": {
    "isValid": true,
    "warnings": [],
    "errors": []
  },
  "metrics": {
    "complexity": 5,
    "branchingFactor": 2.3,
    "avgPathLength": 4.5
  }
}
\`\`\`

Provide ONLY the JSON, no additional text.`;

// ============================================
// Prompt Generation Functions
// ============================================

/**
 * Generate a comprehensive flow analysis prompt
 */
export function generateFlowAnalysisPrompt(
  flow: AnalysisFlowDefinition,
  config?: FlowAnalysisConfig
): string {
  const flowJson = JSON.stringify(flow, null, 2);
  
  const analysisTypes = config?.analysisTypes || Object.values(FlowAnalysisType);
  const focusCategories = config?.focusCategories || Object.values(FlowAnalysisCategory);
  const detailLevel = config?.detailLevel || 'standard';
  const includeOptimizations = config?.includeOptimizations !== false;
  const includeValidation = config?.includeValidation !== false;

  const analysisTypesSection = analysisTypes
    .map(t => `- ${t}`)
    .join('\n');

  const focusCategoriesSection = focusCategories
    .map(c => `- ${c}`)
    .join('\n');

  let additionalInstructions = '';
  
  if (detailLevel === 'brief') {
    additionalInstructions = `
## Focus
- Identify critical and high severity issues only
- Provide concise summaries
- Skip detailed metrics`;
  } else if (detailLevel === 'detailed') {
    additionalInstructions = `
## Focus
- Perform thorough analysis across all categories
- Include detailed metrics and complexity analysis
- Provide step-by-step validation
- Include recommendations for each issue`;
  }

  return `${FLOW_ANALYSIS_SYSTEM_PROMPT}

## Flow to Analyze

\`\`\`json
${flowJson}
\`\`\`

## Analysis Configuration

### Analysis Types
${analysisTypesSection}

### Focus Categories
${focusCategoriesSection}

### Options
- Include Optimizations: ${includeOptimizations}
- Include Validation: ${includeValidation}
- Detail Level: ${detailLevel}
${additionalInstructions}

---

## Analysis Tasks

### 1. Structural Analysis
- Count nodes and edges
- Analyze graph structure (connected components, cycles)
- Identify entry and exit points
- Map all possible paths

### 2. Category-Specific Analysis
For each focus category:
- Identify relevant issues
- Provide severity ratings
- Suggest improvements

### 3. Issue Prioritization
- Group issues by severity
- Identify root causes
- Prioritize fixes

### 4. Optimization Identification
${includeOptimizations ? '- Find performance improvements' : '- (Optimizations disabled)'}

### 5. Validation
${includeValidation ? '- Verify flow completeness' : '- (Validation disabled)'}

Provide your analysis in the specified JSON format.`;
}

/**
 * Generate a focused prompt for specific analysis category
 */
export function generateFocusedAnalysisPrompt(
  flow: AnalysisFlowDefinition,
  category: FlowAnalysisCategory,
  context?: FlowAnalysisContext
): string {
  const flowJson = JSON.stringify(flow, null, 2);

  const categoryGuidance: Record<FlowAnalysisCategory, string> = {
    [FlowAnalysisCategory.LOGIC]: `
### Logic Analysis Focus
- Verify all paths are valid
- Check decision node conditions
- Ensure proper branching
- Identify logical errors`,
    [FlowAnalysisCategory.PERFORMANCE]: `
### Performance Analysis Focus
- Find redundant operations
- Identify sequential tasks that could parallelize
- Detect unnecessary API calls
- Evaluate caching opportunities`,
    [FlowAnalysisCategory.UX]: `
### UX Analysis Focus
- Assess flow clarity
- Check user feedback mechanisms
- Evaluate progress indicators
- Verify intuitive navigation`,
    [FlowAnalysisCategory.ERROR_HANDLING]: `
### Error Handling Focus
- Identify missing error paths
- Check edge case handling
- Evaluate recovery options
- Verify validation completeness`,
    [FlowAnalysisCategory.COMPLETENESS]: `
### Completeness Focus
- Verify all scenarios covered
- Check missing steps
- Ensure requirements met
- Verify role coverage`,
    [FlowAnalysisCategory.SECURITY]: `
### Security Analysis Focus
- Check authentication gaps
- Identify data exposure risks
- Verify input validation
- Assess authorization logic`,
    [FlowAnalysisCategory.MAINTAINABILITY]: `
### Maintainability Focus
- Evaluate complexity
- Check naming clarity
- Verify modularity
- Assess testability`,
  };

  const contextSection = context
    ? `
## Context
- Project: ${context.projectName || 'N/A'}
- Platform: ${context.targetPlatform || 'web'}
- User Roles: ${context.userRoles?.join(', ') || 'All'}
- Industry: ${context.industry || 'General'}`
    : '';

  return `${FLOW_ANALYSIS_SYSTEM_PROMPT}

## Flow to Analyze

\`\`\`json
${flowJson}
\`\`\`${contextSection}

## Focused Analysis: ${category}
${categoryGuidance[category]}

---

Analyze ONLY the specified category in detail.

Output JSON with:
- Issues specific to this category
- Severity and suggestions
- Category-specific metrics`;
}

/**
 * Generate a prompt for comparing two flows
 */
export function generateFlowComparisonPrompt(
  flowA: AnalysisFlowDefinition,
  flowB: AnalysisFlowDefinition,
  comparisonType?: 'structure' | 'logic' | 'optimization'
): string {
  const flowAJson = JSON.stringify(flowA, null, 2);
  const flowBJson = JSON.stringify(flowB, null, 2);

  return `## Flow Comparison Analysis

### Flow A (${flowA.name})
\`\`\`json
${flowAJson}
\`\`\`

### Flow B (${flowB.name})
\`\`\`json
${flowBJson}
\`\`\`

### Comparison Type: ${comparisonType || 'comprehensive'}

---

## Comparison Tasks

### 1. Structural Differences
- Compare node counts and types
- Analyze edge differences
- Identify added/removed components

### 2. Logic Differences (if applicable)
- Compare decision logic
- Analyze path variations
- Evaluate branching changes

### 3. Optimization Comparison (if applicable)
- Identify improvements in Flow B
- Note regressions from Flow A
- Assess overall efficiency

### Output Format
\`\`\`json
{
  "flowA": { "id": "...", "name": "...", "nodeCount": 0, "edgeCount": 0 },
  "flowB": { "id": "...", "name": "...", "nodeCount": 0, "edgeCount": 0 },
  "differences": {
    "structural": [...],
    "logic": [...],
    "optimization": [...]
  },
  "recommendations": "..."
}
\`\`\``;
}

/**
 * Generate a prompt for validating flow completeness
 */
export function generateFlowValidationPrompt(
  flow: AnalysisFlowDefinition,
  requirements?: string[]
): string {
  const flowJson = JSON.stringify(flow, null, 2);
  const requirementsSection = requirements
    ? requirements.map(r => `- ${r}`).join('\n')
    : '- (No specific requirements provided)';

  return `## Flow Validation

### Flow to Validate
\`\`\`json
${flowJson}
\`\`\`

### Requirements to Verify
${requirementsSection}

---

## Validation Checklist

### 1. Structural Validation
- [ ] All nodes have valid types
- [ ] All edges connect valid nodes
- [ ] Flow has start and end points
- [ ] No orphaned nodes
- [ ] No disconnected subgraphs

### 2. Logic Validation
- [ ] All decision branches handled
- [ ] No infinite loops
- [ ] All paths lead to valid endpoints
- [ ] Conditions are complete

### 3. Requirements Validation
For each requirement:
- Verify the flow satisfies it
- Identify missing elements

### 4. Output
\`\`\`json
{
  "isValid": true,
  "validationResults": [
    { "check": "...", "passed": true, "details": "..." }
  ],
  "missingRequirements": [...],
  "errors": [],
  "warnings": []
}
\`\`\``;
}

/**
 * Generate a prompt for identifying bottlenecks
 */
export function generateBottleneckAnalysisPrompt(
  flow: AnalysisFlowDefinition,
  context?: FlowAnalysisContext
): string {
  const flowJson = JSON.stringify(flow, null, 2);

  return `## Bottleneck Analysis

### Flow
\`\`\`json
${flowJson}
\`\`\`

${context?.targetPlatform ? `### Platform: ${context.targetPlatform}` : ''}

---

## Bottleneck Detection

Identify nodes and paths that could cause delays or performance issues:

### 1. Sequential Dependencies
- Find long chains of sequential operations
- Identify opportunities for parallelization

### 2. Resource-Intensive Nodes
- API calls that could be cached
- Complex computations
- Large data processing

### 3. Wait States
- User input waits
- External service delays
- Timer-based delays

### 4. Output Format
\`\`\`json
{
  "bottlenecks": [
    {
      "nodeId": "...",
      "type": "sequential|resource|wait",
      "severity": "high|medium|low",
      "description": "...",
      "recommendation": "..."
    }
  ],
  "optimizationPotential": "high|medium|low"
}
\`\`\``;
}

/**
 * Generate a prompt for security analysis
 */
export function generateSecurityAnalysisPrompt(
  flow: AnalysisFlowDefinition,
  context?: FlowAnalysisContext
): string {
  const flowJson = JSON.stringify(flow, null, 2);

  return `## Security Analysis

### Flow
\`\`\`json
${flowJson}
\`\`\`

${context?.compliance ? `### Compliance Requirements: ${context.compliance.join(', ')}` : ''}

---

## Security Checks

### 1. Authentication
- [ ] Login required before sensitive operations
- [ ] Session timeout handled
- [ ] Re-authentication for sensitive actions

### 2. Authorization
- [ ] Role-based access control
- [ ] Permission checks before actions
- [ ] Data access restrictions

### 3. Data Protection
- [ ] Sensitive data not exposed
- [ ] Proper data validation
- [ ] Secure data transmission

### 4. Error Handling
- [ ] No sensitive data in errors
- [ ] Proper error messages
- [ ] Secure failure modes

### 5. Output
\`\`\`json
{
  "securityIssues": [
    {
      "severity": "critical|high|medium|low",
      "category": "auth|authorization|data|error",
      "title": "...",
      "description": "...",
      "nodeId": "...",
      "recommendation": "..."
    }
  ],
  "complianceStatus": {
    "passed": true,
    "violations": []
  }
}
\`\`\``;
}

// ============================================
// Helper Functions
// ============================================

/**
 * Calculate flow complexity score
 */
export function calculateComplexity(
  nodes: AnalysisFlowNode[],
  edges: AnalysisFlowEdge[]
): {
  complexity: number;
  rating: 'low' | 'medium' | 'high' | 'very_high';
  factors: Record<string, number>;
} {
  const nodeCount = nodes.length;
  const edgeCount = edges.length;
  
  // Calculate cyclomatic complexity approximation
  const branchingFactor = edgeCount / Math.max(nodeCount, 1);
  
  // Count decision nodes
  const decisionNodes = nodes.filter(n => 
    n.type === 'decision' || n.type === 'conditional'
  ).length;
  
  // Calculate complexity metrics
  const complexity = Math.max(1, 
    (nodeCount * 0.3) + 
    (edgeCount * 0.2) + 
    (decisionNodes * 2)
  );
  
  let rating: 'low' | 'medium' | 'high' | 'very_high';
  if (complexity < 5) rating = 'low';
  else if (complexity < 10) rating = 'medium';
  else if (complexity < 20) rating = 'high';
  else rating = 'very_high';
  
  return {
    complexity: Math.round(complexity * 10) / 10,
    rating,
    factors: {
      nodeCount,
      edgeCount,
      branchingFactor: Math.round(branchingFactor * 10) / 10,
      decisionNodes,
    },
  };
}

/**
 * Get all paths in a flow
 */
export function getAllPaths(
  nodes: AnalysisFlowNode[],
  edges: AnalysisFlowEdge[]
): string[][] {
  const adjacency = new Map<string, string[]>();
  
  // Build adjacency list
  for (const node of nodes) {
    adjacency.set(node.id, []);
  }
  for (const edge of edges) {
    const neighbors = adjacency.get(edge.source);
    if (neighbors) {
      neighbors.push(edge.target);
    }
  }
  
  // Find start nodes (no incoming edges)
  const incoming = new Set(edges.map(e => e.target));
  const startNodes = nodes
    .filter(n => !incoming.has(n.id))
    .map(n => n.id);
  
  // Find end nodes (no outgoing edges)
  const outgoing = new Set(edges.map(e => e.source));
  const endNodes = nodes
    .filter(n => !outgoing.has(n.id))
    .map(n => n.id);
  
  // DFS to find all paths
  const paths: string[][] = [];
  
  function dfs(current: string, path: string[]) {
    const newPath = [...path, current];
    
    if (endNodes.includes(current)) {
      paths.push(newPath);
      return;
    }
    
    const neighbors = adjacency.get(current) || [];
    for (const neighbor of neighbors) {
      dfs(neighbor, newPath);
    }
  }
  
  // Handle disconnected start nodes
  if (startNodes.length === 0 && nodes.length > 0) {
    startNodes.push(nodes[0].id);
  }
  
  for (const start of startNodes) {
    dfs(start, []);
  }
  
  return paths;
}

/**
 * Identify orphan nodes
 */
export function findOrphanNodes(
  nodes: AnalysisFlowNode[],
  edges: AnalysisFlowEdge[]
): AnalysisFlowNode[] {
  const connected = new Set<string>();
  
  for (const edge of edges) {
    connected.add(edge.source);
    connected.add(edge.target);
  }
  
  return nodes.filter(n => !connected.has(n.id));
}

/**
 * Validate flow structure
 */
export function validateFlowStructure(
  flow: AnalysisFlowDefinition
): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (!flow.nodes || flow.nodes.length === 0) {
    errors.push('Flow has no nodes');
  }
  
  if (!flow.edges || flow.edges.length === 0) {
    if (flow.nodes.length > 1) {
      errors.push('Flow has nodes but no edges');
    }
  }
  
  // Check for start and end nodes
  const nodeTypes = new Set(flow.nodes.map(n => n.type));
  if (!nodeTypes.has('start') && flow.nodes.length > 1) {
    warnings.push('No explicit start node found');
  }
  if (!nodeTypes.has('end') && flow.nodes.length > 1) {
    warnings.push('No explicit end node found');
  }
  
  // Validate edges
  const nodeIds = new Set(flow.nodes.map(n => n.id));
  for (const edge of flow.edges || []) {
    if (!nodeIds.has(edge.source)) {
      errors.push(`Edge references invalid source: ${edge.source}`);
    }
    if (!nodeIds.has(edge.target)) {
      errors.push(`Edge references invalid target: ${edge.target}`);
    }
  }
  
  // Check for orphan nodes
  const orphans = findOrphanNodes(flow.nodes, flow.edges || []);
  if (orphans.length > 0) {
    warnings.push(`Found ${orphans.length} orphan node(s)`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Get default analysis configuration
 */
export function getDefaultAnalysisConfig(): FlowAnalysisConfig {
  return {
    analysisTypes: Object.values(FlowAnalysisType),
    focusCategories: Object.values(FlowAnalysisCategory),
    includeOptimizations: true,
    includeValidation: true,
    detailLevel: 'standard',
    language: 'en',
  };
}

/**
 * Format issue for display
 */
export function formatIssue(issue: FlowIssue): string {
  const severityEmoji: Record<IssueSeverity, string> = {
    [IssueSeverity.CRITICAL]: '🔴',
    [IssueSeverity.HIGH]: '🟠',
    [IssueSeverity.MEDIUM]: '🟡',
    [IssueSeverity.LOW]: '🔵',
    [IssueSeverity.INFO]: 'ℹ️',
  };
  
  return `${severityEmoji[issue.severity]} **[${issue.severity.toUpperCase()}]** ${issue.title}\n${issue.description}\n→ ${issue.suggestion}`;
}

export default {
  FlowAnalysisType,
  FlowAnalysisCategory,
  IssueSeverity,
  FLOW_ANALYSIS_SYSTEM_PROMPT,
  generateFlowAnalysisPrompt,
  generateFocusedAnalysisPrompt,
  generateFlowComparisonPrompt,
  generateFlowValidationPrompt,
  generateBottleneckAnalysisPrompt,
  generateSecurityAnalysisPrompt,
  calculateComplexity,
  getAllPaths,
  findOrphanNodes,
  validateFlowStructure,
  getDefaultAnalysisConfig,
  formatIssue,
};
