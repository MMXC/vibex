/**
 * General Entity Extraction Prompt Templates
 * 
 * This module contains prompt templates for extracting named entities
 * and semantic entities from natural language text. Unlike domain-
 * entity-extraction.ts which focuses on domain-specific models, this
 * module provides general-purpose entity extraction capabilities.
 */

import { randomUUID } from 'crypto';

// ============================================
// Entity Types
// ============================================

/**
 * Standard entity types for NER (Named Entity Recognition)
 */
export enum EntityType {
  // Person entities
  PERSON = 'PERSON',
  FIRST_NAME = 'FIRST_NAME',
  LAST_NAME = 'LAST_NAME',
  FULL_NAME = 'FULL_NAME',
  
  // Organization entities
  ORGANIZATION = 'ORGANIZATION',
  COMPANY = 'COMPANY',
  DEPARTMENT = 'DEPARTMENT',
  TEAM = 'TEAM',
  INSTITUTION = 'INSTITUTION',
  
  // Location entities
  LOCATION = 'LOCATION',
  CITY = 'CITY',
  STATE = 'STATE',
  COUNTRY = 'COUNTRY',
  ADDRESS = 'ADDRESS',
  BUILDING = 'BUILDING',
  CONTINENT = 'CONTINENT',
  
  // Temporal entities
  DATE = 'DATE',
  TIME = 'TIME',
  DATETIME = 'DATETIME',
  DURATION = 'DURATION',
  PERIOD = 'PERIOD',
  
  // Numeric entities
  NUMBER = 'NUMBER',
  MONEY = 'MONEY',
  PERCENTAGE = 'PERCENTAGE',
  QUANTITY = 'QUANTITY',
  RANGE = 'RANGE',
  
  // Communication entities
  EMAIL = 'EMAIL',
  PHONE = 'PHONE',
  URL = 'URL',
  SOCIAL_MEDIA = 'SOCIAL_MEDIA',
  
  // Document entities
  DOCUMENT = 'DOCUMENT',
  TITLE = 'TITLE',
  BOOK = 'BOOK',
  ARTICLE = 'ARTICLE',
  LAW = 'LAW',
  CONTRACT = 'CONTRACT',
  
  // Product entities
  PRODUCT = 'PRODUCT',
  SERVICE = 'SERVICE',
  SOFTWARE = 'SOFTWARE',
  BRAND = 'BRAND',
  
  // Event entities
  EVENT = 'EVENT',
  MEETING = 'MEETING',
  CONFERENCE = 'CONFERENCE',
  HOLIDAY = 'HOLIDAY',
  WAR = 'WAR',
  DISASTER = 'DISASTER',
  
  // Medical/Scientific entities
  DISEASE = 'DISEASE',
  DRUG = 'DRUG',
  SYMPTOM = 'SYMPTOM',
  TREATMENT = 'TREATMENT',
  GENE = 'GENE',
  PROTEIN = 'PROTEIN',
  
  // Technology entities
  PROGRAMMING_LANGUAGE = 'PROGRAMMING_LANGUAGE',
  FRAMEWORK = 'FRAMEWORK',
  API = 'API',
  DATABASE = 'DATABASE',
  DEVICE = 'DEVICE',
  
  // Abstract entities
  CONCEPT = 'CONCEPT',
  IDEA = 'IDEA',
  THEORY = 'THEORY',
  SKILL = 'SKILL',
  LANGUAGE = 'LANGUAGE',
  
  // Generic
  UNKNOWN = 'UNKNOWN',
}

/**
 * Entity type categories for grouping
 */
