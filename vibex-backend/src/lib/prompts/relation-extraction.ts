/**
 * Entity Relation Extraction Prompt Templates
 * 
 * This module contains prompt templates for extracting entities and their
 * relationships from natural language text.
 */

/**
 * Entity types for relation extraction
 */
export enum EntityType {
  PERSON = 'PERSON',
  ORGANIZATION = 'ORGANIZATION',
  LOCATION = 'LOCATION',
  DATE = 'DATE',
  TIME = 'TIME',
  MONEY = 'MONEY',
  PERCENTAGE = 'PERCENTAGE',
  PRODUCT = 'PRODUCT',
  EVENT = 'EVENT',
  CONCEPT = 'CONCEPT',
  DOCUMENT = 'DOCUMENT',
  ACTION = 'ACTION',
  STATUS = 'STATUS',
}

/**
 * Relation types with descriptions and examples
 */
export enum RelationType {
  // Person relations
  WORKS_FOR = 'WORKS_FOR',           // Person -> Organization
  EMPLOYEE_OF = 'EMPLOYEE_OF',       // Organization -> Person (inverse of WORKS_FOR)
  WORKS_AS = 'WORKS_AS',             // Person -> Job Title
  MEMBER_OF = 'MEMBER_OF',           // Person -> Organization/Group
  
  // Organization relations
  HEADQUARTERS_IN = 'HEADQUARTERS_IN', // Organization -> Location
  PARTNER_WITH = 'PARTNER_WITH',     // Organization <-> Organization
  ACQUIRED_BY = 'ACQUIRED_BY',       // Organization -> Organization
  SUBSIDIARY_OF = 'SUBSIDIARY_OF',   // Organization -> Organization
  
  // Location relations
  LOCATED_IN = 'LOCATED_IN',         // Entity -> Location
  ORIGIN_FROM = 'ORIGIN_FROM',       // Product/Entity -> Location
  
  // Temporal relations
  HAPPENED_ON = 'HAPPENED_ON',       // Event -> Date/Time
  STARTED_ON = 'STARTED_ON',         // Event/Action -> Date
  ENDED_ON = 'ENDED_ON',             // Event/Action -> Date
  DEADLINE_IS = 'DEADLINE_IS',       // Action -> Date/Time
  
  // Quantitative relations
  COST_IS = 'COST_IS',               // Product/Service -> Money
  WORTH_IS = 'WORTH_IS',             // Entity -> Money
  GROWTH_IS = 'GROWTH_IS',           // Entity -> Percentage
  HAS_PERCENTAGE = 'HAS_PERCENTAGE', // Entity -> Percentage
  
  // Action relations
  PERFORMED_BY = 'PERFORMED_BY',     // Action -> Person/Organization
  TARGETS = 'TARGETS',               // Action -> Entity
  DEPENDS_ON = 'DEPENDS_ON',          // Action/Project -> Action/Entity
  
  // Status relations
  HAS_STATUS = 'HAS_STATUS',         // Entity -> Status
  CAUSED_BY = 'CAUSED_BY',           // Event -> Cause
  RESULTED_IN = 'RESULTED_IN',        // Cause -> Effect
  
  // Document relations
  AUTHORED_BY = 'AUTHORED_BY',       // Document -> Person/Organization
  PUBLISHED_ON = 'PUBLISHED_ON',     // Document -> Date
  REFERENCES = 'REFERENCES',         // Document <-> Document
  
  // Conceptual relations
  IS_A = 'IS_A',                     // Entity -> Concept (hypernym)
  PART_OF = 'PART_OF',               // Entity -> Entity (meronym)
  SIMILAR_TO = 'SIMILAR_TO',         // Entity <-> Entity
  RELATED_TO = 'RELATED_TO',         // Entity <-> Entity (generic)
  CONTAINS = 'CONTAINS',             // Entity -> Entity
}

/**
 * Relation type metadata with descriptions and examples
 */
