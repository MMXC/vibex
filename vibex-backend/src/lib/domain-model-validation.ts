/**
 * Domain Model Validation Service
 * 
 * Validates domain model completeness and correctness.
 */

/**
 * Domain Entity type
 */
export interface DomainEntity {
  id: string;
  name: string;
  type: string;
  description?: string;
  properties?: EntityProperty[];
  requirementId?: string;
  position?: { x: number; y: number };
}

/**
 * Entity Property
 */
export interface EntityProperty {
  name: string;
  type: string;
  required?: boolean;
  description?: string;
  defaultValue?: string;
}

/**
 * Entity Relation type
 */
export interface EntityRelation {
  id: string;
  fromEntityId: string;
  toEntityId: string;
  relationType: string;
  description?: string;
  requirementId?: string;
}

/**
 * Validation issue severity
 */
export type ValidationSeverity = 'error' | 'warning' | 'info';

/**
 * Validation issue
 */
export interface ValidationIssue {
  severity: ValidationSeverity;
  type: string;
  message: string;
  entityId?: string;
  relationId?: string;
  field?: string;
}

/**
 * Validation result
 */
export interface ValidationResult {
  isValid: boolean;
  issues: ValidationIssue[];
  score: number; // 0-100
  summary: {
    totalEntities: number;
    totalRelations: number;
    entitiesWithIssues: number;
    relationsWithIssues: number;
  };
}

/**
 * Domain model validation input
 */
export interface ModelValidationInput {
  entities: DomainEntity[];
  relations: EntityRelation[];
}

/**
 * Validate domain entity
 */
function validateEntity(entity: DomainEntity): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // Check required fields
  if (!entity.name || entity.name.trim() === '') {
    issues.push({
      severity: 'error',
      type: 'missing_name',
      message: '实体名称不能为空',
      entityId: entity.id,
      field: 'name',
    });
  }

  if (!entity.type) {
    issues.push({
      severity: 'error',
      type: 'missing_type',
      message: '实体类型不能为空',
      entityId: entity.id,
      field: 'type',
    });
  }

  // Check name format (should be PascalCase)
  if (entity.name && !/^[A-Z][a-zA-Z0-9]*$/.test(entity.name)) {
    issues.push({
      severity: 'warning',
      type: 'naming_convention',
      message: '实体名称建议使用 PascalCase 格式',
      entityId: entity.id,
      field: 'name',
    });
  }

  // Check if entity has properties/attributes
  if (!entity.properties || entity.properties.length === 0) {
    issues.push({
      severity: 'warning',
      type: 'missing_properties',
      message: '实体没有定义属性',
      entityId: entity.id,
      field: 'properties',
    });
  }

  // Check if entity has description
  if (!entity.description || entity.description.trim() === '') {
    issues.push({
      severity: 'info',
      type: 'missing_description',
      message: '建议添加实体描述',
      entityId: entity.id,
      field: 'description',
    });
  }

  return issues;
}

/**
 * Validate entity relation
 */
function validateRelation(
  relation: EntityRelation,
  entities: DomainEntity[]
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // Check required fields
  if (!relation.fromEntityId) {
    issues.push({
      severity: 'error',
      type: 'missing_source',
      message: '关系缺少源实体',
      relationId: relation.id,
      field: 'fromEntityId',
    });
  }

  if (!relation.toEntityId) {
    issues.push({
      severity: 'error',
      type: 'missing_target',
      message: '关系缺少目标实体',
      relationId: relation.id,
      field: 'toEntityId',
    });
  }

  if (!relation.relationType) {
    issues.push({
      severity: 'error',
      type: 'missing_type',
      message: '关系类型不能为空',
      relationId: relation.id,
      field: 'relationType',
    });
  }

  // Check if source entity exists
  if (relation.fromEntityId) {
    const sourceExists = entities.some(e => e.id === relation.fromEntityId);
    if (!sourceExists) {
      issues.push({
        severity: 'error',
        type: 'invalid_source',
        message: '源实体不存在',
        relationId: relation.id,
        field: 'fromEntityId',
      });
    }
  }

  // Check if target entity exists
  if (relation.toEntityId) {
    const targetExists = entities.some(e => e.id === relation.toEntityId);
    if (!targetExists) {
      issues.push({
        severity: 'error',
        type: 'invalid_target',
        message: '目标实体不存在',
        relationId: relation.id,
        field: 'toEntityId',
      });
    }
  }

  // Check for self-referencing relations (warning)
  if (relation.fromEntityId === relation.toEntityId) {
    issues.push({
      severity: 'warning',
      type: 'self_reference',
      message: '实体不能与自身建立关系',
      relationId: relation.id,
    });
  }

  // Check if relation has description
  if (!relation.description || relation.description.trim() === '') {
    issues.push({
      severity: 'info',
      type: 'missing_description',
      message: '建议添加关系描述',
      relationId: relation.id,
      field: 'description',
    });
  }

  return issues;
}

/**
 * Validate domain model completeness
 */
