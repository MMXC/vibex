/**
 * Template Types - Industry Template Data Structures
 * Used by the template library for domain analysis
 */

export type Industry = 'ecommerce' | 'social' | 'saas';

export interface EntityAttribute {
  name: string;
  type: string;
  description?: string;
}

export interface Entity {
  name: string;
  type: 'aggregate' | 'entity' | 'valueObject';
  attributes: EntityAttribute[];
  description: string;
}

export interface BoundedContext {
  name: string;
  entities: string[];
  description?: string;
}

export interface Template {
  id: string;
  name: string;
  industry: Industry;
  description: string;
  icon: string;
  entities: Entity[];
  boundedContexts: BoundedContext[];
  sampleRequirement: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}
