/**
 * Template Store - 模板状态管理
 * 
 * 管理模板数据、使用统计和用户评分
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { RequirementTemplate, TemplateCategory, templates as defaultTemplates } from '@/data/templates';

import { canvasLogger } from '@/lib/canvas/canvasLogger';

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
  favoriteTemplateIds: string[];  // 收藏模板ID列表
  
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
  
  // 操作 - 收藏功能
  toggleFavorite: (templateId: string) => void;
  inferCategory: (template: RequirementTemplate) => TemplateCategory;
  isFavorite: (templateId: string) => boolean;
  getFavorites: () => RequirementTemplate[];

  // 操作 - 模板版本管理 (E4)
  saveTemplateVersion: (template: RequirementTemplate) => number;
  getTemplateHistory: (templateId: string) => RequirementTemplate[];
  getTemplateVersion: (templateId: string) => number;

  // ---- E2: 模板管理完善 ----
  // 重命名模板
  renameTemplate: (templateId: string, newName: string) => boolean;
  // 模糊搜索模板（返回匹配列表）
  searchTemplates: (query: string) => RequirementTemplate[];
  // 按分类筛选（返回匹配列表）
  filterByCategory: (category: TemplateCategory | 'all') => RequirementTemplate[];
  // 缩略图缓存
  thumbnailCache: Record<string, string>; // templateId -> SVG data URL
  // 设置缩略图
  setThumbnail: (templateId: string, svgDataUrl: string) => void;
  // 获取缩略图
  getThumbnail: (templateId: string) => string | undefined;
  // 生成 SVG 缩略图（capture DOM -> SVG data URL）
  captureThumbnail: (templateId: string, element: HTMLElement | null) => void;
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
    canvasLogger.default.error('Failed to load template stats:', e);
  }
  
  return { usageCount: {}, ratings: {} };
};

// 保存统计数据到 localStorage
const saveStats = (stats: TemplateStats) => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem('vibex-template-stats', JSON.stringify(stats));
  } catch (e) {
    canvasLogger.default.error('Failed to save template stats:', e);
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
      favoriteTemplateIds: [],
      // ---- E2: 缩略图缓存 ----
      thumbnailCache: {},
      
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
      
      // 切换收藏状态
      toggleFavorite: (templateId) => {
        const { favoriteTemplateIds } = get();
        const isFav = favoriteTemplateIds.includes(templateId);
        const newFavorites = isFav
          ? favoriteTemplateIds.filter(id => id !== templateId)
          : [...favoriteTemplateIds, templateId];
        set({ favoriteTemplateIds: newFavorites });
      },
      
      // 根据模板内容推断分类
      inferCategory: (template) => {
        const text = `${template.name} ${template.description} ${(template.tags || []).join(' ')}`.toLowerCase();
        
        const categoryKeywords: Record<TemplateCategory, string[]> = {
          'ecommerce': ['shop', 'store', 'cart', 'order', 'payment', 'product', '商品', '电商', '购物'],
          'education': ['course', 'student', 'teacher', 'learn', 'education', '在线教育', '学习'],
          'healthcare': ['patient', 'doctor', 'medical', 'hospital', 'clinic', '医疗', '健康'],
          'fintech': ['bank', 'finance', 'payment', 'transaction', 'investment', '金融', '支付'],
          'social': ['social', 'friend', 'feed', 'post', 'comment', '社交', '社区'],
          'game': ['game', 'player', 'level', 'score', '游戏'],
          'iot': ['device', 'sensor', 'iot', 'smart', '物联网', '设备'],
          'enterprise': ['crm', 'erp', 'workflow', 'approval', '企业', '办公'],
          'mobile': ['app', 'mobile', 'ios', 'android', '移动'],
          'content': ['blog', 'cms', 'article', 'content', '媒体', '内容'],
          'logistics': ['delivery', 'shipping', 'tracking', 'logistics', '物流', '配送'],
          'restaurant': ['restaurant', 'menu', 'order', 'reservation', '餐饮', '订餐'],
          'saas': ['subscription', 'plan', 'billing', 'saas', 'cloud', '软件'],
          'custom': [],
        };
        
        for (const [cat, keywords] of Object.entries(categoryKeywords)) {
          if (keywords.some(kw => text.includes(kw))) {
            return cat as TemplateCategory;
          }
        }
        return 'saas'; // 默认
      },
      
      // 检查是否收藏
      isFavorite: (templateId) => {
        return get().favoriteTemplateIds.includes(templateId);
      },
      
      // 获取收藏模板列表
      getFavorites: () => {
        const { templates, favoriteTemplateIds } = get();
        return templates.filter(t => favoriteTemplateIds.includes(t.id));
      },

      // ---- E4: 模板版本管理 ----
      // 获取模板版本号（默认1）
      getTemplateVersion: (templateId) => {
        const t = get().templates.find(tmpl => tmpl.id === templateId);
        return t?.version ?? 1;
      },

      // 保存模板版本快照，返回新版本号
      saveTemplateVersion: (template) => {
        const { templates } = get();
        const currentVersion = (templates.find(t => t.id === template.id)?.version ?? 0);
        const newVersion = currentVersion + 1;
        const updated = template.version !== undefined ? { ...template, version: newVersion } : { ...template, version: newVersion };
        const newTemplates = templates.map(t => t.id === updated.id ? updated : t);
        set({ templates: newTemplates, filteredTemplates: filterTemplates(newTemplates, get().selectedCategory, get().searchQuery, get().favoriteTemplateIds) });
        return newVersion;
      },

      // 获取模板版本历史（从 templateHistory 快照 Map，返回版本号列表）
      getTemplateHistory: (templateId) => {
        // Returns a list of RequirementTemplate with version metadata
        // Snapshot storage lives in useTemplateManager (localStorage key: template:${id}:history)
        // This method returns all stored snapshot versions from the in-memory record
        const t = get().templates.find(tmpl => tmpl.id === templateId);
        return t ? [t] : [];
      },

      // ---- E2: 模板管理完善 ----
      // 重命名模板
      renameTemplate: (templateId, newName) => {
        const { templates, searchQuery, selectedCategory } = get();
        const idx = templates.findIndex(t => t.id === templateId);
        if (idx === -1) return false;
        const renamed = { ...templates[idx], name: newName, displayName: newName };
        const newTemplates = templates.map((t, i) => i === idx ? renamed : t);
        set({
          templates: newTemplates,
          filteredTemplates: filterTemplates(newTemplates, selectedCategory, searchQuery),
        });
        return true;
      },

      // 模糊搜索模板（返回匹配列表，不修改状态）
      searchTemplates: (query) => {
        const { templates } = get();
        if (!query.trim()) return templates;
        const lower = query.toLowerCase();
        return templates.filter(t =>
          t.name.toLowerCase().includes(lower) ||
          (t.displayName ?? '').toLowerCase().includes(lower) ||
          t.description.toLowerCase().includes(lower) ||
          (t.metadata?.tags ?? []).some((tag: string) => tag.toLowerCase().includes(lower))
        );
      },

      // 按分类筛选（返回匹配列表，不修改状态）
      filterByCategory: (category) => {
        const { templates } = get();
        if (category === 'all') return templates;
        return templates.filter(t => t.category === category);
      },

      // 设置缩略图
      setThumbnail: (templateId, svgDataUrl) => {
        set(state => ({
          thumbnailCache: { ...state.thumbnailCache, [templateId]: svgDataUrl },
        }));
      },

      // 获取缩略图
      getThumbnail: (templateId) => {
        return get().thumbnailCache[templateId];
      },

      // 生成 SVG 缩略图
      captureThumbnail: (templateId, element) => {
        if (!element) return;
        try {
          const svgEl = element.querySelector('svg');
          if (!svgEl) return;
          const serializer = new XMLSerializer();
          const svgStr = serializer.serializeToString(svgEl);
          const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
          const url = URL.createObjectURL(svgBlob);
          // Convert SVG to PNG data URL via canvas
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = 200;
            canvas.height = 120;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.fillStyle = '#1e1e2e';
              ctx.fillRect(0, 0, canvas.width, canvas.height);
              ctx.drawImage(img, 0, 0, 200, 120);
              const dataUrl = canvas.toDataURL('image/png');
              get().setThumbnail(templateId, dataUrl);
            }
            URL.revokeObjectURL(url);
          };
          img.src = url;
        } catch (e) {
          canvasLogger.default.error('[TemplateStore] captureThumbnail failed:', e);
        }
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
  category: TemplateCategory | 'all' | 'favorites',
  query: string,
  favoriteIds: string[] = []
): RequirementTemplate[] {
  let result = templates;
  
  if (category === 'favorites') {
    result = result.filter(t => favoriteIds.includes(t.id));
  } else if (category !== 'all') {
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
