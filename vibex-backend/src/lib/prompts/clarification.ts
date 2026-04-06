import { safeError } from '@/lib/log-sanitizer';
/**
 * Clarification Question Generation Prompt Templates
 * 
 * This module provides prompt templates for generating intelligent clarification
 * questions for requirements analysis in the VibeX AI Prototype Builder.
 * 
 * @module lib/prompts/clarification
 */

// ============================================
// Types and Interfaces
// ============================================

/**
 * Question types for clarification
 */
export enum ClarificationQuestionType {
  /** Open-ended text answer */
  OPEN = 'open',
  /** Single choice selection */
  CHOICE = 'choice',
  /** Multiple choice selection */
  MULTIPLE = 'multiple',
  /** Numeric input */
  NUMBER = 'number',
  /** Date input */
  DATE = 'date',
  /** Boolean yes/no */
  BOOLEAN = 'boolean',
}

/**
 * Category of clarification question
 */
export enum ClarificationCategory {
  /** Functional requirements clarification */
  FUNCTIONALITY = 'functionality',
  /** Data model and storage clarification */
  DATA = 'data',
  /** User interface and experience clarification */
  UI = 'ui',
  /** Security and access control clarification */
  SECURITY = 'security',
  /** Performance and scalability clarification */
  PERFORMANCE = 'performance',
  /** External system integration clarification */
  INTEGRATION = 'integration',
  /** User roles and permissions clarification */
  AUTHORIZATION = 'authorization',
  /** Business rules and logic clarification */
  BUSINESS_RULES = 'business_rules',
  /** Edge cases and error handling clarification */
  EDGE_CASES = 'edge_cases',
  /** Platform and device support clarification */
  PLATFORM = 'platform',
  /** General clarification */
  OTHER = 'other',
}

/**
 * Priority level of clarification question
 */
export enum ClarificationPriority {
  /** Nice to have, not critical */
  LOW = 'low',
  /** Important but not blocking */
  MEDIUM = 'medium',
  /** Critical for understanding */
  HIGH = 'high',
}

/**
 * Definition of a clarification question
 */
export interface ClarificationQuestion {
  /** Unique identifier */
  id: string;
  /** The question text */
  question: string;
  /** Type of question */
  type: ClarificationQuestionType;
  /** Options for choice/multiple types */
  options?: string[];
  /** Category of the question */
  category: ClarificationCategory;
  /** Priority of the question */
  priority: ClarificationPriority;
  /** User's answer */
  answer?: string;
  /** When the question was answered */
  answeredAt?: string;
  /** Why this question is being asked */
  reasoning?: string;
  /** Suggested default answer */
  defaultAnswer?: string;
  /** Whether the question is required */
  required?: boolean;
}

/**
 * Clarification question with context
 */
export interface ClarificationQuestionWithContext extends ClarificationQuestion {
  /** Context snippet from requirement that triggered this question */
  contextSnippet?: string;
  /** Position in original text */
  position?: {
    start: number;
    end: number;
  };
  /** Related entities mentioned */
  relatedEntities?: string[];
}

/**
 * Configuration for clarification generation
 */
export interface ClarificationConfig {
  /** Maximum number of questions to generate */
  maxQuestions?: number;
  /** Categories to focus on (empty = all) */
  categories?: ClarificationCategory[];
  /** Minimum priority level */
  minPriority?: ClarificationPriority;
  /** Include reasoning for each question */
  includeReasoning?: boolean;
  /** Include suggested default answers */
  includeDefaults?: boolean;
  /** Language for questions */
  language?: string;
  /** Detail level */
  detailLevel?: 'brief' | 'standard' | 'detailed';
  /** Target audience */
  audience?: 'developer' | 'business' | 'end_user';
  /** Context about the project */
  projectContext?: string;
}

/**
 * Input for clarification prompt generation
 */
