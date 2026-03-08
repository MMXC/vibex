import { Agent, AgentCreate, AgentUpdate } from '../types/agent';
import { SuccessResponse } from '../types/common';
import { httpClient } from '../client';
import { retry } from '../retry';
import { cache, getCacheKey } from '../cache';

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
      const response = await httpClient.get<{ agents: Agent[] }>('/agents', {
        params: { userId },
      });
      const agents: Agent[] = (response as any).agents || response;
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
      const response = await httpClient.get<{ agent: Agent }>(
        `/agents/${agentId}`
      );
      const agent: Agent = (response as any).agent || response;
      cache.set(cacheKey, agent);
      return agent;
    });
  }

  async createAgent(agent: AgentCreate): Promise<Agent> {
    return retry.execute(async () => {
      const response = await httpClient.post<{ agent: Agent }>(
        '/agents',
        agent
      );
      const created: Agent = (response as any).agent || response;
      cache.remove(getCacheKey('agents', agent.userId));
      return created;
    });
  }

  async updateAgent(agentId: string, data: AgentUpdate): Promise<Agent> {
    return retry.execute(async () => {
      const response = await httpClient.put<{ agent: Agent }>(
        `/agents/${agentId}`,
        data
      );
      const agent: Agent = (response as any).agent || response;
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