export const RELATION_DEFINITIONS: Record<RelationType, {
  description: string;
  domain: string;
  range: string;
  examples: string[];
  inverse?: RelationType;
}> = {
  [RelationType.WORKS_FOR]: {
    description: 'Employment relationship - person works for an organization',
    domain: 'PERSON',
    range: 'ORGANIZATION',
    examples: [
      'Elon Musk works for Tesla',
      'The CEO works for the board of directors',
    ],
    inverse: RelationType.EMPLOYEE_OF,
  },
  [RelationType.EMPLOYEE_OF]: {
    description: 'Employment relationship - organization has this person as employee',
    domain: 'ORGANIZATION',
    range: 'PERSON',
    examples: [
      'Tesla employs Elon Musk',
      'The company has 500 employees',
    ],
    inverse: RelationType.WORKS_FOR,
  },
  [RelationType.WORKS_AS]: {
    description: 'Job title or role of a person',
    domain: 'PERSON',
    range: 'CONCEPT',
    examples: [
      'John works as a software engineer',
      'She serves as the chairman',
    ],
  },
  [RelationType.MEMBER_OF]: {
    description: 'Membership in an organization or group',
    domain: 'PERSON',
    range: 'ORGANIZATION',
    examples: [
      'Alice is a member of the board',
      'He is member of the committee',
    ],
  },
  [RelationType.HEADQUARTERS_IN]: {
    description: 'Location of organization headquarters',
    domain: 'ORGANIZATION',
    range: 'LOCATION',
    examples: [
      'Apple headquarters is in Cupertino',
      'The company headquarters in Tokyo',
    ],
  },
  [RelationType.PARTNER_WITH]: {
    description: 'Business partnership between organizations',
    domain: 'ORGANIZATION',
    range: 'ORGANIZATION',
    examples: [
      'Microsoft partnered with OpenAI',
      'The company partners with Google Cloud',
    ],
    inverse: RelationType.PARTNER_WITH,
  },
  [RelationType.ACQUIRED_BY]: {
    description: 'Acquisition relationship - company acquired by another',
    domain: 'ORGANIZATION',
    range: 'ORGANIZATION',
    examples: [
      'Instagram was acquired by Facebook',
      'The startup acquired by Google',
    ],
  },
  [RelationType.SUBSIDIARY_OF]: {
    description: 'Subsidiary relationship - company is subsidiary of parent',
    domain: 'ORGANIZATION',
    range: 'ORGANIZATION',
    examples: [
      'YouTube is a subsidiary of Google',
      'The subsidiary of Amazon',
    ],
  },
  [RelationType.LOCATED_IN]: {
    description: 'Physical or abstract location of an entity',
    domain: 'ENTITY',
    range: 'LOCATION',
    examples: [
      'The office is located in San Francisco',
      'The conference in Beijing',
    ],
  },
  [RelationType.ORIGIN_FROM]: {
    description: 'Origin or source location of a product or entity',
    domain: 'PRODUCT',
    range: 'LOCATION',
    examples: [
      'This wine originates from France',
      'The product made in China',
    ],
  },
  [RelationType.HAPPENED_ON]: {
    description: 'Date/time when an event occurred',
    domain: 'EVENT',
    range: 'DATE',
    examples: [
      'The meeting happened on Monday',
      'The event occurred on January 15th',
    ],
  },
  [RelationType.STARTED_ON]: {
    description: 'Start date of an event or action',
    domain: 'EVENT',
    range: 'DATE',
    examples: [
      'The project started on March 1st',
      'The campaign began on Monday',
    ],
  },
  [RelationType.ENDED_ON]: {
    description: 'End date of an event or action',
    domain: 'EVENT',
    range: 'DATE',
    examples: [
      'The program ended on December 31st',
      'The trial concluded on Friday',
    ],
  },
  [RelationType.DEADLINE_IS]: {
    description: 'Deadline for an action or task',
    domain: 'ACTION',
    range: 'DATE',
    examples: [
      'The deadline is next Friday',
      'Submit by December 15th',
    ],
  },
  [RelationType.COST_IS]: {
    description: 'Monetary cost of a product or service',
    domain: 'PRODUCT',
    range: 'MONEY',
    examples: [
      'The iPhone costs $999',
      'Service fee is $50 per month',
    ],
  },
  [RelationType.WORTH_IS]: {
    description: 'Financial value or market cap of an entity',
    domain: 'ORGANIZATION',
    range: 'MONEY',
    examples: [
      'Tesla worth over $800 billion',
      'The company valued at $2 million',
    ],
  },
  [RelationType.GROWTH_IS]: {
    description: 'Growth rate or percentage change',
    domain: 'ENTITY',
    range: 'PERCENTAGE',
    examples: [
      'Revenue grew by 25%',
      'User base growth is 15%',
    ],
  },
  [RelationType.HAS_PERCENTAGE]: {
    description: 'Percentage or proportion associated with an entity',
    domain: 'ENTITY',
    range: 'PERCENTAGE',
    examples: [
      'The completion is at 75%',
      'Market share is 30%',
    ],
  },
  [RelationType.PERFORMED_BY]: {
    description: 'Action performed by a person or organization',
    domain: 'ACTION',
    range: 'PERSON',
    examples: [
      'The analysis performed by the team',
      'Code written by developers',
    ],
  },
  [RelationType.TARGETS]: {
    description: 'Target entity of an action',
    domain: 'ACTION',
    range: 'ENTITY',
    examples: [
      'The attack targets government systems',
      'The tool targets enterprise users',
    ],
  },
  [RelationType.DEPENDS_ON]: {
    description: 'Dependency relationship between entities',
    domain: 'ACTION',
    range: 'ENTITY',
    examples: [
      'The task depends on approval',
      'Project depends on funding',
    ],
  },
  [RelationType.HAS_STATUS]: {
    description: 'Current status of an entity',
    domain: 'ENTITY',
    range: 'STATUS',
    examples: [
      'The project is in progress',
      'Status is pending approval',
    ],
  },
  [RelationType.CAUSED_BY]: {
    description: 'Causal relationship - event caused by something',
    domain: 'EVENT',
    range: 'EVENT',
    examples: [
      'The delay caused by technical issues',
      'Failure caused by timeout',
    ],
  },
  [RelationType.RESULTED_IN]: {
    description: 'Result relationship - cause leads to effect',
    domain: 'EVENT',
    range: 'EVENT',
    examples: [
      'The meeting resulted in a decision',
      'The update resulted in better performance',
    ],
  },
  [RelationType.AUTHORED_BY]: {
    description: 'Author of a document or content',
    domain: 'DOCUMENT',
    range: 'PERSON',
    examples: [
      'The report authored by Dr. Smith',
      'Book written by John Doe',
    ],
  },
  [RelationType.PUBLISHED_ON]: {
    description: 'Publication date of a document',
    domain: 'DOCUMENT',
    range: 'DATE',
    examples: [
      'Paper published on Nature',
      'Article published on 2024-01-15',
    ],
  },
  [RelationType.REFERENCES]: {
    description: 'Reference relationship between documents',
    domain: 'DOCUMENT',
    range: 'DOCUMENT',
    examples: [
      'The paper references prior work',
      'Cites the research by Miller',
    ],
  },
  [RelationType.IS_A]: {
    description: 'Hypernym relationship - entity is a type of concept',
    domain: 'ENTITY',
    range: 'CONCEPT',
    examples: [
      'Tesla is a car company',
      'Python is a programming language',
    ],
  },
  [RelationType.PART_OF]: {
    description: 'Meronym relationship - entity is part of a larger whole',
    domain: 'ENTITY',
    range: 'ENTITY',
    examples: [
      'The handle is part of the door',
      'Engine is part of the car',
    ],
  },
  [RelationType.SIMILAR_TO]: {
    description: 'Similarity relationship between entities',
    domain: 'ENTITY',
    range: 'ENTITY',
    examples: [
      'Similar to ChatGPT',
      'Like Stripe but for Asia',
    ],
  },
  [RelationType.RELATED_TO]: {
    description: 'Generic relatedness between entities',
    domain: 'ENTITY',
    range: 'ENTITY',
    examples: [
      'AI related to machine learning',
      'Bitcoin related to cryptocurrency',
    ],
  },
  [RelationType.CONTAINS]: {
    description: 'Container relationship - entity contains another',
    domain: 'ENTITY',
    range: 'ENTITY',
    examples: [
      'The report contains charts',
      'Package contains documentation',
    ],
  },
};