export interface ClarificationInput {
  /** Original requirement text */
  requirement: string;
  /** Parsed entities (optional) */
  entities?: Array<{
    name: string;
    type: string;
    description?: string;
  }>;
  /** Parsed relations (optional) */
  relations?: Array<{
    from: string;
    to: string;
    type: string;
  }>;
  /** Existing clarifications (for follow-up) */
  existingClarifications?: Array<{
    question: string;
    answer: string;
  }>;
  /** Configuration */
  config?: ClarificationConfig;
}

/**
 * Output from clarification prompt
 */
export interface ClarificationOutput {
  /** Generated questions */
  questions: ClarificationQuestion[];
  /** Summary of analysis */
  analysisSummary: string;
  /** Identified ambiguities */
  ambiguities: string[];
  /** Suggestions for requirement improvement */
  suggestions: string[];
  /** Confidence score (0-1) */
  confidence: number;
}

/**
 * Result of question validation
 */
export interface QuestionValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  completeness: number; // 0-1 score
}

// ============================================
// System Prompts
// ============================================

/**
 * Base system prompt for clarification question generation
 */
export const CLARIFICATION_SYSTEM_PROMPT = `You are an expert requirements analyst and software architect specializing in requirements clarification. Your role is to identify ambiguous, incomplete, or unclear aspects of requirements and generate targeted clarification questions.

## Core Principles

1. **Precision**: Questions should be specific and actionable
2. **Value**: Each question should address a genuine gap or ambiguity
3. **Clarity**: Questions should be easy to understand and answer
4. **Priority**: Focus on the most critical clarifications first
5. **Context**: Questions should reference specific parts of the requirement

## Question Categories

- **functionality**: Core features and behaviors
- **data**: Data models, storage, and relationships
- **ui**: User interface and experience
- **security**: Authentication, authorization, data protection
- **performance**: Speed, scalability, load handling
- **integration**: External systems and APIs
- **authorization**: Roles, permissions, access control
- **business_rules**: Business logic and rules
- **edge_cases**: Error handling, edge cases, boundary conditions
- **platform**: Device and platform support
- **other**: General clarifications

## Question Types

- **open**: Free-form text answer
- **choice**: Single selection from options
- **multiple**: Multiple selections from options
- **number**: Numeric input
- **date**: Date/time input
- **boolean**: Yes/no answer

## Output Requirements

You MUST respond with a valid JSON object in this exact format:

\`\`\`json
{
  "questions": [
    {
      "question": "The question text",
      "type": "open|choice|multiple|number|date|boolean",
      "options": ["option1", "option2"],
      "category": "functionality|data|ui|security|performance|integration|authorization|business_rules|edge_cases|platform|other",
      "priority": "low|medium|high",
      "reasoning": "Why this question is needed",
      "defaultAnswer": "Suggested answer"
    }
  ],
  "analysisSummary": "Brief summary of the requirement analysis",
  "ambiguities": ["Ambiguity 1", "Ambiguity 2"],
  "suggestions": ["Suggestion 1", "Suggestion 2"]
}
\`\`\`

## Question Guidelines

1. **Avoid obvious questions**: Don't ask about things clearly stated in the requirement
2. **Be specific**: Reference specific parts of the requirement
3. **Provide options when helpful**: Use choice/multiple for bounded options
4. **Consider user perspective**: Frame questions from the user's point of view
5. **Think about implementation**: Consider technical implications`;

/**
 * Extended system prompt with examples (few-shot)
 */