export const ENTITY_TYPE_CATEGORIES = {
  PERSON: [
    EntityType.PERSON,
    EntityType.FIRST_NAME,
    EntityType.LAST_NAME,
    EntityType.FULL_NAME,
  ],
  ORGANIZATION: [
    EntityType.ORGANIZATION,
    EntityType.COMPANY,
    EntityType.DEPARTMENT,
    EntityType.TEAM,
    EntityType.INSTITUTION,
  ],
  LOCATION: [
    EntityType.LOCATION,
    EntityType.CITY,
    EntityType.STATE,
    EntityType.COUNTRY,
    EntityType.ADDRESS,
    EntityType.BUILDING,
    EntityType.CONTINENT,
  ],
  TEMPORAL: [
    EntityType.DATE,
    EntityType.TIME,
    EntityType.DATETIME,
    EntityType.DURATION,
    EntityType.PERIOD,
  ],
  NUMERIC: [
    EntityType.NUMBER,
    EntityType.MONEY,
    EntityType.PERCENTAGE,
    EntityType.QUANTITY,
    EntityType.RANGE,
  ],
  COMMUNICATION: [
    EntityType.EMAIL,
    EntityType.PHONE,
    EntityType.URL,
    EntityType.SOCIAL_MEDIA,
  ],
  DOCUMENT: [
    EntityType.DOCUMENT,
    EntityType.TITLE,
    EntityType.BOOK,
    EntityType.ARTICLE,
    EntityType.LAW,
    EntityType.CONTRACT,
  ],
  PRODUCT: [
    EntityType.PRODUCT,
    EntityType.SERVICE,
    EntityType.SOFTWARE,
    EntityType.BRAND,
  ],
  EVENT: [
    EntityType.EVENT,
    EntityType.MEETING,
    EntityType.CONFERENCE,
    EntityType.HOLIDAY,
    EntityType.WAR,
    EntityType.DISASTER,
  ],
  MEDICAL: [
    EntityType.DISEASE,
    EntityType.DRUG,
    EntityType.SYMPTOM,
    EntityType.TREATMENT,
    EntityType.GENE,
    EntityType.PROTEIN,
  ],
  TECHNOLOGY: [
    EntityType.PROGRAMMING_LANGUAGE,
    EntityType.FRAMEWORK,
    EntityType.API,
    EntityType.DATABASE,
    EntityType.DEVICE,
  ],
  ABSTRACT: [
    EntityType.CONCEPT,
    EntityType.IDEA,
    EntityType.THEORY,
    EntityType.SKILL,
    EntityType.LANGUAGE,
  ],
} as const;

// ============================================
// Interfaces
// ============================================

/**
 * Entity extraction input parameters
 */
export interface EntityExtractionInput {
  /** Text content to extract entities from */
  text: string;
  /** Optional: specific entity types to extract (if empty, extract all) */
  entityTypes?: EntityType[];
  /** Optional: extraction mode */
  mode?: 'standard' | 'strict' | 'relaxed';
  /** Optional: minimum confidence threshold (0-1) */
  minConfidence?: number;
  /** Optional: enable nested entities */
  allowNested?: boolean;
  /** Optional: enable overlapping entities */
  allowOverlapping?: boolean;
  /** Optional: context or domain for extraction */
  context?: string;
  /** Optional: language code */
  language?: string;
  /** Optional: extract normalized values */
  normalizeValues?: boolean;
}

/**
 * Represents a single extracted entity
 */
export interface ExtractedEntity {
  /** Unique identifier for this entity */
  id: string;
  /** Entity text as it appears in the source */
  text: string;
  /** Entity type */
  type: EntityType;
  /** Start position in source text (character index) */
  start: number;
  /** End position in source text (character index) */
  end: number;
  /** Confidence score (0-1) */
  confidence: number;
  /** Normalized value (for dates, numbers, etc.) */
  normalizedValue?: string;
  /** Optional: additional metadata */
  metadata?: Record<string, unknown>;
  /** Optional: nested entities */
  nestedEntities?: ExtractedEntity[];
}

/**
 * Entity extraction output
 */
export interface EntityExtractionOutput {
  /** Extracted entities */
  entities: ExtractedEntity[];
  /** Statistics about extraction */
  statistics: {
    totalEntities: number;
    entitiesByType: Record<EntityType, number>;
    averageConfidence: number;
    processingTimeMs?: number;
  };
  /** Metadata about extraction */
  metadata: {
    textLength: number;
    language: string;
    extractedAt: string;
    mode: string;
    entityTypesFound: EntityType[];
  };
}

/**
 * Entity co-occurrence for relationship hints
 */
export interface EntityCooccurrence {
  entity1: ExtractedEntity;
  entity2: ExtractedEntity;
  distance: number;
  sentence: string;
}

/**
 * Validation issue for extracted entities
 */
export interface EntityValidationIssue {
  entityId: string;
  issueType: 'overlap' | 'confidence_low' | 'type_mismatch' | 'boundary_error' | 'duplicate';
  description: string;
  suggestion?: string;
}

