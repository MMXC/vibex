/**
 * Flow Optimization Prompt Templates
 * 
 * This module provides prompt templates for optimizing existing flows,
 * improving efficiency, reducing complexity, and streamlining workflows
 * in the VibeX AI Prototype Builder.
 * 
 * @module lib/prompts/flow-optimization
 */

// ============================================
// Types and Interfaces
// ============================================

/**
 * Type of flow being optimized
 */
export enum FlowOptimizationType {
  /** General workflow optimization */
  WORKFLOW = 'workflow',
  /** Decision tree simplification */
  DECISION_TREE = 'decision_tree',
  /** Data pipeline optimization */
  DATA_PIPELINE = 'data_pipeline',
  /** Business process improvement */
  BUSINESS_PROCESS = 'business_process',
  /** User journey optimization */
  USER_JOURNEY = 'user_journey',
  /** State machine optimization */
  STATE_MACHINE = 'state_machine',
  /** API flow optimization */
  API_FLOW = 'api_flow',
}

/**
 * Optimization categories
 */
export enum OptimizationCategory {
  /** Reduce steps or complexity */
  SIMPLIFICATION = 'simplification',
  /** Improve performance */
  PERFORMANCE = 'performance',
  /** Enhance user experience */
  USER_EXPERIENCE = 'user_experience',
  /** Improve error handling */
  ERROR_HANDLING = 'error_handling',
  /** Reduce redundancy */
  REDUCTION = 'reduction',
  /** Improve maintainability */
  MAINTAINABILITY = 'maintainability',
  /** Cost optimization */
  COST = 'cost',
  /** Security improvements */
  SECURITY = 'security',
}

/**
 * Impact level for optimizations
 */
