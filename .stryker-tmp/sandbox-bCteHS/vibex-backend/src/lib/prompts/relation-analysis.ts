/**
 * Entity Relation Analysis Prompt Templates
 * 
 * This module contains prompt templates for analyzing entity relationships
 * in the context of the VibeX AI Prototype Builder. It focuses on understanding
 * how entities relate to each other in user requirements and converting them
 * into structured domain models.
 */
// @ts-nocheck


/**
 * Analysis Entity Types
 * 
 * Core entity types for AI prototype building domain.
 */
export enum AnalysisEntityType {
  // Core domain entities
  USER = 'USER',
  PROJECT = 'PROJECT',
  PAGE = 'PAGE',
  COMPONENT = 'COMPONENT',
  FEATURE = 'FEATURE',
  DATA = 'DATA',
  SERVICE = 'SERVICE',
  API = 'API',
  
  // UI/UX entities
  BUTTON = 'BUTTON',
  FORM = 'FORM',
  INPUT = 'INPUT',
  TABLE = 'TABLE',
  CHART = 'CHART',
  MODAL = 'MODAL',
  NAVIGATION = 'NAVIGATION',
  MENU = 'MENU',
  CARD = 'CARD',
  LIST = 'LIST',
  LINK = 'LINK',
  
  // State & Behavior
  STATE = 'STATE',
  ACTION = 'ACTION',
  EVENT = 'EVENT',
  WORKFLOW = 'WORKFLOW',
  TRANSITION = 'TRANSITION',
  
  // Data & Auth
  DATA_MODEL = 'DATA_MODEL',
  SCHEMA = 'SCHEMA',
  PERMISSION = 'PERMISSION',
  ROLE = 'ROLE',
  AUTH = 'AUTH',
  
  // Integration
  INTEGRATION = 'INTEGRATION',
  WEBHOOK = 'WEBHOOK',
  TRIGGER = 'TRIGGER',
}

/**
 * Relation Analysis Types
 * 
 * Types of relationships between entities in prototype requirements.
 */
export enum RelationAnalysisType {
  // Structural relations
  CONTAINS = 'CONTAINS',
  PART_OF = 'PART_OF',
  COMPOSED_OF = 'COMPOSED_OF',
  PARENT_OF = 'PARENT_OF',
  CHILD_OF = 'CHILD_OF',
  
  // Functional relations
  USES = 'USES',
  CALLS = 'CALLS',
  DEPENDS_ON = 'DEPENDS_ON',
  PROVIDES = 'PROVIDES',
  REQUIRES = 'REQUIRES',
  
  // Data relations
  STORES = 'STORES',
  READS = 'READS',
  WRITES = 'WRITES',
  VALIDATES = 'VALIDATES',
  TRANSFORMS = 'TRANSFORMS',
  
  // User interaction
  DISPLAYS = 'DISPLAYS',
  COLLECTS = 'COLLECTS',
  SUBMITS = 'SUBMITS',
  NAVIGATES = 'NAVIGATES',
  FILTERS = 'FILTERS',
  SORTS = 'SORTS',
  
  // State management
  MANAGES = 'MANAGES',
  TRIGGERS = 'TRIGGERS',
  TRANSITIONS = 'TRANSITIONS',
  UPDATES = 'UPDATES',
  
  // Access control
  AUTHORIZES = 'AUTHORIZES',
  AUTHENTICATES = 'AUTHENTICATES',
  RESTRICTS = 'RESTRICTS',
  ALLOWS = 'ALLOWS',
  
  // Business logic
  VALIDATES_RULE = 'VALIDATES_RULE',
  ENFORCES = 'ENFORCES',
  CALCULATES = 'CALCULATES',
  NOTIFIES = 'NOTIFIES',
  
  // Integration
  INTEGRATES_WITH = 'INTEGRATES_WITH',
  SYNC_WITH = 'SYNC_WITH',
  LISTENS_TO = 'LISTENS_TO',
  SENDS_TO = 'SENDS_TO',
}

/**
 * Relation analysis metadata definitions
 */