export const CLARIFICATION_SYSTEM_PROMPT_WITH_EXAMPLES = `${CLARIFICATION_SYSTEM_PROMPT}

## Example 1: Simple Feature Request

**Requirement**: "Users should be able to upload files to the system."

**Output**:
\`\`\`json
{
  "questions": [
    {
      "question": "What types of files should users be able to upload?",
      "type": "multiple",
      "options": ["Images (JPG, PNG, GIF)", "Documents (PDF, DOC, DOCX)", "Spreadsheets (XLS, XLSX)", "Videos (MP4, MOV)", "Any file type"],
      "category": "functionality",
      "priority": "high",
      "reasoning": "File type restrictions affect security, storage, and validation logic"
    },
    {
      "question": "What is the maximum file size allowed?",
      "type": "choice",
      "options": ["1 MB", "5 MB", "10 MB", "25 MB", "50 MB", "No limit"],
      "category": "performance",
      "priority": "high",
      "reasoning": "File size impacts server storage and upload performance"
    },
    {
      "question": "Should there be a limit on the number of files a user can upload?",
      "type": "choice",
      "options": ["Single file only", "Up to 5 files", "Up to 10 files", "Unlimited"],
      "category": "functionality",
      "priority": "medium",
      "reasoning": "Storage planning and UI design depend on this"
    },
    {
      "question": "What should happen if a user tries to upload an unsupported file type?",
      "type": "choice",
      "options": ["Show error message", "Silently reject", "Convert to supported format", "Allow with warning"],
      "category": "edge_cases",
      "priority": "medium",
      "reasoning": "Error handling strategy needs to be defined"
    }
  ],
  "analysisSummary": "The requirement describes a file upload feature but lacks details about file constraints, limits, and error handling.",
  "ambiguities": [
    "File types not specified",
    "File size limits not defined",
    "Upload quantity limits unclear",
    "Error handling strategy missing"
  ],
  "suggestions": [
    "Specify allowed file types and their maximum sizes",
    "Define upload quotas per user",
    "Document error handling and user feedback strategy"
  ]
}
\`\`\`

## Example 2: User Management

**Requirement**: "The system should have user management with roles."

**Output**:
\`\`\`json
{
  "questions": [
    {
      "question": "What roles should be available in the system?",
      "type": "multiple",
      "options": ["Admin", "Manager", "Editor", "Viewer", "Guest"],
      "category": "authorization",
      "priority": "high",
      "reasoning": "Role definition is fundamental to the entire authorization model"
    },
    {
      "question": "Can users have multiple roles simultaneously?",
      "type": "boolean",
      "category": "authorization",
      "priority": "high",
      "reasoning": "Affects permission calculation and UI design"
    },
    {
      "question": "How should users be authenticated?",
      "type": "multiple",
      "options": ["Email/password", "Social login (Google, GitHub)", "SSO/SAML", "Magic link", "Two-factor authentication"],
      "category": "security",
      "priority": "high",
      "reasoning": "Authentication method affects security architecture and user experience"
    },
    {
      "question": "What user profile information should be stored?",
      "type": "multiple",
      "options": ["Name", "Email", "Phone", "Avatar", "Department", "Job title", "Location", "Bio"],
      "category": "data",
      "priority": "medium",
      "reasoning": "Defines the user data model"
    },
    {
      "question": "Should there be a self-service password reset feature?",
      "type": "boolean",
      "category": "functionality",
      "priority": "medium",
      "reasoning": "Common security and UX consideration"
    }
  ],
  "analysisSummary": "User management requirements are broadly defined. Key decisions needed around roles, authentication, and user data model.",
  "ambiguities": [
    "Specific roles not defined",
    "Multi-role assignment unclear",
    "Authentication method not specified",
    "User data model undefined"
  ],
  "suggestions": [
    "Define a role matrix with permissions",
    "Choose authentication methods",
    "Create user data model diagram",
    "Plan for password management flows"
  ]
}
\`\`\``;

// ============================================
// User Prompt Templates
// ============================================

/**
 * Generate user prompt for clarification question generation
 */