export enum OptimizationImpact {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

/**
 * Effort level required for optimization
 */
export enum OptimizationEffort {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

/**
 * Optimization recommendation
 */
export interface OptimizationRecommendation {
  id: string;
  category: OptimizationCategory;
  title: string;
  description: string;
  currentState: string;
  optimizedState: string;
  impact: OptimizationImpact;
  effort: OptimizationEffort;
  affectedNodes: string[];
  benefits: string[];
  risks?: string[];
  implementation?: string;
}

/**
 * Flow optimization context
 */
export interface FlowOptimizationContext {
  projectId?: string;
  projectName?: string;
  industry?: string;
  targetPlatform?: 'web' | 'mobile' | 'desktop' | 'api';
  userRoles?: string[];
  performanceRequirements?: string[];
  constraints?: string[];
}

/**
 * Flow optimization configuration
 */
export interface FlowOptimizationConfig {
  /** Types of optimization to focus on */
  optimizationTypes?: FlowOptimizationType[];
  /** Categories to focus on */
  focusCategories?: OptimizationCategory[];
  /** Maximum number of recommendations */
  maxRecommendations?: number;
  /** Include implementation details */
  includeImplementation?: boolean;
  /** Consider constraints */
  considerConstraints?: boolean;
  /** Detail level */
  detailLevel?: 'brief' | 'standard' | 'detailed';
  /** Language for output */
  language?: string;
}

/**
 * Flow node for optimization
 */
export interface OptimizationFlowNode {
  id: string;
  type: string;
  label: string;
  description?: string;
  config?: Record<string, unknown>;
  executionTime?: number;
  cost?: number;
}

/**
 * Flow edge for optimization
 */
export interface OptimizationFlowEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
  label?: string;
  condition?: string;
  weight?: number;
}

/**
 * Flow definition for optimization
 */
export interface OptimizationFlowDefinition {
  id: string;
  name: string;
  description?: string;
  type: FlowOptimizationType;
  nodes: OptimizationFlowNode[];
  edges: OptimizationFlowEdge[];
  metrics?: {
    totalExecutionTime?: number;
    totalCost?: number;
    userSteps?: number;
  };
}

// ============================================
// System Prompts
// ============================================

/**
 * Base system prompt for flow optimization
 */
export const FLOW_OPTIMIZATION_SYSTEM_PROMPT = `You are an expert flow optimization specialist with deep expertise in analyzing, improving, and streamlining workflows and process models. Your mission is to transform existing flows into more efficient, simpler, and more effective versions while maintaining all required functionality.

## Your Expertise

- **Process Simplification**: Reducing complexity without losing functionality
- **Performance Optimization**: Improving execution speed and efficiency
- **User Experience Enhancement**: Making flows more intuitive and enjoyable
- **Error Handling Improvement**: Making flows more robust and resilient
- **Cost Reduction**: Optimizing resource usage and reducing expenses
- **Maintainability**: Improving code structure for future changes

## Optimization Philosophy

### 1. Simplification First
- Remove unnecessary steps
- Combine related operations
- Eliminate redundant paths
- Flatten nested structures

### 2. Preserve Functionality
- Never remove required functionality
- Maintain all user paths
- Keep error handling
- Preserve business logic

### 3. Measure Impact
- Quantify improvements where possible
- Consider both immediate and long-term benefits
- Balance effort vs. impact
- Prioritize high-impact, low-effort changes

### 4. Risk Awareness
- Identify potential risks of changes
- Suggest rollback strategies
- Highlight breaking changes
- Consider edge cases

## Optimization Categories

### Simplification
- Remove redundant nodes
- Combine similar operations
- Simplify decision logic
- Flatten nested flows

### Performance
- Parallelize sequential operations
- Cache repeated computations
- Optimize API calls
- Reduce wait times

### User Experience
- Reduce user steps
- Improve feedback
- Add progress indicators
- Simplify choices

### Error Handling
- Add missing error paths
- Improve error messages
- Add retry logic
- Better validation

### Reduction
- Remove duplicate operations
- Eliminate wasted effort
- Optimize data flow
- Reduce resource usage

### Maintainability
- Improve naming clarity
- Add documentation
- Modularize complex sections
- Improve testability

### Cost
- Reduce API calls
- Optimize resource usage
- Simplify infrastructure
- Improve efficiency

### Security
- Add authentication checks
- Improve authorization
- Secure data handling
- Input validation

## Output Format

You MUST respond with a valid JSON object:

\`\`\`json
{
  "flowId": "flow-123",
  "flowName": "Example Flow",
  "optimizationDate": "2024-01-01T00:00:00Z",
  "summary": {
    "totalNodes": 10,
    "totalEdges": 12,
    "recommendationsCount": 5,
    "estimatedImprovement": "35%",
    "riskLevel": "low"
  },
  "currentMetrics": {
    "complexity": 8,
    "executionSteps": 15,
    "estimatedTime": "30s",
    "userSteps": 8
  },
  "optimizedMetrics": {
    "complexity": 5,
    "executionSteps": 10,
    "estimatedTime": "20s",
    "userSteps": 5
  },
  "recommendations": [
    {
      "id": "opt-1",
      "category": "simplification",
      "title": "Combine API Validation Steps",
      "description": "Merge the two separate validation nodes into one",
      "currentState": "Node A validates format, Node B validates content",
      "optimizedState": "Single validation node handles both",
      "impact": "high",
      "effort": "low",
      "affectedNodes": ["node-3", "node-4"],
      "benefits": ["Reduced complexity", "Faster execution", "Fewer network calls"],
      "risks": ["Minor - validation logic needs to be combined"],
      "implementation": "Create new validation node with combined logic..."
    }
  ],
  "implementationPlan": {
    "phases": [
      {
        "phase": 1,
        "title": "Quick Wins",
        "recommendations": ["opt-1", "opt-2"],
        "estimatedEffort": "2 hours"
      }
    ],
    "totalEstimatedEffort": "8 hours"
  },
  "risks": [
    {
      "description": "Combined validation may need updated tests",
      "severity": "low",
      "mitigation": "Update test cases before deployment"
    }
  ]
}
\`\`\`

Provide ONLY the JSON, no additional text.`;

// ============================================
// Prompt Generation Functions
// ============================================

/**
 * Generate a comprehensive flow optimization prompt
 */
export function generateFlowOptimizationPrompt(
  flow: OptimizationFlowDefinition,
  config?: FlowOptimizationConfig
): string {
  const flowJson = JSON.stringify(flow, null, 2);
  
  const optimizationTypes = config?.optimizationTypes || Object.values(FlowOptimizationType);
  const focusCategories = config?.focusCategories || Object.values(OptimizationCategory);
  const maxRecommendations = config?.maxRecommendations || 10;
  const includeImplementation = config?.includeImplementation !== false;
  const considerConstraints = config?.considerConstraints !== false;
  const detailLevel = config?.detailLevel || 'standard';

  const optimizationTypesSection = optimizationTypes
    .map(t => `- ${t}`)
    .join('\n');

  const focusCategoriesSection = focusCategories
    .map(c => `- ${c}`)
    .join('\n');

  let additionalInstructions = '';
  
  if (detailLevel === 'brief') {
    additionalInstructions = `
## Focus
- Identify top ${Math.min(5, maxRecommendations)} high-impact optimizations only
- Provide concise descriptions
- Skip detailed implementation plans`;
  } else if (detailLevel === 'detailed') {
    additionalInstructions = `
## Focus
- Provide up to ${maxRecommendations} detailed recommendations
- Include step-by-step implementation guides
- Include risk assessments for each change
- Calculate quantified improvements`;
  }

  const constraintsSection = considerConstraints ? `
## Constraints to Consider
- Maintain all existing functionality
- Preserve backward compatibility
- Keep error handling intact
- Consider security requirements` : '';

  return `${FLOW_OPTIMIZATION_SYSTEM_PROMPT}

## Flow to Optimize

\`\`\`json
${flowJson}
\`\`\`

## Optimization Configuration

### Optimization Types
${optimizationTypesSection}

### Focus Categories
${focusCategoriesSection}

### Options
- Max Recommendations: ${maxRecommendations}
- Include Implementation: ${includeImplementation}
- Consider Constraints: ${considerConstraints}
- Detail Level: ${detailLevel}
${constraintsSection}
${additionalInstructions}

---

## Optimization Tasks

### 1. Current State Analysis
- Analyze current flow structure
- Identify complexity hotspots
- Map all execution paths
- Measure current metrics

### 2. Optimization Opportunity Identification
For each focus category:
- Identify improvement opportunities
- Assess impact and effort
- Prioritize recommendations

### 3. Recommendation Generation
Generate up to ${maxRecommendations} recommendations with:
- Clear title and description
- Current vs. optimized state
- Impact and effort assessment
- Affected components
- Expected benefits

### 4. Implementation Planning
${includeImplementation ? '- Create phased implementation plan' : '- (Implementation details disabled)'}

### 5. Risk Assessment
- Identify potential risks
- Suggest mitigation strategies

Provide your optimization recommendations in the specified JSON format.`;
}

/**
 * Generate a prompt for specific category optimization
 */
export function generateCategoryOptimizationPrompt(
  flow: OptimizationFlowDefinition,
  category: OptimizationCategory,
  context?: FlowOptimizationContext
): string {
  const flowJson = JSON.stringify(flow, null, 2);

  const categoryGuidance: Record<OptimizationCategory, string> = {
    [OptimizationCategory.SIMPLIFICATION]: `
### Simplification Focus
- Identify redundant nodes
- Find combinable operations
- Simplify decision trees
- Flatten nested flows`,
    [OptimizationCategory.PERFORMANCE]: `
### Performance Focus
- Find sequential operations that could parallelize
- Identify repeated computations
- Optimize API call patterns
- Reduce wait times`,
    [OptimizationCategory.USER_EXPERIENCE]: `
### UX Focus
- Reduce user interaction steps
- Improve feedback mechanisms
- Add progress indicators
- Simplify user choices`,
    [OptimizationCategory.ERROR_HANDLING]: `
### Error Handling Focus
- Identify missing error paths
- Improve error recovery
- Add validation improvements
- Enhance error messages`,
    [OptimizationCategory.REDUCTION]: `
### Reduction Focus
- Remove duplicate operations
- Eliminate unnecessary steps
- Optimize data flow
- Reduce resource consumption`,
    [OptimizationCategory.MAINTAINABILITY]: `
### Maintainability Focus
- Improve node naming
- Suggest documentation
- Identify complex sections
- Improve testability`,
    [OptimizationCategory.COST]: `
### Cost Focus
- Reduce API calls
- Optimize resource usage
- Identify expensive operations
- Suggest caching opportunities`,
    [OptimizationCategory.SECURITY]: `
### Security Focus
- Add authentication checks
- Improve authorization
- Enhance input validation
- Secure data handling`,
  };

  const contextSection = context
    ? `
## Context
- Project: ${context.projectName || 'N/A'}
- Platform: ${context.targetPlatform || 'web'}
- User Roles: ${context.userRoles?.join(', ') || 'All'}
- Industry: ${context.industry || 'General'}
${context.performanceRequirements ? `- Performance Requirements: ${context.performanceRequirements.join(', ')}` : ''}
${context.constraints ? `- Constraints: ${context.constraints.join(', ')}` : ''}`
    : '';

  return `${FLOW_OPTIMIZATION_SYSTEM_PROMPT}

## Flow to Optimize

\`\`\`json
${flowJson}
\`\`\`${contextSection}

## Focused Optimization: ${category}
${categoryGuidance[category]}

---

Analyze ONLY the specified category in detail.

Output JSON with:
- Category-specific recommendations
- Impact and effort ratings
- Detailed implementation guidance`;
}

/**
 * Generate a prompt for performance-focused optimization
 */
export function generatePerformanceOptimizationPrompt(
  flow: OptimizationFlowDefinition,
  context?: FlowOptimizationContext
): string {
  const flowJson = JSON.stringify(flow, null, 2);

  return `## Performance Optimization

### Flow
\`\`\`json
${flowJson}
\`\`\`

${context?.performanceRequirements ? `### Performance Requirements
- ${context.performanceRequirements.join('\n- ')}` : ''}

---

## Performance Optimization Tasks

### 1. Parallelization Opportunities
Find operations that can run in parallel:
- Independent API calls
- Parallel data fetching
- Concurrent processing

### 2. Caching Opportunities
Identify data that can be cached:
- Repeated API calls with same params
- Static reference data
- User session data

### 3. API Call Optimization
- Batch multiple calls
- Remove redundant calls
- Optimize payload sizes

### 4. Sequential Optimization
- Minimize sequential dependencies
- Reorder operations for efficiency

### 5. Output Format
\`\`\`json
{
  "flowId": "...",
  "flowName": "...",
  "currentPerformance": {
    "estimatedTime": "...",
    "apiCalls": 0,
    "parallelOpportunities": 0
  },
  "optimizedPerformance": {
    "estimatedTime": "...",
    "apiCalls": 0,
    "parallelizationGain": "..."
  },
  "recommendations": [
    {
      "id": "perf-1",
      "title": "...",
      "currentState": "...",
      "optimizedState": "...",
      "impact": "high|medium|low",
      "effort": "high|medium|low",
      "estimatedImprovement": "..."
    }
  ]
}
\`\`\``;
}

/**
 * Generate a prompt for user experience optimization
 */
export function generateUXOptimizationPrompt(
  flow: OptimizationFlowDefinition,
  context?: FlowOptimizationContext
): string {
  const flowJson = JSON.stringify(flow, null, 2);

  const userRoles = context?.userRoles?.join(', ') || 'All users';

  return `## User Experience Optimization

### Flow
\`\`\`json
${flowJson}
\`\`\`

### Target Users: ${userRoles}
${context?.targetPlatform ? `### Platform: ${context.targetPlatform}` : ''}

---

## UX Optimization Tasks

### 1. Step Reduction
Find ways to reduce user interactions:
- Combine multi-step forms
- Auto-fill where possible
- Remove unnecessary confirmations

### 2. Feedback Improvement
Enhance user feedback:
- Progress indicators
- Success/error messages
- Loading states

### 3. Flow Clarity
Improve understanding:
- Clear labels
- Logical groupings
- Intuitive navigation

### 4. Error Prevention
Reduce user errors:
- Better validation
- Clear instructions
- Helpful suggestions

### 5. Output Format
\`\`\`json
{
  "flowId": "...",
  "flowName": "...",
  "currentUX": {
    "userSteps": 0,
    "complexityRating": "...",
    "painPoints": []
  },
  "optimizedUX": {
    "userSteps": 0,
    "complexityRating": "...",
    "improvements": []
  },
  "recommendations": [
    {
      "id": "ux-1",
      "title": "...",
      "description": "...",
      "impact": "high|medium|low",
      "effort": "high|medium|low",
      "userBenefit": "..."
    }
  ]
}
\`\`\``;
}

/**
 * Generate a prompt for simplification-focused optimization
 */
export function generateSimplificationPrompt(
  flow: OptimizationFlowDefinition
): string {
  const flowJson = JSON.stringify(flow, null, 2);

  return `## Flow Simplification

### Flow
\`\`\`json
${flowJson}
\`\`\`

---

## Simplification Tasks

### 1. Redundancy Detection
Find redundant elements:
- Duplicate nodes
- Repeated operations
- Similar decision paths

### 2. Combinable Operations
Identify operations that can be combined:
- Sequential validation steps
- Multiple data fetches
- Related transformations

### 3. Decision Tree Simplification
Simplify complex decisions:
- Flatten nested conditions
- Reduce branching complexity
- Simplify boolean logic

### 4. Path Optimization
Find shorter paths:
- Eliminate unnecessary steps
- Short-circuit long chains
- Combine similar paths

### 5. Output Format
\`\`\`json
{
  "flowId": "...",
  "flowName": "...",
  "currentComplexity": {
    "nodeCount": 0,
    "edgeCount": 0,
    "depth": 0,
    "branchingFactor": 0
  },
  "optimizedComplexity": {
    "nodeCount": 0,
    "edgeCount": 0,
    "depth": 0,
    "branchingFactor": 0,
    "reduction": "..."
  },
  "simplifications": [
    {
      "id": "simp-1",
      "type": "redundant|combinable|decision|path",
      "title": "...",
      "description": "...",
      "nodesToRemove": [],
      "nodesToCombine": [],
      "impact": "high|medium|low"
    }
  ]
}
\`\`\``;
}

/**
 * Generate a prompt for cost optimization
 */
export function generateCostOptimizationPrompt(
  flow: OptimizationFlowDefinition,
  context?: FlowOptimizationContext
): string {
  const flowJson = JSON.stringify(flow, null, 2);

  return `## Cost Optimization

### Flow
\`\`\`json
${flowJson}
\`\`\`

---

## Cost Optimization Tasks

### 1. API Call Reduction
Minimize expensive API calls:
- Batch requests
- Cache responses
- Remove duplicates

### 2. Resource Optimization
Reduce resource consumption:
- Optimize data processing
- Reduce payload sizes
- Minimize database queries

### 3. Third-Party Service Optimization
Reduce external costs:
- Evaluate service alternatives
- Optimize usage patterns
- Implement rate limiting

### 4. Infrastructure Efficiency
Improve infrastructure costs:
- Optimize processing time
- Reduce storage needs
- Improve scalability

### 5. Output Format
\`\`\`json
{
  "flowId": "...",
  "flowName": "...",
  "currentCost": {
    "apiCalls": 0,
    "estimatedMonthlyCost": "...",
    "resourceUnits": 0
  },
  "optimizedCost": {
    "apiCalls": 0,
    "estimatedMonthlyCost": "...",
    "resourceUnits": 0,
    "savings": "..."
  },
  "recommendations": [
    {
      "id": "cost-1",
      "title": "...",
      "currentCost": "...",
      "optimizedCost": "...",
      "monthlySavings": "...",
      "implementationEffort": "high|medium|low"
    }
  ]
}
\`\`\``;
}

/**
 * Generate a prompt for comparing original and optimized flows
 */
export function generateOptimizationComparisonPrompt(
  originalFlow: OptimizationFlowDefinition,
  optimizedFlow: OptimizationFlowDefinition
): string {
  const originalJson = JSON.stringify(originalFlow, null, 2);
  const optimizedJson = JSON.stringify(optimizedFlow, null, 2);

  return `## Optimization Comparison

### Original Flow
\`\`\`json
${originalJson}
\`\`\`

### Optimized Flow
\`\`\`json
${optimizedJson}
\`\`\`

---

## Comparison Tasks

### 1. Structural Changes
- Compare node counts
- Analyze edge differences
- Identify added/removed components

### 2. Metrics Comparison
- Complexity reduction
- Performance improvement
- Cost savings
- User step reduction

### 3. Functionality Preservation
- Verify all functionality maintained
- Check error handling preserved
- Validate all paths covered

### 4. Output Format
\`\`\`json
{
  "original": {
    "id": "...",
    "name": "...",
    "nodeCount": 0,
    "edgeCount": 0,
    "complexity": 0
  },
  "optimized": {
    "id": "...",
    "name": "...",
    "nodeCount": 0,
    "edgeCount": 0,
    "complexity": 0
  },
  "changes": {
    "nodesRemoved": [],
    "nodesAdded": [],
    "nodesModified": [],
    "edgesRemoved": [],
    "edgesAdded": []
  },
  "improvements": {
    "complexityReduction": "...",
    "performanceImprovement": "...",
    "costSavings": "...",
    "userStepReduction": "..."
  },
  "validation": {
    "functionalityPreserved": true,
    "errors": [],
    "warnings": []
  }
}
\`\`\``;
}

// ============================================
// Helper Functions
// ============================================

/**
 * Calculate optimization priority score
 */
export function calculatePriority(
  impact: OptimizationImpact,
  effort: OptimizationEffort
): number {
  const impactScores: Record<OptimizationImpact, number> = {
    [OptimizationImpact.HIGH]: 3,
    [OptimizationImpact.MEDIUM]: 2,
    [OptimizationImpact.LOW]: 1,
  };

  const effortScores: Record<OptimizationEffort, number> = {
    [OptimizationEffort.HIGH]: 1,
    [OptimizationEffort.MEDIUM]: 2,
    [OptimizationEffort.LOW]: 3,
  };

  return impactScores[impact] * effortScores[effort];
}

/**
 * Get impact color for display
 */
export function getImpactColor(impact: OptimizationImpact): string {
  const colors: Record<OptimizationImpact, string> = {
    [OptimizationImpact.HIGH]: '#ef4444',
    [OptimizationImpact.MEDIUM]: '#f59e0b',
    [OptimizationImpact.LOW]: '#22c55e',
  };
  return colors[impact];
}

/**
 * Format recommendation for display
 */
export function formatRecommendation(recommendation: OptimizationRecommendation): string {
  const impactEmoji: Record<OptimizationImpact, string> = {
    [OptimizationImpact.HIGH]: '🔴',
    [OptimizationImpact.MEDIUM]: '🟡',
    [OptimizationImpact.LOW]: '🟢',
  };

  const categoryEmoji: Record<OptimizationCategory, string> = {
    [OptimizationCategory.SIMPLIFICATION]: '📋',
    [OptimizationCategory.PERFORMANCE]: '⚡',
    [OptimizationCategory.USER_EXPERIENCE]: '👤',
    [OptimizationCategory.ERROR_HANDLING]: '🛡️',
    [OptimizationCategory.REDUCTION]: '✂️',
    [OptimizationCategory.MAINTAINABILITY]: '🔧',
    [OptimizationCategory.COST]: '💰',
    [OptimizationCategory.SECURITY]: '🔒',
  };

  return `${impactEmoji[recommendation.impact]} **[${recommendation.impact.toUpperCase()}]** ${categoryEmoji[recommendation.category]} ${recommendation.title}\n${recommendation.description}\n→ Impact: ${recommendation.impact} | Effort: ${recommendation.effort}\nBenefits: ${recommendation.benefits.join(', ')}`;
}

/**
 * Get default optimization configuration
 */
export function getDefaultOptimizationConfig(): FlowOptimizationConfig {
  return {
    optimizationTypes: Object.values(FlowOptimizationType),
    focusCategories: Object.values(OptimizationCategory),
    maxRecommendations: 10,
    includeImplementation: true,
    considerConstraints: true,
    detailLevel: 'standard',
    language: 'en',
  };
}

/**
 * Group recommendations by category
 */
export function groupByCategory(
  recommendations: OptimizationRecommendation[]
): Record<OptimizationCategory, OptimizationRecommendation[]> {
  const grouped: Record<OptimizationCategory, OptimizationRecommendation[]> = {} as any;
  
  for (const rec of recommendations) {
    if (!grouped[rec.category]) {
      grouped[rec.category] = [];
    }
    grouped[rec.category].push(rec);
  }
  
  return grouped;
}

/**
 * Sort recommendations by priority
 */
export function sortByPriority(
  recommendations: OptimizationRecommendation[]
): OptimizationRecommendation[] {
  return [...recommendations].sort((a, b) => {
    const priorityA = calculatePriority(a.impact, a.effort);
    const priorityB = calculatePriority(b.impact, b.effort);
    return priorityB - priorityA;
  });
}

export default {
  FlowOptimizationType,
  OptimizationCategory,
  OptimizationImpact,
  OptimizationEffort,
  FLOW_OPTIMIZATION_SYSTEM_PROMPT,
  generateFlowOptimizationPrompt,
  generateCategoryOptimizationPrompt,
  generatePerformanceOptimizationPrompt,
  generateUXOptimizationPrompt,
  generateSimplificationPrompt,
  generateCostOptimizationPrompt,
  generateOptimizationComparisonPrompt,
  calculatePriority,
  getImpactColor,
  formatRecommendation,
  getDefaultOptimizationConfig,
  groupByCategory,
  sortByPriority,
};
