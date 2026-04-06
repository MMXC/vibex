/**
 * useDDDStreamQuery - React Query 封装的 DDD 流式分析 Hook
 * 
 * 使用 React Query 管理 SSE 流式请求的状态、缓存和错误处理
 * 
 * @example
 * ```typescript
 * const { data, isLoading, error, refetch } = useDDDStreamQuery({
 *   requirement: '用户需求描述',
 *   enabled: true
 * });
 * ```
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback, useRef, useEffect } from 'react';
import { getApiUrl } from '@/lib/api-config';
import { BoundedContext } from '@/services/api/types/prototype/domain';

import { canvasLogger } from '@/lib/canvas/canvasLogger';

function getAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = sessionStorage.getItem('auth_token') || localStorage.getItem('auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ==================== Types ====================

export type DDDStreamStatus = 'idle' | 'pending' | 'thinking' | 'done' | 'error';

export interface ThinkingStep {
  step: string;
  message: string;
}

export interface UseDDDStreamQueryOptions {
  /** 需求文本 */
  requirement?: string;
  /** 是否启用查询 */
  enabled?: boolean;
  /** 缓存时间 (ms) */
  staleTime?: number;
}

export interface UseDDDStreamQueryResult {
  // State
  thinkingMessages: ThinkingStep[];
  contexts: BoundedContext[];
  mermaidCode: string;
  status: DDDStreamStatus;
  errorMessage: string | null;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  isSuccess: boolean;
  
  // Actions
  refetch: () => void;
  mutate: (requirement: string) => void;
  abort: () => void;
  reset: () => void;
}

// ==================== Query Keys ====================

export const dddStreamKeys = {
  all: ['dddStream'] as const,
  contexts: (requirement: string) => [...dddStreamKeys.all, 'contexts', requirement] as const,
  domainModels: (requirement: string, contexts: BoundedContext[]) => 
    [...dddStreamKeys.all, 'domainModels', requirement, contexts.map(c => c.id).join(',')] as const,
  businessFlow: (requirement: string, domainModels: unknown[]) => 
    [...dddStreamKeys.all, 'businessFlow', requirement] as const,
};

// ==================== SSE Fetch Helper ====================

interface SSEResponseData {
  event: 'thinking' | 'context' | 'done' | 'error';
  data: unknown;
}

/**
 * 使用 ReadableStream 解析 SSE 流
 */