export function generateClarificationUserPrompt(
  input: ClarificationInput
): string {
  const { requirement, entities, relations, existingClarifications, config } = input;
  const {
    maxQuestions = 5,
    categories,
    minPriority = 'medium',
    includeReasoning = true,
    includeDefaults = true,
    language = 'en',
    detailLevel = 'standard',
    audience = 'developer',
    projectContext,
  } = config || {};

  let prompt = `## Requirement Analysis Task

Analyze the following requirement and generate clarification questions.

### Requirement Text
\`\`\`
${requirement}
\`\`\`
`;

  // Add entities if provided
  if (entities && entities.length > 0) {
    prompt += `
### Extracted Entities
${entities.map(e => `- **${e.name}** (${e.type})${e.description ? `: ${e.description}` : ''}`).join('\n')}
`;
  }

  // Add relations if provided
  if (relations && relations.length > 0) {
    prompt += `
### Extracted Relations
${relations.map(r => `- **${r.from}** → ${r.type} → **${r.to}**`).join('\n')}
`;
  }

  // Add existing clarifications if provided
  if (existingClarifications && existingClarifications.length > 0) {
    prompt += `
### Previously Clarified
${existingClarifications.map(c => `Q: ${c.question}\nA: ${c.answer}`).join('\n\n')}
`;
  }

  // Add configuration
  prompt += `
### Generation Parameters
- **Maximum Questions**: ${maxQuestions}
- **Minimum Priority**: ${minPriority}
- **Detail Level**: ${detailLevel}
- **Target Audience**: ${audience}
- **Language**: ${language}
`;

  // Add category focus
  if (categories && categories.length > 0) {
    prompt += `- **Focus Categories**: ${categories.join(', ')}\n`;
  }

  // Add project context if provided
  if (projectContext) {
    prompt += `
### Project Context
${projectContext}
`;
  }

  // Add output instructions
  prompt += `
### Output Instructions

Generate up to ${maxQuestions} clarification questions. For each question:
1. Make it specific and actionable
2. Reference specific parts of the requirement when possible
3. Use appropriate question type (open, choice, multiple, number, date, boolean)
4. Provide options for choice/multiple types
5. ${includeReasoning ? 'Include reasoning for why this question is needed' : 'Skip reasoning'}
6. ${includeDefaults ? 'Suggest a reasonable default answer' : 'Skip default answer'}

Focus on questions with **${minPriority}** priority or higher.

Return a valid JSON object with the questions array, analysis summary, ambiguities found, and suggestions.`;

  return prompt;
}

/**
 * Generate follow-up clarification prompt
 */
export function generateFollowUpClarificationPrompt(
  originalRequirement: string,
  answeredQuestions: Array<{ question: string; answer: string }>,
  config?: ClarificationConfig
): string {
  const { maxQuestions = 3 } = config || {};

  const answeredSummary = answeredQuestions
    .map(qa => `Q: ${qa.question}\nA: ${qa.answer}`)
    .join('\n\n');

  return `## Follow-up Clarification Task

Based on the answers provided, generate additional clarification questions.

### Original Requirement
\`\`\`
${originalRequirement}
\`\`\`

### Previously Answered Questions
${answeredSummary}

### Task
Analyze if the answers reveal new ambiguities or if additional clarification is needed.
Generate up to ${maxQuestions} follow-up questions that:
1. Build upon the provided answers
2. Explore newly revealed ambiguities
3. Deepen understanding of critical aspects

Return a valid JSON object with questions, updated analysis, and remaining ambiguities.`;
}

/**
 * Generate focused clarification prompt for specific aspect
 */
export function generateFocusedClarificationPrompt(
  requirement: string,
  focusAspect: ClarificationCategory,
  config?: ClarificationConfig
): string {
  const { maxQuestions = 3, detailLevel = 'detailed' } = config || {};

  const aspectDescriptions: Record<ClarificationCategory, string> = {
    [ClarificationCategory.FUNCTIONALITY]: 'core features, behaviors, and user interactions',
    [ClarificationCategory.DATA]: 'data models, storage, relationships, and data flow',
    [ClarificationCategory.UI]: 'user interface, visual design, and user experience',
    [ClarificationCategory.SECURITY]: 'authentication, authorization, data protection, and security measures',
    [ClarificationCategory.PERFORMANCE]: 'response times, scalability, load handling, and optimization',
    [ClarificationCategory.INTEGRATION]: 'external systems, APIs, third-party services, and data exchange',
    [ClarificationCategory.AUTHORIZATION]: 'roles, permissions, access control, and permission management',
    [ClarificationCategory.BUSINESS_RULES]: 'business logic, validation rules, and workflow constraints',
    [ClarificationCategory.EDGE_CASES]: 'error handling, boundary conditions, and exceptional scenarios',
    [ClarificationCategory.PLATFORM]: 'device support, browser compatibility, and platform requirements',
    [ClarificationCategory.OTHER]: 'general aspects not covered by other categories',
  };

  return `## Focused Clarification: ${focusAspect}

Analyze the requirement specifically for **${aspectDescriptions[focusAspect]}**.

### Requirement
\`\`\`
${requirement}
\`\`\`

### Focus Area
**${focusAspect}**: ${aspectDescriptions[focusAspect]}

### Task
Generate up to ${maxQuestions} questions focused specifically on ${focusAspect}.
Provide ${detailLevel} level of detail in your analysis.

Return a valid JSON object with questions, analysis, and suggestions.`;
}

