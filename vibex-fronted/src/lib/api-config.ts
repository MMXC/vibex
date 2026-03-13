/**
 * API Configuration
 * Centralized API URL management
 */

export const API_CONFIG = {
  // Base URL - use environment variable or fallback
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.vibex.top/api',
  
  // API version
  version: 'v1',
  
  // Endpoints
  endpoints: {
    ddd: {
      boundedContext: '/ddd/bounded-context',
      boundedContextStream: '/ddd/bounded-context/stream',
      domainModel: '/ddd/domain-model',
      businessFlow: '/ddd/business-flow',
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
