import { FlowData, FlowDataUpdate } from '../types/flow';
import { SuccessResponse } from '../types/common';
import { httpClient } from '../client';
import { retry } from '../retry';
import { cache, getCacheKey } from '../cache';

// ==================== 接口定义 ====================

export interface FlowApi {
  getFlow(flowId: string): Promise<FlowData>;
  updateFlow(flowId: string, data: FlowDataUpdate): Promise<FlowData>;
  generateFlow(description: string): Promise<FlowData>;
  deleteFlow(flowId: string): Promise<SuccessResponse>;
}

// ==================== 实现 ====================

class FlowApiImpl implements FlowApi {
  private isOnline(): boolean {
    if (typeof navigator !== 'undefined') {
      return navigator.onLine;
    }
    return true;
  }

  async getFlow(flowId: string): Promise<FlowData> {
    const cacheKey = getCacheKey('flow', flowId);
    const cached = cache.get<FlowData>(cacheKey);

    if (!this.isOnline() && cached) {
      return cached;
    }

    const result = await retry.execute(async () => {
      return await httpClient.get<FlowData>(`/flows/${flowId}`);
    });
    cache.set(cacheKey, result);
    return result;
  }

  async updateFlow(flowId: string, data: FlowDataUpdate): Promise<FlowData> {
    const result = await retry.execute(async () => {
      return await httpClient.put<FlowData>(`/flows/${flowId}`, data);
    });
    cache.remove(getCacheKey('flow', flowId));
    return result;
  }

  async generateFlow(description: string): Promise<FlowData> {
    const result = await retry.execute(async () => {
      return await httpClient.post<FlowData>('/flows/generate', {
        description,
      });
    });
    return result;
  }

  async deleteFlow(flowId: string): Promise<SuccessResponse> {
    const result = await retry.execute(async () => {
      return await httpClient.delete<SuccessResponse>(`/flows/${flowId}`);
    });
    return result;
  }
}

// ==================== 工厂函数 ====================

export function createFlowApi(): FlowApi {
  return new FlowApiImpl();
}

// ==================== 单例导出 ====================

export const flowApi = createFlowApi();
