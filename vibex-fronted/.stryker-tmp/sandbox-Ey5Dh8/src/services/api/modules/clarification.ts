// @ts-nocheck
import { Clarification } from '../types/prototype/ui-schema';
import { httpClient } from '../client';
import { retry } from '../retry';
import { cache, getCacheKey } from '../cache';
import { unwrapField } from '../unwrappers';

// ==================== 接口定义 ====================

export interface ClarificationApi {
  getClarifications(requirementId: string): Promise<Clarification[]>;
  answerClarification(
    requirementId: string,
    clarificationId: string,
    answer: string
  ): Promise<Clarification>;
  skipClarification(
    requirementId: string,
    clarificationId: string
  ): Promise<Clarification>;
}

// ==================== 实现 ====================

class ClarificationApiImpl implements ClarificationApi {
  private isOnline(): boolean {
    if (typeof navigator !== 'undefined') {
      return navigator.onLine;
    }
    return true;
  }

  async getClarifications(requirementId: string): Promise<Clarification[]> {
    const cacheKey = getCacheKey('clarifications', requirementId);
    const cached = cache.get<Clarification[]>(cacheKey);

    if (!this.isOnline() && cached) {
      return cached;
    }

    const result = await retry.execute(async () => {
      const response = await httpClient.get<Clarification[]>(
        `/requirements/${requirementId}/clarifications`
      );
      return response;
    });
    const clarifications = unwrapField<Clarification[]>(result, 'clarifications');
    cache.set(cacheKey, clarifications);
    return clarifications;
  }

  async answerClarification(
    requirementId: string,
    clarificationId: string,
    answer: string
  ): Promise<Clarification> {
    const result = await retry.execute(async () => {
      const response = await httpClient.put<Clarification>(
        `/clarifications/${clarificationId}`,
        { answer }
      );
      return response;
    });
    const clarification = unwrapField<Clarification>(result, 'clarification');
    cache.remove(getCacheKey('clarifications', requirementId));
    cache.remove(getCacheKey('requirement', requirementId));
    return clarification;
  }

  async skipClarification(
    requirementId: string,
    clarificationId: string
  ): Promise<Clarification> {
    const result = await retry.execute(async () => {
      const response = await httpClient.put<Clarification>(
        `/clarifications/${clarificationId}`,
        { status: 'skipped' }
      );
      return response;
    });
    const clarification = unwrapField<Clarification>(result, 'clarification');
    cache.remove(getCacheKey('clarifications', requirementId));
    return clarification;
  }
}

// ==================== 工厂函数 ====================

export function createClarificationApi(): ClarificationApi {
  return new ClarificationApiImpl();
}

// ==================== 单例导出 ====================

export const clarificationApi = createClarificationApi();
