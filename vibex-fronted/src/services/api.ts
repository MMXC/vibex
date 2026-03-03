import axios, { AxiosInstance, AxiosError, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { Node, Edge } from 'reactflow';

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
  deletedAt?: string | null;
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
  quotedMessageId?: string;
  quotedContent?: string;
}

export interface MessageCreate {
  content: string;
  projectId: string;
  role?: 'user' | 'assistant' | 'system';
  quotedMessageId?: string;
}

// 流程图
export interface FlowData {
  id: string;
  nodes: Node[];
  edges: Edge[];
  projectId: string;
  name?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface FlowDataUpdate {
  nodes?: Node[];
  edges?: Edge[];
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

// ==================== AI 原型设计工具类型 ====================

// 需求
export interface Requirement {
  id: string;
  userId: string;
  content: string;
  templateId?: string | null;
  status: RequirementStatus;
  analysisResult?: AnalysisResult | null;
  createdAt?: string;
  updatedAt?: string;
}

export type RequirementStatus = 'draft' | 'analyzing' | 'clarifying' | 'completed' | 'failed';

export interface RequirementCreate {
  content: string;
  templateId?: string;
  userId: string;
}

export interface RequirementUpdate {
  content?: string;
  templateId?: string;
  status?: RequirementStatus;
}

// 需求分析结果
export interface AnalysisResult {
  requirementId: string;
  domains: DomainEntity[];
  relations: EntityRelation[];
  uiSchema?: UISchema;
  confidence: number;
  analyzedAt: string;
}

// 领域实体
export interface DomainEntity {
  id: string;
  requirementId: string;
  name: string;
  type: EntityType;
  description?: string;
  attributes: EntityAttribute[];
  position?: { x: number; y: number };
  createdAt?: string;
}

export type EntityType = 'user' | 'system' | 'business' | 'data' | 'external' | 'abstract';

export interface EntityAttribute {
  name: string;
  type: string;
  required: boolean;
  description?: string;
}

// 实体关系
export interface EntityRelation {
  id: string;
  fromEntityId: string;
  toEntityId: string;
  relationType: string;
  description?: string;
  createdAt?: string;
}

export type RelationType = 'inheritance' | 'composition' | 'aggregation' | 'association' | 'dependency' | 'realization';

// UI Schema
export interface UISchema {
  version: string;
  pages: UIPage[];
  theme?: UITheme;
}

export interface UIPage {
  id: string;
  name: string;
  route: string;
  components: UIComponent[];
  layout?: UILayout;
}

export interface UIComponent {
  id: string;
  type: string;
  props: Record<string, any>;
  children?: UIComponent[];
}

export type ComponentType = 'form' | 'table' | 'list' | 'card' | 'navigation' | 'chart' | 'media' | 'layout' | 'input' | 'button' | 'text' | 'image' | 'container';

export interface UILayout {
  type: 'single' | 'split' | 'grid' | 'sidebar';
  sections?: UISection[];
}

export interface UISection {
  id: string;
  components: string[]; // component ids
  ratio?: number;
}

// UI Theme
export interface UITheme {
  colors: ThemeColors;
  typography: ThemeTypography;
  spacing: ThemeSpacing;
  responsive: ThemeResponsive;
}

export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  border: string;
  [key: string]: string;
}

export interface ThemeTypography {
  fontFamily: string;
  fontSize: Record<string, string>;
  fontWeight: Record<string, number>;
  lineHeight: Record<string, number>;
}

export interface ThemeSpacing {
  unit: number;
  scale: number[];
}

export interface ThemeResponsive {
  breakpoints: Record<string, number>;
}

// 原型快照
export interface PrototypeSnapshot {
  id: string;
  projectId: string;
  version: number;
  name?: string;
  description?: string;
  content?: string; // JSON: 界面快照数据
  createdAt?: string;
  updatedAt?: string;
}

export interface PrototypeSnapshotCreate {
  projectId: string;
  version?: number;
  name?: string;
  description?: string;
  content?: string;
}

// 反馈
export interface Feedback {
  id: string;
  prototypeSnapshotId: string;
  userId: string;
  type: FeedbackType;
  content: string;
  position?: { x: number; y: number };
  status: FeedbackStatus;
  createdAt?: string;
}

export type FeedbackType = 'bug' | 'suggestion' | 'question' | 'praise';
export type FeedbackStatus = 'open' | 'resolved' | 'dismissed';

export interface FeedbackCreate {
  prototypeSnapshotId: string;
  type: FeedbackType;
  content: string;
  position?: { x: number; y: number };
}

// 澄清对话
export interface Clarification {
  id: string;
  requirementId: string;
  question: string;
  answer?: string;
  status: ClarificationStatus;
  createdAt?: string;
}

export type ClarificationStatus = 'pending' | 'answered' | 'skipped';

// 对话分支
export interface ConversationBranch {
  id: string;
  parentMessageId: string;
  branchName: string;
  messages: Message[];
  createdAt?: string;
}

export interface ConversationBranchCreate {
  parentMessageId: string;
  branchName: string;
}

// ==================== API 服务类 ====================

export class ApiService {
  private client: AxiosInstance;
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAY = 1000;

