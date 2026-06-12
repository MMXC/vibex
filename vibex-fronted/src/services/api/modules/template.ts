/**
 * Templates API Module
 *
 * Manages industry and custom templates via /api/v1/templates
 */

import { SuccessResponse } from '../types/common';
import { httpClient } from '../client';
import { retry } from '../retry';
import { unwrapItem, unwrapList } from '@/lib/api-unwrap';

// ==================== Types ====================

export interface IndustryEntity {
  name: string;
  type: 'aggregate' | 'entity' | 'valueObject';
  attributes: { name: string; type: string; description?: string }[];
  description: string;
}

export interface IndustryBoundedContext {
  name: string;
  entities: string[];
  description?: string;
}

export interface IndustryTemplate {
  id: string;
  name: string;
  industry: string;
  description: string;
  icon: string;
  entities: IndustryEntity[];
  boundedContexts: IndustryBoundedContext[];
  sampleRequirement: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PublicTemplate {
  id: string;
  name: string;
  description: string;
  author_name: string;
  tags: string[];
  thumbnail: string | null;
  usage_count: number;
  avg_rating: number;
  rating_count: number;
  share_token: string | null;
  published_at: string;
}

export interface PublicTemplateDetail extends PublicTemplate {
  content_json: string | null;
}

export interface PublicTemplatesResponse {
  ok: boolean;
  templates: PublicTemplate[];
  total: number;
  page: number;
  limit: number;
}

export interface PublishResponse {
  ok: boolean;
  isPublic: boolean;
  shareToken?: string;
  error?: string;
}

export interface TemplateApi {
  getTemplates(industry?: string): Promise<IndustryTemplate[]>;
  getTemplate(id: string): Promise<IndustryTemplate>;
  createTemplate(data: Partial<IndustryTemplate>): Promise<IndustryTemplate>;
  updateTemplate(id: string, data: Partial<IndustryTemplate>): Promise<IndustryTemplate>;
  deleteTemplate(id: string): Promise<SuccessResponse>;
  exportTemplates(): Promise<void>;
  importTemplate(file: File): Promise<IndustryTemplate>;
  getMarketplaceTemplates(industry?: string): Promise<IndustryTemplate[]>;
  // S90-E3: Template Sharing
  getPublicTemplates(params?: { category?: string; sort?: string; page?: number; limit?: number }): Promise<PublicTemplatesResponse>;
  getPublicTemplate(id: string, token: string): Promise<PublicTemplateDetail>;
  publishTemplate(id: string, isPublic: boolean): Promise<PublishResponse>;
}

// ==================== 实现 ====================

class TemplateApiImpl implements TemplateApi {
  async getTemplates(industry?: string): Promise<IndustryTemplate[]> {
    const result = await retry.execute(async () => {
      return await httpClient.get<{ templates: IndustryTemplate[] }>('/templates', {
        params: industry ? { industry } : undefined,
      });
    });
    return unwrapList<IndustryTemplate>(result, 'templates');
  }

  async getTemplate(id: string): Promise<IndustryTemplate> {
    const result = await retry.execute(async () => {
      return await httpClient.get<{ data: IndustryTemplate }>(`/templates/${id}`);
    });
    return unwrapItem<IndustryTemplate>(result, 'data') as IndustryTemplate;
  }

  async createTemplate(data: Partial<IndustryTemplate>): Promise<IndustryTemplate> {
    const result = await retry.execute(async () => {
      return await httpClient.post<{ data: IndustryTemplate }>('/templates', data);
    });
    return unwrapItem<IndustryTemplate>(result, 'data') as IndustryTemplate;
  }

  async updateTemplate(id: string, data: Partial<IndustryTemplate>): Promise<IndustryTemplate> {
    const result = await retry.execute(async () => {
      return await httpClient.put<{ data: IndustryTemplate }>(`/templates/${id}`, data);
    });
    return unwrapItem<IndustryTemplate>(result, 'data') as IndustryTemplate;
  }

  async deleteTemplate(id: string): Promise<SuccessResponse> {
    const result = await retry.execute(async () => {
      return await httpClient.delete<SuccessResponse>(`/templates/${id}`);
    });
    return unwrapItem<SuccessResponse>(result, 'data') ?? result;
  }

  async exportTemplates(): Promise<void> {
    const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.vibex.top/api';
    const url = `${baseURL}/v1/templates/export`;
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken') || '';

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error(`Export failed: ${response.status}`);

    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = `vibex-templates-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
  }

  async importTemplate(file: File): Promise<IndustryTemplate> {
    const text = await file.text();
    const data = JSON.parse(text);
    const result = await retry.execute(async () => {
      return await httpClient.post<{ data: IndustryTemplate }>('/templates/import', data);
    });
    return unwrapItem<IndustryTemplate>(result, 'data') as IndustryTemplate;
  }

  async getMarketplaceTemplates(industry?: string): Promise<IndustryTemplate[]> {
    const result = await retry.execute(async () => {
      return await httpClient.get<{ templates: IndustryTemplate[] }>('/templates/marketplace', {
        params: industry ? { industry } : undefined,
      });
    });
    return unwrapList<IndustryTemplate>(result, 'templates');
  }

  // S90-E3: Template Sharing
  async getPublicTemplates(params?: { category?: string; sort?: string; page?: number; limit?: number }): Promise<PublicTemplatesResponse> {
    const result = await retry.execute(async () => {
      return await httpClient.get<PublicTemplatesResponse>('/templates/public', {
        params: {
          category: params?.category,
          sort: params?.sort,
          page: params?.page,
          limit: params?.limit,
        },
      });
    });
    return result as PublicTemplatesResponse;
  }

  async getPublicTemplate(id: string, token: string): Promise<PublicTemplateDetail> {
    const result = await retry.execute(async () => {
      return await httpClient.get<{ ok: boolean; template: PublicTemplateDetail }>(`/templates/public/${id}`, {
        params: { token },
      });
    });
    return (result as { ok: boolean; template: PublicTemplateDetail }).template;
  }

  async publishTemplate(id: string, isPublic: boolean): Promise<PublishResponse> {
    const result = await retry.execute(async () => {
      return await httpClient.post<PublishResponse>(`/templates/${id}/publish`, { isPublic });
    });
    return result as PublishResponse;
  }
}

// ==================== 工厂函数 ====================

export function createTemplateApi(): TemplateApi {
  return new TemplateApiImpl();
}

// ==================== 单例导出 ====================

export const templateApi = createTemplateApi();