// ============================================
// Specialized Prompt Templates
// ============================================

/**
 * Generate prompt for ambiguity detection
 */
export function generateAmbiguityDetectionPrompt(requirement: string): string {
  return `## Ambiguity Detection Task

Analyze the following requirement text to identify all ambiguities, unclear statements, and potential interpretation issues.

### Requirement
\`\`\`
${requirement}
\`\`\`

### Task
Identify and categorize ambiguities:
1. **Lexical Ambiguities**: Words with multiple meanings
2. **Syntactic Ambiguities**: Ambiguous sentence structures
3. **Semantic Ambiguities**: Unclear intended meaning
4. **Vague Terms**: Imprecise or subjective terms
5. **Missing Information**: Incomplete specifications

For each ambiguity:
- Quote the ambiguous text
- Explain why it's ambiguous
- Suggest clarifications

Return a JSON object with:
\`\`\`json
{
  "ambiguities": [
    {
      "text": "quoted ambiguous text",
      "type": "lexical|syntactic|semantic|vague|missing",
      "explanation": "why this is ambiguous",
      "suggestedClarification": "how to clarify"
    }
  ],
  "severity": "low|medium|high",
  "summary": "overall ambiguity assessment"
}
\`\`\``;
}

/**
 * Generate prompt for technical clarification
 */
export function generateTechnicalClarificationPrompt(
  requirement: string,
  technicalArea: 'architecture' | 'database' | 'api' | 'frontend' | 'security' | 'deployment'
): string {
  const areaPrompts: Record<string, string> = {
    architecture: `Technical Focus: Architecture
- System architecture patterns (monolith, microservices, serverless)
- Service boundaries and communication
- Scalability considerations
- Technology stack choices`,
    
    database: `Technical Focus: Database
- Database type (SQL, NoSQL, graph)
- Data model and schema design
- Relationships and constraints
- Data migration and versioning`,
    
    api: `Technical Focus: API Design
- API style (REST, GraphQL, gRPC)
- Endpoints and resources
- Authentication and authorization
- Rate limiting and caching`,
    
    frontend: `Technical Focus: Frontend
- Framework choices
- Component architecture
- State management
- Responsive design requirements`,
    
    security: `Technical Focus: Security
- Authentication mechanisms
- Authorization model
- Data encryption
- Security compliance`,
    
    deployment: `Technical Focus: Deployment
- Hosting environment
- CI/CD requirements
- Environment management
- Monitoring and logging`,
  };

  return `## Technical Clarification: ${technicalArea}

### Requirement
\`\`\`
${requirement}
\`\`\`

### ${areaPrompts[technicalArea]}

### Task
Generate technical clarification questions specific to ${technicalArea}.
Focus on decisions that affect implementation.

Return a valid JSON object with technical questions, each with:
- question
- type (open, choice, multiple)
- options (for choice/multiple)
- category: "functionality" or "security" or "performance" etc.
- priority
- reasoning`;
}

/**
 * Generate prompt for business rule extraction
 */
export function generateBusinessRulesClarificationPrompt(requirement: string): string {
  return `## Business Rules Clarification

Identify and clarify business rules implied or stated in the requirement.

### Requirement
\`\`\`
${requirement}
\`\`\`

### Task
Extract and clarify business rules:
1. **Validation Rules**: Data validation constraints
2. **Workflow Rules**: Process and state transitions
3. **Access Rules**: Who can do what
4. **Calculation Rules**: Formulas and computations
5. **Timing Rules**: Deadlines, schedules, intervals

For each identified or implied business rule, ask clarifying questions about:
- Exact conditions and triggers
- Exceptions and edge cases
- Priority and precedence

Return a JSON object:
\`\`\`json
{
  "questions": [
    {
      "question": "The clarification question",
      "type": "open|choice|multiple|boolean",
      "category": "business_rules",
      "priority": "high|medium|low",
      "relatedRule": "The business rule being clarified"
    }
  ],
  "identifiedRules": ["Rule 1", "Rule 2"],
  "assumptions": ["Assumption 1", "Assumption 2"]
}
\`\`\``;
}

