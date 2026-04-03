/**
 * Domain Entity Extraction Prompt Templates
 * 
 * This module contains prompt templates specifically designed for extracting
 * domain entities and relationships from user requirements in the VibeX
 * AI Prototype Builder application.
 */
// @ts-nocheck


/**
 * Domain Entity Types
 * 
 * These are the core entity types supported in the VibeX domain model.
 */
export enum DomainEntityType {
  PERSON = 'person',
  PLACE = 'place',
  OBJECT = 'object',
  CONCEPT = 'concept',
  EVENT = 'event',
  ACTION = 'action',
  ORGANIZATION = 'organization',
  DOCUMENT = 'document',
  DATA = 'data',
  FEATURE = 'feature',
  PAGE = 'page',
  COMPONENT = 'component',
  SERVICE = 'service',
  USER = 'user',
  ROLE = 'role',
  PERMISSION = 'permission',
  WORKFLOW = 'workflow',
  STATE = 'state',
}

/**
 * Relation Types for Domain Entities
 * 
 * These define how entities relate to each other in the domain model.
 */
export enum DomainRelationType {
  OWNS = 'owns',
  USES = 'uses',
  CONTAINS = 'contains',
  DEPENDS_ON = 'depends_on',
  REFERENCES = 'references',
  CREATES = 'creates',
  MODIFIES = 'modifies',
  DELETES = 'deletes',
  VIEWS = 'views',
  EDITS = 'edits',
  SHARES = 'shares',
  AUTHENTICATES = 'authenticates',
  AUTHORIZES = 'authorizes',
  TRIGGERS = 'triggers',
  TRANSITIONS = 'transitions',
  VALIDATES = 'validates',
  TRANSFORMS = 'transforms',
  STORES = 'stores',
  RETRIEVES = 'retrieves',
  SENDS = 'sends',
  RECEIVES = 'receives',
  HAS_STATE = 'has_state',
  HAS_PERMISSION = 'has_permission',
  HAS_ROLE = 'has_role',
  BELONGS_TO = 'belongs_to',
  PART_OF = 'part_of',
  SIMILAR_TO = 'similar_to',
  RELATED_TO = 'related_to',
}

/**
 * Domain Entity Definition
 */
export interface DomainEntityDefinition {
  id?: string;
  name: string;
  type: DomainEntityType;
  description: string;
  properties: EntityProperty[];
  requirements?: string[];
}

/**
 * Entity Property
 */
export interface EntityProperty {
  name: string;
  type: string;
  required: boolean;
  description: string;
  defaultValue?: string;
  options?: string[];
}

/**
 * Domain Relation Definition
 */
export interface DomainRelationDefinition {
  id?: string;
  fromEntity: string;
  toEntity: string;
  relationType: DomainRelationType;
  description: string;
  conditions?: string;
}

/**
 * Domain Model Output
 */
export interface DomainModelOutput {
  entities: DomainEntityDefinition[];
  relations: DomainRelationDefinition[];
  metadata: {
    sourceRequirement: string;
    extractedAt: string;
    confidence: number;
    missingInfo: string[];
  };
}

/**
 * Domain Entity Extraction Input
 */
export interface DomainEntityExtractionInput {
  requirementText: string;
  domain?: string;
  focusEntityTypes?: DomainEntityType[];
  focusRelationTypes?: DomainRelationType[];
}

/**
 * Generate the main domain entity extraction prompt
 */
