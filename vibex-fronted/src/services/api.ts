import axios, { AxiosInstance, AxiosError } from 'axios';

// ==================== 类型定义 ====================

// 用户
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserUpdate {
  name?: string;
  avatar?: string | null;
}

// 认证
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// 项目
export interface Project {
  id: string;
  name: string;
  userId: string;
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
  pages?: Page[];
}

export interface ProjectCreate {
  name: string;
  description?: string;
  userId: string;
}

export interface ProjectUpdate {
  name?: string;
  description?: string | null;
}

// 消息
export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  projectId: string;
  createdAt?: string;
}

export interface MessageCreate {
  content: string;
  projectId: string;
  role?: 'user' | 'assistant' | 'system';
}

// 流程图
export interface FlowData {
  id: string;
  nodes: any[];
  edges: any[];
  projectId: string;
  name?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface FlowDataUpdate {
  nodes?: any[];
  edges?: any[];
  name?: string | null;
}

// Agent
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

// 页面
export interface Page {
  id: string;
  name: string;
  content?: string | null;
  projectId: string;
  createdAt?: string;
  updatedAt?: string;
  project?: Project;
}

export interface PageCreate {
  name: string;
  content?: string | null;
  projectId: string;
}

export interface PageUpdate {
  name?: string;
  content?: string | null;
}

// 通用响应
export interface SuccessResponse {
  success: boolean;
}

export interface ApiError {
  error: string;
}

// ==================== API 服务类 ====================

export class ApiService {
  private client: AxiosInstance;
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAY = 1000;

