import { EntityRelation } from '../types/prototype/domain';
import { SuccessResponse } from '../types/common';
import { httpClient } from '../client';
import { retry } from '../retry';
import { cache, getCacheKey } from '../cache';

// ==================== 接口定义 ====================

export interface EntityRelationApi {
  getEntityRelations(requirementId: string): Promise<EntityRelation[]>;
  getEntityRelation(relationId: string): Promise<EntityRelation>;
  createEntityRelation(relation: Omit<EntityRelation, 'id'>, requirementId?: string): Promise<EntityRelation>;
  updateEntityRelation(relationId: string, data: Partial<EntityRelation>, requirementId?: string): Promise<EntityRelation>;
  deleteEntityRelation(relationId: string, requirementId: string): Promise<SuccessResponse>;
}

// ==================== 实现 ====================

class EntityRelationApiImpl implements EntityRelationApi {
  private isOnline(): boolean {
    if (typeof navigator !== 'undefined') {
      return navigator.onLine;
    }
    return true;
  }

  async getEntityRelations(requirementId: string): Promise<EntityRelation[]> {
    const cacheKey = getCacheKey('entity_relations', requirementId);
    const cached = cache.get<EntityRelation[]>(cacheKey);
    
    if (!this.isOnline() && cached) {
      return cached;
    }

    const result = await retry.execute(async () => {
      return await httpClient.get<{ entityRelations: EntityRelation[] }>(`/entity-relations?requirementId=${requirementId}`);
    });
    const relations: EntityRelation[] = (result as any).entityRelations || result;
    cache.set(cacheKey, relations);
    return relations;
  }

  async getEntityRelation(relationId: string): Promise<EntityRelation> {
    const cacheKey = getCacheKey('entity_relation', relationId);
    const cached = cache.get<EntityRelation>(cacheKey);
    
    if (!this.isOnline() && cached) {
      return cached;
    }

    const result = await retry.execute(async () => {
      return await httpClient.get<{ entityRelation: EntityRelation }>(`/entity-relations/${relationId}`);
    });
    const relation: EntityRelation = (result as any).entityRelation || result;
    cache.set(cacheKey, relation);
    return relation;
  }

  async createEntityRelation(relation: Omit<EntityRelation, 'id'>, requirementId?: string): Promise<EntityRelation> {
    const result = await retry.execute(async () => {
      return await httpClient.post<{ entityRelation: EntityRelation }>('/entity-relations', relation);
    });
    const created: EntityRelation = (result as any).entityRelation || result;
    if (requirementId) {
      cache.remove(getCacheKey('entity_relations', requirementId));
    }
    return created;
  }

  async updateEntityRelation(relationId: string, data: Partial<EntityRelation>, requirementId?: string): Promise<EntityRelation> {
    const result = await retry.execute(async () => {
      return await httpClient.put<{ entityRelation: EntityRelation }>(`/entity-relations/${relationId}`, data);
    });
    const relation: EntityRelation = (result as any).entityRelation || result;
    if (requirementId) {
      cache.remove(getCacheKey('entity_relations', requirementId));
    }
    return relation;
  }

  async deleteEntityRelation(relationId: string, requirementId: string): Promise<SuccessResponse> {
    const result = await retry.execute(async () => {
      return await httpClient.delete<SuccessResponse>(`/entity-relations/${relationId}`);
    });
    cache.remove(getCacheKey('entity_relations', requirementId));
    return result;
  }
}

// ==================== 工厂函数 ====================

export function createEntityRelationApi(): EntityRelationApi {
  return new EntityRelationApiImpl();
}

// ==================== 单例导出 ====================

export const entityRelationApi = createEntityRelationApi();