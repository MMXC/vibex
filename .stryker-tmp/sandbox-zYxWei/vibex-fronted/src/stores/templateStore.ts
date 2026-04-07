/**
 * Template Store - 模板状态管理
 * 
 * 管理模板数据、使用统计和用户评分
 */
// @ts-nocheck


import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { RequirementTemplate, TemplateCategory } from '@/data/templates';
import { templates as defaultTemplates } from '@/data/templates';

interface TemplateStats {
  usageCount: Record<string, number>;    // 模板ID -> 使用次数
  ratings: Record<string, number[]>;     // 模板ID -> 评分数组
}

interface TemplateState {
  // 状态
  templates: RequirementTemplate[];
  filteredTemplates: RequirementTemplate[];
  selectedTemplate: RequirementTemplate | null;
  selectedCategory: TemplateCategory | 'all';
  searchQuery: string;
  isSelectorOpen: boolean;
  stats: TemplateStats;
  
  // 操作 - 模板选择
  setCategory: (category: TemplateCategory | 'all') => void;
  setSearchQuery: (query: string) => void;
  selectTemplate: (template: RequirementTemplate | null) => void;
  openSelector: () => void;
  closeSelector: () => void;
  applyTemplate: (template: RequirementTemplate) => string;
  
  // 操作 - 统计功能
  recordUsage: (templateId: string) => void;
  rateTemplate: (templateId: string, rating: number) => void;
  getTemplateStats: (templateId: string) => { usageCount: number; avgRating: number; ratingCount: number };
  getPopularTemplates: (limit?: number) => RequirementTemplate[];
  getTopRatedTemplates: (limit?: number) => RequirementTemplate[];
}

// 初始统计数据
const getInitialStats = (): TemplateStats => {
  // 从 localStorage 加载或使用默认值
  if (typeof window === 'undefined') {
    return { usageCount: {}, ratings: {} };
  }
  
  try {
    const saved = localStorage.getItem('vibex-template-stats');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to load template stats:', e);
  }
  
  return { usageCount: {}, ratings: {} };
};

// 保存统计数据到 localStorage
const saveStats = (stats: TemplateStats) => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem('vibex-template-stats', JSON.stringify(stats));
  } catch (e) {
    console.error('Failed to save template stats:', e);
  }
};

export const useTemplateStore = create<TemplateState>()(
  persist(
    (set, get) => ({
      // 初始状态
      templates: defaultTemplates,
      filteredTemplates: defaultTemplates,
      selectedTemplate: null,
      selectedCategory: 'all',
      searchQuery: '',
      isSelectorOpen: false,
      stats: getInitialStats(),
      
      // 设置分类
      setCategory: (category) => {
        const { templates, searchQuery } = get();
        const filtered = filterTemplates(templates, category, searchQuery);
        set({ selectedCategory: category, filteredTemplates: filtered });
      },
      
      // 设置搜索词
      setSearchQuery: (query) => {
        const { templates, selectedCategory } = get();
        const filtered = filterTemplates(templates, selectedCategory, query);
        set({ searchQuery: query, filteredTemplates: filtered });
      },
      
      // 选择模板
      selectTemplate: (template) => set({ selectedTemplate: template }),
      
      // 打开选择器
      openSelector: () => set({ isSelectorOpen: true }),
      
      // 关闭选择器
      closeSelector: () => set({ isSelectorOpen: false, selectedTemplate: null }),
      
      // 应用模板（返回填充后的文本，并记录使用）
      applyTemplate: (template) => {
        // 记录使用
        get().recordUsage(template.id);
        // 返回模板内容
        return template.content ?? '';
      },
      
      // 记录模板使用
      recordUsage: (templateId) => {
        const { stats } = get();
        const newStats = {
          ...stats,
          usageCount: {
            ...stats.usageCount,
            [templateId]: (stats.usageCount[templateId] || 0) + 1,
          },
        };
        set({ stats: newStats });
        saveStats(newStats);
      },
      
      // 对模板评分
      rateTemplate: (templateId, rating) => {
        const { stats } = get();
        const existingRatings = stats.ratings[templateId] || [];
        const newStats = {
          ...stats,
          ratings: {
            ...stats.ratings,
            [templateId]: [...existingRatings, rating],
          },
        };
        set({ stats: newStats });
        saveStats(newStats);
      },
      
      // 获取模板统计
      getTemplateStats: (templateId) => {
        const { stats } = get();
        const usageCount = stats.usageCount[templateId] || 0;
        const ratings = stats.ratings[templateId] || [];
        const ratingCount = ratings.length;
        const avgRating = ratingCount > 0 
          ? ratings.reduce((a, b) => a + b, 0) / ratingCount 
          : 0;
        
        return { usageCount, avgRating, ratingCount };
      },
      
      // 获取热门模板
      getPopularTemplates: (limit = 5) => {
        const { templates, stats } = get();
        
        return [...templates].sort((a, b) => {
          const aCount = stats.usageCount[a.id] || 0;
          const bCount = stats.usageCount[b.id] || 0;
          return bCount - aCount;
        }).slice(0, limit);
      },
      
      // 获取高评分模板
      getTopRatedTemplates: (limit = 5) => {
        const { templates, stats } = get();
        
        return [...templates]
          .map(t => {
            const ratings = stats.ratings[t.id] || [];
            const avgRating = ratings.length > 0 
              ? ratings.reduce((a, b) => a + b, 0) / ratings.length 
              : 0;
            return { template: t, avgRating, count: ratings.length };
          })
          .filter(t => t.count > 0)
          .sort((a, b) => b.avgRating - a.avgRating)
          .slice(0, limit)
          .map(t => t.template);
      },
    }),
    {
      name: 'vibex-template-store',
      partialize: (state) => ({ stats: state.stats }),
    }
  )
);

// 辅助函数：过滤模板
function filterTemplates(
  templates: RequirementTemplate[],
  category: TemplateCategory | 'all',
  query: string
): RequirementTemplate[] {
  let result = templates;
  
  if (category !== 'all') {
    result = result.filter(t => t.category === category);
  }
  
  if (query) {
    const lowerQuery = query.toLowerCase();
    result = result.filter(t =>
      t.name.toLowerCase().includes(lowerQuery) ||
      (t.displayName ?? '').toLowerCase().includes(lowerQuery) ||
      t.description.toLowerCase().includes(lowerQuery) ||
      (t.metadata?.tags ?? []).some((tag: string) => tag.toLowerCase().includes(lowerQuery))
    );
  }
  
  return result;
}
