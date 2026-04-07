/**
 * Query Keys - React Query 统一键值管理
 * 使用工厂模式集中管理所有 query keys
 */

export const QueryKeys = {
  /**
   * 生成标准的 query key
   */
  create: <T extends string>(key: T, ...params: unknown[]): [T, ...unknown[]] => {
    return [key, ...params];
  },

  // ==================== DDD Stream Keys ====================
  dddStream: {
    all: ['dddStream'] as const,
    lists: () => [...QueryKeys.dddStream.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) => 
      [...QueryKeys.dddStream.lists(), filters] as const,
    details: () => [...QueryKeys.dddStream.all, 'detail'] as const,
    detail: (id: string) => 
      [...QueryKeys.dddStream.details(), id] as const,
  },

  // ==================== API Keys ====================
  api: {
    all: ['api'] as const,
    endpoint: (path: string) => [...QueryKeys.api.all, path] as const,
  },

  // ==================== User Keys ====================
  user: {
    all: ['user'] as const,
    profile: () => [...QueryKeys.user.all, 'profile'] as const,
    settings: () => [...QueryKeys.user.all, 'settings'] as const,
  },

  // ==================== Collaboration Keys ====================
  collaboration: {
    all: ['collaboration'] as const,
    sessions: () => [...QueryKeys.collaboration.all, 'sessions'] as const,
    session: (id: string) => [...QueryKeys.collaboration.sessions(), id] as const,
  },
} as const;

/**
 * 类型安全的 query key factory
 */
export type QueryKeyFactory = typeof QueryKeys;

export default QueryKeys;