// ============================================
// Question Validation Functions
// ============================================

/**
 * Validate a clarification question
 */
export function validateQuestion(question: ClarificationQuestion): QuestionValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required fields
  if (!question.question || question.question.trim().length === 0) {
    errors.push('Question text is required');
  }

  if (!question.type) {
    errors.push('Question type is required');
  }

  if (!question.category) {
    errors.push('Question category is required');
  }

  // Validate question text
  if (question.question && question.question.length < 10) {
    warnings.push('Question is very short, consider adding more context');
  }

  if (question.question && question.question.length > 500) {
    warnings.push('Question is very long, consider breaking into multiple questions');
  }

  // Validate options for choice/multiple types
  if ((question.type === ClarificationQuestionType.CHOICE || 
       question.type === ClarificationQuestionType.MULTIPLE) &&
      (!question.options || question.options.length < 2)) {
    errors.push('Choice and multiple questions require at least 2 options');
  }

  // Check for question marks
  if (question.question && !question.question.includes('?')) {
    warnings.push('Questions should end with a question mark');
  }

  // Calculate completeness
  let completeness = 1;
  if (errors.length > 0) completeness -= 0.5;
  if (warnings.length > 0) completeness -= 0.1 * Math.min(warnings.length, 3);

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    completeness: Math.max(0, completeness),
  };
}

/**
 * Validate a set of clarification questions
 */
export function validateQuestions(
  questions: ClarificationQuestion[]
): { valid: ClarificationQuestion[]; invalid: ClarificationQuestion[]; results: Map<string, QuestionValidationResult> } {
  const valid: ClarificationQuestion[] = [];
  const invalid: ClarificationQuestion[] = [];
  const results = new Map<string, QuestionValidationResult>();

  for (const question of questions) {
    const result = validateQuestion(question);
    results.set(question.id, result);
    
    if (result.isValid) {
      valid.push(question);
    } else {
      invalid.push(question);
    }
  }

  return { valid, invalid, results };
}

// ============================================
// Prompt Composition Functions
// ============================================

/**
 * Compose full clarification prompt
 */
export function composeClarificationPrompt(
  input: ClarificationInput,
  options?: {
    includeExamples?: boolean;
    customSystemPrompt?: string;
  }
): { systemPrompt: string; userPrompt: string } {
  const { includeExamples = false, customSystemPrompt } = options || {};

  const systemPrompt = customSystemPrompt || 
    (includeExamples ? CLARIFICATION_SYSTEM_PROMPT_WITH_EXAMPLES : CLARIFICATION_SYSTEM_PROMPT);

  const userPrompt = generateClarificationUserPrompt(input);

  return { systemPrompt, userPrompt };
}

/**
 * Generate prompt for validating answers
 */
export function generateAnswerValidationPrompt(
  questions: ClarificationQuestion[],
  answers: Record<string, string>
): string {
  const qaText = questions
    .map(q => {
      const answer = answers[q.id] || 'Not answered';
      return `Q: ${q.question}\nType: ${q.type}\nCategory: ${q.category}\nA: ${answer}`;
    })
    .join('\n\n');

  return `## Answer Validation Task

Review the provided answers to clarification questions and assess their completeness and quality.

### Questions and Answers
${qaText}

### Task
For each answer:
1. Assess if the answer addresses the question
2. Check if the answer provides sufficient detail
3. Identify any follow-up questions needed
4. Suggest improvements if the answer is incomplete

Return a JSON object:
\`\`\`json
{
  "validations": [
    {
      "questionId": "id",
      "isComplete": true|false,
      "quality": "good|partial|insufficient",
      "gaps": ["gap1", "gap2"],
      "suggestions": ["suggestion1"]
    }
  ],
  "overallCompleteness": 0.0-1.0,
  "followUpNeeded": true|false
}
\`\`\``;
}

