// ==================== AI 原型类型 - 领域实体 ====================

export interface DomainEntity {
  id: string;
  requirementId: string;
  name: string;
  type: EntityType;
  description?: string;
  attributes: EntityAttribute[];
  position?: { x: number; y: number };
  createdAt?: string;
}

export type EntityType =
  | 'user'
  | 'system'
  | 'business'
  | 'data'
  | 'external'
  | 'abstract';

export interface EntityAttribute {
  name: string;
  type: string;
  required: boolean;
  description?: string;
}

// 实体关系
export interface EntityRelation {
  id: string;
  fromEntityId: string;
  toEntityId: string;
  relationType: string;
  description?: string;
  createdAt?: string;
}

export type RelationType =
  | 'inheritance'
  | 'composition'
  | 'aggregation'
  | 'association'
  | 'dependency'
  | 'realization';

// Bounded Context
export interface ContextRelationship {
  id: string;
  fromContextId: string;
  toContextId: string;
  type: 'upstream' | 'downstream' | 'symmetric';
  description: string;
}

export interface BoundedContext {
  id: string;
  name: string;
  description: string;
  type: 'core' | 'supporting' | 'generic' | 'external';
  keyResponsibilities?: string[];
  relationships: ContextRelationship[];
}

export interface BoundedContextResponse {
  success: boolean;
  boundedContexts: BoundedContext[];
  mermaidCode?: string;
  error?: string;
}