/**
 * Relation Extraction Input Schema
 */
export interface RelationExtractionInput {
  /** Text content to extract relations from */
  text: string;
  /** Optional: specific relation types to extract (if empty, extract all) */
  relationTypes?: RelationType[];
  /** Optional: specific entity types to identify */
  entityTypes?: EntityType[];
  /** Optional: context or domain for extraction */
  domain?: string;
  /** Optional: language code */
  language?: string;
}

/**
 * Extracted entity representation
 */
export interface ExtractedEntity {
  /** Entity text as it appears in the source */
  text: string;
  /** Entity type */
  type: EntityType;
  /** Start position in source text */
  start: number;
  /** End position in source text */
  end: number;
  /** Confidence score (0-1) */
  confidence: number;
  /** Normalized value (for dates, money, etc.) */
  normalizedValue?: string;
}

/**
 * Extracted relation representation
 */
export interface ExtractedRelation {
  /** Relation type */
  relationType: RelationType;
  /** Source entity */
  source: ExtractedEntity;
  /** Target entity */
  target: ExtractedEntity;
  /** Confidence score (0-1) */
  confidence: number;
  /** Optional: contextual evidence */
  evidence?: string;
}

/**
 * Relation extraction output
 */
export interface RelationExtractionOutput {
  /** Extracted entities */
  entities: ExtractedEntity[];
  /** Extracted relations */
  relations: ExtractedRelation[];
  /** Metadata about extraction */
  metadata: {
    textLength: number;
    language: string;
    extractedAt: string;
    relationTypesFound: RelationType[];
  };
}

