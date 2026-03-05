import { BoundedContext, BoundedContextResponse } from '../types/prototype/domain';
import { httpClient } from '../client';

// ==================== 接口定义 ====================

export interface DddApi {
  generateBoundedContext(requirementText: string, projectId?: string): Promise<BoundedContextResponse>;
  generateDomainModel(
    boundedContexts: BoundedContext[],
    requirementText: string,
    projectId?: string
  ): Promise<{ success: boolean; domainModels?: unknown[]; mermaidCode?: string; error?: string }>;
  generateBusinessFlow(
    domainModels: unknown[],
    requirementText: string,
    projectId?: string
  ): Promise<{ success: boolean; businessFlow?: unknown; mermaidCode?: string; error?: string }>;
}

// ==================== 实现 ====================

class DddApiImpl implements DddApi {
  async generateBoundedContext(requirementText: string, projectId?: string): Promise<BoundedContextResponse> {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.vibex.top/api';
    
    const response = await fetch(`${baseUrl}/ddd/bounded-context`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requirementText, projectId }),
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    return response.json();
  }

  async generateDomainModel(
    boundedContexts: BoundedContext[],
    requirementText: string,
    projectId?: string
  ): Promise<{ success: boolean; domainModels?: unknown[]; mermaidCode?: string; error?: string }> {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.vibex.top/api';
    
    const response = await fetch(`${baseUrl}/ddd/domain-model`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ boundedContexts, requirementText, projectId }),
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    return response.json();
  }

  async generateBusinessFlow(
    domainModels: unknown[],
    requirementText: string,
    projectId?: string
  ): Promise<{ success: boolean; businessFlow?: unknown; mermaidCode?: string; error?: string }> {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.vibex.top/api';
    
    const response = await fetch(`${baseUrl}/ddd/business-flow`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domainModels, requirementText, projectId }),
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    return response.json();
  }
}

// ==================== 工厂函数 ====================

export function createDddApi(): DddApi {
  return new DddApiImpl();
}

// ==================== 单例导出 ====================

export const dddApi = createDddApi();