  constructor(baseURL: string = process.env.NEXT_PUBLIC_API_BASE_URL || '/api') {
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
          return Promise.reject(this.transformError(error));
        }
      );
    }
  }

  // 转换错误为用户友好的消息
  private transformError(error: AxiosError | Error): Error {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      let message = '操作失败，请稍后重试';

      switch (status) {
        case 400:
          message = error.response?.data?.error || '请求参数错误';
          break;
        case 401:
          message = '登录已过期，请重新登录';
          break;
        case 403:
          message = '没有权限执行此操作';
          break;
        case 404:
          message = '请求的资源不存在';
          break;
        case 409:
          message = '该邮箱已被注册';
          break;
        case 500:
          message = '服务器错误，请稍后重试';
          break;
        default:
          message = error.response?.data?.error || '网络错误，请检查网络连接';
      }

      return new Error(message);
    }
    return error;
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
    if (axios.isAxiosError(error)) {
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

  private clearCache(key: string): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(this.getCacheKey(key));
  }

  // ==================== 认证 ====================

  /**
   * 用户登录
   */
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    return this.withRetry(async () => {
      const response = await this.client.post<AuthResponse>('/auth/login', credentials);
      // 保存 token
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', response.data.token);
      }
      return response.data;
    });
  }

  /**
   * 用户注册
   */
  async register(data: RegisterRequest): Promise<AuthResponse> {
    return this.withRetry(async () => {
      const response = await this.client.post<AuthResponse>('/auth/register', data);
      // 保存 token
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', response.data.token);
      }
      return response.data;
    });
  }

  /**
   * 用户登出
   */
  async logout(): Promise<SuccessResponse> {
    return this.withRetry(async () => {
      const response = await this.client.post<SuccessResponse>('/auth/logout');
      // 清除 token
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
      }
      return response.data;
    });
  }

  // ==================== 用户 ====================

  /**
   * 获取用户信息
   */
  async getUser(userId: string): Promise<User> {
    const cacheKey = `user_${userId}`;
    const cached = this.getFromCache<User>(cacheKey);
    
    if (!this.isOnline() && cached) {
      return cached;
    }

    return this.withRetry(async () => {
      const response = await this.client.get<{ user: User }>(`/users/${userId}`);
      this.setToCache(cacheKey, response.data.user);
      return response.data.user;
    });
  }

  /**
   * 更新用户信息
   */
  async updateUser(userId: string, data: UserUpdate): Promise<User> {
    return this.withRetry(async () => {
      const response = await this.client.put<{ user: User }>(`/users/${userId}`, data);
      this.clearCache(`user_${userId}`);
      return response.data.user;
    });
  }

  // ==================== 项目 ====================

  /**
   * 获取项目列表
   */
  async getProjects(userId: string): Promise<Project[]> {
    const cacheKey = `projects_${userId}`;
    const cached = this.getFromCache<Project[]>(cacheKey);
    
    if (!this.isOnline() && cached) {
      return cached;
    }

    return this.withRetry(async () => {
      const response = await this.client.get<{ projects: Project[] }>('/projects', { params: { userId } });
      this.setToCache(cacheKey, response.data.projects);
      return response.data.projects;
    });
  }

  /**
   * 创建项目
   */
  async createProject(project: ProjectCreate): Promise<Project> {
    return this.withRetry(async () => {
      const response = await this.client.post<{ project: Project }>('/projects', project);
      // 清除项目列表缓存
      this.clearCache(`projects_${project.userId}`);
      return response.data.project;
    });
  }

  /**
   * 获取单个项目
   */
  async getProject(projectId: string): Promise<Project> {
    const cacheKey = `project_${projectId}`;
    const cached = this.getFromCache<Project>(cacheKey);
    
    if (!this.isOnline() && cached) {
      return cached;
    }

    return this.withRetry(async () => {
      const response = await this.client.get<{ project: Project }>(`/projects/${projectId}`);
      this.setToCache(cacheKey, response.data.project);
      return response.data.project;
    });
  }

  /**
   * 更新项目
   */
  async updateProject(projectId: string, data: ProjectUpdate): Promise<Project> {
    return this.withRetry(async () => {
      const response = await this.client.put<{ project: Project }>(`/projects/${projectId}`, data);
      this.clearCache(`project_${projectId}`);
      return response.data.project;
    });
  }

  /**
   * 删除项目
   */
  async deleteProject(projectId: string): Promise<SuccessResponse> {
    return this.withRetry(async () => {
      const response = await this.client.delete<SuccessResponse>(`/projects/${projectId}`);
      return response.data;
    });
  }

  // ==================== 消息 ====================

  /**
   * 获取消息列表
   */
  async getMessages(projectId: string): Promise<Message[]> {
    const cacheKey = `messages_${projectId}`;
    const cached = this.getFromCache<Message[]>(cacheKey);
    
    if (!this.isOnline() && cached) {
      return cached;
    }

    return this.withRetry(async () => {
      const response = await this.client.get<Message[]>('/messages', { params: { projectId } });
      this.setToCache(cacheKey, response.data);
      return response.data;
    });
  }

  /**
   * 创建消息
   */
  async createMessage(message: MessageCreate): Promise<Message> {
    return this.withRetry(async () => {
      const response = await this.client.post<Message>('/messages', message);
      // 清除消息缓存
      this.clearCache(`messages_${message.projectId}`);
      return response.data;
    });
  }

  /**
   * 删除消息
   */
  async deleteMessage(messageId: string): Promise<SuccessResponse> {
    return this.withRetry(async () => {
      const response = await this.client.delete<SuccessResponse>(`/messages/${messageId}`);
      return response.data;
    });
  }

  // ==================== 流程图 ====================

  /**
   * 获取流程图
   */
  async getFlow(flowId: string): Promise<FlowData> {
    const cacheKey = `flow_${flowId}`;
    const cached = this.getFromCache<FlowData>(cacheKey);
    
    if (!this.isOnline() && cached) {
      return cached;
    }

    return this.withRetry(async () => {
      const response = await this.client.get<FlowData>(`/flows/${flowId}`);
      this.setToCache(cacheKey, response.data);
      return response.data;
    });
  }

  /**
   * 更新流程图
   */
  async updateFlow(flowId: string, data: FlowDataUpdate): Promise<FlowData> {
    return this.withRetry(async () => {
      const response = await this.client.put<FlowData>(`/flows/${flowId}`, data);
      this.clearCache(`flow_${flowId}`);
      return response.data;
    });
  }

  /**
   * 删除流程图
   */
  async deleteFlow(flowId: string): Promise<SuccessResponse> {
    return this.withRetry(async () => {
      const response = await this.client.delete<SuccessResponse>(`/flows/${flowId}`);
      return response.data;
    });
  }

  // ==================== Agent ====================

  /**
   * 获取 Agent 列表
   */
  async getAgents(userId?: string): Promise<Agent[]> {
    const cacheKey = `agents_${userId || 'all'}`;
    const cached = this.getFromCache<Agent[]>(cacheKey);
    
    if (!this.isOnline() && cached) {
      return cached;
    }

    return this.withRetry(async () => {
      const response = await this.client.get<{ agents: Agent[] }>('/agents', { params: { userId } });
      this.setToCache(cacheKey, response.data.agents);
      return response.data.agents;
    });
  }

  /**
   * 创建 Agent
   */
  async createAgent(agent: AgentCreate): Promise<Agent> {
    return this.withRetry(async () => {
      const response = await this.client.post<{ agent: Agent }>('/agents', agent);
      // 清除缓存
      this.clearCache(`agents_${agent.userId}`);
      return response.data.agent;
    });
  }

  /**
   * 获取单个 Agent
   */
  async getAgent(agentId: string): Promise<Agent> {
    const cacheKey = `agent_${agentId}`;
    const cached = this.getFromCache<Agent>(cacheKey);
    
    if (!this.isOnline() && cached) {
      return cached;
    }

    return this.withRetry(async () => {
      const response = await this.client.get<{ agent: Agent }>(`/agents/${agentId}`);
      this.setToCache(cacheKey, response.data.agent);
      return response.data.agent;
    });
  }

  /**
   * 更新 Agent
   */
  async updateAgent(agentId: string, data: AgentUpdate): Promise<Agent> {
    return this.withRetry(async () => {
      const response = await this.client.put<{ agent: Agent }>(`/agents/${agentId}`, data);
      this.clearCache(`agent_${agentId}`);
      return response.data.agent;
    });
  }

  /**
   * 删除 Agent
   */
  async deleteAgent(agentId: string): Promise<SuccessResponse> {
    return this.withRetry(async () => {
      const response = await this.client.delete<SuccessResponse>(`/agents/${agentId}`);
      return response.data;
    });
  }

  // ==================== 页面 ====================

  /**
   * 获取页面列表
   */
  async getPages(projectId?: string): Promise<Page[]> {
    const cacheKey = `pages_${projectId || 'all'}`;
    const cached = this.getFromCache<Page[]>(cacheKey);
    
    if (!this.isOnline() && cached) {
      return cached;
    }

    return this.withRetry(async () => {
      const response = await this.client.get<{ pages: Page[] }>('/pages', { params: { projectId } });
      this.setToCache(cacheKey, response.data.pages);
      return response.data.pages;
    });
  }

  /**
   * 创建页面
   */
  async createPage(page: PageCreate): Promise<Page> {
    return this.withRetry(async () => {
      const response = await this.client.post<{ page: Page }>('/pages', page);
      // 清除缓存
      if (page.projectId) {
        this.clearCache(`pages_${page.projectId}`);
      }
      return response.data.page;
    });
  }

  /**
   * 获取单个页面
   */
  async getPage(pageId: string): Promise<Page> {
    const cacheKey = `page_${pageId}`;
    const cached = this.getFromCache<Page>(cacheKey);
    
    if (!this.isOnline() && cached) {
      return cached;
    }

    return this.withRetry(async () => {
      const response = await this.client.get<{ page: Page }>(`/pages/${pageId}`);
      this.setToCache(cacheKey, response.data.page);
      return response.data.page;
    });
  }

  /**
   * 更新页面
   */
  async updatePage(pageId: string, data: PageUpdate): Promise<Page> {
    return this.withRetry(async () => {
      const response = await this.client.put<{ page: Page }>(`/pages/${pageId}`, data);
      this.clearCache(`page_${pageId}`);
      return response.data.page;
    });
  }

  /**
   * 删除页面
   */
  async deletePage(pageId: string): Promise<SuccessResponse> {
    return this.withRetry(async () => {
      const response = await this.client.delete<SuccessResponse>(`/pages/${pageId}`);
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