/**
 * Generate the main relation extraction prompt
 */
export function generateRelationExtractionPrompt(input: RelationExtractionInput): string {
  const {
    text,
    relationTypes,
    entityTypes,
    domain = 'general',
    language = 'en',
  } = input;

  // Filter relation definitions if specific types are requested
  const relationsToExtract = relationTypes?.length 
    ? relationTypes 
    : Object.values(RelationType);
  
  const relationsText = relationsToExtract
    .filter(r => RELATION_DEFINITIONS[r])
    .map(r => {
      const def = RELATION_DEFINITIONS[r];
      return `### ${r}
- **Description**: ${def.description}
- **Domain**: ${def.domain}
- **Range**: ${def.range}
- **Examples**: ${def.examples.join('; ')}${def.inverse ? `\n- **Inverse**: ${def.inverse}` : ''}`;
    })
    .join('\n\n');

  return `## Entity Relation Extraction

### Task
Extract entities and their relationships from the given text.

### Input Text
${text}

### Context
- **Domain**: ${domain}
- **Language**: ${language}

### Entity Types to Identify
${entityTypes?.length ? entityTypes.join(', ') : Object.values(EntityType).join(', ')}

### Relation Types to Extract
${relationsText}

---

## Extraction Guidelines

### Step 1: Entity Extraction
Identify all relevant entities in the text:
1. **Named Entities**: People, organizations, locations, dates, etc.
2. **Implicit Entities**: Concepts, actions, statuses mentioned implicitly
3. **Normalize Values**: Convert dates to standard format, money to numbers, etc.

### Step 2: Relation Extraction
For each pair of entities, determine if they have a relationship:
1. **Context Awareness**: Understand the context to correctly identify relations
2. **Temporal Relations**: Handle past, present, future temporal aspects
3. **Nested Relations**: Handle relations within complex sentences
4. **Bidirectional**: Some relations are directional, others are symmetric

### Step 3: Confidence Scoring
Assign confidence scores based on:
- **Explicit Mentions**: Direct mentions get higher confidence (0.9-1.0)
- **Implicit Mentions**: Inferred relations get lower confidence (0.6-0.8)
- **Ambiguous Cases**: Unclear relations get low confidence (<0.6)

---

## Output Format

Return a JSON object with the following structure:

\`\`\`json
{
  "entities": [
    {
      "text": "entity text",
      "type": "ENTITY_TYPE",
      "start": 0,
      "end": 10,
      "confidence": 0.95,
      "normalizedValue": "optional normalized form"
    }
  ],
  "relations": [
    {
      "relationType": "RELATION_TYPE",
      "source": { "text": "source entity", "type": "ENTITY_TYPE" },
      "target": { "text": "target entity", "type": "ENTITY_TYPE" },
      "confidence": 0.9,
      "evidence": "supporting text evidence"
    }
  ]
}
\`\`\`

### Requirements
1. Include ALL entities found, even if they don't participate in relations
2. Each entity must have unique start/end positions (no overlapping entities)
3. Provide evidence/justification for each relation
4. Use standardized relation and entity type names
5. Set confidence to 0 if uncertain (avoid false positives)`;
}

/**
 * Generate a focused prompt for specific relation types
 */
