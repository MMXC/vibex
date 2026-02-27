import axios, { AxiosInstance, AxiosError } from 'axios';

// 类型定义
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface Project {
  id: string;
  name: string;
  userId: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  projectId: string;
  createdAt?: string;
}

export interface FlowData {
  id: string;
  nodes: any[];
  edges: any[];
  projectId: string;
  name?: string;
  createdAt?: string;
  updatedAt?: string;
}

// API 服务类
export class ApiService {
  private client: AxiosInstance;
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAY = 1000;

  constructor(baseURL: string = '/api') {
    this.client = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // 请求拦截器 - 添加认证token
    if (this.client.interceptors?.request) {
      this.client.interceptors.request.use(
        (config: any) => {
          const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
          return config;
        },
        (error: any) => Promise.reject(error)
      );
    }

    // 响应拦截器 - 统一错误处理
    if (this.client.interceptors?.response) {
      this.client.interceptors.response.use(
        (response: any) => response,
        (error: any) => {
          if (error.response?.status === 401) {
            // Token 过期，清除本地存储
            if (typeof window !== 'undefined') {
              localStorage.removeItem('auth_token');
            }
          }
          return Promise.reject(error);
        }
      );
    }
  }

  // 错误重试机制
  private async withRetry<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < ApiService.MAX_RETRIES; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        
        // 判断是否可重试
        if (this.isRetryableError(error)) {
          await this.delay(ApiService.RETRY_DELAY * (attempt + 1));
          continue;
        }
        throw error;
      }
    }
    
    throw lastError;
  }

  private isRetryableError(error: unknown): boolean {
    if (error instanceof AxiosError) {
      // 网络错误或服务器错误可重试
      return !error.response || error.response.status >= 500;
    }
    return false;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 检测网络状态
  public isOnline(): boolean {
    if (typeof navigator !== 'undefined') {
      return navigator.onLine;
    }
    return true;
  }

  // 本地缓存
  private getCacheKey(key: string): string {
    return `vibex_cache_${key}`;
  }

  private getFromCache<T>(key: string): T | null {
    if (typeof localStorage === 'undefined') return null;
    const cached = localStorage.getItem(this.getCacheKey(key));
    return cached ? JSON.parse(cached) : null;
  }

  private setToCache<T>(key: string, data: T): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(this.getCacheKey(key), JSON.stringify(data));
  }

  // ==================== 用户数据 ====================
  
  async saveUser(user: Partial<User>): Promise<User> {
    return this.withRetry(async () => {
      const response = await this.client.put(`/users/${user.id}`, user);
      return response.data;
    });
  }

  async getUser(userId: string): Promise<User> {
    // 尝试从缓存获取
    const cacheKey = `user_${userId}`;
    const cached = this.getFromCache<User>(cacheKey);
    
    if (!this.isOnline() && cached) {
      return cached;
    }

    return this.withRetry(async () => {
      const response = await this.client.get(`/users/${userId}`);
      this.setToCache(cacheKey, response.data);
      return response.data;
    });
  }

  // ==================== 项目数据 ====================

  async saveProject(project: Partial<Project>): Promise<Project> {
    return this.withRetry(async () => {
      const response = await this.client.put(`/projects/${project.id}`, project);
      return response.data;
    });
  }

  async getProjects(userId: string): Promise<Project[]> {
    const cacheKey = `projects_${userId}`;
    const cached = this.getFromCache<Project[]>(cacheKey);
    
    if (!this.isOnline() && cached) {
      return cached;
    }

    return this.withRetry(async () => {
      const response = await this.client.get(`/projects`, { params: { userId } });
      this.setToCache(cacheKey, response.data);
      return response.data;
    });
  }

  async getProject(projectId: string): Promise<Project> {
    return this.withRetry(async () => {
      const response = await this.client.get(`/projects/${projectId}`);
      return response.data;
    });
  }

  async deleteProject(projectId: string): Promise<{ success: boolean }> {
    return this.withRetry(async () => {
      const response = await this.client.delete(`/projects/${projectId}`);
      return response.data;
    });
  }

  // ==================== 对话历史 ====================

  async saveMessage(message: Partial<Message>): Promise<Message> {
    return this.withRetry(async () => {
      const response = await this.client.post(`/messages`, message);
      return response.data;
    });
  }

  async getMessages(projectId: string): Promise<Message[]> {
    const cacheKey = `messages_${projectId}`;
    const cached = this.getFromCache<Message[]>(cacheKey);
    
    if (!this.isOnline() && cached) {
      return cached;
    }

    return this.withRetry(async () => {
      const response = await this.client.get(`/messages`, { params: { projectId } });
      this.setToCache(cacheKey, response.data);
      return response.data;
    });
  }

  async deleteMessage(messageId: string): Promise<{ success: boolean }> {
    return this.withRetry(async () => {
      const response = await this.client.delete(`/messages/${messageId}`);
      return response.data;
    });
  }

  // ==================== 流程图数据 ====================

  async saveFlow(flow: Partial<FlowData>): Promise<FlowData> {
    return this.withRetry(async () => {
      const response = await this.client.put(`/flows/${flow.id}`, flow);
      return response.data;
    });
  }

  async getFlow(flowId: string): Promise<FlowData> {
    const cacheKey = `flow_${flowId}`;
    const cached = this.getFromCache<FlowData>(cacheKey);
    
    if (!this.isOnline() && cached) {
      return cached;
    }

    return this.withRetry(async () => {
      const response = await this.client.get(`/flows/${flowId}`);
      this.setToCache(cacheKey, response.data);
      return response.data;
    });
  }

  async deleteFlow(flowId: string): Promise<{ success: boolean }> {
    return this.withRetry(async () => {
      const response = await this.client.delete(`/flows/${flowId}`);
      return response.data;
    });
  }

  // ==================== 离线队列 ====================

  private offlineQueue: Array<{ fn: () => Promise<any>; key: string }> = [];

  async queueOfflineRequest(key: string, requestFn: () => Promise<any>): Promise<any> {
    if (this.isOnline()) {
      return requestFn();
    }

    // 离线时加入队列
    this.offlineQueue.push({ fn: requestFn, key });
    
    // 尝试缓存关键数据
    this.setToCache(`offline_queue_${key}`, { key, timestamp: Date.now() });
    
    throw new Error('Offline - request queued');
  }

  async processOfflineQueue(): Promise<void> {
    if (!this.isOnline() || this.offlineQueue.length === 0) return;

    const queue = [...this.offlineQueue];
    this.offlineQueue = [];

    for (const request of queue) {
      try {
        await request.fn();
      } catch (error) {
        // 重试失败，重新加入队列
        this.offlineQueue.push(request);
      }
    }
  }
}

// 导出单例
export const apiService = new ApiService();
export default apiService;