/**
 * Entity resolution input
 */
export interface EntityResolutionInput {
  entities: ExtractedEntity[];
  text: string;
  options?: {
    mergeDuplicates?: boolean;
    resolveCoreferences?: boolean;
    linkEntities?: boolean;
  };
};

/**
 * Resolved entity with coreference links
 */
export interface ResolvedEntity extends ExtractedEntity {
  /** IDs of entities this entity corefers with */
  coreferences: string[];
  /** Canonical form of the entity */
  canonicalForm: string;
  /** Entity cluster ID */
  clusterId: string;
}

// ============================================
// Helper Functions
// ============================================

/**
 * Get entity type description
 */
export function getEntityTypeDescription(type: EntityType): string {
  const descriptions: Record<EntityType, string> = {
    [EntityType.PERSON]: 'Human being, personal name',
    [EntityType.FIRST_NAME]: 'Given name or forename',
    [EntityType.LAST_NAME]: 'Family name or surname',
    [EntityType.FULL_NAME]: 'Complete personal name with first and last',
    [EntityType.ORGANIZATION]: 'Generic organization entity',
    [EntityType.COMPANY]: 'Business company or corporation',
    [EntityType.DEPARTMENT]: 'Organizational department',
    [EntityType.TEAM]: 'Work team or group',
    [EntityType.INSTITUTION]: 'Institutional organization (school, hospital, etc.)',
    [EntityType.LOCATION]: 'Generic location entity',
    [EntityType.CITY]: 'City or municipality',
    [EntityType.STATE]: 'State, province, or region',
    [EntityType.COUNTRY]: 'Country name',
    [EntityType.ADDRESS]: 'Street address',
    [EntityType.BUILDING]: 'Building or structure',
    [EntityType.CONTINENT]: 'Continent name',
    [EntityType.DATE]: 'Calendar date',
    [EntityType.TIME]: 'Time of day',
    [EntityType.DATETIME]: 'Combined date and time',
    [EntityType.DURATION]: 'Time duration',
    [EntityType.PERIOD]: 'Time period or range',
    [EntityType.NUMBER]: 'Generic numeric value',
    [EntityType.MONEY]: 'Monetary value with currency',
    [EntityType.PERCENTAGE]: 'Percentage value',
    [EntityType.QUANTITY]: 'Quantity with unit',
    [EntityType.RANGE]: 'Numeric range',
    [EntityType.EMAIL]: 'Email address',
    [EntityType.PHONE]: 'Phone number',
    [EntityType.URL]: 'Web URL',
    [EntityType.SOCIAL_MEDIA]: 'Social media handle or mention',
    [EntityType.DOCUMENT]: 'Generic document',
    [EntityType.TITLE]: 'Title of work or position',
    [EntityType.BOOK]: 'Book title',
    [EntityType.ARTICLE]: 'Article or paper',
    [EntityType.LAW]: 'Law or regulation',
    [EntityType.CONTRACT]: 'Legal contract',
    [EntityType.PRODUCT]: 'Physical or digital product',
    [EntityType.SERVICE]: 'Service offering',
    [EntityType.SOFTWARE]: 'Software application',
    [EntityType.BRAND]: 'Brand name',
    [EntityType.EVENT]: 'Generic event',
    [EntityType.MEETING]: 'Meeting or appointment',
    [EntityType.CONFERENCE]: 'Conference or event',
    [EntityType.HOLIDAY]: 'Holiday or celebration',
    [EntityType.WAR]: 'War or conflict',
    [EntityType.DISASTER]: 'Natural or man-made disaster',
    [EntityType.DISEASE]: 'Medical condition',
    [EntityType.DRUG]: 'Medication or drug',
    [EntityType.SYMPTOM]: 'Medical symptom',
    [EntityType.TREATMENT]: 'Medical treatment',
    [EntityType.GENE]: 'Gene name or symbol',
    [EntityType.PROTEIN]: 'Protein name',
    [EntityType.PROGRAMMING_LANGUAGE]: 'Programming language',
    [EntityType.FRAMEWORK]: 'Software framework',
    [EntityType.API]: 'API or interface',
    [EntityType.DATABASE]: 'Database system',
    [EntityType.DEVICE]: 'Electronic device',
    [EntityType.CONCEPT]: 'Abstract concept',
    [EntityType.IDEA]: 'Idea or thought',
    [EntityType.THEORY]: 'Theory or hypothesis',
    [EntityType.SKILL]: 'Skill or ability',
    [EntityType.LANGUAGE]: 'Spoken or programming language',
    [EntityType.UNKNOWN]: 'Unknown or undetermined type',
  };
  return descriptions[type] || 'Unknown entity type';
}

