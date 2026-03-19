import { Agent, AgentCreate, AgentUpdate } from '../types/agent';
import { SuccessResponse } from '../types/common';
import { httpClient } from '../client';
import { retry } from '../retry';
import { cache, getCacheKey } from '../cache';
import { unwrapField } from '../unwrappers';

// ==================== 接口定义 ====================

export interface AgentApi {
  getAgents(userId?: string): Promise<Agent[]>;
  getAgent(agentId: string): Promise<Agent>;
  createAgent(agent: AgentCreate): Promise<Agent>;
  updateAgent(agentId: string, data: AgentUpdate): Promise<Agent>;
  deleteAgent(agentId: string): Promise<SuccessResponse>;
}

// ==================== 实现 ====================

class AgentApiImpl implements AgentApi {
  private isOnline(): boolean {
    if (typeof navigator !== 'undefined') {
      return navigator.onLine;
    }
    return true;
  }

  async getAgents(userId?: string): Promise<Agent[]> {
    const cacheKey = getCacheKey('agents', userId || 'all');
    const cached = cache.get<Agent[]>(cacheKey);

    if (!this.isOnline() && cached) {
      return cached;
    }

    return retry.execute(async () => {
      const response = await httpClient.get<Agent[]>('/agents', {
        params: { userId },
      });
      const agents = unwrapField<Agent[]>(response, 'agents');
      cache.set(cacheKey, agents);
      return agents;
    });
  }

  async getAgent(agentId: string): Promise<Agent> {
    const cacheKey = getCacheKey('agent', agentId);
    const cached = cache.get<Agent>(cacheKey);

    if (!this.isOnline() && cached) {
      return cached;
    }

    return retry.execute(async () => {
      const response = await httpClient.get<Agent>(`/agents/${agentId}`);
      const agent = unwrapField<Agent>(response, 'agent');
      cache.set(cacheKey, agent);
      return agent;
    });
  }

  async createAgent(agent: AgentCreate): Promise<Agent> {
    return retry.execute(async () => {
      const response = await httpClient.post<Agent>('/agents', agent);
      const created = unwrapField<Agent>(response, 'agent');
      cache.remove(getCacheKey('agents', agent.userId));
      return created;
    });
  }

  async updateAgent(agentId: string, data: AgentUpdate): Promise<Agent> {
    return retry.execute(async () => {
      const response = await httpClient.put<Agent>(
        `/agents/${agentId}`,
        data
      );
      const agent = unwrapField<Agent>(response, 'agent');
      cache.remove(getCacheKey('agent', agentId));
      return agent;
    });
  }

  async deleteAgent(agentId: string): Promise<SuccessResponse> {
    return retry.execute(async () => {
      const response = await httpClient.delete<SuccessResponse>(
        `/agents/${agentId}`
      );
      return response;
    });
  }
}

// ==================== 工厂函数 ====================

export function createAgentApi(): AgentApi {
  return new AgentApiImpl();
}

// ==================== 单例导出 ====================

export const agentApi = createAgentApi();
