/**
 * @fileoverview Canvas API Schema — 前后端契约类型定义
 *
 * 用于契约测试 (Epic 1)
 * 基于 canvasApi.ts 中的 API 调用定义
 *
 * Schema 版本: 1.0.0
 * 创建日期: 2026-03-31
 *
 * 注意: 本文件使用纯 TypeScript 类型，不依赖 zod
 * 如需运行时校验，使用类型守卫函数
 */

// =============================================================================
// 枚举类型
// =============================================================================

/** 限界上下文类型 */
export type BoundedContextType = 'core' | 'supporting' | 'generic' | 'external';

/** 组件类型 */
export type ComponentType = 'page' | 'api' | 'database' | 'queue' | 'cache' | 'gateway' | 'worker';

/** HTTP 方法 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

// =============================================================================
// Context API
// =============================================================================

/** generateContexts 请求 */
export interface GenerateContextsRequest {
  requirementText: string;
  mode?: 'parallel' | 'sequential';
  projectId?: string;
}

/** generateContexts 响应 */
export interface GenerateContextsResponse {
  success: boolean;
  contexts: Array<{
    id: string;
    name: string;
    description: string;
    type: BoundedContextType;
  }>;
  sessionId: string;
  confidence: number;
  error?: string;
}

// =============================================================================
// Flow API
// =============================================================================

/** generateFlows 请求 */
export interface GenerateFlowsRequest {
  contexts: Array<{
    id: string;
    name: string;
    description: string;
    type: BoundedContextType;
  }>;
  mode?: 'parallel' | 'sequential';
  projectId?: string;
}

/** generateFlows 响应 */
export interface GenerateFlowsResponse {
  success: boolean;
  flows: Array<{
    name: string;
    contextId: string;
    description?: string;
    steps: Array<{
      name: string;
      actor: string;
      description: string;
      order: number;
    }>;
  }>;
  confidence: number;
  error?: string;
}

// =============================================================================
// Components API
// =============================================================================

/** Flow 步骤 */
export interface FlowStep {
  name: string;
  actor: string;
  description: string;
  order: number;
}

/** Flow */
export interface Flow {
  name: string;
  contextId: string;
  description?: string;
  steps: FlowStep[];
}

/** Context (for generateComponents) */
export interface Context {
  id: string;
  name: string;
  description: string;
  type: BoundedContextType;
}

/** Component */
export interface Component {
  name: string;
  flowId: string;
  type: ComponentType;
  description?: string;
  api?: {
    method: HttpMethod;
    path: string;
    params: string[];
  };
}

/** generateComponents 请求 */
export interface GenerateComponentsRequest {
  contexts: Context[];
  flows: Flow[];
  mode?: 'parallel' | 'sequential';
  projectId?: string;
}

/** generateComponents 响应 */
export interface GenerateComponentsResponse {
  success: boolean;
  components: Component[];
  error?: string;
}

// =============================================================================
// 错误码定义
// =============================================================================

/** API 错误码 */
export type CanvasApiErrorCode =
  | 'INVALID_REQUIREMENT_TEXT'
  | 'NO_CORE_CONTEXTS'
  | 'EMPTY_CONTEXTS'
  | 'EMPTY_FLOWS'
  | 'UNAUTHORIZED'
  | 'INTERNAL_ERROR'
  | 'RATE_LIMITED';

// =============================================================================
// 类型守卫函数 (用于运行时校验)
// =============================================================================

/** 校验 BoundedContextType */
export function isBoundedContextType(value: unknown): value is BoundedContextType {
  return (
    typeof value === 'string' &&
    ['core', 'supporting', 'generic', 'external'].indexOf(value) !== -1
  );
}

/** 校验 ComponentType */
export function isComponentType(value: unknown): value is ComponentType {
  return (
    typeof value === 'string' &&
    ['page', 'api', 'database', 'queue', 'cache', 'gateway', 'worker'].indexOf(
      value
    ) !== -1
  );
}

/** 校验 HttpMethod */
export function isHttpMethod(value: unknown): value is HttpMethod {
  return typeof value === 'string' && ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].indexOf(value) !== -1;
}

/** 校验 GenerateContextsResponse */
export function isGenerateContextsResponse(value: unknown): value is GenerateContextsResponse {
  if (!value || typeof value !== 'object') return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.success === 'boolean' &&
    Array.isArray(obj.contexts) &&
    typeof obj.sessionId === 'string' &&
    typeof obj.confidence === 'number'
  );
}

/** 校验 GenerateFlowsResponse */
export function isGenerateFlowsResponse(value: unknown): value is GenerateFlowsResponse {
  if (!value || typeof value !== 'object') return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.success === 'boolean' &&
    Array.isArray(obj.flows) &&
    typeof obj.confidence === 'number'
  );
}

/** 校验 GenerateComponentsResponse */
export function isGenerateComponentsResponse(
  value: unknown
): value is GenerateComponentsResponse {
  if (!value || typeof value !== 'object') return false;
  const obj = value as Record<string, unknown>;
  return typeof obj.success === 'boolean' && Array.isArray(obj.components);
}

// =============================================================================
// 契约测试常量
// =============================================================================

/** API 端点路径 */
export const CANVAS_API_ENDPOINTS = {
  generateContexts: '/api/v1/canvas/generate-contexts',
  generateFlows: '/api/v1/canvas/generate-flows',
  generateComponents: '/api/v1/canvas/generate-components',
} as const;

/** 置信度阈值 */
export const CONFIDENCE_THRESHOLD = {
  LOW: 0.5,
  MEDIUM: 0.7,
  HIGH: 0.85,
} as const;

/** 最少 Context 数量 */
export const MIN_CONTEXTS = 1;

/** 最少 Flow 数量 */
export const MIN_FLOWS = 1;

/** 最少 Component 数量 */
export const MIN_COMPONENTS = 0;