/**
 * Get all entity types as an array
 */
export function getAllEntityTypes(): EntityType[] {
  return Object.values(EntityType);
}

/**
 * Get entity types by category
 */
export function getEntityTypesByCategory(category: keyof typeof ENTITY_TYPE_CATEGORIES): EntityType[] {
  return [...(ENTITY_TYPE_CATEGORIES[category] || [])];
}

// ============================================
// Prompt Generation Functions
// ============================================

/**
 * Generate the main entity extraction prompt
 */
export function generateEntityExtractionPrompt(input: EntityExtractionInput): string {
  const {
    text,
    entityTypes,
    mode = 'standard',
    minConfidence = 0.5,
    allowNested = false,
    allowOverlapping = false,
    context = 'general',
    language = 'en',
    normalizeValues = true,
  } = input;

  // Determine which entity types to extract
  const typesToExtract = entityTypes?.length ? entityTypes : getAllEntityTypes();
  
  const entityTypesSection = typesToExtract
    .filter(t => t !== EntityType.UNKNOWN)
    .map(t => `- **${t}**: ${getEntityTypeDescription(t)}`)
    .join('\n');

  const modeInstructions = {
    standard: 'Extract entities with balanced precision and recall.',
    strict: 'Extract only high-confidence entities. Prefer false negatives over false positives.',
    relaxed: 'Extract all possible entities, including uncertain ones. Prefer false positives over false negatives.',
  };

  return `## Entity Extraction Task

### Context
Extract named entities from the following ${context} text. This is a ${mode} extraction task.

### Input Text
\`\`\`
${text}
\`\`\`

### Extraction Parameters
- **Mode**: ${mode} - ${modeInstructions[mode]}
- **Minimum Confidence**: ${minConfidence} (${minConfidence * 100}% threshold)
- **Allow Nested Entities**: ${allowNested ? 'Yes' : 'No'}
- **Allow Overlapping Entities**: ${allowOverlapping ? 'Yes' : 'No'}
- **Normalize Values**: ${normalizeValues ? 'Yes' : 'No'}
- **Language**: ${language}

---

## Entity Types to Extract

${entityTypesSection}

---

## Extraction Guidelines

### Step 1: Identify Entities
1. **Named Entities**: Look for proper nouns, specific names, and unique identifiers
2. **Numeric Entities**: Identify numbers, currencies, percentages, and quantities
3. **Temporal Entities**: Find dates, times, durations, and periods
4. **Contact Information**: Extract emails, phone numbers, URLs
5. **Abstract Entities**: Identify concepts, ideas, and theories when relevant

### Step 2: Classify Entity Types
- Assign the most specific entity type possible
- Use hierarchical types (e.g., CITY before LOCATION)
- Mark uncertain types with lower confidence

### Step 3: Determine Boundaries
- Entity boundaries should match exactly with source text
- Include all relevant parts (e.g., "Dr." prefix for PERSON)
- Exclude surrounding context (articles, prepositions)

### Step 4: Normalize Values (if enabled)
- Convert dates to ISO format (YYYY-MM-DD)
- Convert currencies to standard format ($100.00)
- Convert numbers to numeric form
- Convert text variations to canonical form

### Step 5: Assign Confidence
- **0.9-1.0**: Explicit, unambiguous entity mention
- **0.7-0.9**: Clear entity with minor uncertainty
- **0.5-0.7**: Inferred or context-dependent entity
- **< 0.5**: Uncertain entity (only in relaxed mode)

---

## Output Format

Return a JSON object with this structure:

\`\`\`json
{
  "entities": [
    {
      "id": "unique-id",
      "text": "entity text as it appears",
      "type": "ENTITY_TYPE",
      "start": 0,
      "end": 10,
      "confidence": 0.95,
      "normalizedValue": "optional normalized form",
      "metadata": {}
    }
  ],
  "statistics": {
    "totalEntities": 10,
    "entitiesByType": { "PERSON": 3, "DATE": 2, ... },
    "averageConfidence": 0.85
  },
  "metadata": {
    "textLength": 500,
    "language": "en",
    "extractedAt": "2024-01-15T10:30:00Z",
    "mode": "standard",
    "entityTypesFound": ["PERSON", "DATE", ...]
  }
}
\`\`\`

### Requirements
1. Each entity must have a unique \`id\` (use UUID format)
2. Entity \`start\` and \`end\` are character positions in the original text
3. Include ALL entities meeting the confidence threshold
4. Provide normalized values for dates, numbers, currencies
5. Group statistics by entity type`;
}