/**
 * Generate prompt for summarizing clarifications
 */
export function generateClarificationSummaryPrompt(
  requirement: string,
  questions: ClarificationQuestion[]
): string {
  const qaText = questions
    .map(q => {
      let text = `Q: ${q.question}\nA: ${q.answer || 'Not answered'}`;
      if (q.options) {
        text += `\nOptions: ${q.options.join(', ')}`;
      }
      return text;
    })
    .join('\n\n');

  return `## Clarification Summary Task

Create a concise summary of the clarification process and its outcomes.

### Original Requirement
\`\`\`
${requirement}
\`\`\`

### Clarifications
${qaText}

### Task
Generate a summary that:
1. Lists key decisions made through clarifications
2. Highlights remaining ambiguities (if any)
3. Suggests next steps for the requirement

Return a JSON object:
\`\`\`json
{
  "summary": "Brief overall summary",
  "keyDecisions": ["Decision 1", "Decision 2"],
  "resolvedAmbiguities": ["Ambiguity 1", "Ambiguity 2"],
  "remainingAmbiguities": ["Still unclear 1"],
  "nextSteps": ["Next step 1", "Next step 2"],
  "readinessScore": 0.0-1.0
}
\`\`\``;
}

// ============================================
// Utility Functions
// ============================================

/**
 * Create a new clarification question
 */
export function createClarificationQuestion(
  question: string,
  type: ClarificationQuestionType,
  category: ClarificationCategory,
  options?: {
    priority?: ClarificationPriority;
    options?: string[];
    reasoning?: string;
    defaultAnswer?: string;
    required?: boolean;
  }
): ClarificationQuestion {
  return {
    id: generateQuestionId(),
    question,
    type,
    category,
    priority: options?.priority || ClarificationPriority.MEDIUM,
    options: options?.options,
    reasoning: options?.reasoning,
    defaultAnswer: options?.defaultAnswer,
    required: options?.required,
  };
}

/**
 * Generate a unique question ID
 */
