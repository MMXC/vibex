/**
 * useDDDStream - React Hook for SSE streaming DDD analysis
 * 
 * React Query Integration Version
 * 
 * Uses useMutation for state management while maintaining SSE streaming capability.
 * The streaming logic is delegated to services/ddd/stream-service.ts
 * 
 * @example
 * ```typescript
 * const { contexts, status, generateContexts, abort } = useDDDStream();
 * 
 * // Start streaming
 * generateContexts('用户需要登录功能');
 * 
 * // Abort streaming
 * abort();
 * ```
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { BoundedContext } from '@/services/api/types/prototype/domain';
import { queryKeys } from '@/lib/query/QueryProvider';
import {
  streamBoundedContexts,
  streamDomainModels,
  streamBusinessFlow,
  ThinkingStep,
  DomainModel,
  BusinessFlow,
} from '@/services/ddd/stream-service';

// ==================== Types ====================

export type DDDStreamStatus = 'idle' | 'thinking' | 'done' | 'error';

export type { ThinkingStep, DomainModel, BusinessFlow };

export interface UseDDDStreamReturn {
  // State
  thinkingMessages: ThinkingStep[];
  contexts: BoundedContext[];
  mermaidCode: string;
  status: DDDStreamStatus;
  errorMessage: string | null;
  
  // Actions
  generateContexts: (requirementText: string) => void;
  abort: () => void;
  reset: () => void;
}

// ==================== Hook ====================

/**
 * useDDDStream - React Hook for SSE streaming DDD analysis
 * 
 * Uses React Query's useMutation for state management while
 * maintaining real-time SSE streaming capability.
 * 
 * @returns {UseDDDStreamReturn}
 */
export function useDDDStream(): UseDDDStreamReturn {
  const queryClient = useQueryClient();
  
  // Internal state for SSE streaming updates
  const [thinkingMessages, setThinkingMessages] = useState<ThinkingStep[]>([]);
  const [contexts, setContexts] = useState<BoundedContext[]>([]);
  const [mermaidCode, setMermaidCode] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Refs for abort control
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Cleanup function
  const cleanup = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);
  
  // React Query mutation for SSE streaming (defined before abort/reset to allow access to mutation.reset())
  const mutation = useMutation({
    mutationFn: async (requirementText: string) => {
      // Reset state
      setThinkingMessages([]);
      setContexts([]);
      setMermaidCode('');
      setErrorMessage(null);
      
      // Create new abort controller
      abortControllerRef.current = new AbortController();
      
      // Stream with callbacks using service
      return streamBoundedContexts(
        requirementText,
        {
          onThinking: (data) => setThinkingMessages(prev => [...prev, data]),
          onContext: (data) => setContexts(prev => [...prev, data]),
          onDone: (data) => {
            setContexts(data.boundedContexts);
            setMermaidCode(data.mermaidCode);
          },
          onError: (message) => setErrorMessage(message),
        },
        abortControllerRef.current.signal
      );
    },
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.ddd.contexts('') });
    },
    onError: (error: Error) => {
      // Ignore abort errors
      if (error.name === 'AbortError') return;
      setErrorMessage(error.message);
    },
  });
  
  // Public generateContexts function
  const generateContexts = useCallback((requirementText: string) => {
    mutation.mutate(requirementText);
  }, [mutation]);
  
  // Reset state
  const reset = useCallback(() => {
    mutation.reset();
    cleanup();
    setThinkingMessages([]);
    setContexts([]);
    setMermaidCode('');
    setErrorMessage(null);
  }, [mutation, cleanup]);
  
  // Abort current request
  const abort = useCallback(() => {
    mutation.reset();
    cleanup();
    setThinkingMessages([]);
    setContexts([]);
  }, [mutation, cleanup]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);
  
  // Determine status
  const status: DDDStreamStatus = mutation.isPending
    ? 'thinking'
    : mutation.isError
    ? 'error'
    : mutation.isSuccess
    ? 'done'
    : 'idle';
  
  return {
    thinkingMessages,
    contexts,
    mermaidCode,
    status,
    errorMessage: mutation.error?.message || errorMessage,
    generateContexts,
    abort,
    reset,
  };
}

// ==================== Domain Model Stream ====================

export type DomainModelStreamStatus = 'idle' | 'thinking' | 'done' | 'error';

export interface UseDomainModelStreamReturn {
  thinkingMessages: ThinkingStep[];
  domainModels: DomainModel[];
  mermaidCode: string;
  status: DomainModelStreamStatus;
  errorMessage: string | null;
  generateDomainModels: (requirementText: string, boundedContexts?: BoundedContext[]) => void;
  abort: () => void;
  reset: () => void;
}

/**
 * useDomainModelStream - React Hook for SSE streaming domain model generation
 * 
 * Uses React Query's useMutation for state management.
 */
