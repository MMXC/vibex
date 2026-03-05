// ==================== Agent 相关类型 ====================

export interface Agent {
  id: string;
  name: string;
  prompt: string;
  model?: string;
  temperature?: number;
  userId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AgentCreate {
  name: string;
  prompt: string;
  model?: string;
  temperature?: number;
  userId: string;
}

export interface AgentUpdate {
  name?: string;
  prompt?: string;
  model?: string;
  temperature?: number;
}
