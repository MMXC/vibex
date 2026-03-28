/**
 * DDD SSE Stream Service
 * 
 * Provides SSE streaming functions for DDD analysis.
 * These functions handle the low-level fetch and streaming logic.
 */

import { getApiUrl } from '@/lib/api-config';
import { BoundedContext } from '@/services/api/types/prototype/domain';

// ==================== Auth helper ====================

function getAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = sessionStorage.getItem('auth_token') || localStorage.getItem('auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function handleResponseError(res: Response, defaultMsg: string): never {
  if (res.status === 401) {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('auth_token');
      localStorage.removeItem('auth_token');
    }
    throw new Error('登录已过期，请重新登录');
  }
  throw new Error(`${defaultMsg}: ${res.status}`);
}

// ==================== Types ====================

export interface ThinkingStep {
  step: string;
  message: string;
}

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

// ==================== Bounded Context Stream ====================

export interface BoundedContextStreamCallbacks {
  onThinking: (data: ThinkingStep) => void;
  onContext: (data: BoundedContext) => void;
  onDone: (data: { boundedContexts: BoundedContext[]; mermaidCode: string }) => void;
  onError: (message: string) => void;
}

/**
 * Stream bounded contexts via SSE
 */
export async function streamBoundedContexts(
  requirementText: string,
  callbacks: BoundedContextStreamCallbacks,
  signal: AbortSignal
): Promise<{ boundedContexts: BoundedContext[]; mermaidCode: string }> {
  const fullURL = getApiUrl('/ddd/bounded-context/stream');
  // ST-2.2: SSE timeout — 60s per request
  const combinedSignal = AbortSignal.any([signal, AbortSignal.timeout(60000)]);
  
  const response = await fetch(fullURL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify({ requirementText }),
    signal: combinedSignal,
  });

  if (!response.ok) handleResponseError(response, '生成限界上下文失败');

  if (!response.body) {
    throw new Error('Response body is null');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let result: { boundedContexts: BoundedContext[]; mermaidCode: string } = {
    boundedContexts: [],
    mermaidCode: '',
  };

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
                  callbacks.onThinking(parsedData as ThinkingStep);
                  break;
                  
                case 'context':
                  callbacks.onContext(parsedData as BoundedContext);
                  break;
                  
                case 'done':
                  const contexts = Array.isArray(parsedData.boundedContexts)
                    ? parsedData.boundedContexts
                    : [];
                  callbacks.onDone({
                    boundedContexts: contexts,
                    mermaidCode: parsedData.mermaidCode || '',
                  });
                  result = { boundedContexts: contexts, mermaidCode: parsedData.mermaidCode || '' };
                  break;
                  
                case 'error':
                  callbacks.onError(parsedData.message || 'Unknown error');
                  break;
              }
            } catch (e) {
              console.error('Failed to parse SSE data:', e);
            }
            i++;
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  return result;
}

// ==================== Domain Model Stream ====================

export interface DomainModelStreamCallbacks {
  onThinking: (data: ThinkingStep) => void;
  onDone: (data: { domainModels: DomainModel[]; mermaidCode: string }) => void;
  onError: (message: string) => void;
}

/**
 * Stream domain models via SSE
 */
export async function streamDomainModels(
  requirementText: string,
  boundedContexts: BoundedContext[] | undefined,
  callbacks: DomainModelStreamCallbacks,
  signal: AbortSignal
): Promise<{ domainModels: DomainModel[]; mermaidCode: string }> {
  const fullURL = getApiUrl('/ddd/domain-model/stream');
  // ST-2.2: SSE timeout — 60s per request
  const combinedSignal = AbortSignal.any([signal, AbortSignal.timeout(60000)]);
  
  const response = await fetch(fullURL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify({ requirementText, boundedContexts }),
    signal: combinedSignal,
  });

  if (!response.ok) handleResponseError(response, '生成领域模型失败');

  if (!response.body) {
    throw new Error('Response body is null');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let result: { domainModels: DomainModel[]; mermaidCode: string } = {
    domainModels: [],
    mermaidCode: '',
  };

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
                  callbacks.onThinking(parsedData as ThinkingStep);
                  break;
                case 'done':
                  const models = Array.isArray(parsedData.domainModels)
                    ? parsedData.domainModels
                    : [];
                  callbacks.onDone({
                    domainModels: models,
                    mermaidCode: parsedData.mermaidCode || '',
                  });
                  result = { domainModels: models, mermaidCode: parsedData.mermaidCode || '' };
                  break;
                case 'error':
                  callbacks.onError(parsedData.message || 'Unknown error');
                  break;
              }
            } catch (e) {
              console.error('Failed to parse SSE data:', e);
            }
            i++;
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  return result;
}

// ==================== Business Flow Stream ====================

export interface BusinessFlowStreamCallbacks {
  onThinking: (data: ThinkingStep) => void;
  onDone: (data: { businessFlow: BusinessFlow; mermaidCode: string }) => void;
  onError: (message: string) => void;
}

/**
 * Stream business flow via SSE
 */
export async function streamBusinessFlow(
  domainModels: unknown[],
  requirementText: string | undefined,
  callbacks: BusinessFlowStreamCallbacks,
  signal: AbortSignal
): Promise<{ businessFlow: BusinessFlow | null; mermaidCode: string }> {
  const fullURL = getApiUrl('/ddd/business-flow/stream');
  // ST-2.2: SSE timeout — 60s per request
  const combinedSignal = AbortSignal.any([signal, AbortSignal.timeout(60000)]);
  
  const response = await fetch(fullURL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify({ domainModels, requirementText }),
    signal: combinedSignal,
  });

  if (!response.ok) handleResponseError(response, '生成业务流程失败');

  if (!response.body) {
    throw new Error('Response body is null');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let result: { businessFlow: BusinessFlow | null; mermaidCode: string } = {
    businessFlow: null,
    mermaidCode: '',
  };

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
                  callbacks.onThinking(parsedData as ThinkingStep);
                  break;
                case 'done':
                  callbacks.onDone({
                    businessFlow: parsedData.businessFlow || null,
                    mermaidCode: parsedData.mermaidCode || '',
                  });
                  result = {
                    businessFlow: parsedData.businessFlow || null,
                    mermaidCode: parsedData.mermaidCode || '',
                  };
                  break;
                case 'error':
                  callbacks.onError(parsedData.message || 'Unknown error');
                  break;
              }
            } catch (e) {
              console.error('Failed to parse SSE data:', e);
            }
            i++;
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  return result;
}