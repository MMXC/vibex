import {
  BoundedContext,
  BoundedContextResponse,
} from '../types/prototype/domain';
import { httpClient } from '../client';

// ==================== 接口定义 ====================

export interface DddApi {
  generateBoundedContext(
    requirementText: string,
    projectId?: string
  ): Promise<BoundedContextResponse>;
  generateDomainModel(
    boundedContexts: BoundedContext[],
    requirementText: string,
    projectId?: string
  ): Promise<{
    success: boolean;
    domainModels?: unknown[];
    mermaidCode?: string;
    error?: string;
  }>;
  generateBusinessFlow(
    domainModels: unknown[],
    requirementText: string,
    projectId?: string
  ): Promise<{
    success: boolean;
    businessFlow?: unknown;
    mermaidCode?: string;
    error?: string;
  }>;
}

// ==================== 实现 ====================

class DddApiImpl implements DddApi {
  async generateBoundedContext(
    requirementText: string,
    projectId?: string
  ): Promise<BoundedContextResponse> {
    const response = await httpClient.post<{ data: BoundedContextResponse }>(
      '/ddd/bounded-context',
      { requirementText, projectId }
    );
    return response.data;
  }

  async generateDomainModel(
    boundedContexts: BoundedContext[],
    requirementText: string,
    projectId?: string
  ): Promise<{
    success: boolean;
    domainModels?: unknown[];
    mermaidCode?: string;
    error?: string;
  }> {
    const response = await httpClient.post<{ data: {
      success: boolean;
      domainModels?: unknown[];
      mermaidCode?: string;
      error?: string;
    } }>('/ddd/domain-model', { boundedContexts, requirementText, projectId });
    return response.data;
  }

  async generateBusinessFlow(
    domainModels: unknown[],
    requirementText: string,
    projectId?: string
  ): Promise<{
    success: boolean;
    businessFlow?: unknown;
    mermaidCode?: string;
    error?: string;
  }> {
    const response = await httpClient.post<{ data: {
      success: boolean;
      businessFlow?: unknown;
      mermaidCode?: string;
      error?: string;
    } }>('/ddd/business-flow', { domainModels, requirementText, projectId });
    return response.data;
  }
}

// ==================== 工厂函数 ====================

export function createDddApi(): DddApi {
  return new DddApiImpl();
}

// ==================== 单例导出 ====================

export const dddApi = createDddApi();