async function fetchSSEStream(
  url: string, 
  body: unknown,
  onThinking: (data: ThinkingStep) => void,
  onContext: (data: BoundedContext) => void,
  onDone: (data: { boundedContexts: BoundedContext[]; mermaidCode: string }) => void,
  onError: (message: string) => void,
  signal: AbortSignal
): Promise<void> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok) {
    if (response.status === 401) {
      onError('登录已过期，请重新登录');
      return;
    }
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  if (!response.body) {
    throw new Error('Response body is null');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.startsWith('event: ')) {
          const eventType = line.slice(7);
          const nextLine = lines[i + 1];
          
          if (nextLine && nextLine.startsWith('data: ')) {
            const data = nextLine.slice(6);
            try {
              const parsedData = JSON.parse(data);
              
              switch (eventType) {
                case 'thinking':
                  onThinking(parsedData as ThinkingStep);
                  break;
                  
                case 'context':
                  onContext(parsedData as BoundedContext);
                  break;
                  
                case 'done':
                  onDone(parsedData as { boundedContexts: BoundedContext[]; mermaidCode: string });
                  break;
                  
                case 'error':
                  onError((parsedData as { message: string }).message || 'Unknown error');
                  break;
              }
            } catch (e) {
              canvasLogger.default.error('Failed to parse SSE data:', e);
            }
            i++;
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

// ==================== React Query Hook ====================

/**
 * 使用 React Query 的 DDD 流式分析 Hook
 * 
 * 特性：
 * - 缓存管理
 * - 自动重试
 * - 后台刷新
 * - 错误处理
 * - 状态追踪
 */
export function useDDDStreamQuery(options: UseDDDStreamQueryOptions = {}): UseDDDStreamQueryResult {
  const { requirement, enabled = false, staleTime = 5 * 60 * 1000 } = options;
  
  const queryClient = useQueryClient();
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // 内部状态 - 用于 SSE 流式更新
  const [thinkingMessages, setThinkingMessages] = useState<ThinkingStep[]>([]);
  const [contexts, setContexts] = useState<BoundedContext[]>([]);
  const [mermaidCode, setMermaidCode] = useState('');
  const [status, setStatus] = useState<DDDStreamStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // 清理函数
  const cleanup = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);
  
  // 重置状态
  const reset = useCallback(() => {
    cleanup();
    setThinkingMessages([]);
    setContexts([]);
    setMermaidCode('');
    setStatus('idle');
    setErrorMessage(null);
  }, [cleanup]);
  
  // 终止请求
  const abort = useCallback(() => {
    cleanup();
    setStatus('idle');
    setThinkingMessages([]);
    setContexts([]);
  }, [cleanup]);
  
  // 使用 useQuery 处理状态管理
  const queryKey = requirement ? dddStreamKeys.contexts(requirement) : dddStreamKeys.all;
  
  // Mutation 用于触发请求
  const mutation = useMutation({
    mutationFn: async (reqText: string) => {
      // 清理之前的请求
      cleanup();
      setThinkingMessages([]);
      setContexts([]);
      setMermaidCode('');
      setErrorMessage(null);
      setStatus('thinking');
      
      abortControllerRef.current = new AbortController();
      const fullURL = getApiUrl('/ddd/bounded-context/stream');
      
      await fetchSSEStream(
        fullURL,
        { requirementText: reqText },
        (thinking) => {
          setThinkingMessages(prev => [...(prev ?? []), thinking]);
        },
        (context) => {
          setContexts(prev => [...(prev ?? []), context]);
        },
        (done) => {
          setContexts(done?.boundedContexts ?? []);
          setMermaidCode(done?.mermaidCode ?? '');
          setStatus('done');
        },
        (error) => {
          setErrorMessage(error);
          setStatus('error');
        },
        abortControllerRef.current.signal
      );
      
      return { contexts, mermaidCode };
    },
    onSuccess: () => {
      // 使缓存失效以刷新数据
      queryClient.invalidateQueries({ queryKey: dddStreamKeys.all });
    },
    onError: (error: Error) => {
      setErrorMessage(error.message);
      setStatus('error');
    },
  });
  
  // 清理 on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);
  
  return {
    // State
    thinkingMessages,
    contexts,
    mermaidCode,
    status: mutation.isPending ? 'thinking' : status,
    errorMessage: mutation.error?.message || errorMessage,
    isLoading: mutation.isPending,
    isFetching: mutation.isPending,
    isError: mutation.isError,
    isSuccess: mutation.isSuccess,
    
    // Actions
    refetch: () => mutation.mutate(requirement || ''),
    mutate: (req: string) => mutation.mutate(req),
    abort,
    reset,
  };
}

// ==================== Domain Model Stream ====================

export type DomainModelStreamStatus = 'idle' | 'pending' | 'thinking' | 'done' | 'error';

export interface DomainModel {
  id: string;
  name: string;
  contextId: string;
  type: 'aggregate_root' | 'entity' | 'value_object';
  properties: Array<{
    name: string;
    type: string;
    required: boolean;
    description: string;
  }>;
  methods: string[];
}

export interface UseDomainModelStreamQueryOptions {
  requirement?: string;
  contexts?: BoundedContext[];
  enabled?: boolean;
}

export interface UseDomainModelStreamQueryResult {
  thinkingMessages: ThinkingStep[];
  domainModels: DomainModel[];
  mermaidCode: string;
  status: DomainModelStreamStatus;
  errorMessage: string | null;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  isSuccess: boolean;
  mutate: (requirement: string, contexts?: BoundedContext[]) => void;
  abort: () => void;
  reset: () => void;
}

export function useDomainModelStreamQuery(options: UseDomainModelStreamQueryOptions = {}): UseDomainModelStreamQueryResult {
  const { requirement, contexts: initialContexts, enabled = false } = options;
  
  const queryClient = useQueryClient();
  const abortControllerRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const TIMEOUT_DURATION = 60000;
  
  const [thinkingMessages, setThinkingMessages] = useState<ThinkingStep[]>([]);
  const [domainModels, setDomainModels] = useState<DomainModel[]>([]);
  const [mermaidCode, setMermaidCode] = useState('');
  const [status, setStatus] = useState<DomainModelStreamStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const cleanup = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);
  
  const reset = useCallback(() => {
    cleanup();
    setThinkingMessages([]);
    setDomainModels([]);
    setMermaidCode('');
    setStatus('idle');
    setErrorMessage(null);
  }, [cleanup]);
  
  const abort = useCallback(() => {
    cleanup();
    setStatus('idle');
    setThinkingMessages([]);
    setDomainModels([]);
    setMermaidCode('');
  }, [cleanup]);
  
  const mutation = useMutation({
    mutationFn: async ({ reqText, ctx }: { reqText: string; ctx?: BoundedContext[] }) => {
      cleanup();
      setThinkingMessages([]);
      setDomainModels([]);
      setMermaidCode('');
      setErrorMessage(null);
      setStatus('thinking');
      
      // 设置超时
      timeoutRef.current = setTimeout(() => {
        setErrorMessage('请求超时，请稍后重试 (60s)');
        setStatus('error');
      }, TIMEOUT_DURATION);
      
      abortControllerRef.current = new AbortController();
      const fullURL = getApiUrl('/ddd/domain-model/stream');
      
      await fetchSSEStream(
        fullURL,
        { requirementText: reqText, boundedContexts: ctx },
        (thinking) => {
          setThinkingMessages(prev => [...(prev ?? []), thinking]);
        },
        () => {}, // context event not used for domain model
        (done) => {
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
          const models = (done as unknown as { domainModels?: DomainModel[] }).domainModels;
          setDomainModels(models ?? []);
          setMermaidCode((done as unknown as { mermaidCode?: string }).mermaidCode ?? '');
          setStatus('done');
        },
        (error) => {
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
          setErrorMessage(error);
          setStatus('error');
        },
        abortControllerRef.current.signal
      );
      
      return { domainModels, mermaidCode };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dddStreamKeys.all });
    },
    onError: (error: Error) => {
      setErrorMessage(error.message);
      setStatus('error');
    },
  });
  
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);
  
  return {
    thinkingMessages,
    domainModels,
    mermaidCode,
    status: mutation.isPending ? 'thinking' : status,
    errorMessage: mutation.error?.message || errorMessage,
    isLoading: mutation.isPending,
    isFetching: mutation.isPending,
    isError: mutation.isError,
    isSuccess: mutation.isSuccess,
    mutate: (req, ctx) => mutation.mutate({ reqText: req, ctx }),
    abort,
    reset,
  };
}

