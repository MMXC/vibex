/**
 * API 类型定义
 * 手动维护的 API 类型，与自动生成类型配合使用
 */

import type { components } from './api-generated';

// ==================== 类型导出 ====================

// 从自动生成的类型重新导出
export type { paths, operations } from './api-generated';

// 限界上下文类型
export type BoundedContext = components['schemas']['BoundedContext'];
export type BoundedContextResponse = components['schemas']['BoundedContextResponse'];

// 领域模型类型
export type DomainModel = components['schemas']['DomainModel'];
export type DomainModelResponse = components['schemas']['DomainModelResponse'];

// 业务流程类型
export type BusinessFlow = components['schemas']['BusinessFlow'];
export type BusinessFlowResponse = components['schemas']['BusinessFlowResponse'];

// ==================== 增强类型 ====================

/**
 * 限界上下文 + 领域模型
 */
export interface BoundedContextWithModels {
  context: BoundedContext;
  domainModels: DomainModel[];
}

/**
 * 完整 DDD 结果
 */
export interface DDDResult {
  boundedContexts: BoundedContext[];
  domainModels: DomainModel[];
  businessFlow?: BusinessFlow;
  mermaidCode?: string;
}

// ==================== 请求/响应类型 ====================

/**
 * 创建限界上下文请求
 */
export interface CreateContextRequest {
  requirementText: string;
  projectId?: string;
}

/**
 * 创建限界上下文响应
 */
export interface CreateContextResponse {
  success: boolean;
  contexts: BoundedContext[];
  mermaidCode: string;
  error?: string;
}

/**
 * 创建领域模型请求
 */
export interface CreateDomainModelRequest {
  requirementText: string;
  boundedContexts: BoundedContext[];
}

/**
 * 创建领域模型响应
 */
export interface CreateDomainModelResponse {
  success: boolean;
  domainModels: DomainModel[];
  mermaidCode?: string;
  error?: string;
}

/**
 * 创建业务流程请求
 */
export interface CreateBusinessFlowRequest {
  requirementText: string;
  domainModels: DomainModel[];
}

/**
 * 创建业务流程响应
 */
export interface CreateBusinessFlowResponse {
  success: boolean;
  businessFlow: BusinessFlow;
  mermaidCode?: string;
  error?: string;
}

// ==================== 流式类型 ====================

/**
 * SSE 事件类型
 */
export type SSEEventType = 
  | 'thinking'
  | 'contexts'
  | 'domainModels'
  | 'businessFlow'
  | 'done'
  | 'error';

/**
 * SSE 消息
 */
export interface SSEMessage {
  type: SSEEventType;
  data?: unknown;
  error?: string;
  timestamp: number;
}

/**
 * 流式响应状态
 */
export type StreamStatus = 'idle' | 'streaming' | 'done' | 'error';
