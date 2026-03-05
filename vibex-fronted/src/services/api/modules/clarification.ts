import { Clarification } from '../types/prototype/ui-schema';
import { httpClient } from '../client';
import { retry } from '../retry';
import { cache, getCacheKey } from '../cache';

// ==================== 接口定义 ====================

export interface ClarificationApi {
  getClarifications(requirementId: string): Promise<Clarification[]>;
  answerClarification(requirementId: string, clarificationId: string, answer: string): Promise<Clarification>;
  skipClarification(requirementId: string, clarificationId: string): Promise<Clarification>;
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
      const response = await httpClient.get<{ clarifications: Clarification[] }>(`/requirements/${requirementId}/clarifications`);
      return response;
    });
    const clarifications: Clarification[] = (result as any).clarifications || result;
    cache.set(cacheKey, clarifications);
    return clarifications;
  }

  async answerClarification(requirementId: string, clarificationId: string, answer: string): Promise<Clarification> {
    const result = await retry.execute(async () => {
      const response = await httpClient.put<{ clarification: Clarification }>(`/clarifications/${clarificationId}`, { answer });
      return response;
    });
    const clarification: Clarification = (result as any).clarification || result;
    cache.remove(getCacheKey('clarifications', requirementId));
    cache.remove(getCacheKey('requirement', requirementId));
    return clarification;
  }

  async skipClarification(requirementId: string, clarificationId: string): Promise<Clarification> {
    const result = await retry.execute(async () => {
      const response = await httpClient.put<{ clarification: Clarification }>(`/clarifications/${clarificationId}`, { status: 'skipped' });
      return response;
    });
    const clarification: Clarification = (result as any).clarification || result;
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