export const RELATION_ANALYSIS_DEFINITIONS: Record<RelationAnalysisType, {
  description: string;
  sourceTypes: AnalysisEntityType[];
  targetTypes: AnalysisEntityType[];
  bidirectional: boolean;
  examples: string[];
}> = {
  // Structural relations
  [RelationAnalysisType.CONTAINS]: {
    description: 'One entity contains or wraps another entity',
    sourceTypes: [AnalysisEntityType.PAGE, AnalysisEntityType.COMPONENT, AnalysisEntityType.CARD, AnalysisEntityType.MODAL],
    targetTypes: [AnalysisEntityType.COMPONENT, AnalysisEntityType.BUTTON, AnalysisEntityType.INPUT, AnalysisEntityType.FORM],
    bidirectional: false,
    examples: [
      'The dashboard page contains a navigation menu',
      'The card component contains a button',
    ],
  },
  [RelationAnalysisType.PART_OF]: {
    description: 'Entity is a part of a larger entity',
    sourceTypes: [AnalysisEntityType.COMPONENT, AnalysisEntityType.FEATURE],
    targetTypes: [AnalysisEntityType.PAGE, AnalysisEntityType.PROJECT],
    bidirectional: true,
    examples: [
      'The login form is part of the authentication page',
      'Header is part of every page',
    ],
  },
  [RelationAnalysisType.COMPOSED_OF]: {
    description: 'Entity is composed of multiple sub-entities',
    sourceTypes: [AnalysisEntityType.PAGE, AnalysisEntityType.COMPONENT],
    targetTypes: [AnalysisEntityType.COMPONENT, AnalysisEntityType.BUTTON, AnalysisEntityType.INPUT],
    bidirectional: false,
    examples: [
      'The dashboard is composed of charts, tables, and filters',
      'The form is composed of multiple input fields',
    ],
  },
  [RelationAnalysisType.PARENT_OF]: {
    description: 'Parent entity manages or owns child entities',
    sourceTypes: [AnalysisEntityType.PROJECT, AnalysisEntityType.PAGE, AnalysisEntityType.SERVICE],
    targetTypes: [AnalysisEntityType.PAGE, AnalysisEntityType.COMPONENT, AnalysisEntityType.FEATURE],
    bidirectional: false,
    examples: [
      'The project is parent of all pages',
      'The parent component is parent of child components',
    ],
  },
  [RelationAnalysisType.CHILD_OF]: {
    description: 'Child entity belongs to or is owned by parent',
    sourceTypes: [AnalysisEntityType.PAGE, AnalysisEntityType.COMPONENT],
    targetTypes: [AnalysisEntityType.PROJECT, AnalysisEntityType.PAGE, AnalysisEntityType.COMPONENT],
    bidirectional: false,
    examples: [
      'Settings page is child of the project',
      'The button is child of the card',
    ],
  },
  
  // Functional relations
  [RelationAnalysisType.USES]: {
    description: 'Entity uses another entity to perform its function',
    sourceTypes: [AnalysisEntityType.PAGE, AnalysisEntityType.COMPONENT, AnalysisEntityType.SERVICE],
    targetTypes: [AnalysisEntityType.COMPONENT, AnalysisEntityType.SERVICE, AnalysisEntityType.API],
    bidirectional: false,
    examples: [
      'The user profile page uses the user data service',
      'The form component uses validation service',
    ],
  },
  [RelationAnalysisType.CALLS]: {
    description: 'Entity makes calls to another entity (typically APIs)',
    sourceTypes: [AnalysisEntityType.SERVICE, AnalysisEntityType.COMPONENT],
    targetTypes: [AnalysisEntityType.API, AnalysisEntityType.SERVICE],
    bidirectional: false,
    examples: [
      'The auth service calls the login API',
      'The component calls the data fetch API',
    ],
  },
  [RelationAnalysisType.DEPENDS_ON]: {
    description: 'Entity depends on another entity to function',
    sourceTypes: [AnalysisEntityType.COMPONENT, AnalysisEntityType.SERVICE, AnalysisEntityType.FEATURE],
    targetTypes: [AnalysisEntityType.SERVICE, AnalysisEntityType.API, AnalysisEntityType.DATA],
    bidirectional: false,
    examples: [
      'The dashboard depends on analytics service',
      'The export feature depends on file generation service',
    ],
  },
  [RelationAnalysisType.PROVIDES]: {
    description: 'Entity provides functionality or data to other entities',
    sourceTypes: [AnalysisEntityType.SERVICE, AnalysisEntityType.API],
    targetTypes: [AnalysisEntityType.DATA, AnalysisEntityType.FEATURE],
    bidirectional: false,
    examples: [
      'The user service provides user data',
      'The API provides CRUD operations',
    ],
  },
  [RelationAnalysisType.REQUIRES]: {
    description: 'Entity requires another entity to be present',
    sourceTypes: [AnalysisEntityType.FEATURE, AnalysisEntityType.COMPONENT],
    targetTypes: [AnalysisEntityType.PERMISSION, AnalysisEntityType.ROLE, AnalysisEntityType.AUTH],
    bidirectional: false,
    examples: [
      'The admin panel requires admin role',
      'The export feature requires authentication',
    ],
  },
  
  // Data relations
  [RelationAnalysisType.STORES]: {
    description: 'Entity stores or persists data',
    sourceTypes: [AnalysisEntityType.SERVICE, AnalysisEntityType.DATA_MODEL],
    targetTypes: [AnalysisEntityType.DATA, AnalysisEntityType.SCHEMA],
    bidirectional: false,
    examples: [
      'The user service stores user profiles',
      'The database stores customer data',
    ],
  },
  [RelationAnalysisType.READS]: {
    description: 'Entity reads data from a source',
    sourceTypes: [AnalysisEntityType.SERVICE, AnalysisEntityType.COMPONENT],
    targetTypes: [AnalysisEntityType.DATA, AnalysisEntityType.API],
    bidirectional: false,
    examples: [
      'The dashboard reads analytics data',
      'The list component reads from API',
    ],
  },
  [RelationAnalysisType.WRITES]: {
    description: 'Entity writes or updates data',
    sourceTypes: [AnalysisEntityType.SERVICE, AnalysisEntityType.FORM, AnalysisEntityType.ACTION],
    targetTypes: [AnalysisEntityType.DATA, AnalysisEntityType.DATA_MODEL],
    bidirectional: false,
    examples: [
      'The form writes user input to database',
      'The update action writes changes',
    ],
  },
  [RelationAnalysisType.VALIDATES]: {
    description: 'Entity validates data or rules',
    sourceTypes: [AnalysisEntityType.SERVICE, AnalysisEntityType.FORM, AnalysisEntityType.ACTION],
    targetTypes: [AnalysisEntityType.DATA, AnalysisEntityType.SCHEMA],
    bidirectional: false,
    examples: [
      'The form validates email format',
      'The service validates user input',
    ],
  },
  [RelationAnalysisType.TRANSFORMS]: {
    description: 'Entity transforms or converts data',
    sourceTypes: [AnalysisEntityType.SERVICE, AnalysisEntityType.ACTION],
    targetTypes: [AnalysisEntityType.DATA, AnalysisEntityType.DATA_MODEL],
    bidirectional: false,
    examples: [
      'The mapper transforms API response to UI model',
      'The service transforms raw data to formatted output',
    ],
  },
  
  // User interaction
  [RelationAnalysisType.DISPLAYS]: {
    description: 'Entity displays or shows content to user',
    sourceTypes: [AnalysisEntityType.COMPONENT, AnalysisEntityType.PAGE],
    targetTypes: [AnalysisEntityType.DATA, AnalysisEntityType.COMPONENT],
    bidirectional: false,
    examples: [
      'The card displays user information',
      'The chart displays analytics data',
    ],
  },
  [RelationAnalysisType.COLLECTS]: {
    description: 'Entity collects user input',
    sourceTypes: [AnalysisEntityType.FORM, AnalysisEntityType.INPUT, AnalysisEntityType.COMPONENT],
    targetTypes: [AnalysisEntityType.DATA],
    bidirectional: false,
    examples: [
      'The login form collects credentials',
      'The search input collects query',
    ],
  },
  [RelationAnalysisType.SUBMITS]: {
    description: 'Entity submits data to a target',
    sourceTypes: [AnalysisEntityType.FORM, AnalysisEntityType.BUTTON],
    targetTypes: [AnalysisEntityType.API, AnalysisEntityType.SERVICE, AnalysisEntityType.ACTION],
    bidirectional: false,
    examples: [
      'The submit button submits form data to API',
      'The form submits to the save action',
    ],
  },
  [RelationAnalysisType.NAVIGATES]: {
    description: 'Entity causes navigation to another page',
    sourceTypes: [AnalysisEntityType.BUTTON, AnalysisEntityType.LINK, AnalysisEntityType.MENU],
    targetTypes: [AnalysisEntityType.PAGE],
    bidirectional: false,
    examples: [
      'The menu navigates to different pages',
      'The button navigates to detail page',
    ],
  },
  [RelationAnalysisType.FILTERS]: {
    description: 'Entity filters data based on criteria',
    sourceTypes: [AnalysisEntityType.COMPONENT, AnalysisEntityType.FEATURE],
    targetTypes: [AnalysisEntityType.DATA, AnalysisEntityType.LIST],
    bidirectional: false,
    examples: [
      'The filter component filters the table data',
      'Search filters results',
    ],
  },
  [RelationAnalysisType.SORTS]: {
    description: 'Entity sorts data in a specific order',
    sourceTypes: [AnalysisEntityType.COMPONENT, AnalysisEntityType.FEATURE],
    targetTypes: [AnalysisEntityType.DATA, AnalysisEntityType.LIST],
    bidirectional: false,
    examples: [
      'The table sorts by date',
      'The dropdown sorts options alphabetically',
    ],
  },
  
  // State management
  [RelationAnalysisType.MANAGES]: {
    description: 'Entity manages or controls state',
    sourceTypes: [AnalysisEntityType.SERVICE, AnalysisEntityType.COMPONENT],
    targetTypes: [AnalysisEntityType.STATE, AnalysisEntityType.DATA],
    bidirectional: false,
    examples: [
      'The auth service manages login state',
      'The store manages application state',
    ],
  },
  [RelationAnalysisType.TRIGGERS]: {
    description: 'Entity triggers an event or action',
    sourceTypes: [AnalysisEntityType.EVENT, AnalysisEntityType.BUTTON, AnalysisEntityType.ACTION],
    targetTypes: [AnalysisEntityType.ACTION, AnalysisEntityType.WORKFLOW],
    bidirectional: false,
    examples: [
      'The click triggers the save action',
      'The timer triggers refresh',
    ],
  },
  [RelationAnalysisType.TRANSITIONS]: {
    description: 'Entity causes state transition',
    sourceTypes: [AnalysisEntityType.ACTION, AnalysisEntityType.EVENT],
    targetTypes: [AnalysisEntityType.STATE],
    bidirectional: false,
    examples: [
      'The submit action transitions to loading state',
      'The event transitions from pending to complete',
    ],
  },
  [RelationAnalysisType.UPDATES]: {
    description: 'Entity updates or modifies another entity',
    sourceTypes: [AnalysisEntityType.ACTION, AnalysisEntityType.SERVICE],
    targetTypes: [AnalysisEntityType.DATA, AnalysisEntityType.STATE, AnalysisEntityType.COMPONENT],
    bidirectional: false,
    examples: [
      'The action updates the record',
      'The service updates the UI state',
    ],
  },
  
  // Access control
  [RelationAnalysisType.AUTHORIZES]: {
    description: 'Entity authorizes access to resources',
    sourceTypes: [AnalysisEntityType.AUTH, AnalysisEntityType.SERVICE],
    targetTypes: [AnalysisEntityType.PERMISSION, AnalysisEntityType.ROLE],
    bidirectional: false,
    examples: [
      'The auth service authorizes user access',
      'The permission authorizes resource access',
    ],
  },
  [RelationAnalysisType.AUTHENTICATES]: {
    description: 'Entity verifies user identity',
    sourceTypes: [AnalysisEntityType.AUTH, AnalysisEntityType.SERVICE],
    targetTypes: [AnalysisEntityType.USER],
    bidirectional: false,
    examples: [
      'The login service authenticates users',
      'The token authenticates requests',
    ],
  },
  [RelationAnalysisType.RESTRICTS]: {
    description: 'Entity restricts access to resources',
    sourceTypes: [AnalysisEntityType.PERMISSION, AnalysisEntityType.ROLE],
    targetTypes: [AnalysisEntityType.FEATURE, AnalysisEntityType.COMPONENT, AnalysisEntityType.DATA],
    bidirectional: false,
    examples: [
      'The admin role restricts access to settings',
      'The permission restricts data access',
    ],
  },
  [RelationAnalysisType.ALLOWS]: {
    description: 'Entity allows access to resources',
    sourceTypes: [AnalysisEntityType.PERMISSION, AnalysisEntityType.ROLE],
    targetTypes: [AnalysisEntityType.FEATURE, AnalysisEntityType.COMPONENT, AnalysisEntityType.ACTION],
    bidirectional: false,
    examples: [
      'The editor role allows content editing',
      'The permission allows data export',
    ],
  },
  
  // Business logic
  [RelationAnalysisType.VALIDATES_RULE]: {
    description: 'Entity validates business rules',
    sourceTypes: [AnalysisEntityType.SERVICE, AnalysisEntityType.ACTION],
    targetTypes: [AnalysisEntityType.DATA, AnalysisEntityType.ACTION],
    bidirectional: false,
    examples: [
      'The service validates business rules',
      'The validator validates order rules',
    ],
  },
  [RelationAnalysisType.ENFORCES]: {
    description: 'Entity enforces constraints or policies',
    sourceTypes: [AnalysisEntityType.SERVICE, AnalysisEntityType.ACTION],
    targetTypes: [AnalysisEntityType.DATA, AnalysisEntityType.ACTION],
    bidirectional: false,
    examples: [
      'The service enforces data constraints',
      'The policy enforces rate limiting',
    ],
  },
  [RelationAnalysisType.CALCULATES]: {
    description: 'Entity performs calculations',
    sourceTypes: [AnalysisEntityType.SERVICE, AnalysisEntityType.ACTION],
    targetTypes: [AnalysisEntityType.DATA],
    bidirectional: false,
    examples: [
      'The billing service calculates totals',
      'The calculator computes metrics',
    ],
  },
  [RelationAnalysisType.NOTIFIES]: {
    description: 'Entity sends notifications',
    sourceTypes: [AnalysisEntityType.SERVICE, AnalysisEntityType.ACTION, AnalysisEntityType.TRIGGER],
    targetTypes: [AnalysisEntityType.USER, AnalysisEntityType.SERVICE],
    bidirectional: false,
    examples: [
      'The service notifies users of updates',
      'The trigger notifies external systems',
    ],
  },
  
  // Integration
  [RelationAnalysisType.INTEGRATES_WITH]: {
    description: 'Entity integrates with external systems',
    sourceTypes: [AnalysisEntityType.SERVICE, AnalysisEntityType.INTEGRATION],
    targetTypes: [AnalysisEntityType.SERVICE, AnalysisEntityType.API],
    bidirectional: true,
    examples: [
      'The payment service integrates with Stripe',
      'The app integrates with OAuth providers',
    ],
  },
  [RelationAnalysisType.SYNC_WITH]: {
    description: 'Entity syncs data with external source',
    sourceTypes: [AnalysisEntityType.SERVICE, AnalysisEntityType.INTEGRATION],
    targetTypes: [AnalysisEntityType.DATA, AnalysisEntityType.API],
    bidirectional: true,
    examples: [
      'The import service syncs with CRM',
      'The data syncs with external API',
    ],
  },
  [RelationAnalysisType.LISTENS_TO]: {
    description: 'Entity listens for events',
    sourceTypes: [AnalysisEntityType.SERVICE, AnalysisEntityType.TRIGGER],
    targetTypes: [AnalysisEntityType.EVENT],
    bidirectional: false,
    examples: [
      'The webhook listens to external events',
      'The listener listens to user actions',
    ],
  },
  [RelationAnalysisType.SENDS_TO]: {
    description: 'Entity sends data to external target',
    sourceTypes: [AnalysisEntityType.SERVICE, AnalysisEntityType.WEBHOOK],
    targetTypes: [AnalysisEntityType.API, AnalysisEntityType.SERVICE],
    bidirectional: false,
    examples: [
      'The webhook sends data to external URL',
      'The service sends analytics to backend',
    ],
  },
};