export function generateDomainEntityExtractionPrompt(
  input: DomainEntityExtractionInput
): string {
  const { requirementText, domain = 'general application', focusEntityTypes, focusRelationTypes } = input;

  const entityTypes = focusEntityTypes?.length 
    ? focusEntityTypes 
    : Object.values(DomainEntityType);
    
  const relationTypes = focusRelationTypes?.length
    ? focusRelationTypes
    : Object.values(DomainRelationType);

  const entityTypesText = entityTypes.map(t => `- **${t}**: ${getEntityTypeDescription(t)}`).join('\n');
  const relationTypesText = relationTypes.map(r => `- **${r}**: ${getRelationTypeDescription(r)}`).join('\n');

  return `## Domain Entity Extraction Task

### Context
You are analyzing user requirements for a ${domain} application. Your task is to extract domain entities and their relationships from the requirement text below.

### Input Requirements
${requirementText}

---

## Entity Types to Identify

Extract entities that match these types:
${entityTypesText}

### Entity Type Guidelines:
- **person**: Human users, roles, or actors in the system
- **place**: Physical or logical locations
- **object**: Tangible or intangible items
- **concept**: Abstract ideas, categories, or classifications
- **event**: Things that happen, either system events or business events
- **action**: Operations, functions, or behaviors
- **organization**: Companies, teams, departments
- **document**: Files, records, reports, templates
- **data**: Data models, databases, data structures
- **feature**: System capabilities or functionalities
- **page**: UI pages or screens
- **component**: UI components or modules
- **service**: Backend services, APIs, integrations
- **user**: End users of the system
- **role**: User roles or responsibilities
- **permission**: Access rights or privileges
- **workflow**: Business processes or workflows
- **state**: System states or data states

---

## Relation Types to Extract

Identify relationships between entities:
${relationTypesText}

### Relation Type Guidelines:
- **owns**: Entity possesses or controls another entity
- **uses**: Entity utilizes or depends on another entity
- **contains**: Entity includes or comprises another entity
- **depends_on**: Entity requires another entity to function
- **references**: Entity points to or mentions another entity
- **creates**: Entity generates or produces another entity
- **modifies**: Entity changes or updates another entity
- **deletes**: Entity removes another entity
- **views**: Entity observes another entity
- **edits**: Entity changes another entity
- **shares**: Entity makes another entity available to others
- **authenticates**: Entity verifies identity of another
- **authorizes**: Entity grants permission to another
- **triggers**: Entity initiates another entity or process
- **transitions**: Entity moves from one state to another
- **validates**: Entity checks correctness of another
- **transforms**: Entity converts or changes another
- **stores**: Entity saves another entity
- **retrieves**: Entity fetches another entity
- **sends**: Entity transmits another entity
- **receives**: Entity accepts another entity
- **has_state**: Entity possesses a specific state
- **has_permission**: Entity has specific access rights
- **has_role**: Entity has a specific role
- **belongs_to**: Entity is part of another entity
- **part_of**: Entity is part of another
- **similar_to**: Entity resembles another
- **related_to**: Entity is connected to another

---

## Extraction Instructions

### Step 1: Identify Core Entities
1. Extract all nouns and noun phrases that represent domain concepts
2. Group similar entities and eliminate duplicates
3. Assign appropriate entity types from the list above
4. Provide clear, descriptive names for each entity

### Step 2: Define Entity Properties
For each entity, identify relevant properties:
- What attributes describe this entity?
- What are the data types of these attributes?
- Which attributes are required vs optional?
- Are there any default values or constraints?

### Step 3: Identify Relationships
1. Find verbs that connect entities
2. Classify each relationship using the relation types
3. Note any conditions or constraints on relationships
4. Identify bidirectional relationships

### Step 4: Flag Ambiguities
- Note any unclear requirements
- Identify entities that might need clarification
- List missing information that would help refine the model

---

## Output Format

Return a JSON object with this structure:

\`\`\`json
{
  "entities": [
    {
      "name": "EntityName",
      "type": "entity_type",
      "description": "Clear description of what this entity represents",
      "properties": [
        {
          "name": "propertyName",
          "type": "string|number|boolean|date|array|object",
          "required": true,
          "description": "What this property represents",
          "defaultValue": "optional default",
          "options": ["option1", "option2"]
        }
      ],
      "requirements": ["specific requirement sentences mentioning this entity"]
    }
  ],
  "relations": [
    {
      "fromEntity": "SourceEntityName",
      "toEntity": "TargetEntityName",
      "relationType": "relation_type",
      "description": "How these entities relate",
      "conditions": "optional conditions or constraints"
    }
  ],
  "metadata": {
    "sourceRequirement": "[first 100 chars of input...]",
    "extractedAt": "ISO timestamp",
    "confidence": 0.85,
    "missingInfo": ["list of unclear points requiring clarification"]
  }
}
\`\`\`

### Requirements:
1. Each entity must have a unique, descriptive name (PascalCase)
2. Properties should cover all relevant attributes
3. Relations should be specific and meaningful
4. Confidence score should reflect completeness and clarity (0.0-1.0)
5. missingInfo should list questions that need clarification from the user`;
}

/**
 * Get description for entity type
 */
function getEntityTypeDescription(type: DomainEntityType): string {
  const descriptions: Record<DomainEntityType, string> = {
    [DomainEntityType.PERSON]: 'Human users, roles, or actors',
    [DomainEntityType.PLACE]: 'Physical or logical locations',
    [DomainEntityType.OBJECT]: 'Tangible or intangible items',
    [DomainEntityType.CONCEPT]: 'Abstract ideas or classifications',
    [DomainEntityType.EVENT]: 'Things that happen',
    [DomainEntityType.ACTION]: 'Operations or behaviors',
    [DomainEntityType.ORGANIZATION]: 'Companies or teams',
    [DomainEntityType.DOCUMENT]: 'Files or records',
    [DomainEntityType.DATA]: 'Data models or structures',
    [DomainEntityType.FEATURE]: 'System capabilities',
    [DomainEntityType.PAGE]: 'UI screens',
    [DomainEntityType.COMPONENT]: 'UI components',
    [DomainEntityType.SERVICE]: 'Backend services',
    [DomainEntityType.USER]: 'End users',
    [DomainEntityType.ROLE]: 'User responsibilities',
    [DomainEntityType.PERMISSION]: 'Access rights',
    [DomainEntityType.WORKFLOW]: 'Business processes',
    [DomainEntityType.STATE]: 'System states',
  };
  return descriptions[type] || 'Generic entity';
}