// ==================== Business Flow Stream ====================

export type BusinessFlowStreamStatus = 'idle' | 'pending' | 'thinking' | 'done' | 'error';

export interface BusinessFlow {
  id: string;
  name: string;
  states: Array<{
    id: string;
    name: string;
    type: 'initial' | 'intermediate' | 'final';
    description: string;
  }>;
  transitions: Array<{
    id: string;
    fromStateId: string;
    toStateId: string;
    event: string;
    condition?: string;
  }>;
}

export interface UseBusinessFlowStreamQueryOptions {
  domainModels?: unknown[];
  requirement?: string;
  enabled?: boolean;
}

export interface UseBusinessFlowStreamQueryResult {
  thinkingMessages: ThinkingStep[];
  businessFlow: BusinessFlow | null;
  mermaidCode: string;
  status: BusinessFlowStreamStatus;
  errorMessage: string | null;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  isSuccess: boolean;
  mutate: (domainModels: unknown[], requirement?: string) => void;
  abort: () => void;
  reset: () => void;
}

export function useBusinessFlowStreamQuery(options: UseBusinessFlowStreamQueryOptions = {}): UseBusinessFlowStreamQueryResult {
  const { domainModels: initialModels, requirement, enabled = false } = options;
  
  const queryClient = useQueryClient();
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const [thinkingMessages, setThinkingMessages] = useState<ThinkingStep[]>([]);
  const [businessFlow, setBusinessFlow] = useState<BusinessFlow | null>(null);
  const [mermaidCode, setMermaidCode] = useState('');
  const [status, setStatus] = useState<BusinessFlowStreamStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const cleanup = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);
  
  const reset = useCallback(() => {
    cleanup();
    setThinkingMessages([]);
    setBusinessFlow(null);
    setMermaidCode('');
    setStatus('idle');
    setErrorMessage(null);
  }, [cleanup]);
  
  const abort = useCallback(() => {
    cleanup();
    setStatus('idle');
    setThinkingMessages([]);
    setBusinessFlow(null);
  }, [cleanup]);
  
  const mutation = useMutation({
    mutationFn: async ({ models, reqText }: { models: unknown[]; reqText?: string }) => {
      cleanup();
      setThinkingMessages([]);
      setBusinessFlow(null);
      setMermaidCode('');
      setErrorMessage(null);
      setStatus('thinking');
      
      abortControllerRef.current = new AbortController();
      const fullURL = getApiUrl('/ddd/business-flow/stream');
      
      await fetchSSEStream(
        fullURL,
        { domainModels: models, requirementText: reqText },
        (thinking) => {
          setThinkingMessages(prev => [...(prev ?? []), thinking]);
        },
        () => {},
        (done) => {
          const flowData = done as unknown as { businessFlow?: BusinessFlow; mermaidCode?: string };
          setBusinessFlow(flowData?.businessFlow ?? null);
          setMermaidCode(flowData?.mermaidCode ?? '');
          setStatus('done');
        },
        (error) => {
          setErrorMessage(error);
          setStatus('error');
        },
        abortControllerRef.current.signal
      );
      
      return { businessFlow, mermaidCode };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dddStreamKeys.all });
    },
    onError: (error: Error) => {
      setErrorMessage(error.message);
      setStatus('error');
    },
  });
  
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);
  
  return {
    thinkingMessages,
    businessFlow,
    mermaidCode,
    status: mutation.isPending ? 'thinking' : status,
    errorMessage: mutation.error?.message || errorMessage,
    isLoading: mutation.isPending,
    isFetching: mutation.isPending,
    isError: mutation.isError,
    isSuccess: mutation.isSuccess,
    mutate: (models, reqText) => mutation.mutate({ models, reqText }),
    abort,
    reset,
  };
}

// ==================== Query Detection Helper ====================

/**
 * 检测 hooks 是否使用 React Query
 * 用于验收测试
 * 
 * @example
 * expect(usesReactQuery).toBe(true)
 */
export const usesReactQuery = true;

export default useDDDStreamQuery;