export function validateDomainModel(input: ModelValidationInput): ValidationResult {
  const { entities, relations } = input;
  const allIssues: ValidationIssue[] = [];

  // Validate entities
  const entityIdsWithIssues = new Set<string>();
  entities.forEach(entity => {
    const issues = validateEntity(entity);
    issues.forEach(issue => {
      if (issue.entityId) {
        entityIdsWithIssues.add(issue.entityId);
      }
    });
    allIssues.push(...issues);
  });

  // Validate relations
  const relationIdsWithIssues = new Set<string>();
  relations.forEach(relation => {
    const issues = validateRelation(relation, entities);
    issues.forEach(issue => {
      if (issue.relationId) {
        relationIdsWithIssues.add(issue.relationId);
      }
    });
    allIssues.push(...issues);
  });

  // Check for orphan entities (entities with no relations)
  const entityIds = new Set(entities.map(e => e.id));
  const connectedEntityIds = new Set<string>();
  
  relations.forEach(rel => {
    if (rel.fromEntityId) connectedEntityIds.add(rel.fromEntityId);
    if (rel.toEntityId) connectedEntityIds.add(rel.toEntityId);
  });

  entities.forEach(entity => {
    if (!connectedEntityIds.has(entity.id)) {
      allIssues.push({
        severity: 'info',
        type: 'orphan_entity',
        message: '该实体没有与其他实体建立关系',
        entityId: entity.id,
      });
      entityIdsWithIssues.add(entity.id);
    }
  });

  // Check for circular dependencies
  const circularDeps = detectCircularDependencies(entities, relations);
  circularDeps.forEach(path => {
    allIssues.push({
      severity: 'warning',
      type: 'circular_dependency',
      message: `检测到循环依赖: ${path.join(' → ')}`,
    });
  });

  // Calculate score
  const totalChecks = entities.length + relations.length;
  const errorCount = allIssues.filter(i => i.severity === 'error').length;
  const warningCount = allIssues.filter(i => i.severity === 'warning').length;
  
  const score = Math.max(0, Math.min(100, 
    100 - (errorCount * 10) - (warningCount * 5)
  ));

  const isValid = !allIssues.some(i => i.severity === 'error');

  return {
    isValid,
    issues: allIssues,
    score,
    summary: {
      totalEntities: entities.length,
      totalRelations: relations.length,
      entitiesWithIssues: entityIdsWithIssues.size,
      relationsWithIssues: relationIdsWithIssues.size,
    },
  };
}

/**
 * Detect circular dependencies in relations
 */
function detectCircularDependencies(
  entities: DomainEntity[],
  relations: EntityRelation[]
): string[][] {
  const adjacency = new Map<string, string[]>();
  
  // Build adjacency list
  entities.forEach(e => adjacency.set(e.id, []));
  relations.forEach(r => {
    if (r.fromEntityId && r.toEntityId) {
      const neighbors = adjacency.get(r.fromEntityId) || [];
      neighbors.push(r.toEntityId);
      adjacency.set(r.fromEntityId, neighbors);
    }
  });

  const cycles: string[][] = [];
  const visited = new Set<string>();
  const path: string[] = [];

  function dfs(nodeId: string, startId: string): boolean {
    if (nodeId === startId && path.length > 1) {
      cycles.push([...path, startId]);
      return true;
    }

    if (visited.has(nodeId)) return false;
    
    visited.add(nodeId);
    path.push(nodeId);

    const neighbors = adjacency.get(nodeId) || [];
    for (const neighbor of neighbors) {
      if (neighbor === startId || !visited.has(neighbor)) {
        dfs(neighbor, startId);
      }
    }

    path.pop();
    return false;
  }

  // Check each entity for cycles
  entities.forEach(entity => {
    visited.clear();
    path.length = 0;
    dfs(entity.id, entity.id);
  });

  return cycles;
}

/**
 * Get validation summary as human-readable string
 */
export function getValidationSummary(result: ValidationResult): string {
  const { isValid, score, summary, issues } = result;
  
  const errorCount = issues.filter(i => i.severity === 'error').length;
  const warningCount = issues.filter(i => i.severity === 'warning').length;
  const infoCount = issues.filter(i => i.severity === 'info').length;

  let summaryText = `模型完整性评分: ${score}/100\n`;
  summaryText += `验证结果: ${isValid ? '通过' : '未通过'}\n`;
  summaryText += `\n统计:\n`;
  summaryText += `- 实体总数: ${summary.totalEntities}\n`;
  summaryText += `- 关系总数: ${summary.totalRelations}\n`;
  
  if (errorCount > 0 || warningCount > 0 || infoCount > 0) {
    summaryText += `\n问题:\n`;
    if (errorCount > 0) summaryText += `- ❌ 错误: ${errorCount}\n`;
    if (warningCount > 0) summaryText += `- ⚠️ 警告: ${warningCount}\n`;
    if (infoCount > 0) summaryText += `- ℹ️ 提示: ${infoCount}\n`;
  }

  return summaryText;
}

export default {
  validateDomainModel,
  getValidationSummary,
};