/**
 * Get description for relation type
 */
function getRelationTypeDescription(type: DomainRelationType): string {
  const descriptions: Record<DomainRelationType, string> = {
    [DomainRelationType.OWNS]: 'Possesses or controls',
    [DomainRelationType.USES]: 'Utilizes or depends on',
    [DomainRelationType.CONTAINS]: 'Includes or comprises',
    [DomainRelationType.DEPENDS_ON]: 'Requires to function',
    [DomainRelationType.REFERENCES]: 'Points to or mentions',
    [DomainRelationType.CREATES]: 'Generates or produces',
    [DomainRelationType.MODIFIES]: 'Changes or updates',
    [DomainRelationType.DELETES]: 'Removes',
    [DomainRelationType.VIEWS]: 'Observes',
    [DomainRelationType.EDITS]: 'Changes',
    [DomainRelationType.SHARES]: 'Makes available',
    [DomainRelationType.AUTHENTICATES]: 'Verifies identity',
    [DomainRelationType.AUTHORIZES]: 'Grants permission',
    [DomainRelationType.TRIGGERS]: 'Initiates',
    [DomainRelationType.TRANSITIONS]: 'Moves between states',
    [DomainRelationType.VALIDATES]: 'Checks correctness',
    [DomainRelationType.TRANSFORMS]: 'Converts or changes',
    [DomainRelationType.STORES]: 'Saves data',
    [DomainRelationType.RETRIEVES]: 'Fetches data',
    [DomainRelationType.SENDS]: 'Transmits data',
    [DomainRelationType.RECEIVES]: 'Accepts data',
    [DomainRelationType.HAS_STATE]: 'Possesses state',
    [DomainRelationType.HAS_PERMISSION]: 'Has access rights',
    [DomainRelationType.HAS_ROLE]: 'Has role',
    [DomainRelationType.BELONGS_TO]: 'Is part of',
    [DomainRelationType.PART_OF]: 'Is part of',
    [DomainRelationType.SIMILAR_TO]: 'Resembles',
    [DomainRelationType.RELATED_TO]: 'Is connected to',
  };
  return descriptions[type] || 'Generic relationship';
}

/**
 * Generate a validation prompt for extracted domain model
 */
export function generateDomainModelValidationPrompt(
  extractedModel: DomainModelOutput,
  originalRequirements: string
): string {
  const modelJson = JSON.stringify(extractedModel, null, 2);

  return `## Domain Model Validation Task

### Original Requirements
${originalRequirements}

### Extracted Domain Model
\`\`\`json
${modelJson}
\`\`\`

---

## Validation Checklist

Please validate the extracted model against these criteria:

### 1. Completeness
- [ ] Are all major entities from requirements captured?
- [ ] Are all key relationships identified?
- [ ] Are entity properties comprehensive?

### 2. Correctness
- [ ] Are entity types appropriate?
- [ ] Are relation types accurate?
- [ ] Are property types correct?

### 3. Consistency
- [ ] Are entity names consistent (PascalCase)?
- [ ] Are relation directions correct?
- [ ] Are there any circular dependencies?

### 4. Clarity
- [ ] Are descriptions clear and unambiguous?
- [ ] Are property descriptions informative?
- [ ] Are relation descriptions meaningful?

---

## Output Format

Return validation results:
\`\`\`json
{
  "isValid": true,
  "issues": [
    {
      "severity": "error|warning|info",
      "type": "completeness|correctness|consistency|clarity",
      "description": "Issue description",
      "suggestion": "How to fix"
    }
  ],
  "suggestions": ["Additional improvements"],
  "confidence": 0.9
}
\`\`\``;
}

/**
 * Generate a clarification prompt for ambiguous entities
 */
export function generateClarificationPrompt(
  ambiguousEntities: { name: string; issues: string[] }[]
): string {
  const entitiesText = ambiguousEntities
    .map(e => `- **${e.name}**: ${e.issues.join('; ')}`)
    .join('\n');

  return `## Clarification Needed

The following entities need more information:

${entitiesText}

---

Please clarify:
1. What is the exact purpose of each entity?
2. What are the key attributes?
3. How does it relate to other entities?

Provide your clarifications and I will update the domain model accordingly.`;
}
