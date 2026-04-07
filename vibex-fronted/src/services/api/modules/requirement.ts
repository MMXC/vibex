import {
  Requirement,
  RequirementCreate,
  RequirementUpdate,
  AnalysisResult,
} from '../types/prototype/requirement';
import { SuccessResponse } from '../types/common';
import { httpClient } from '../client';
import { retry } from '../retry';
import { cache, getCacheKey } from '../cache';
import { unwrapField, unwrapData } from '../unwrappers';

// ==================== 接口定义 ====================

export interface RequirementApi {
  getRequirements(userId: string): Promise<Requirement[]>;
  getRequirement(requirementId: string): Promise<Requirement>;
  createRequirement(requirement: RequirementCreate): Promise<Requirement>;
  updateRequirement(
    requirementId: string,
    data: RequirementUpdate,
    userId?: string
  ): Promise<Requirement>;
  deleteRequirement(
    requirementId: string,
    userId: string
  ): Promise<SuccessResponse>;
  analyzeRequirement(requirementId: string): Promise<Requirement>;
  reanalyzeRequirement(
    requirementId: string,
    context?: Record<string, unknown>
  ): Promise<Requirement>;
  getAnalysisResult(requirementId: string): Promise<AnalysisResult | null>;
}

// ==================== 实现 ====================

class RequirementApiImpl implements RequirementApi {
  private isOnline(): boolean {
    if (typeof navigator !== 'undefined') {
      return navigator.onLine;
    }
    return true;
  }

  async getRequirements(userId: string): Promise<Requirement[]> {
    const cacheKey = getCacheKey('requirements', userId);
    const cached = cache.get<Requirement[]>(cacheKey);

    if (!this.isOnline() && cached) {
      return cached;
    }

    const result = await retry.execute(async () => {
      return await httpClient.get<Requirement[]>(
        '/requirements',
        { params: { userId } }
      );
    });
    const requirements = unwrapField<Requirement[]>(result, 'requirements');
    cache.set(cacheKey, requirements);
    return requirements;
  }

  async getRequirement(requirementId: string): Promise<Requirement> {
    const cacheKey = getCacheKey('requirement', requirementId);
    const cached = cache.get<Requirement>(cacheKey);

    if (!this.isOnline() && cached) {
      return cached;
    }

    const result = await retry.execute(async () => {
      return await httpClient.get<Requirement>(
        `/requirements/${requirementId}`
      );
    });
    const requirement = unwrapField<Requirement>(result, 'requirement');
    cache.set(cacheKey, requirement);
    return requirement;
  }

  async createRequirement(
    requirement: RequirementCreate
  ): Promise<Requirement> {
    const result = await retry.execute(async () => {
      return await httpClient.post<Requirement>(
        '/requirements',
        requirement
      );
    });
    const created = unwrapField<Requirement>(result, 'requirement');
    cache.remove(getCacheKey('requirements', requirement.userId));
    return created;
  }

  async updateRequirement(
    requirementId: string,
    data: RequirementUpdate,
    userId?: string
  ): Promise<Requirement> {
    const result = await retry.execute(async () => {
      return await httpClient.put<Requirement>(
        `/requirements/${requirementId}`,
        data
      );
    });
    const requirement = unwrapField<Requirement>(result, 'requirement');
    cache.remove(getCacheKey('requirement', requirementId));
    if (userId) {
      cache.remove(getCacheKey('requirements', userId));
    }
    return requirement;
  }

  async deleteRequirement(
    requirementId: string,
    userId: string
  ): Promise<SuccessResponse> {
    const result = await retry.execute(async () => {
      return await httpClient.delete<SuccessResponse>(
        `/requirements/${requirementId}`
      );
    });
    cache.remove(getCacheKey('requirement', requirementId));
    cache.remove(getCacheKey('requirements', userId));
    return result;
  }

  async analyzeRequirement(requirementId: string): Promise<Requirement> {
    const result = await retry.execute(async () => {
      return await httpClient.post<Requirement>(
        `/requirements/${requirementId}/analyze`
      );
    });
    const requirement = unwrapField<Requirement>(result, 'requirement');
    cache.remove(getCacheKey('requirement', requirementId));
    return requirement;
  }

  async reanalyzeRequirement(
    requirementId: string,
    context?: Record<string, unknown>
  ): Promise<Requirement> {
    const result = await retry.execute(async () => {
      return await httpClient.post<Requirement>(
        `/requirements/${requirementId}/reanalyze`,
        context
      );
    });
    const requirement = unwrapField<Requirement>(result, 'requirement');
    cache.remove(getCacheKey('requirement', requirementId));
    return requirement;
  }

  async getAnalysisResult(
    requirementId: string
  ): Promise<AnalysisResult | null> {
    const cacheKey = getCacheKey('analysis_result', requirementId);
    const cached = cache.get<AnalysisResult | null>(cacheKey);

    if (!this.isOnline() && cached) {
      return cached;
    }

    const result = await retry.execute(async () => {
      return await httpClient.get<AnalysisResult>(
        `/requirements/${requirementId}/analysis`
      );
    });
    const analysisResult = unwrapField<AnalysisResult>(result, 'analysisResult');
    cache.set(cacheKey, analysisResult);
    return analysisResult;
  }
}

// ==================== 工厂函数 ====================

export function createRequirementApi(): RequirementApi {
  return new RequirementApiImpl();
}

// ==================== 单例导出 ====================

export const requirementApi = createRequirementApi();