/**
 * Analysis Input Schema
 */
export interface RelationAnalysisInput {
  /** User requirement or description text */
  text: string;
  /** Optional: specific entity types to identify */
  entityTypes?: AnalysisEntityType[];
  /** Optional: specific relation types to analyze */
  relationTypes?: RelationAnalysisType[];
  /** Optional: project context for better analysis */
  projectContext?: {
    name: string;
    description?: string;
    existingEntities?: string[];
  };
  /** Optional: language code */
  language?: string;
}

/**
 * Analysis Entity Representation
 */
export interface AnalysisEntity {
  /** Entity name/identifier */
  name: string;
  /** Entity type */
  type: AnalysisEntityType;
  /** Entity description from context */
  description: string;
  /** Properties or attributes */
  properties?: Record<string, string>;
  /** Confidence score */
  confidence: number;
}

/**
 * Analysis Relation Representation
 */
export interface AnalysisRelation {
  /** Relation type */
  relationType: RelationAnalysisType;
  /** Source entity */
  source: AnalysisEntity;
  /** Target entity */
  target: AnalysisEntity;
  /** Confidence score */
  confidence: number;
  /** Evidence from text */
  evidence: string;
  /** Optional: additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Entity Relation Analysis Output
 */
export interface RelationAnalysisOutput {
  /** Identified entities */
  entities: AnalysisEntity[];
  /** Identified relationships */
  relations: AnalysisRelation[];
  /** Analysis metadata */
  metadata: {
    textLength: number;
    language: string;
    analyzedAt: string;
    entityTypesFound: AnalysisEntityType[];
    relationTypesFound: RelationAnalysisType[];
  };
}

/**
 * Generate comprehensive relation analysis prompt
 */
export function generateRelationAnalysisPrompt(input: RelationAnalysisInput): string {
  const {
    text,
    entityTypes,
    relationTypes,
    projectContext,
    language = 'en',
  } = input;

  const relationsToAnalyze = relationTypes?.length
    ? relationTypes
    : Object.values(RelationAnalysisType);

  const relationsText = relationsToAnalyze
    .filter(r => RELATION_ANALYSIS_DEFINITIONS[r])
    .map(r => {
      const def = RELATION_ANALYSIS_DEFINITIONS[r];
      return `### ${r}
- **Description**: ${def.description}
- **Source Types**: ${def.sourceTypes.join(', ')}
- **Target Types**: ${def.targetTypes.join(', ')}
- **Bidirectional**: ${def.bidirectional ? 'Yes' : 'No'}
- **Examples**: ${def.examples.join('; ')}`;
    })
    .join('\n\n');

  const entityText = entityTypes?.length
    ? entityTypes.join(', ')
    : Object.values(AnalysisEntityType).join(', ');

  return `## Entity Relation Analysis

### Task
Analyze the following user requirement or description to extract entities and their relationships in the context of AI prototype building.

### Input Text
${text}

### Project Context
${projectContext ? `
- **Project Name**: ${projectContext.name}
- **Description**: ${projectContext.description || 'N/A'}
- **Existing Entities**: ${projectContext.existingEntities?.join(', ') || 'None'}
` : 'No specific project context provided.'}

### Language
${language}

### Entity Types to Identify
${entityText}

### Relation Types to Analyze
${relationsText}

---

## Analysis Guidelines

### Step 1: Entity Identification
Identify all relevant entities in the text:
1. **Domain Entities**: Users, projects, pages, components, features
2. **UI Components**: Buttons, forms, inputs, tables, charts, modals, navigation
3. **Data & Services**: APIs, services, data models, schemas
4. **Actions & Events**: User actions, system events, workflows
5. **Access Control**: Permissions, roles, authentication

### Step 2: Relationship Analysis
For each pair of related entities:
1. **Identify Relation Type**: Match the relationship to the defined types
2. **Verify Direction**: Ensure source → target direction is correct
3. **Check Bidirectional**: Mark symmetric relations appropriately
4. **Validate Compatibility**: Check if source/target types match definition

### Step 3: Evidence Extraction
For each identified relationship:
1. Extract supporting text evidence
2. Note the context and conditions
3. Assign confidence based on clarity

### Step 4: Confidence Scoring
- **High (0.9-1.0)**: Explicit, clear relationship mentioned in text
- **Medium (0.7-0.8)**: Implicit relationship can be reasonably inferred
- **Low (0.5-0.6)**: Weak evidence, may need validation
- **Very Low (<0.5)**: Uncertain, recommend manual review

---

## Output Format

Return a JSON object:

\`\`\`json
{
  "entities": [
    {
      "name": "entity_name",
      "type": "ENTITY_TYPE",
      "description": "description from context",
      "properties": { "key": "value" },
      "confidence": 0.95
    }
  ],
  "relations": [
    {
      "relationType": "RELATION_TYPE",
      "source": { "name": "source_entity", "type": "ENTITY_TYPE" },
      "target": { "name": "target_entity", "type": "ENTITY_TYPE" },
      "confidence": 0.9,
      "evidence": "supporting text from input"
    }
  ],
  "metadata": {
    "textLength": 0,
    "language": "en",
    "analyzedAt": "ISO timestamp",
    "entityTypesFound": [],
    "relationTypesFound": []
  }
}
\`\`\`

### Requirements
1. Identify ALL entities mentioned, even peripheral ones
2. Map relations to the most specific type possible
3. Provide evidence for every relationship
4. Set confidence to 0 for highly uncertain cases
5. Output valid JSON only`;
}

/**
 * Generate a focused prompt for specific relation analysis
 */
export function generateFocusedAnalysisPrompt(
  text: string,
  targetRelations: RelationAnalysisType[],
  options?: {
    domain?: string;
    includeBidirectional?: boolean;
    minConfidence?: number;
  }
): string {
  const {
    domain = 'AI Prototype Builder',
    includeBidirectional = true,
    minConfidence = 0.7,
  } = options || {};

  const relationsInfo = targetRelations
    .filter(r => RELATION_ANALYSIS_DEFINITIONS[r])
    .map(r => {
      const def = RELATION_ANALYSIS_DEFINITIONS[r];
      let info = `**${r}**: ${def.description}`;
      info += `\n  - Sources: ${def.sourceTypes.join(', ')}`;
      info += `\n  - Targets: ${def.targetTypes.join(', ')}`;
      if (includeBidirectional && def.bidirectional) {
        info += `\n  - ⚡ Bidirectional`;
      }
      return info;
    })
    .join('\n\n');

  return `## Focused Entity Relation Analysis

### Text
${text}

### Domain
${domain}

### Target Relations
${relationsInfo}

### Parameters
- Include bidirectional relations: ${includeBidirectional}
- Minimum confidence threshold: ${minConfidence}

---

Analyze ONLY the specified relation types. For each relation found:

1. **Identify Source & Target**: Determine the entities involved
2. **Verify Type Compatibility**: Check if the relation is valid per definitions
3. **Extract Evidence**: Quote the supporting text
4. **Assign Confidence**: Score based on clarity (${minConfidence}+ required)

Output JSON:
\`\`\`json
{
  "relations": [
    {
      "relationType": "...",
      "source": { "name": "...", "type": "..." },
      "target": { "name": "...", "type": "..." },
      "confidence": 0.x,
      "evidence": "..."
    }
  ]
}
\`\`\``;
}

/**
 * Generate a prompt for validating existing entity relations
 */
export function generateRelationValidationPrompt(
  text: string,
  entities: AnalysisEntity[],
  existingRelations: AnalysisRelation[],
  options?: {
    strictMode?: boolean;
    suggestNew?: boolean;
  }
): string {
  const { strictMode = false, suggestNew = true } = options || {};

  const entitiesJson = JSON.stringify(entities, null, 2);
  const relationsJson = JSON.stringify(existingRelations, null, 2);

  return `## Entity Relation Validation

### Source Text
${text}

### Previously Identified Entities
\`\`\`json
${entitiesJson}
\`\`\`

### Previously Identified Relations
\`\`\`json
${relationsJson}
\`\`\`

### Options
- **Strict Mode**: ${strictMode ? 'Reject low-confidence relations' : 'Allow borderline relations'}
- **Suggest New**: ${suggestNew ? 'Propose missing entities and relations' : 'Only validate existing'}

---

## Validation Tasks

### 1. Validate Existing Relations
For each existing relation:
- Verify both source and target entities exist in text
- Confirm relation type matches the context
- Check evidence is still valid

### 2. Enhance Relations (if enabled)
- Find additional relations between existing entities
- Suggest missing relation types
- Identify hidden entities

### 3. Output Validation Results
\`\`\`json
{
  "validRelations": [...],
  "invalidRelations": [...],
  "enhancedRelations": [...],
  "newEntities": [...],
  "newRelations": [...]
}
\`\`\``;
}

/**
 * Get all relation analysis types as array
 */
export function getAllRelationTypes(): RelationAnalysisType[] {
  return Object.values(RelationAnalysisType);
}

/**
 * Get relation types by category
 */
export function getRelationsByCategory(
  category: 'structural' | 'functional' | 'data' | 'interaction' | 'state' | 'access' | 'business' | 'integration'
): RelationAnalysisType[] {
  const categoryMap: Record<string, RelationAnalysisType[]> = {
    structural: [
      RelationAnalysisType.CONTAINS,
      RelationAnalysisType.PART_OF,
      RelationAnalysisType.COMPOSED_OF,
      RelationAnalysisType.PARENT_OF,
      RelationAnalysisType.CHILD_OF,
    ],
    functional: [
      RelationAnalysisType.USES,
      RelationAnalysisType.CALLS,
      RelationAnalysisType.DEPENDS_ON,
      RelationAnalysisType.PROVIDES,
      RelationAnalysisType.REQUIRES,
    ],
    data: [
      RelationAnalysisType.STORES,
      RelationAnalysisType.READS,
      RelationAnalysisType.WRITES,
      RelationAnalysisType.VALIDATES,
      RelationAnalysisType.TRANSFORMS,
    ],
    interaction: [
      RelationAnalysisType.DISPLAYS,
      RelationAnalysisType.COLLECTS,
      RelationAnalysisType.SUBMITS,
      RelationAnalysisType.NAVIGATES,
      RelationAnalysisType.FILTERS,
      RelationAnalysisType.SORTS,
    ],
    state: [
      RelationAnalysisType.MANAGES,
      RelationAnalysisType.TRIGGERS,
      RelationAnalysisType.TRANSITIONS,
      RelationAnalysisType.UPDATES,
    ],
    access: [
      RelationAnalysisType.AUTHORIZES,
      RelationAnalysisType.AUTHENTICATES,
      RelationAnalysisType.RESTRICTS,
      RelationAnalysisType.ALLOWS,
    ],
    business: [
      RelationAnalysisType.VALIDATES_RULE,
      RelationAnalysisType.ENFORCES,
      RelationAnalysisType.CALCULATES,
      RelationAnalysisType.NOTIFIES,
    ],
    integration: [
      RelationAnalysisType.INTEGRATES_WITH,
      RelationAnalysisType.SYNC_WITH,
      RelationAnalysisType.LISTENS_TO,
      RelationAnalysisType.SENDS_TO,
    ],
  };
  return categoryMap[category] || [];
}

export default {
  AnalysisEntityType,
  RelationAnalysisType,
  RELATION_ANALYSIS_DEFINITIONS,
  generateRelationAnalysisPrompt,
  generateFocusedAnalysisPrompt,
  generateRelationValidationPrompt,
  getAllRelationTypes,
  getRelationsByCategory,
};