export function generateFocusedRelationPrompt(
  text: string,
  targetRelations: RelationType[],
  options?: {
    domain?: string;
    includeInverse?: boolean;
    minConfidence?: number;
  }
): string {
  const { domain = 'general', includeInverse = true, minConfidence = 0.7 } = options || {};

  const relationsInfo = targetRelations
    .filter(r => RELATION_DEFINITIONS[r])
    .map(r => {
      const def = RELATION_DEFINITIONS[r];
      let info = `**${r}**: ${def.description} (${def.domain} → ${def.range})`;
      if (includeInverse && def.inverse) {
        info += `\n  - Inverse: ${def.inverse}`;
      }
      return info;
    })
    .join('\n');

  return `## Focused Relation Extraction

### Text
${text}

### Target Domain
${domain}

### Target Relations
${relationsInfo}

### Parameters
- Include inverse relations: ${includeInverse}
- Minimum confidence threshold: ${minConfidence}

---

Extract ONLY the following relation types. Ignore other potential relations.

For each relation found:
1. Identify the source and target entities
2. Verify the relation matches the definition
3. Extract supporting evidence from the text
4. Assign confidence score (${minConfidence}+ required)

Output in JSON format:
\`\`\`json
{
  "relations": [
    {
      "relationType": "...",
      "source": { "text": "...", "type": "..." },
      "target": { "text": "...", "type": "..." },
      "confidence": 0.x,
      "evidence": "..."
    }
  ]
}
\`\`\``;
}

/**
 * Generate a prompt for validating/enhancing extracted relations
 */
export function generateRelationValidationPrompt(
  text: string,
  entities: ExtractedEntity[],
  existingRelations: ExtractedRelation[],
  options?: {
    strictMode?: boolean;
    allowNewEntities?: boolean;
  }
): string {
  const { strictMode = false, allowNewEntities = false } = options || {};

  const entitiesJson = JSON.stringify(entities, null, 2);
  const relationsJson = JSON.stringify(existingRelations, null, 2);

  return `## Relation Validation & Enhancement

### Source Text
${text}

### Previously Extracted Entities
\`\`\`json
${entitiesJson}
\`\`\`

### Previously Extracted Relations
\`\`\`json
${relationsJson}
\`\`\`

### Validation Options
- **Strict Mode**: ${strictMode ? 'Reject low-confidence relations' : 'Allow borderline relations'}
- **Allow New Entities**: ${allowNewEntities ? 'Add missing entities' : 'Only validate existing'}

---

## Task

1. **Validate** each existing relation:
   - Check if entities still exist in text
   - Verify relation type is correct
   - Confirm evidence is still valid
   
2. **Enhance** (if enabled):
   - Add missing entities found in text
   - Discover additional relations between entities
   - Fill gaps in the relation graph

3. **Output** validated/enhanced results:
\`\`\`json
{
  "validRelations": [...],
  "invalidRelations": [...],
  "newEntities": [...],
  "newRelations": [...]
}
\`\`\``;
}

/**
 * Get all relation types as a flat array
 */
export function getAllRelationTypes(): RelationType[] {
  return Object.values(RelationType);
}

/**
 * Get relation type by category
 */
export function getRelationsByCategory(category: 'person' | 'organization' | 'location' | 'temporal' | 'quantitative' | 'action' | 'status' | 'document' | 'conceptual'): RelationType[] {
  const categoryMap: Record<string, RelationType[]> = {
    person: [RelationType.WORKS_FOR, RelationType.WORKS_AS, RelationType.MEMBER_OF, RelationType.PERFORMED_BY],
    organization: [RelationType.HEADQUARTERS_IN, RelationType.PARTNER_WITH, RelationType.ACQUIRED_BY, RelationType.SUBSIDIARY_OF, RelationType.WORTH_IS],
    location: [RelationType.LOCATED_IN, RelationType.ORIGIN_FROM],
    temporal: [RelationType.HAPPENED_ON, RelationType.STARTED_ON, RelationType.ENDED_ON, RelationType.DEADLINE_IS, RelationType.PUBLISHED_ON],
    quantitative: [RelationType.COST_IS, RelationType.WORTH_IS, RelationType.GROWTH_IS, RelationType.HAS_PERCENTAGE],
    action: [RelationType.PERFORMED_BY, RelationType.TARGETS, RelationType.DEPENDS_ON],
    status: [RelationType.HAS_STATUS, RelationType.CAUSED_BY, RelationType.RESULTED_IN],
    document: [RelationType.AUTHORED_BY, RelationType.PUBLISHED_ON, RelationType.REFERENCES],
    conceptual: [RelationType.IS_A, RelationType.PART_OF, RelationType.SIMILAR_TO, RelationType.RELATED_TO, RelationType.CONTAINS],
  };
  return categoryMap[category] || [];
}

export default {
  EntityType,
  RelationType,
  RELATION_DEFINITIONS,
  generateRelationExtractionPrompt,
  generateFocusedRelationPrompt,
  generateRelationValidationPrompt,
  getAllRelationTypes,
  getRelationsByCategory,
};
