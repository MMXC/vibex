/**
 * Plan Service
 * Frontend service for calling Plan API
 */
// @ts-nocheck


import { getApiUrl } from '@/lib/api-config';

function getAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = sessionStorage.getItem('auth_token') || localStorage.getItem('auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export interface PlanFeature {
  name: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

export interface PlanResult {
  requirementAnalysis: string;
  inferredFeatures: PlanFeature[];
  suggestedContexts: Array<{
    name: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  risks: string[];
  complexity: 'simple' | 'medium' | 'complex';
  estimatedComplexityScore: number;
}

export interface AnalyzeRequest {
  requirementText: string;
  context?: {
    projectType?: string;
    targetUsers?: string;
    constraints?: string[];
  };
}

/**
 * Analyze requirement using Plan API
 */
export async function analyzeRequirement(req: AnalyzeRequest): Promise<PlanResult> {
  const response = await fetch(getApiUrl('/api/plan/analyze'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(req),
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('登录已过期，请重新登录');
    }
    const error = await response.json().catch(() => ({ message: 'Failed to analyze requirement' }));
    throw new Error(error.message || 'Failed to analyze requirement');
  }

  return response.json();
}

/**
 * Stream analyze requirement (for future SSE support)
 */
export async function* streamAnalyzeRequirement(req: AnalyzeRequest): AsyncGenerator<Partial<PlanResult>> {
  const response = await fetch(getApiUrl('/api/plan/analyze'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(req),
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('登录已过期，请重新登录');
    }
    throw new Error('Failed to analyze requirement');
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('Response body is null');
  }

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const data = JSON.parse(line.slice(6));
          yield data;
        } catch {
          // Ignore parse errors
        }
      }
    }
  }
}

/**
 * Get complexity color for UI
 */
export function getComplexityColor(complexity: PlanResult['complexity']): string {
  switch (complexity) {
    case 'simple':
      return '#10b981'; // green
    case 'medium':
      return '#f59e0b'; // yellow
    case 'complex':
      return '#ef4444'; // red
    default:
      return '#71717a';
  }
}

/**
 * Get complexity label
 */
export function getComplexityLabel(complexity: PlanResult['complexity']): string {
  switch (complexity) {
    case 'simple':
      return '简单';
    case 'medium':
      return '中等';
    case 'complex':
      return '复杂';
    default:
      return '未知';
  }
}