export function generateQuestionId(): string {
  return `q_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Get category description
 */
export function getCategoryDescription(category: ClarificationCategory): string {
  const descriptions: Record<ClarificationCategory, string> = {
    [ClarificationCategory.FUNCTIONALITY]: 'Core features and behaviors',
    [ClarificationCategory.DATA]: 'Data models, storage, and relationships',
    [ClarificationCategory.UI]: 'User interface and experience',
    [ClarificationCategory.SECURITY]: 'Authentication, authorization, and data protection',
    [ClarificationCategory.PERFORMANCE]: 'Performance, scalability, and optimization',
    [ClarificationCategory.INTEGRATION]: 'External systems and APIs',
    [ClarificationCategory.AUTHORIZATION]: 'Roles, permissions, and access control',
    [ClarificationCategory.BUSINESS_RULES]: 'Business logic and validation rules',
    [ClarificationCategory.EDGE_CASES]: 'Error handling and boundary conditions',
    [ClarificationCategory.PLATFORM]: 'Device and platform support',
    [ClarificationCategory.OTHER]: 'General clarifications',
  };
  return descriptions[category] || 'Unknown category';
}

/**
 * Get priority description
 */
export function getPriorityDescription(priority: ClarificationPriority): string {
  const descriptions: Record<ClarificationPriority, string> = {
    [ClarificationPriority.LOW]: 'Nice to have, not blocking',
    [ClarificationPriority.MEDIUM]: 'Important but not critical',
    [ClarificationPriority.HIGH]: 'Critical for understanding',
  };
  return descriptions[priority];
}

/**
 * Parse LLM response to clarification output
 */
export function parseClarificationResponse(
  content: string
): ClarificationOutput | null {
  try {
    // Try to extract JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return null;
    }

    const parsed = JSON.parse(jsonMatch[0]);

    if (!Array.isArray(parsed.questions)) {
      return null;
    }

    // Transform and validate questions
    const questions: ClarificationQuestion[] = parsed.questions
      .map((q: any, index: number) => {
        if (!q.question) return null;

        return {
          id: q.id || generateQuestionId(),
          question: q.question,
          type: Object.values(ClarificationQuestionType).includes(q.type)
            ? q.type
            : ClarificationQuestionType.OPEN,
          options: Array.isArray(q.options) ? q.options : undefined,
          category: Object.values(ClarificationCategory).includes(q.category)
            ? q.category
            : ClarificationCategory.OTHER,
          priority: Object.values(ClarificationPriority).includes(q.priority)
            ? q.priority
            : ClarificationPriority.MEDIUM,
          reasoning: q.reasoning,
          defaultAnswer: q.defaultAnswer,
          required: q.required,
        };
      })
      .filter((q: ClarificationQuestion | null): q is ClarificationQuestion => q !== null);

    return {
      questions,
      analysisSummary: parsed.analysisSummary || '',
      ambiguities: Array.isArray(parsed.ambiguities) ? parsed.ambiguities : [],
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
      confidence: parsed.confidence || 0.8,
    };
  } catch (error) {
    safeError('Failed to parse clarification response:', error);
    return null;
  }
}

/**
 * Filter questions by category
 */
export function filterByCategory(
  questions: ClarificationQuestion[],
  categories: ClarificationCategory[]
): ClarificationQuestion[] {
  return questions.filter(q => categories.includes(q.category));
}

/**
 * Filter questions by priority
 */
export function filterByPriority(
  questions: ClarificationQuestion[],
  minPriority: ClarificationPriority
): ClarificationQuestion[] {
  const priorityOrder = {
    [ClarificationPriority.HIGH]: 3,
    [ClarificationPriority.MEDIUM]: 2,
    [ClarificationPriority.LOW]: 1,
  };

  return questions.filter(
    q => priorityOrder[q.priority] >= priorityOrder[minPriority]
  );
}

/**
 * Sort questions by priority
 */
export function sortByPriority(
  questions: ClarificationQuestion[],
  order: 'asc' | 'desc' = 'desc'
): ClarificationQuestion[] {
  const priorityOrder = {
    [ClarificationPriority.HIGH]: 3,
    [ClarificationPriority.MEDIUM]: 2,
    [ClarificationPriority.LOW]: 1,
  };

  return [...questions].sort((a, b) => {
    const diff = priorityOrder[b.priority] - priorityOrder[a.priority];
    return order === 'desc' ? diff : -diff;
  });
}

/**
 * Group questions by category
 */
export function groupByCategory(
  questions: ClarificationQuestion[]
): Record<ClarificationCategory, ClarificationQuestion[]> {
  return questions.reduce((acc, question) => {
    if (!acc[question.category]) {
      acc[question.category] = [];
    }
    acc[question.category].push(question);
    return acc;
  }, {} as Record<ClarificationCategory, ClarificationQuestion[]>);
}

// ============================================
// Export
// ============================================

export default {
  // Enums
  ClarificationQuestionType,
  ClarificationCategory,
  ClarificationPriority,
  
  // Constants
  CLARIFICATION_SYSTEM_PROMPT,
  CLARIFICATION_SYSTEM_PROMPT_WITH_EXAMPLES,
  
  // Prompt generation
  generateClarificationUserPrompt,
  generateFollowUpClarificationPrompt,
  generateFocusedClarificationPrompt,
  generateAmbiguityDetectionPrompt,
  generateTechnicalClarificationPrompt,
  generateBusinessRulesClarificationPrompt,
  composeClarificationPrompt,
  generateAnswerValidationPrompt,
  generateClarificationSummaryPrompt,
  
  // Validation
  validateQuestion,
  validateQuestions,
  
  // Utilities
  createClarificationQuestion,
  generateQuestionId,
  getCategoryDescription,
  getPriorityDescription,
  parseClarificationResponse,
  filterByCategory,
  filterByPriority,
  sortByPriority,
  groupByCategory,
};