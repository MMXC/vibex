/**
 * Fallback Strategy - F1.4 降级策略
 * 支持离线模式，当 API 不可用时使用本地缓存
 * 性能目标: < 50ms
 */

import { persist, createJSONStorage } from 'zustand/middleware';
import { create } from 'zustand';

// 离线数据存储键
const OFFLINE_DATA_KEY = 'vibex_offline_data';
const POPULAR_TEMPLATES_KEY = 'vibex_popular_templates';
const USAGE_HISTORY_KEY = 'vibex_usage_history';
const CACHE_TIMESTAMP_KEY = 'vibex_cache_timestamp';

// 默认热门模板（降级时使用）
const DEFAULT_POPULAR_TEMPLATES = [
  { id: 'ecommerce', name: '电商平台', usageCount: 100 },
  { id: 'user-management', name: '用户管理系统', usageCount: 90 },
  { id: 'oa', name: 'OA 办公系统', usageCount: 80 },
  { id: 'crm', name: 'CRM系统', usageCount: 70 },
  { id: 'blog', name: '博客系统', usageCount: 60 },
];

// 离线状态
interface OfflineState {
  isOnline: boolean;
  lastSyncTime: number;
  popularTemplates: Array<{ id: string; name: string; usageCount: number }>;
  usageHistory: Array<{ templateId: string; timestamp: number }>;
  
  // 操作
  setOnlineStatus: (isOnline: boolean) => void;
  syncPopularTemplates: (templates: Array<{ id: string; name: string; usageCount: number }>) => void;
  recordUsage: (templateId: string) => void;
  getFallbackRecommendations: (limit?: number) => Array<{ id: string; name: string; score: number }>;
  clearOfflineData: () => void;
}

// 创建离线存储
function createOfflineStorage() {
  // 使用 localStorage（已在其他地方使用）
  const storage = {
    getItem: (name: string): string | null => {
      if (typeof window === 'undefined') return null;
      return localStorage.getItem(name);
    },
    setItem: (name: string, value: string): void => {
      if (typeof window === 'undefined') return;
      localStorage.setItem(name, value);
    },
    removeItem: (name: string): void => {
      if (typeof window === 'undefined') return;
      localStorage.removeItem(name);
    },
  };
  return storage;
}

export const useOfflineStore = create<OfflineState>()(
  persist(
    (set, get) => ({
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
      lastSyncTime: 0,
      popularTemplates: DEFAULT_POPULAR_TEMPLATES,
      usageHistory: [],

      // 设置在线状态
      setOnlineStatus: (isOnline: boolean) => {
        set({ isOnline });
        
        // 离线转在线时，尝试同步
        if (isOnline) {
          console.log('[Fallback] Back online, ready to sync');
        }
      },

      // 同步热门模板
      syncPopularTemplates: (templates) => {
        set({ 
          popularTemplates: templates,
          lastSyncTime: Date.now(),
        });
      },

      // 记录使用
      recordUsage: (templateId: string) => {
        const { usageHistory, popularTemplates } = get();
        
        // 添加到历史
        const newHistory = [
          ...usageHistory,
          { templateId, timestamp: Date.now() },
        ].slice(-100); // 保留最近100条
        
        // 更新热门模板计数
        const templateCounts = new Map<string, number>();
        newHistory.forEach(h => {
          templateCounts.set(h.templateId, (templateCounts.get(h.templateId) || 0) + 1);
        });
        
        const updatedPopular = popularTemplates.map(t => ({
          ...t,
          usageCount: templateCounts.get(t.id) || t.usageCount,
        })).sort((a, b) => b.usageCount - a.usageCount);
        
        set({
          usageHistory: newHistory,
          popularTemplates: updatedPopular,
        });
      },

      // 获取降级推荐
      getFallbackRecommendations: (limit = 3) => {
        const { popularTemplates, isOnline } = get();
        
        // 计算推荐分数
        const recommendations = popularTemplates.map(t => ({
          id: t.id,
          name: t.name,
          // 降级时降低分数
          score: isOnline ? t.usageCount / 100 : (t.usageCount / 100) * 0.8,
        }));
        
        return recommendations
          .sort((a, b) => b.score - a.score)
          .slice(0, limit);
      },

      // 清除离线数据
      clearOfflineData: () => {
        set({
          popularTemplates: DEFAULT_POPULAR_TEMPLATES,
          usageHistory: [],
          lastSyncTime: 0,
        });
      },
    }),
    {
      name: OFFLINE_DATA_KEY,
      storage: createJSONStorage(createOfflineStorage),
    }
  )
);

/**
 * 检查是否可以使用在线模式
 */
export function canUseOnlineMode(): boolean {
  if (typeof navigator === 'undefined') return false;
  return navigator.onLine;
}

/**
 * 获取降级推荐（独立函数）
 */
export function getFallbackRecommendation(): Array<{ id: string; name: string; score: number }> {
  const store = useOfflineStore.getState();
  return store.getFallbackRecommendations();
}

/**
 * 初始化离线监听
 */
export function initOfflineListener(): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const handleOnline = () => useOfflineStore.getState().setOnlineStatus(true);
  const handleOffline = () => useOfflineStore.getState().setOnlineStatus(false);

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // 初始化状态
  useOfflineStore.getState().setOnlineStatus(navigator.onLine);

  // 返回清理函数
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

/**
 * 带降级策略的推荐获取
 */
export async function getRecommendationsWithFallback(
  input: string,
  onlineRecommender: (input: string) => Promise<any>
): Promise<any> {
  const isOnline = canUseOnlineMode();
  
  if (!isOnline) {
    console.log('[Fallback] Offline mode, using cached recommendations');
    return {
      recommendations: getFallbackRecommendation(),
      isFallback: true,
    };
  }

  try {
    // 尝试在线获取
    const result = await onlineRecommender(input);
    
    // 如果结果为空，触发降级
    if (!result || !result.recommendations || result.recommendations.length === 0) {
      console.log('[Fallback] Empty result, using fallback');
      return {
        recommendations: getFallbackRecommendation(),
        isFallback: true,
      };
    }
    
    return { ...result, isFallback: false };
  } catch (error) {
    console.error('[Fallback] Online recommendation failed:', error);
    
    // 降级到离线模式
    return {
      recommendations: getFallbackRecommendation(),
      isFallback: true,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export default {
  useOfflineStore,
  canUseOnlineMode,
  getFallbackRecommendation,
  initOfflineListener,
  getRecommendationsWithFallback,
};
