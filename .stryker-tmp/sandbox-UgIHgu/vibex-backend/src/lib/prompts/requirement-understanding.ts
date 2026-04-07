/**
 * Requirement Understanding Prompt Templates
 * 
 * This module provides prompt templates for deep understanding and analysis
 * of user requirements in the VibeX AI Prototype Builder.
 * 
 * @module lib/prompts/requirement-understanding
 */
// @ts-nocheck


// ============================================
// Types and Interfaces
// ============================================

/**
 * Type of requirement being analyzed
 */
export enum RequirementType {
  /** Core functional feature */
  FEATURE = 'feature',
  /** User interface component */
  UI_COMPONENT = 'ui_component',
  /** Data model or entity */
  DATA_MODEL = 'data_model',
  /** Integration with external system */
  INTEGRATION = 'integration',
  /** Business logic or rule */
  BUSINESS_LOGIC = 'business_logic',
  /** User workflow or process */
  WORKFLOW = 'workflow',
  /** Report or analytics */
  REPORT = 'report',
  /** Search or filtering */
  SEARCH = 'search',
  /** Notification or messaging */
  NOTIFICATION = 'notification',
  /** Authentication or security */
  SECURITY = 'security',
  /** Performance optimization */
  PERFORMANCE = 'performance',
  /** General requirement */
  GENERAL = 'general',
}

/**
 * Requirement completeness level
 */
export enum CompletenessLevel {
  /** Fully specified requirement */
  COMPLETE = 'complete',
  /** Partially specified with some details */
  PARTIAL = 'partial',
  /** High-level concept only */
  MINIMAL = 'minimal',
  /** Ambiguous or unclear */
  AMBIGUOUS = 'ambiguous',
}

/**
 * Priority level
 */
