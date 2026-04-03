/**
 * API Configuration
 * Centralized API URL management
 */
// @ts-nocheck


export const API_CONFIG = {
  // Base URL - use environment variable or fallback
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.vibex.top/api',
  
  // API version
  version: 'v1',
  
  // Endpoints
  endpoints: {
    ddd: {
      boundedContext: '/v1/ddd/bounded-context',
      boundedContextStream: '/v1/ddd/bounded-context/stream',
      domainModel: '/v1/ddd/domain-model',
      businessFlow: '/v1/ddd/business-flow',
    },
    canvas: {
      generateContexts: '/v1/canvas/generate-contexts',
      generateFlows: '/v1/canvas/generate-flows',
      generateComponents: '/v1/canvas/generate-components',
      status: '/v1/canvas/status',
      project: '/v1/canvas/project',
      generate: '/v1/canvas/generate',
      export: '/v1/canvas/export',
      stream: '/v1/canvas/stream',
      // E4-F11: Version History — Canvas Snapshots
      snapshots: '/v1/canvas/snapshots',
      snapshot: (id: string) => `/v1/canvas/snapshots/${id}`,
      restoreSnapshot: (id: string) => `/v1/canvas/snapshots/${id}/restore`,
    },
    auth: {
      login: '/auth/login',
      logout: '/auth/logout',
      register: '/auth/register',
    },
    project: {
      list: '/projects',
      create: '/projects',
      detail: (id: string) => `/projects/${id}`,
    },
  },
} as const;

// Helper to get full URL
export function getApiUrl(path: string): string {
  const base = API_CONFIG.baseURL.replace(/\/$/, ''); // Remove trailing slash
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${cleanPath}`;
}

export default API_CONFIG;
