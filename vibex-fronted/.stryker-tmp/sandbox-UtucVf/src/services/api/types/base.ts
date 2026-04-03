/**
 * API 基础类型定义
 * 统一所有 API 响应格式
 */
// @ts-nocheck


export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiErrorResponse;
  timestamp?: string;
}

export interface ApiErrorResponse {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  pagination?: {
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
  };
}

// 通用请求配置
export interface RequestConfig {
  headers?: Record<string, string>;
  timeout?: number;
  signal?: AbortSignal;
}

// 流式响应类型
export interface StreamResponse<T> {
  data: T;
  done: boolean;
  error?: ApiErrorResponse;
}