export function useDomainModelStream(): UseDomainModelStreamReturn {
  const queryClient = useQueryClient();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const TIMEOUT_DURATION = 60000;
  
  const [thinkingMessages, setThinkingMessages] = useState<ThinkingStep[]>([]);
  const [domainModels, setDomainModels] = useState<DomainModel[]>([]);
  const [mermaidCode, setMermaidCode] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  
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
  
  const mutation = useMutation({
    mutationFn: async ({ requirementText, boundedContexts }: { requirementText: string; boundedContexts?: BoundedContext[] }) => {
      setThinkingMessages([]);
      setDomainModels([]);
      setMermaidCode('');
      setErrorMessage(null);
      
      // Set timeout
      timeoutRef.current = setTimeout(() => {
        setErrorMessage('请求超时，请稍后重试 (60s)');
      }, TIMEOUT_DURATION);
      
      abortControllerRef.current = new AbortController();
      
      // Use service for streaming
      return streamDomainModels(
        requirementText,
        boundedContexts,
        {
          onThinking: (data) => setThinkingMessages(prev => [...prev, data]),
          onDone: (data) => {
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
              timeoutRef.current = null;
            }
            setDomainModels(data.domainModels);
            setMermaidCode(data.mermaidCode);
          },
          onError: (message) => {
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
              timeoutRef.current = null;
            }
            setErrorMessage(message);
          },
        },
        abortControllerRef.current.signal
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.ddd.domainModels() });
    },
    onError: (error: Error) => {
      if (error.name === 'AbortError') return;
      setErrorMessage(error.message);
    },
  });
  
  const reset = useCallback(() => {
    mutation.reset();
    cleanup();
    setThinkingMessages([]);
    setDomainModels([]);
    setMermaidCode('');
    setErrorMessage(null);
  }, [mutation, cleanup]);
  
  const abort = useCallback(() => {
    mutation.reset();
    cleanup();
    setThinkingMessages([]);
    setDomainModels([]);
    setMermaidCode('');
  }, [mutation, cleanup]);
  
  const generateDomainModels = useCallback((requirementText: string, boundedContexts?: BoundedContext[]) => {
    mutation.mutate({ requirementText, boundedContexts });
  }, [mutation]);
  
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);
  
  const status: DomainModelStreamStatus = mutation.isPending
    ? 'thinking'
    : mutation.isError
    ? 'error'
    : mutation.isSuccess
    ? 'done'
    : 'idle';
  
  return {
    thinkingMessages,
    domainModels,
    mermaidCode,
    status,
    errorMessage: mutation.error?.message || errorMessage,
    generateDomainModels,
    abort,
    reset,
  };
}

// ==================== Business Flow Stream ====================

export type BusinessFlowStreamStatus = 'idle' | 'thinking' | 'done' | 'error';

export interface UseBusinessFlowStreamReturn {
  thinkingMessages: ThinkingStep[];
  businessFlow: BusinessFlow | null;
  mermaidCode: string;
  status: BusinessFlowStreamStatus;
  errorMessage: string | null;
  generateBusinessFlow: (domainModels: unknown[], requirementText?: string) => void;
  abort: () => void;
  reset: () => void;
}

/**
 * useBusinessFlowStream - React Hook for SSE streaming business flow generation
 * 
 * Uses React Query's useMutation for state management.
 */
export function useBusinessFlowStream(): UseBusinessFlowStreamReturn {
  const queryClient = useQueryClient();
  
  const [thinkingMessages, setThinkingMessages] = useState<ThinkingStep[]>([]);
  const [businessFlow, setBusinessFlow] = useState<BusinessFlow | null>(null);
  const [mermaidCode, setMermaidCode] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const cleanup = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);
  
  const mutation = useMutation({
    mutationFn: async ({ domainModels, requirementText }: { domainModels: unknown[]; requirementText?: string }) => {
      setThinkingMessages([]);
      setBusinessFlow(null);
      setMermaidCode('');
      setErrorMessage(null);
      
      abortControllerRef.current = new AbortController();
      
      // Use service for streaming
      return streamBusinessFlow(
        domainModels,
        requirementText,
        {
          onThinking: (data) => setThinkingMessages(prev => [...prev, data]),
          onDone: (data) => {
            setBusinessFlow(data.businessFlow);
            setMermaidCode(data.mermaidCode);
          },
          onError: (message) => setErrorMessage(message),
        },
        abortControllerRef.current.signal
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.ddd.businessFlow() });
    },
    onError: (error: Error) => {
      if (error.name === 'AbortError') return;
      setErrorMessage(error.message);
    },
  });
  
  const reset = useCallback(() => {
    mutation.reset();
    cleanup();
    setThinkingMessages([]);
    setBusinessFlow(null);
    setMermaidCode('');
    setErrorMessage(null);
  }, [mutation, cleanup]);
  
  const abort = useCallback(() => {
    mutation.reset();
    cleanup();
    setThinkingMessages([]);
    setBusinessFlow(null);
  }, [mutation, cleanup]);
  
  const generateBusinessFlow = useCallback((domainModels: unknown[], requirementText?: string) => {
    mutation.mutate({ domainModels, requirementText });
  }, [mutation]);
  
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);
  
  const status: BusinessFlowStreamStatus = mutation.isPending
    ? 'thinking'
    : mutation.isError
    ? 'error'
    : mutation.isSuccess
    ? 'done'
    : 'idle';
  
  return {
    thinkingMessages,
    businessFlow,
    mermaidCode,
    status,
    errorMessage: mutation.error?.message || errorMessage,
    generateBusinessFlow,
    abort,
    reset,
  };
}

export default useDDDStream;