/**
 * Generate a focused entity extraction prompt for specific types
 */
export function generateFocusedEntityPrompt(
  text: string,
  targetTypes: EntityType[],
  options?: {
    context?: string;
    minConfidence?: number;
    mode?: 'standard' | 'strict' | 'relaxed';
  }
): string {
  const { context = 'general', minConfidence = 0.6, mode = 'standard' } = options || {};

  const typesSection = targetTypes
    .filter(t => t !== EntityType.UNKNOWN)
    .map(t => `- **${t}**: ${getEntityTypeDescription(t)}`)
    .join('\n');

  return `## Focused Entity Extraction

### Text
${text}

### Context
${context}

### Target Entity Types
${typesSection}

### Parameters
- Mode: ${mode}
- Minimum confidence: ${minConfidence}

---

Extract ONLY entities of the specified types. Ignore other entities.

For each entity found:
1. Identify the exact text span
2. Classify with the most specific type
3. Assign confidence based on certainty
4. Normalize values where applicable

Output JSON:
\`\`\`json
{
  "entities": [
    {
      "id": "uuid",
      "text": "...",
      "type": "TYPE",
      "start": 0,
      "end": 5,
      "confidence": 0.9,
      "normalizedValue": "..."
    }
  ]
}
\`\`\``;
}

/**
 * Generate an entity validation and enhancement prompt
 */
export function generateEntityValidationPrompt(
  text: string,
  entities: ExtractedEntity[],
  options?: {
    fixOverlaps?: boolean;
    resolveCoreferences?: boolean;
    enhanceTypes?: boolean;
  }
): string {
  const { fixOverlaps = true, resolveCoreferences = false, enhanceTypes = false } = options || {};

  const entitiesJson = JSON.stringify(
    entities.map(e => ({
      id: e.id,
      text: e.text,
      type: e.type,
      start: e.start,
      end: e.end,
      confidence: e.confidence,
      normalizedValue: e.normalizedValue,
    })),
    null,
    2
  );

  return `## Entity Validation & Enhancement

### Source Text
\`\`\`
${text}
\`\`\`

### Current Entities
\`\`\`json
${entitiesJson}
\`\`\`

### Validation Options
- **Fix Overlapping Entities**: ${fixOverlaps ? 'Yes - resolve conflicts' : 'No'}
- **Resolve Coreferences**: ${resolveCoreferences ? 'Yes - link pronouns to entities' : 'No'}
- **Enhance Entity Types**: ${enhanceTypes ? 'Yes - upgrade to more specific types' : 'No'}

---

## Tasks

### 1. Validation
- Verify each entity exists in the text at the specified position
- Check entity type is appropriate for the context
- Confirm confidence scores are justified

### 2. Fix Issues (if enabled)
- **Overlaps**: Remove nested/overlapping entities, keep higher confidence
- **Boundaries**: Adjust start/end positions to match text exactly
- **Duplicates**: Merge duplicate entities

### 3. Enhancement (if enabled)
- **Coreference Resolution**: Link pronouns (it, they, this) to mentioned entities
- **Type Promotion**: Upgrade generic types to specific (LOCATION → CITY)
- **New Entities**: Add any missing entities of the target types

---

## Output Format

\`\`\`json
{
  "validEntities": [...],
  "invalidEntities": [...],
  "mergedEntities": [...],
  "newEntities": [...],
  "coreferenceLinks": [...],
  "issues": [
    {
      "entityId": "...",
      "issue": "description",
      "action": "fix applied"
    }
  ]
}
\`\`\``;
}