  constructor(baseURL: string = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.vibex.top/api') {
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
        (config: InternalAxiosRequestConfig) => {
          const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
          if (token) {
            (config.headers as any) = (config.headers as any) || {};
            (config.headers as any).Authorization = `Bearer ${token}`;
          }
          return config;
        },
        (error: AxiosError) => Promise.reject(error)
      );
    }

    // 响应拦截器 - 统一错误处理
    if (this.client.interceptors?.response) {
      this.client.interceptors.response.use(
        (response: AxiosResponse) => response,
        (error: AxiosError) => {
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
  async login(credentials: LoginRequest): Promise<AuthResponse | { data: AuthResponse }> {
    return this.withRetry(async () => {
      const response = await this.client.post<{ data: AuthResponse }>('/auth/login', credentials);
      // 响应适配：提取 response.data.data
      const data = response.data.data || response.data;
      // 保存 token 和用户信息
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', (data as AuthResponse).token);
        localStorage.setItem('user_id', (data as AuthResponse).user.id);
      }
      return data;
    });
  }

  /**
   * 用户注册
   */
  async register(data: RegisterRequest): Promise<AuthResponse | { data: AuthResponse }> {
    return this.withRetry(async () => {
      const response = await this.client.post<{ data: AuthResponse }>('/auth/register', data);
      // 响应适配：提取 response.data.data
      const result = response.data.data || response.data;
      // 保存 token 和用户信息
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', (result as AuthResponse).token);
        localStorage.setItem('user_id', (result as AuthResponse).user.id);
      }
      return result;
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
      return (response.data as any);
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
      return (response.data as any).user;
    });
  }

  /**
   * 更新用户信息
   */
  async updateUser(userId: string, data: UserUpdate): Promise<User> {
    return this.withRetry(async () => {
      const response = await this.client.put<{ user: User }>(`/users/${userId}`, data);
      this.clearCache(`user_${userId}`);
      return (response.data as any).user;
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
      return (response.data as any).projects;
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
      return (response.data as any).project;
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
      return (response.data as any).project;
    });
  }

  /**
   * 更新项目
   */
  async updateProject(projectId: string, data: ProjectUpdate): Promise<Project> {
    return this.withRetry(async () => {
      const response = await this.client.put<{ project: Project }>(`/projects/${projectId}`, data);
      this.clearCache(`project_${projectId}`);
      return (response.data as any).project;
    });
  }

  /**
   * 删除项目
   */
  async deleteProject(projectId: string): Promise<SuccessResponse> {
    return this.withRetry(async () => {
      const response = await this.client.delete<SuccessResponse>(`/projects/${projectId}`);
      return (response.data as any);
    });
  }

  /**
   * 软删除项目（移到回收站）
   */
  async softDeleteProject(projectId: string): Promise<Project> {
    return this.withRetry(async () => {
      const response = await this.client.patch<{ project: Project }>(`/projects/${projectId}/soft-delete`, {});
      return (response.data as any).project;
    });
  }

  /**
   * 恢复已删除的项目
   */
  async restoreProject(projectId: string): Promise<Project> {
    return this.withRetry(async () => {
      const response = await this.client.patch<{ project: Project }>(`/projects/${projectId}/restore`, {});
      return (response.data as any).project;
    });
  }

  /**
   * 永久删除项目
   */
  async permanentDeleteProject(projectId: string): Promise<SuccessResponse> {
    return this.withRetry(async () => {
      const response = await this.client.delete<SuccessResponse>(`/projects/${projectId}/permanent`);
      return (response.data as any);
    });
  }

  /**
   * 获取回收站中的项目
   */
  async getDeletedProjects(): Promise<Project[]> {
    return this.withRetry(async () => {
      const response = await this.client.get<{ projects: Project[] }>('/projects/deleted');
      return (response.data as any).projects;
    });
  }

  /**
   * 清空回收站
   */
  async clearDeletedProjects(): Promise<SuccessResponse> {
    return this.withRetry(async () => {
      const response = await this.client.delete<SuccessResponse>('/projects/deleted-all');
      return (response.data as any);
    });
  }

  // ==================== 消息 ====================

  /**
   * 获取消息列表
   */
  async getMessages(projectId: string): Promise<Message[] | { messages: Message[] }> {
    const cacheKey = `messages_${projectId}`;
    const cached = this.getFromCache<Message[]>(cacheKey);
    
    if (!this.isOnline() && cached) {
      return cached;
    }

    return this.withRetry(async () => {
      const response = await this.client.get<{ messages: Message[] }>('/messages', { params: { projectId } });
      // 响应适配：提取 response.data.messages
      const messages = response.data.messages || (response.data as any as Message[]);
      this.setToCache(cacheKey, messages as Message[]);
      return messages as Message[];
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
      return (response.data as any);
    });
  }

  /**
   * 删除消息
   */
  async deleteMessage(messageId: string): Promise<SuccessResponse> {
    return this.withRetry(async () => {
      const response = await this.client.delete<SuccessResponse>(`/messages/${messageId}`);
      return (response.data as any);
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
      return (response.data as any);
    });
  }

  /**
   * 更新流程图
   */
  async updateFlow(flowId: string, data: FlowDataUpdate): Promise<FlowData> {
    return this.withRetry(async () => {
      const response = await this.client.put<FlowData>(`/flows/${flowId}`, data);
      this.clearCache(`flow_${flowId}`);
      return (response.data as any);
    });
  }

  /**
   * AI 生成流程图
   */
  async generateFlow(description: string): Promise<FlowData> {
    return this.withRetry(async () => {
      const response = await this.client.post<FlowData>('/flows/generate', { description });
      return (response.data as any);
    });
  }

  /**
   * 删除流程图
   */
  async deleteFlow(flowId: string): Promise<SuccessResponse> {
    return this.withRetry(async () => {
      const response = await this.client.delete<SuccessResponse>(`/flows/${flowId}`);
      return (response.data as any);
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
      return (response.data as any).agents;
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
      return (response.data as any).agent;
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
      return (response.data as any).agent;
    });
  }

  /**
   * 更新 Agent
   */
  async updateAgent(agentId: string, data: AgentUpdate): Promise<Agent> {
    return this.withRetry(async () => {
      const response = await this.client.put<{ agent: Agent }>(`/agents/${agentId}`, data);
      this.clearCache(`agent_${agentId}`);
      return (response.data as any).agent;
    });
  }

  /**
   * 删除 Agent
   */
  async deleteAgent(agentId: string): Promise<SuccessResponse> {
    return this.withRetry(async () => {
      const response = await this.client.delete<SuccessResponse>(`/agents/${agentId}`);
      return (response.data as any);
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
      return (response.data as any).pages;
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
      return (response.data as any).page;
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
      return (response.data as any).page;
    });
  }

  /**
   * 更新页面
   */
  async updatePage(pageId: string, data: PageUpdate): Promise<Page> {
    return this.withRetry(async () => {
      const response = await this.client.put<{ page: Page }>(`/pages/${pageId}`, data);
      this.clearCache(`page_${pageId}`);
      return (response.data as any).page;
    });
  }

  /**
   * 删除页面
   */
  async deletePage(pageId: string): Promise<SuccessResponse> {
    return this.withRetry(async () => {
      const response = await this.client.delete<SuccessResponse>(`/pages/${pageId}`);
      return (response.data as any);
    });
  }

  // ==================== 领域实体 (DomainEntity) ====================

  /**
   * 获取需求的所有领域实体
   */
  async getDomainEntities(requirementId: string): Promise<DomainEntity[]> {
    const cacheKey = `domain_entities_${requirementId}`;
    const cached = this.getFromCache<DomainEntity[]>(cacheKey);
    
    if (!this.isOnline() && cached) {
      return cached;
    }

    return this.withRetry(async () => {
      const response = await this.client.get<{ domainEntities: DomainEntity[] }>(`/domain-entities?requirementId=${requirementId}`);
      this.setToCache(cacheKey, response.data.domainEntities);
      return (response.data as any).domainEntities;
    });
  }

  /**
   * 获取单个领域实体
   */
  async getDomainEntity(entityId: string): Promise<DomainEntity> {
    const cacheKey = `domain_entity_${entityId}`;
    const cached = this.getFromCache<DomainEntity>(cacheKey);
    
    if (!this.isOnline() && cached) {
      return cached;
    }

    return this.withRetry(async () => {
      const response = await this.client.get<{ domain: DomainEntity }>(`/domains/${entityId}`);
      this.setToCache(cacheKey, response.data.domain);
      return (response.data as any).domain;
    });
  }

  /**
   * 创建领域实体
   */
  async createDomainEntity(entity: Omit<DomainEntity, 'id' | 'createdAt'>): Promise<DomainEntity> {
    return this.withRetry(async () => {
      const response = await this.client.post<{ domain: DomainEntity }>(`/requirements/${entity.requirementId}/domains`, entity);
      // 清除缓存
      this.clearCache(`domain_entities_${entity.requirementId}`);
      return (response.data as any).domain;
    });
  }

  /**
   * 更新领域实体
   */
  async updateDomainEntity(entityId: string, data: Partial<DomainEntity>): Promise<DomainEntity> {
    return this.withRetry(async () => {
      const response = await this.client.put<{ domain: DomainEntity }>(`/domains/${entityId}`, data);
      // 清除相关缓存
      if (data.requirementId) {
        this.clearCache(`domain_entities_${data.requirementId}`);
      }
      return (response.data as any).domain;
    });
  }

  /**
   * 删除领域实体
   */
  async deleteDomainEntity(entityId: string, requirementId: string): Promise<SuccessResponse> {
    return this.withRetry(async () => {
      const response = await this.client.delete<SuccessResponse>(`/domains/${entityId}`);
      this.clearCache(`domain_entities_${requirementId}`);
      return (response.data as any);
    });
  }

  // ==================== 实体关系 (EntityRelation) ====================

  /**
   * 获取需求的所有实体关系
   */
  async getEntityRelations(requirementId: string): Promise<EntityRelation[]> {
    const cacheKey = `entity_relations_${requirementId}`;
    const cached = this.getFromCache<EntityRelation[]>(cacheKey);
    
    if (!this.isOnline() && cached) {
      return cached;
    }

    return this.withRetry(async () => {
      const response = await this.client.get<{ entityRelations: EntityRelation[] }>(`/entity-relations?requirementId=${requirementId}`);
      this.setToCache(cacheKey, response.data.entityRelations);
      return (response.data as any).entityRelations;
    });
  }

  /**
   * 获取单个实体关系
   */
  async getEntityRelation(relationId: string): Promise<EntityRelation> {
    const cacheKey = `entity_relation_${relationId}`;
    const cached = this.getFromCache<EntityRelation>(cacheKey);
    
    if (!this.isOnline() && cached) {
      return cached;
    }

    return this.withRetry(async () => {
      const response = await this.client.get<{ entityRelation: EntityRelation }>(`/entity-relations/${relationId}`);
      this.setToCache(cacheKey, response.data.entityRelation);
      return (response.data as any).entityRelation;
    });
  }

  /**
   * 创建实体关系
   * @param relation 实体关系数据
   * @param requirementId 需求ID（用于清除缓存）
   */
  async createEntityRelation(relation: Omit<EntityRelation, 'id'>, requirementId?: string): Promise<EntityRelation> {
    return this.withRetry(async () => {
      const response = await this.client.post<{ entityRelation: EntityRelation }>(`/entity-relations`, relation);
      // 清除缓存
      if (requirementId) {
        this.clearCache(`entity_relations_${requirementId}`);
      }
      return (response.data as any).entityRelation;
    });
  }

  /**
   * 更新实体关系
   * @param relationId 关系ID
   * @param data 更新数据
   * @param requirementId 需求ID（用于清除缓存）
   */
  async updateEntityRelation(relationId: string, data: Partial<EntityRelation>, requirementId?: string): Promise<EntityRelation> {
    return this.withRetry(async () => {
      const response = await this.client.put<{ entityRelation: EntityRelation }>(`/entity-relations/${relationId}`, data);
      // 清除相关缓存
      if (requirementId) {
        this.clearCache(`entity_relations_${requirementId}`);
      }
      return (response.data as any).entityRelation;
    });
  }

  /**
   * 删除实体关系
   */
  async deleteEntityRelation(relationId: string, requirementId: string): Promise<SuccessResponse> {
    return this.withRetry(async () => {
      const response = await this.client.delete<SuccessResponse>(`/entity-relations/${relationId}`);
      this.clearCache(`entity_relations_${requirementId}`);
      return (response.data as any);
    });
  }

  // ==================== 原型快照 (PrototypeSnapshot) ====================

  /**
   * 获取项目的所有原型快照
   */
  async getPrototypeSnapshots(projectId: string): Promise<PrototypeSnapshot[]> {
    const cacheKey = `prototype_snapshots_${projectId}`;
    const cached = this.getFromCache<PrototypeSnapshot[]>(cacheKey);
    
    if (!this.isOnline() && cached) {
      return cached;
    }

    return this.withRetry(async () => {
      const response = await this.client.get<{ prototypeSnapshots: PrototypeSnapshot[] }>(`/prototype-snapshots?projectId=${projectId}`);
      this.setToCache(cacheKey, response.data.prototypeSnapshots);
      return (response.data as any).prototypeSnapshots;
    });
  }

  /**
   * 获取单个原型快照
   */
  async getPrototypeSnapshot(snapshotId: string): Promise<PrototypeSnapshot> {
    const cacheKey = `prototype_snapshot_${snapshotId}`;
    const cached = this.getFromCache<PrototypeSnapshot>(cacheKey);
    
    if (!this.isOnline() && cached) {
      return cached;
    }

    return this.withRetry(async () => {
      const response = await this.client.get<{ prototypeSnapshot: PrototypeSnapshot }>(`/prototype-snapshots/${snapshotId}`);
      this.setToCache(cacheKey, response.data.prototypeSnapshot);
      return (response.data as any).prototypeSnapshot;
    });
  }

  /**
   * 创建原型快照
   */
  async createPrototypeSnapshot(snapshot: PrototypeSnapshotCreate): Promise<PrototypeSnapshot> {
    return this.withRetry(async () => {
      const response = await this.client.post<{ prototypeSnapshot: PrototypeSnapshot }>(`/prototype-snapshots`, snapshot);
      // 清除缓存
      this.clearCache(`prototype_snapshots_${snapshot.projectId}`);
      return (response.data as any).prototypeSnapshot;
    });
  }

  /**
   * 更新原型快照
   */
  async updatePrototypeSnapshot(snapshotId: string, data: Partial<PrototypeSnapshotCreate>): Promise<PrototypeSnapshot> {
    return this.withRetry(async () => {
      const response = await this.client.put<{ prototypeSnapshot: PrototypeSnapshot }>(`/prototype-snapshots/${snapshotId}`, data);
      return (response.data as any).prototypeSnapshot;
    });
  }

  /**
   * 删除原型快照
   */
  async deletePrototypeSnapshot(snapshotId: string, projectId: string): Promise<SuccessResponse> {
    return this.withRetry(async () => {
      const response = await this.client.delete<SuccessResponse>(`/prototype-snapshots/${snapshotId}`);
      this.clearCache(`prototype_snapshots_${projectId}`);
      return (response.data as any);
    });
  }

  // ==================== 需求 (Requirement) ====================

  /**
   * 获取用户的所有需求
   */
  async getRequirements(userId: string): Promise<Requirement[]> {
    const cacheKey = `requirements_${userId}`;
    const cached = this.getFromCache<Requirement[]>(cacheKey);
    
    if (!this.isOnline() && cached) {
      return cached;
    }

    return this.withRetry(async () => {
      const response = await this.client.get<{ requirements: Requirement[] }>('/requirements', { params: { userId } });
      this.setToCache(cacheKey, response.data.requirements);
      return (response.data as any).requirements;
    });
  }

  /**
   * 创建需求
   */
  async createRequirement(requirement: RequirementCreate): Promise<Requirement> {
    return this.withRetry(async () => {
      const response = await this.client.post<{ requirement: Requirement }>('/requirements', requirement);
      // 清除缓存
      this.clearCache(`requirements_${requirement.userId}`);
      return (response.data as any).requirement;
    });
  }

  /**
   * 获取单个需求
   */
  async getRequirement(requirementId: string): Promise<Requirement> {
    const cacheKey = `requirement_${requirementId}`;
    const cached = this.getFromCache<Requirement>(cacheKey);
    
    if (!this.isOnline() && cached) {
      return cached;
    }

    return this.withRetry(async () => {
      const response = await this.client.get<{ requirement: Requirement }>(`/requirements/${requirementId}`);
      this.setToCache(cacheKey, response.data.requirement);
      return (response.data as any).requirement;
    });
  }

  /**
   * 更新需求
   * @param requirementId 需求ID
   * @param data 更新数据
   * @param userId 用户ID（用于清除列表缓存）
   */
  async updateRequirement(requirementId: string, data: RequirementUpdate, userId?: string): Promise<Requirement> {
    return this.withRetry(async () => {
      const response = await this.client.put<{ requirement: Requirement }>(`/requirements/${requirementId}`, data);
      // 清除缓存
      this.clearCache(`requirement_${requirementId}`);
      // 如果提供了 userId，也清除列表缓存
      if (userId) {
        this.clearCache(`requirements_${userId}`);
      }
      return (response.data as any).requirement;
    });
  }

  /**
   * 删除需求
   */
  async deleteRequirement(requirementId: string, userId: string): Promise<SuccessResponse> {
    return this.withRetry(async () => {
      const response = await this.client.delete<SuccessResponse>(`/requirements/${requirementId}`);
      // 清除缓存
      this.clearCache(`requirement_${requirementId}`);
      this.clearCache(`requirements_${userId}`);
      return (response.data as any);
    });
  }

  /**
   * 分析需求 (触发 AI 分析)
   */
  async analyzeRequirement(requirementId: string): Promise<Requirement> {
    return this.withRetry(async () => {
      const response = await this.client.post<{ requirement: Requirement }>(`/requirements/${requirementId}/analyze`);
      // 清除缓存
      this.clearCache(`requirement_${requirementId}`);
      return (response.data as any).requirement;
    });
  }

  /**
   * 重新分析需求 (带额外上下文)
   */
  async reanalyzeRequirement(requirementId: string, context?: Record<string, any>): Promise<Requirement> {
    return this.withRetry(async () => {
      const response = await this.client.post<{ requirement: Requirement }>(`/requirements/${requirementId}/reanalyze`, context);
      // 清除缓存
      this.clearCache(`requirement_${requirementId}`);
      return (response.data as any).requirement;
    });
  }

  // ==================== 澄清对话 (Clarification) ====================

  /**
   * 获取需求的澄清问题列表
   */
  async getClarifications(requirementId: string): Promise<Clarification[]> {
    const cacheKey = `clarifications_${requirementId}`;
    const cached = this.getFromCache<Clarification[]>(cacheKey);
    
    if (!this.isOnline() && cached) {
      return cached;
    }

    return this.withRetry(async () => {
      const response = await this.client.get<{ clarifications: Clarification[] }>(`/requirements/${requirementId}/clarifications`);
      this.setToCache(cacheKey, response.data.clarifications);
      return (response.data as any).clarifications;
    });
  }

  /**
   * 回答澄清问题
   */
  async answerClarification(requirementId: string, clarificationId: string, answer: string): Promise<Clarification> {
    return this.withRetry(async () => {
      const response = await this.client.put<{ clarification: Clarification }>(`/clarifications/${clarificationId}`, { answer });
      // 清除缓存
      this.clearCache(`clarifications_${requirementId}`);
      // 清除需求缓存，因为回答可能会改变需求状态
      this.clearCache(`requirement_${requirementId}`);
      return (response.data as any).clarification;
    });
  }

  /**
   * 跳过澄清问题
   */
  async skipClarification(requirementId: string, clarificationId: string): Promise<Clarification> {
    return this.withRetry(async () => {
      const response = await this.client.put<{ clarification: Clarification }>(`/clarifications/${clarificationId}`, { status: 'skipped' });
      // 清除缓存
      this.clearCache(`clarifications_${requirementId}`);
      return (response.data as any).clarification;
    });
  }

  // ==================== 需求分析结果 ====================

  /**
   * 获取需求的分析结果
   */
  async getAnalysisResult(requirementId: string): Promise<AnalysisResult | null> {
    const cacheKey = `analysis_result_${requirementId}`;
    const cached = this.getFromCache<AnalysisResult | null>(cacheKey);
    
    if (!this.isOnline() && cached) {
      return cached;
    }

    return this.withRetry(async () => {
      const response = await this.client.get<{ analysisResult: AnalysisResult }>(`/requirements/${requirementId}/analysis`);
      this.setToCache(cacheKey, response.data.analysisResult);
      return (response.data as any).analysisResult;
    });
  }

  // ==================== 离线队列 ====================

  private offlineQueue: Array<{ fn: () => Promise<unknown>; key: string }> = [];

  async queueOfflineRequest(key: string, requestFn: () => Promise<unknown>): Promise<unknown> {
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

// ==================== DDD Bounded Context ====================

export interface ContextRelationship {
  id: string
  fromContextId: string
  toContextId: string
  type: 'upstream' | 'downstream' | 'symmetric'
  description: string
}

export interface BoundedContext {
  id: string
  name: string
  description: string
  type: 'core' | 'supporting' | 'generic' | 'external'
  relationships: ContextRelationship[]
}

export interface BoundedContextResponse {
  success: boolean
  boundedContexts: BoundedContext[]
  mermaidCode?: string
  error?: string
}

/**
 * 生成限界上下文
 */
export async function generateBoundedContext(
  requirementText: string,
  projectId?: string
): Promise<BoundedContextResponse> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.vibex.top/api'
  
  const response = await fetch(`${baseUrl}/ddd/bounded-context`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      requirementText,
      projectId,
    }),
  })
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`)
  }
  
  return response.json()
}

/**
 * 生成领域模型
 */
export async function generateDomainModel(
  boundedContexts: BoundedContext[],
  requirementText: string,
  projectId?: string
): Promise<{ success: boolean; domainModels?: any[]; mermaidCode?: string; error?: string }> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.vibex.top/api'
  
  const response = await fetch(`${baseUrl}/ddd/domain-model`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      boundedContexts,
      requirementText,
      projectId,
    }),
  })
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`)
  }
  
  return response.json()
}

/**
 * 生成业务流程
 */
export async function generateBusinessFlow(
  domainModels: any[],
  requirementText: string,
  projectId?: string
): Promise<{ success: boolean; businessFlow?: any; mermaidCode?: string; error?: string }> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.vibex.top/api'
  
  const response = await fetch(`${baseUrl}/ddd/business-flow`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      domainModels,
      requirementText,
      projectId,
    }),
  })
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`)
  }
  
  return response.json()
}
