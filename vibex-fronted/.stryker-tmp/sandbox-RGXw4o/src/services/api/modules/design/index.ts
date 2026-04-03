/**
 * Design API Module
 * API 接口适配：clarify, domain, flow, pages
 */
// @ts-nocheck


import { httpClient } from '../../client';

// ==================== Types ====================

export interface EntityDerivationRequest {
  requirementText: string;
  sessionId?: string;
}

export interface DomainEntity {
  id: string;
  name: string;
  type: 'aggregate' | 'entity' | 'value-object' | 'domain-event';
  attributes: Array<{
    name: string;
    type: string;
    required: boolean;
  }>;
  relationships: Array<{
    target: string;
    type: string;
    description?: string;
  }>;
}

export interface EntityDerivationResponse {
  success: boolean;
  entities?: DomainEntity[];
  mermaidCode?: string;
  error?: string;
}

export interface ClarificationRequest {
  sessionId: string;
  question: string;
}

export interface ClarificationResponse {
  success: boolean;
  answer?: string;
  clarification?: {
    id: string;
    question: string;
    answer: string;
    timestamp: number;
    isAccepted: boolean;
  };
  error?: string;
}

export interface DomainModelRequest {
  sessionId: string;
  boundedContexts: Array<{
    id: string;
    name: string;
    description: string;
  }>;
  requirementText: string;
}

export interface DomainModelResponse {
  success: boolean;
  domainModels?: Array<{
    id: string;
    name: string;
    type: string;
    attributes: Array<{ name: string; type: string; required: boolean }>;
    relationships: Array<{ target: string; type: string }>;
  }>;
  mermaidCode?: string;
  error?: string;
}

export interface BusinessFlowRequest {
  sessionId: string;
  domainModels: unknown[];
  requirementText: string;
}

export interface BusinessFlowResponse {
  success: boolean;
  businessFlows?: Array<{
    id: string;
    name: string;
    steps: Array<{
      id: string;
      action: string;
      actor: string;
      result: string;
    }>;
    mermaidCode?: string;
  }>;
  error?: string;
}

export interface PageDerivationRequest {
  businessFlowId: string;
  domainEntities: Array<{ name: string; type: string }>;
  requirementText: string;
}

export interface PageDerivationResponse {
  success: boolean;
  pages?: Array<{
    id: string;
    name: string;
    route: string;
    type: string;
    components: Array<{
      type: string;
      props: Record<string, unknown>;
    }>;
    layout: Record<string, unknown>;
  }>;
  error?: string;
}

export interface PrototypeGenerationRequest {
  pages: Array<{
    name: string;
    route: string;
    components: unknown[];
  }>;
  theme?: Record<string, unknown>;
}

export interface PrototypeGenerationResponse {
  success: boolean;
  prototype?: {
    id: string;
    pages: Record<string, unknown>[];
    theme: Record<string, unknown>;
  };
  html?: string;
  error?: string;
}

export interface FlowDerivationRequest {
  domainEntities: Array<{
    name: string;
    type: string;
    attributes: Array<{ name: string; type: string }>;
  }>;
  requirementText: string;
}

export interface FlowDerivationResponse {
  success: boolean;
  flows?: Array<{
    id: string;
    name: string;
    type: string;
    steps: Array<{
      id: string;
      action: string;
      actor: string;
      result: string;
    }>;
    mermaidCode?: string;
  }>;
  error?: string;
}

export interface UIPageRequest {
  sessionId: string;
  businessFlowId: string;
}

export interface UIPageResponse {
  success: boolean;
  pages?: Array<{
    id: string;
    name: string;
    route: string;
    components: unknown[];
    layout: Record<string, unknown>;
  }>;
  error?: string;
}

// ==================== API Interface ====================

export interface DesignApi {
  // Clarification
  askClarification(req: ClarificationRequest): Promise<ClarificationResponse>;
  acceptClarification(sessionId: string, clarificationId: string): Promise<{ success: boolean }>;
  
  // Domain Model
  generateDomainModel(req: DomainModelRequest): Promise<DomainModelResponse>;
  
  // Entity Derivation
  deriveEntities(req: EntityDerivationRequest): Promise<EntityDerivationResponse>;
  
  // Business Flow
  generateBusinessFlow(req: BusinessFlowRequest): Promise<BusinessFlowResponse>;
  
  // UI Pages
  generateUIPages(req: UIPageRequest): Promise<UIPageResponse>;
  
  // Page Derivation
  derivePages(req: PageDerivationRequest): Promise<PageDerivationResponse>;
  
  // Prototype Generation
  generatePrototype(req: PrototypeGenerationRequest): Promise<PrototypeGenerationResponse>;
  
  // Flow Derivation
  deriveFlows(req: FlowDerivationRequest): Promise<FlowDerivationResponse>;
  
  // Session
  createSession(projectId?: string): Promise<{ sessionId: string }>;
  getSession(sessionId: string): Promise<unknown>;
  deleteSession(sessionId: string): Promise<{ success: boolean }>;
}

// ==================== Implementation ====================

class DesignApiImpl implements DesignApi {
  async askClarification(req: ClarificationRequest): Promise<ClarificationResponse> {
    const response = await httpClient.post<ClarificationResponse>('/clarify/ask', req);
    return response;
  }
  
  async acceptClarification(sessionId: string, clarificationId: string): Promise<{ success: boolean }> {
    const response = await httpClient.post<{ success: boolean }>('/clarify/accept', {
      sessionId,
      clarificationId,
    });
    return response;
  }
  
  async generateDomainModel(req: DomainModelRequest): Promise<DomainModelResponse> {
    const response = await httpClient.post<DomainModelResponse>('/domain/generate', req);
    return response;
  }
  
  async deriveEntities(req: EntityDerivationRequest): Promise<EntityDerivationResponse> {
    const response = await httpClient.post<EntityDerivationResponse>('/domain/derive', req);
    return response;
  }
  
  async generateBusinessFlow(req: BusinessFlowRequest): Promise<BusinessFlowResponse> {
    const response = await httpClient.post<BusinessFlowResponse>('/flow/generate', req);
    return response;
  }
  
  async generateUIPages(req: UIPageRequest): Promise<UIPageResponse> {
    const response = await httpClient.post<UIPageResponse>('/pages/generate', req);
    return response;
  }
  
  async derivePages(req: PageDerivationRequest): Promise<PageDerivationResponse> {
    const response = await httpClient.post<PageDerivationResponse>('/pages/derive', req);
    return response;
  }
  
  async generatePrototype(req: PrototypeGenerationRequest): Promise<PrototypeGenerationResponse> {
    const response = await httpClient.post<PrototypeGenerationResponse>('/prototype/generate', req);
    return response;
  }
  
  async deriveFlows(req: FlowDerivationRequest): Promise<FlowDerivationResponse> {
    const response = await httpClient.post<FlowDerivationResponse>('/flow/derive', req);
    return response;
  }
  
  async createSession(projectId?: string): Promise<{ sessionId: string }> {
    const response = await httpClient.post<{ sessionId: string }>('/design/session', {
      projectId,
    });
    return response;
  }
  
  async getSession(sessionId: string): Promise<unknown> {
    const response = await httpClient.get<{ data: unknown }>(`'/design/session/${sessionId}`);
    return response.data;
  }
  
  async deleteSession(sessionId: string): Promise<{ success: boolean }> {
    const response = await httpClient.delete<{ success: boolean }>(`'/design/session/${sessionId}`);
    return response;
  }
}

// ==================== Export ====================

export const designApi = new DesignApiImpl();
export default designApi;