export enum RequirementPriority {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

/**
 * Target platform or device
 */
export enum TargetPlatform {
  WEB = 'web',
  MOBILE_WEB = 'mobile_web',
  DESKTOP = 'desktop',
  MOBILE_NATIVE = 'mobile_native',
  CROSS_PLATFORM = 'cross_platform',
  API = 'api',
  ALL = 'all',
}

/**
 * User role definition
 */
export interface UserRole {
  name: string;
  description: string;
  permissions: string[];
  responsibilities?: string[];
}

/**
 * Functional requirement
 */
export interface FunctionalRequirement {
  id: string;
  title: string;
  description: string;
  type: RequirementType;
  priority: RequirementPriority;
  acceptanceCriteria: string[];
  dependencies?: string[];
  constraints?: string[];
}

/**
 * Non-functional requirement
 */
export interface NonFunctionalRequirement {
  category: string;
  description: string;
  metrics?: {
    metric: string;
    target: string;
  }[];
}

/**
 * Data requirement
 */
export interface DataRequirement {
  entity: string;
  fields: Array<{
    name: string;
    type: string;
    required: boolean;
    description?: string;
  }>;
  relationships?: Array<{
    to: string;
    type: string;
    description: string;
  }>;
}

/**
 * Workflow step
 */
export interface WorkflowStep {
  step: number;
  action: string;
  actor: string;
  result: string;
  conditions?: string[];
}

/**
 * Understanding result
 */
export interface RequirementUnderstanding {
  summary: string;
  title: string;
  type: RequirementType;
  completeness: CompletenessLevel;
  priority: RequirementPriority;
  targetPlatform: TargetPlatform;
  userRoles: UserRole[];
  functionalRequirements: FunctionalRequirement[];
  nonFunctionalRequirements: NonFunctionalRequirement[];
  dataRequirements: DataRequirement[];
  workflows: WorkflowStep[];
  ambiguities: string[];
  missingInfo: string[];
  clarifications: Array<{
    question: string;
    reason: string;
  }>;
  confidence: number;
}

/**
 * Configuration for requirement understanding
 */
export interface RequirementUnderstandingConfig {
  /** Include detailed workflow analysis */
  includeWorkflows?: boolean;
  /** Include data model analysis */
  includeDataModel?: boolean;
  /** Include non-functional requirements */
  includeNonFunctional?: boolean;
  /** Target platform context */
  targetPlatform?: TargetPlatform;
  /** Industry context for better understanding */
  industryContext?: string;
  /** Language for output */
  language?: string;
  /** Detail level */
  detailLevel?: 'brief' | 'standard' | 'detailed';
}

// ============================================
// System Prompts
// ============================================

/**
 * Base system prompt for requirement understanding
 */
export const REQUIREMENT_UNDERSTANDING_SYSTEM_PROMPT = `You are an expert requirements analyst specializing in understanding, dissecting, and clarifying user requirements for software development projects. Your role is to deeply analyze requirement descriptions and extract all necessary information for accurate implementation.

## Your Expertise

- **Requirements Analysis**: Understanding what users truly need vs. what they ask for
- **Domain Modeling**: Identifying entities, relationships, and business rules
- **Process Modeling**: Breaking down workflows into actionable steps
- **Ambiguity Detection**: Finding unclear or missing information
- **Technical Feasibility**: Understanding implementation implications

## Requirement Types to Identify

- **feature**: New functionality or capability
- **ui_component**: Interface element or page
- **data_model**: Data structure or entity
- **integration**: External system connection
- **business_logic**: Rules and calculations
- **workflow**: Multi-step process
- **report**: Data presentation or analytics
- **search**: Query and filtering
- **notification**: Alerts and messages
- **security**: Access control and protection
- **performance**: Optimization requirements

## Completeness Levels

- **complete**: All necessary details provided
- **partial**: Some details missing
- **minimal**: Only high-level concept
- **ambiguous**: Unclear or contradictory

## Analysis Framework

1. **Extract Core Purpose**: What problem does this solve?
2. **Identify Actors**: Who interacts with this?
3. **Map Actions**: What operations are performed?
4. **Define Data**: What information is processed?
5. **Establish Flows**: How does information move?
6. **Identify Constraints**: What limitations exist?
7. **Surface Ambiguities**: What needs clarification?

## Output Requirements

You MUST respond with a valid JSON object in this exact format:

\`\`\`json
{
  "title": "Short descriptive title",
  "summary": "2-3 sentence summary of the requirement",
  "type": "feature|ui_component|data_model|integration|business_logic|workflow|report|search|notification|security|performance|general",
  "completeness": "complete|partial|minimal|ambiguous",
  "priority": "critical|high|medium|low",
  "targetPlatform": "web|mobile_web|desktop|mobile_native|cross_platform|api|all",
  "userRoles": [
    {
      "name": "role name",
      "description": "what this role does",
      "permissions": ["what they can do"],
      "responsibilities": ["what they're responsible for"]
    }
  ],
  "functionalRequirements": [
    {
      "id": "FR-1",
      "title": "requirement title",
      "description": "detailed description",
      "type": "feature|ui_component|data_model|integration|business_logic|workflow|report|search|notification|security|performance|general",
      "priority": "critical|high|medium|low",
      "acceptanceCriteria": ["criterion 1", "criterion 2"],
      "dependencies": ["other requirements"],
      "constraints": ["limitations"]
    }
  ],
  "nonFunctionalRequirements": [
    {
      "category": "performance|security|usability|reliability|maintainability|compatibility",
      "description": "requirement description",
      "metrics": [{"metric": "response time", "target": "< 200ms"}]
    }
  ],
  "dataRequirements": [
    {
      "entity": "EntityName",
      "fields": [
        {"name": "fieldName", "type": "string", "required": true, "description": "what this field stores"}
      ],
      "relationships": [
        {"to": "OtherEntity", "type": "one-to-many", "description": "how they relate"}
      ]
    }
  ],
  "workflows": [
    {
      "step": 1,
      "action": "what happens",
      "actor": "who does it",
      "result": "what happens next",
      "conditions": ["when this happens"]
    }
  ],
  "ambiguities": ["list of unclear points"],
  "missingInfo": ["what additional information is needed"],
  "clarifications": [
    {"question": "question to ask", "reason": "why this matters"}
  ],
  "confidence": 0.85
}
\`\`\`

Provide ONLY the JSON, no additional text.`;

/**
 * Brief requirement understanding prompt
 */
export const BRIEF_REQUIREMENT_UNDERSTANDING_PROMPT = `Analyze the following requirement and provide a concise understanding:

Requirement: {requirement}

Provide:
1. Title (short, descriptive)
2. Summary (2-3 sentences)
3. Type (feature/ui_component/data_model/integration/business_logic/workflow/report/search/notification/security/performance/general)
4. Priority (critical/high/medium/low)
5. Key functional requirements (max 3)
6. Any ambiguities or missing information

Output as JSON.`;

/**
 * Detailed requirement understanding prompt
 */
export const DETAILED_REQUIREMENT_UNDERSTANDING_PROMPT = `Perform a comprehensive analysis of the following requirement. Include all aspects: user roles, functional and non-functional requirements, data models, workflows, and potential issues.

Requirement: {requirement}

{context}

Provide a complete requirement understanding document in JSON format with:
- Detailed title and summary
- Requirement type classification
- Completeness assessment
- Priority level
- Target platform
- All user roles with permissions
- Comprehensive functional requirements with acceptance criteria
- Non-functional requirements with metrics
- Data model with fields and relationships
- Detailed workflow steps
- Identified ambiguities
- Missing information
- Clarification questions
- Confidence score

Output as JSON.`;

// ============================================
// Prompt Generation Functions
// ============================================

/**
 * Generate requirement understanding prompt
 */
export function generateRequirementUnderstandingPrompt(
  requirement: string,
  config?: RequirementUnderstandingConfig
): string {
  const systemPrompt = REQUIREMENT_UNDERSTANDING_SYSTEM_PROMPT;
  
  const contextSection = config?.industryContext 
    ? `Industry Context: ${config.industryContext}\n` 
    : '';
  
  const platformSection = config?.targetPlatform 
    ? `Target Platform: ${config.targetPlatform}\n` 
    : '';
  
  const detailLevel = config?.detailLevel || 'standard';
  
  let userPrompt: string;
  
  switch (detailLevel) {
    case 'brief':
      userPrompt = BRIEF_REQUIREMENT_UNDERSTANDING_PROMPT.replace(
        '{requirement}',
        requirement
      );
      break;
    case 'detailed':
      userPrompt = DETAILED_REQUIREMENT_UNDERSTANDING_PROMPT
        .replace('{requirement}', requirement)
        .replace('{context}', contextSection + platformSection);
      break;
    default:
      userPrompt = `${systemPrompt}

## Requirement to Analyze

${requirement}

${contextSection}${platformSection}Provide your analysis in the specified JSON format.`;
  }
  
  return userPrompt;
}

/**
 * Generate quick requirement summary
 */
export function generateRequirementSummaryPrompt(requirement: string): string {
  return `Provide a brief summary of the following requirement in 2-3 sentences:

${requirement}

Also identify:
- The main goal
- Key stakeholders
- Any obvious missing information

Output as JSON with keys: summary, mainGoal, stakeholders, missingInfo.`;
}

/**
 * Generate requirement type classification prompt
 */
export function generateTypeClassificationPrompt(requirement: string): string {
  return `Classify the following requirement into one or more types:

${requirement}

Types to consider:
- feature: New functionality
- ui_component: Interface element
- data_model: Data structure
- integration: External system
- business_logic: Rules
- workflow: Process
- report: Analytics
- search: Query
- notification: Alerts
- security: Access control
- performance: Optimization

Output as JSON with keys: types (array), primaryType, confidence.`;
}

/**
 * Generate ambiguity detection prompt
 */
export function generateAmbiguityDetectionPrompt(requirement: string): string {
  return `Identify any ambiguities, inconsistencies, or missing information in this requirement:

${requirement}

For each issue found, provide:
- The problematic text
- The issue type (ambiguous|contradictory|incomplete|vague)
- Why it's problematic
- A question to clarify

Output as JSON with keys: issues (array with text, type, reason, question).`;
}

/**
 * Generate user role extraction prompt
 */
export function generateUserRoleExtractionPrompt(requirement: string): string {
  return `Extract all user roles mentioned or implied in this requirement:

${requirement}

For each role provide:
- Name
- Description
- Permissions/abilities
- Responsibilities

Output as JSON with key: roles (array).`;
}

/**
 * Generate workflow extraction prompt
 */
export function generateWorkflowExtractionPrompt(requirement: string): string {
  return `Extract the workflow(s) described in this requirement:

${requirement}

For each step provide:
- Step number
- Action performed
- Who performs it (actor)
- Result/outcome
- Any conditions

Output as JSON with key: workflows (array of step sequences).`;
}

/**
 * Generate data model extraction prompt
 */
export function generateDataModelExtractionPrompt(requirement: string): string {
  return `Extract data entities and their relationships from this requirement:

${requirement}

For each entity provide:
- Name
- Fields (name, type, required, description)
- Relationships to other entities

Output as JSON with key: entities (array).`;
}

// ============================================
// Helper Functions
// ============================================

/**
 * Validate requirement understanding output
 */
export function validateRequirementUnderstanding(output: unknown): {
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
  
  // Required fields
  const requiredFields = ['title', 'summary', 'type', 'priority', 'confidence'];
  for (const field of requiredFields) {
    if (!(field in obj)) {
      errors.push(`Missing required field: ${field}`);
    }
  }
  
  // Type validation
  const validTypes = Object.values(RequirementType);
  if (obj.type && !validTypes.includes(obj.type as RequirementType)) {
    warnings.push(`Unusual type: ${obj.type}`);
  }
  
  // Priority validation
  const validPriorities = Object.values(RequirementPriority);
  if (obj.priority && !validPriorities.includes(obj.priority as RequirementPriority)) {
    warnings.push(`Invalid priority: ${obj.priority}`);
  }
  
  // Confidence range
  if (typeof obj.confidence === 'number' && (obj.confidence < 0 || obj.confidence > 1)) {
    errors.push('Confidence must be between 0 and 1');
  }
  
  // Arrays should be arrays
  const arrayFields = ['userRoles', 'functionalRequirements', 'ambiguities', 'missingInfo'];
  for (const field of arrayFields) {
    if (obj[field] !== undefined && !Array.isArray(obj[field])) {
      errors.push(`${field} must be an array`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Get default requirement understanding
 */
export function getDefaultRequirementUnderstanding(): RequirementUnderstanding {
  return {
    title: 'Untitled Requirement',
    summary: 'No requirement provided',
    type: RequirementType.GENERAL,
    completeness: CompletenessLevel.MINIMAL,
    priority: RequirementPriority.MEDIUM,
    targetPlatform: TargetPlatform.WEB,
    userRoles: [],
    functionalRequirements: [],
    nonFunctionalRequirements: [],
    dataRequirements: [],
    workflows: [],
    ambiguities: ['No requirement text provided'],
    missingInfo: ['Requirement text is required'],
    clarifications: [],
    confidence: 0,
  };
}

/**
 * Get priority score for sorting
 */
export function getPriorityScore(priority: RequirementPriority): number {
  const scores: Record<RequirementPriority, number> = {
    [RequirementPriority.CRITICAL]: 4,
    [RequirementPriority.HIGH]: 3,
    [RequirementPriority.MEDIUM]: 2,
    [RequirementPriority.LOW]: 1,
  };
  return scores[priority] || 0;
}