/**
 * Generate a prompt for extracting entity relationships (co-occurrence)
 */
export function generateEntityCooccurrencePrompt(
  text: string,
  entities: ExtractedEntity[]
): string {
  const entitiesSummary = entities
    .map(e => `- "${e.text}" (${e.type}) [${e.start}-${e.end}]`)
    .join('\n');

  return `## Entity Co-occurrence Analysis

### Text
${text}

### Entities Found
${entitiesSummary}

---

Identify pairs of entities that co-occur in the same context (sentence or clause).

For each co-occurring pair:
1. Note the distance between entities
2. Identify the connecting context/sentence
3. Determine if there's a potential relationship

Output:
\`\`\`json
{
  "cooccurrences": [
    {
      "entity1": { "text": "...", "type": "..." },
      "entity2": { "text": "...", "type": "..." },
      "distance": 50,
      "sentence": "The sentence containing both...",
      "potentialRelation": "description of potential relationship"
    }
  ]
}
\`\`\``;
}

/**
 * Generate a prompt for batch entity extraction from multiple texts
 */
export function generateBatchEntityExtractionPrompt(
  texts: { id: string; text: string }[],
  entityTypes?: EntityType[]
): string {
  const typesSection = entityTypes
    ? entityTypes.map(t => `- ${t}`).join('\n')
    : '(All entity types)';

  const textsSection = texts
    .map((t, i) => `### Text ${i + 1} (ID: ${t.id})\n${t.text}`)
    .join('\n\n');

  return `## Batch Entity Extraction

### Entity Types to Extract
${typesSection}

---

${textsSection}

---

Extract entities from each text independently. Maintain the text ID in the output.

Output:
\`\`\`json
{
  "results": [
    {
      "textId": "id-1",
      "entities": [...]
    },
    {
      "textId": "id-2", 
      "entities": [...]
    }
  ]
}
\`\`\``;
}

// ============================================
// Utility Functions
// ============================================

/**
 * Create a new entity with default values
 */
export function createEntity(
  text: string,
  type: EntityType,
  start: number,
  end: number,
  confidence: number = 1.0,
  normalizedValue?: string
): ExtractedEntity {
  return {
    id: randomUUID(),
    text,
    type,
    start,
    end,
    confidence,
    normalizedValue,
  };
}

/**
 * Filter entities by confidence threshold
 */
export function filterByConfidence(
  entities: ExtractedEntity[],
  minConfidence: number
): ExtractedEntity[] {
  return entities.filter(e => e.confidence >= minConfidence);
}

/**
 * Group entities by type
 */
export function groupByType(
  entities: ExtractedEntity[]
): Record<EntityType, ExtractedEntity[]> {
  return entities.reduce((acc, entity) => {
    if (!acc[entity.type]) {
      acc[entity.type] = [];
    }
    acc[entity.type].push(entity);
    return acc;
  }, {} as Record<EntityType, ExtractedEntity[]>);
}

/**
 * Sort entities by position in text
 */
export function sortByPosition(entities: ExtractedEntity[]): ExtractedEntity[] {
  return [...entities].sort((a, b) => a.start - b.start);
}

/**
 * Find overlapping entities
 */
export function findOverlappingEntities(
  entities: ExtractedEntity[]
): ExtractedEntity[][] {
  const sorted = sortByPosition(entities);
  const overlaps: ExtractedEntity[][] = [];
  
  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i];
    const overlapping = [current];
    
    for (let j = i + 1; j < sorted.length; j++) {
      const next = sorted[j];
      if (next.start < current.end) {
        overlapping.push(next);
      } else {
        break;
      }
    }
    
    if (overlapping.length > 1) {
      overlaps.push(overlapping);
    }
  }
  
  return overlaps;
}

// ============================================
// Export
// ============================================

export default {
  EntityType,
  ENTITY_TYPE_CATEGORIES,
  getEntityTypeDescription,
  getAllEntityTypes,
  getEntityTypesByCategory,
  generateEntityExtractionPrompt,
  generateFocusedEntityPrompt,
  generateEntityValidationPrompt,
  generateEntityCooccurrencePrompt,
  generateBatchEntityExtractionPrompt,
  createEntity,
  filterByConfidence,
  groupByType,
  sortByPosition,
  findOverlappingEntities,
};
