import { DomainEntity } from '../types/prototype/domain';
import { SuccessResponse } from '../types/common';
import { httpClient } from '../client';
import { retry } from '../retry';
import { cache, getCacheKey } from '../cache';
import { unwrapField } from '../unwrappers';

// ==================== 接口定义 ====================

export interface DomainEntityApi {
  getDomainEntities(requirementId: string): Promise<DomainEntity[]>;
  getDomainEntity(entityId: string): Promise<DomainEntity>;
  createDomainEntity(
    entity: Omit<DomainEntity, 'id' | 'createdAt'>
  ): Promise<DomainEntity>;
  updateDomainEntity(
    entityId: string,
    data: Partial<DomainEntity>
  ): Promise<DomainEntity>;
  deleteDomainEntity(
    entityId: string,
    requirementId: string
  ): Promise<SuccessResponse>;
}

// ==================== 实现 ====================

class DomainEntityApiImpl implements DomainEntityApi {
  private isOnline(): boolean {
    if (typeof navigator !== 'undefined') {
      return navigator.onLine;
    }
    return true;
  }

  async getDomainEntities(requirementId: string): Promise<DomainEntity[]> {
    const cacheKey = getCacheKey('domain_entities', requirementId);
    const cached = cache.get<DomainEntity[]>(cacheKey);

    if (!this.isOnline() && cached) {
      return cached;
    }

    const result = await retry.execute(async () => {
      return await httpClient.get<DomainEntity[]>(
        `/domain-entities?requirementId=${requirementId}`
      );
    });
    const entities = unwrapField<DomainEntity[]>(result, 'domainEntities');
    cache.set(cacheKey, entities);
    return entities;
  }

  async getDomainEntity(entityId: string): Promise<DomainEntity> {
    const cacheKey = getCacheKey('domain_entity', entityId);
    const cached = cache.get<DomainEntity>(cacheKey);

    if (!this.isOnline() && cached) {
      return cached;
    }

    const result = await retry.execute(async () => {
      return await httpClient.get<DomainEntity>(`/domains/${entityId}`);
    });
    const entity = unwrapField<DomainEntity>(result, 'domain');
    cache.set(cacheKey, entity);
    return entity;
  }

  async createDomainEntity(
    entity: Omit<DomainEntity, 'id' | 'createdAt'>
  ): Promise<DomainEntity> {
    const result = await retry.execute(async () => {
      return await httpClient.post<DomainEntity>(
        `/requirements/${entity.requirementId}/domains`,
        entity
      );
    });
    const created = unwrapField<DomainEntity>(result, 'domain');
    cache.remove(getCacheKey('domain_entities', entity.requirementId));
    return created;
  }

  async updateDomainEntity(
    entityId: string,
    data: Partial<DomainEntity>
  ): Promise<DomainEntity> {
    const result = await retry.execute(async () => {
      return await httpClient.put<DomainEntity>(
        `/domains/${entityId}`,
        data
      );
    });
    const entity = unwrapField<DomainEntity>(result, 'domain');
    if (data.requirementId) {
      cache.remove(getCacheKey('domain_entities', data.requirementId));
    }
    return entity;
  }

  async deleteDomainEntity(
    entityId: string,
    requirementId: string
  ): Promise<SuccessResponse> {
    const result = await retry.execute(async () => {
      return await httpClient.delete<SuccessResponse>(`/domains/${entityId}`);
    });
    cache.remove(getCacheKey('domain_entities', requirementId));
    return result;
  }
}

// ==================== 工厂函数 ====================

export function createDomainEntityApi(): DomainEntityApi {
  return new DomainEntityApiImpl();
}

// ==================== 单例导出 ====================

export const domainEntityApi = createDomainEntityApi();
