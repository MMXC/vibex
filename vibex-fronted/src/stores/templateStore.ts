/**
 * Template Store - 模板状态管理
 * 
 * 管理模板数据、使用统计和用户评分
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import Fuse from 'fuse.js';
import { RequirementTemplate, TemplateCategory, templates as defaultTemplates } from '@/data/templates';

import { canvasLogger } from '@/lib/canvas/canvasLogger';
import { importTemplateToCanvas as importTemplateNodes, type ImportMode } from '@/lib/canvas/templateStore';
import { useDDSCanvasStore } from '@/stores/dds/DDSCanvasStore';
import { generateId } from '@/lib/canvas/id';

interface TemplateStats {
  usageCount: Record<string, number>;    // 模板ID -> 使用次数
  ratings: Record<string, number[]>;     // 模板ID -> 评分数组
}


/** ---- E4: 模板高级搜索与过滤 ---- */
export interface FilterOptions {
  tags: string[];           // 选中标签列表（AND 组合）
  dateRange: {
    start: number | null;   // 开始时间戳
    end: number | null;     // 结束时间戳
  };
  searchQuery: string;      // 搜索词
}

/**
 * 高级搜索方法参数（E4）
 */
export interface SearchOptions {
  query?: string;
  filters?: Partial<Omit<FilterOptions, 'searchQuery'>>;
}

/** ---- E5: 模板节点（用于预览面板） ---- */
export interface TemplateNode {
  id: string;
  title: string;
  type: string;
  description: string;
  priority: string;
  inboundCount: number;   // 指向该节点的其他节点数
  outboundCount: number;  // 该节点指向的其他节点数
}

/** S78-E2: 模板订阅状态 */
export interface TemplateSubscription {
  templateId: string;
  subscribedAt: number;   // timestamp ms
  /** 最后检测到更新的时间戳 */
  lastUpdateCheck: number;
}

export interface AuthorSubscription {
  authorId: string;
  subscribedAt: number;
  lastUpdateCheck: number;
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

  // ---- S78-E2: 模板订阅 ----
  /** 订阅的模板 ID → 订阅状态 */
  subscribedTemplates: Record<string, TemplateSubscription>;
  /** 订阅的作者 ID → 订阅状态 */
  subscribedAuthors: Record<string, AuthorSubscription>;
  /** 订阅模板 */
  subscribeTemplate: (templateId: string) => void;
  /** 取消订阅模板 */
  unsubscribeTemplate: (templateId: string) => void;
  /** 订阅作者 */
  subscribeAuthor: (authorId: string) => void;
  /** 取消订阅作者 */
  unsubscribeAuthor: (authorId: string) => void;
  /** 获取有更新的模板列表（检查时间戳 > lastUpdateCheck） */
  getTemplateUpdates: () => RequirementTemplate[];
  
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

  // ---- E5: 模板发布与评分系统 ----
  /** 发布当前画布为模板 */
  publishTemplate: (options: {
    name: string;
    description?: string;
    tags?: string[];
    thumbnail?: string;
    canvasId?: string;
    contentJson?: string;
  }) => Promise<{ ok: boolean; templateId?: string; error?: string }>;

  /** 提交模板评分（含评论） */
  submitRating: (templateId: string, rating: number, comment?: string) => Promise<void>;

  // ---- E3: 模板使用分析与AI推荐 ----
  // 按使用量排序（前N）
  topTemplates: (limit: number) => RequirementTemplate[];
  // 分类维度统计
  getCategoryStats: () => Record<TemplateCategory | 'all', { count: number; avgUsage: number }>;
  // AI推荐评分 (usage×0.5 + tagMatch×0.3 + recency×0.2)
  calcRecommendScore: (templateId: string) => number;

  // 操作 - 收藏功能
  toggleFavorite: (templateId: string) => void;
  inferCategory: (template: RequirementTemplate) => TemplateCategory;
  isFavorite: (templateId: string) => boolean;
  getFavorites: () => RequirementTemplate[];

  // 操作 - 模板版本管理 (E4)
  saveTemplateVersion: (template: RequirementTemplate) => number;
  getTemplateHistory: (templateId: string) => RequirementTemplate[];
  getTemplateVersion: (templateId: string) => number;

  // ---- E5: 模板画廊搜索增强 ----
  // 搜索词（Fuse.js）
  searchQuery: string;
  // 选中的使用场景标签（交集过滤）
  selectedTags: string[];
  // Fuse.js 搜索（Fuse.js 模糊匹配）
  searchTemplates: (query: string) => RequirementTemplate[];
  // 按分类筛选（返回匹配列表）
  filterByCategory: (category: TemplateCategory | 'all') => RequirementTemplate[];
  // 按使用场景标签过滤（交集过滤）
  filterByTag: (tags: string[]) => RequirementTemplate[];
  // 设置选中的标签
  setSelectedTags: (tags: string[]) => void;
  // ---- E4: 高级搜索与过滤 ----
  // 高级过滤选项（AND 组合过滤 + 日期范围）
  filterOptions: FilterOptions;
  // 设置过滤选项
  setFilterOptions: (options: Partial<FilterOptions>) => void;
  // 应用过滤条件（返回过滤后列表，不修改状态）
  applyFilters: (options: Partial<FilterOptions>) => RequirementTemplate[];
  // 高级搜索（query + filters 组合）
  search: (options: { query?: string; filters?: Partial<Omit<FilterOptions, 'searchQuery'>> }) => RequirementTemplate[];
  // 添加自定义标签
  addCustomTag: (tag: string) => void;
  // 移除自定义标签
  removeCustomTag: (tag: string) => void;
  // 获取自定义标签列表
  getCustomTags: () => string[];
  // ---- E2: 模板管理完善 ----
  // 重命名模板
  renameTemplate: (templateId: string, newName: string) => boolean;
  // 缩略图缓存
  thumbnailCache: Record<string, string>; // templateId -> SVG data URL
  // 设置缩略图
  setThumbnail: (templateId: string, svgDataUrl: string) => void;
  // 获取缩略图
  getThumbnail: (templateId: string) => string | undefined;
  // 生成 SVG 缩略图（capture DOM -> SVG data URL）
  captureThumbnail: (templateId: string, element: HTMLElement | null) => void;

  // ---- E4: 模板分类/标签管理 ----
  // 设置模板分类
  setTemplateCategory: (id: string, category: 'flowchart' | 'mindmap' | 'uml' | 'other' | null) => Promise<void>;
  // 添加标签
  addTemplateTag: (id: string, tag: string) => Promise<void>;
  // 移除标签
  removeTemplateTag: (id: string, tag: string) => Promise<void>;

  // ---- E5: 自定义分类管理 ----
  // 自定义分类列表
  customCategories: { id: string; name: string; createdAt: number }[];
  // 添加自定义分类
  addCustomCategory: (name: string) => void;
  // 移除自定义分类
  removeCustomCategory: (id: string) => void;
  // 获取自定义分类列表
  getCustomCategories: () => { id: string; name: string; createdAt: number }[];
  // 使用频率递增（在打开模板时调用）
  incrementUsage: (templateId: string) => void;

  // ---- E2: 模板市场发现与浏览 ----
  // 获取热门/精选模板（按使用量排序）
  featuredTemplates: (limit?: number) => RequirementTemplate[];
  // 市场搜索（query + tags 组合）
  searchMarketplace: (query?: string, tags?: string[]) => RequirementTemplate[];
  // 获取所有市场模板
  getMarketplaceTemplates: () => RequirementTemplate[];

  // ---- E4: 模板导入/导出管理 ----
  // 导出所有模板为 JSON
  exportTemplates: () => { version: string; exportedAt: string; templates: RequirementTemplate[] };
  // 导入模板（支持覆盖/跳过/重命名策略）
  importTemplates: (json: string, strategy?: 'skip' | 'overwrite' | 'rename') => {
    success: boolean; imported: number; skipped: number; error?: string;
  };

  // ---- E5: 模板预览 ----
  /** 获取模板节点列表（含出入边数量） */
  getTemplateNodes: (templateId: string) => TemplateNode[];
  /** S73-E2: 导入模板节点到画布（含ID映射表） */
  importTemplateToCanvas: (
    templateId: string,
    position?: { x: number; y: number },
    mode?: ImportMode
  ) => Promise<{ nodeCount: number; edgeCount: number }>;
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

      // ---- S78-E2: 模板订阅 ----
      subscribedTemplates: {},
      subscribedAuthors: {},
      // ---- E4: 高级搜索过滤 ----
      filterOptions: { tags: [], dateRange: { start: null as number | null, end: null as number | null }, searchQuery: '' } as FilterOptions,
      // ---- E5: 模板画廊搜索增强 ----
      selectedTags: [],
      // ---- E5: 自定义分类 ----
      customCategories: [] as { id: string; name: string; createdAt: number }[],
      // ---- E2: 缩略图缓存 ----
      thumbnailCache: {},

      // ---- S78-E2: 模板订阅 actions ----
      subscribeTemplate: (templateId) => {
        const { subscribedTemplates } = get();
        if (subscribedTemplates[templateId]) return; // already subscribed
        set({
          subscribedTemplates: {
            ...subscribedTemplates,
            [templateId]: { templateId, subscribedAt: Date.now(), lastUpdateCheck: Date.now() },
          },
        });
      },

      unsubscribeTemplate: (templateId) => {
        const { subscribedTemplates } = get();
        if (!subscribedTemplates[templateId]) return;
        const next = { ...subscribedTemplates };
        delete next[templateId];
        set({ subscribedTemplates: next });
      },

      subscribeAuthor: (authorId) => {
        const { subscribedAuthors } = get();
        if (subscribedAuthors[authorId]) return;
        set({
          subscribedAuthors: {
            ...subscribedAuthors,
            [authorId]: { authorId, subscribedAt: Date.now(), lastUpdateCheck: Date.now() },
          },
        });
      },

      unsubscribeAuthor: (authorId) => {
        const { subscribedAuthors } = get();
        if (!subscribedAuthors[authorId]) return;
        const next = { ...subscribedAuthors };
        delete next[authorId];
        set({ subscribedAuthors: next });
      },

      /** 返回有更新的模板（updatedAt > lastUpdateCheck 的已订阅模板） */
      getTemplateUpdates: () => {
        const { subscribedTemplates, templates } = get();
        const now = Date.now();
        const updated: RequirementTemplate[] = [];

        for (const [templateId, sub] of Object.entries(subscribedTemplates)) {
          // Simulate update detection: treat templates updated since subscription as "updated"
          // In a real implementation this would call a backend API
          const template = templates.find(t => t.id === templateId);
          if (template && (template as any).updatedAt > sub.lastUpdateCheck) {
            updated.push(template);
            // Update lastUpdateCheck to avoid repeat notifications
            set(state => ({
              subscribedTemplates: {
                ...state.subscribedTemplates,
                [templateId]: { ...state.subscribedTemplates[templateId], lastUpdateCheck: now },
              },
            }));
          }
        }
        return updated;
      },

      // 设置分类
      setCategory: (category) => {
        const { templates, searchQuery, selectedTags, favoriteTemplateIds } = get();
        const filtered = filterTemplates(templates, category, searchQuery, favoriteTemplateIds, selectedTags);
        set({ selectedCategory: category, filteredTemplates: filtered });
      },
      
      // 设置搜索词
      setSearchQuery: (query) => {
        const { templates, selectedCategory, selectedTags, favoriteTemplateIds } = get();
        const filtered = filterTemplates(templates, selectedCategory, query, favoriteTemplateIds, selectedTags);
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

      // ---- E5: 模板发布与评分系统 ----
      publishTemplate: async ({ name, description = '', tags = [], thumbnail, canvasId, contentJson = '{}' }) => {
        try {
          const res = await fetch('/api/templates', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, description, tags, thumbnail, canvasId, contentJson }),
          });
          const data = await res.json();
          if (data.ok) {
            return { ok: true, templateId: data.template?.id };
          }
          return { ok: false, error: data.error || 'Publish failed' };
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Network error';
          return { ok: false, error: msg };
        }
      },

      submitRating: async (templateId, rating, comment = '') => {
        const { stats } = get();
        const res = await fetch(`/api/templates/${templateId}/rate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rating, comment }),
        });
        const data = await res.json();
        if (data.ok) {
          // Update local stats
          const newStats = {
            ...stats,
            ratings: {
              ...stats.ratings,
              [templateId]: [...(stats.ratings[templateId] || []), rating],
            },
          };
          set({ stats: newStats });
          saveStats(newStats);
        }
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

      // ---- E3: 模板使用分析与AI推荐 ----
      // 按使用量排序（前N）
      topTemplates: (limit) => {
        const { templates, stats } = get();
        return [...templates]
          .sort((a, b) => {
            const aCount = stats.usageCount[a.id] || 0;
            const bCount = stats.usageCount[b.id] || 0;
            return bCount - aCount;
          })
          .slice(0, limit);
      },

      // 分类维度统计
      getCategoryStats: () => {
        const { templates, stats } = get();
        const categories: (TemplateCategory | 'all')[] = ['all', 'flowchart', 'mindmap', 'uml', 'other'];
        const result = {} as Record<TemplateCategory | 'all', { count: number; avgUsage: number }>;

        for (const cat of categories) {
          const filtered = cat === 'all'
            ? templates
            : templates.filter(t => t.category === cat);
          const counts = filtered.map(t => stats.usageCount[t.id] || 0);
          const avgUsage = counts.length > 0
            ? counts.reduce((a, b) => a + b, 0) / counts.length
            : 0;
          result[cat] = { count: filtered.length, avgUsage };
        }
        return result;
      },

      // AI推荐评分 (usage×0.5 + tagMatch×0.3 + recency×0.2)
      calcRecommendScore: (templateId) => {
        const { templates, stats, selectedTags } = get();
        const template = templates.find(t => t.id === templateId);
        if (!template) return 0;

        const usageCount = stats.usageCount[templateId] || 0;
        const maxUsage = Math.max(1, ...Object.values(stats.usageCount));
        const usageScore = (usageCount / maxUsage) * 0.5;

        // Tag match score: overlap with selectedTags
        const templateTags: string[] = template.metadata?.tags ?? [];
        const tagOverlap = selectedTags.length > 0
          ? templateTags.filter(tag => selectedTags.includes(tag)).length / selectedTags.length
          : 0;
        const tagScore = tagOverlap * 0.3;

        // Recency score: favor newer templates
        const createdAt = (template as { createdAt?: number }).createdAt || Date.now();
        const now = Date.now();
        const ageMs = now - createdAt;
        const ageDays = ageMs / (1000 * 60 * 60 * 24);
        const recencyScore = Math.max(0, 1 - ageDays / 90) * 0.2;

        return usageScore + tagScore + recencyScore;
      },

      // 切换收藏状态（fire-and-forget 同步到后端）
      toggleFavorite: (templateId) => {
        const { favoriteTemplateIds } = get();
        const isFav = favoriteTemplateIds.includes(templateId);
        const newFavorites = isFav
          ? favoriteTemplateIds.filter(id => id !== templateId)
          : [...favoriteTemplateIds, templateId];
        set({ favoriteTemplateIds: newFavorites });
        // Fire-and-forget: sync to backend
        fetch(`/api/templates/${templateId}/favorite`, {
          method: isFav ? 'DELETE' : 'POST',
          headers: { 'Content-Type': 'application/json' },
        }).catch(() => { /* silent — local state already updated */ });
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

      // ---- E5: 自定义分类管理 ----
      addCustomCategory: (name) => {
        const id = `cat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        set(state => ({
          customCategories: [...state.customCategories, { id, name, createdAt: Date.now() }],
        }));
      },

      removeCustomCategory: (id) => {
        set(state => ({
          customCategories: state.customCategories.filter(c => c.id !== id),
        }));
      },

      getCustomCategories: () => get().customCategories,

      // 使用频率递增
      incrementUsage: (templateId) => {
        get().recordUsage(templateId);
      },

      // ---- E2: 模板市场发现与浏览 ----
      // 获取热门/精选模板（按使用量排序）
      featuredTemplates: (limit = 8) => {
        const { templates, stats } = get();
        return [...templates]
          .sort((a, b) => {
            const aCount = stats.usageCount[a.id] ?? 0;
            const bCount = stats.usageCount[b.id] ?? 0;
            return bCount - aCount;
          })
          .slice(0, limit);
      },

      // 市场搜索（query + tags 组合）
      searchMarketplace: (query, tags) => {
        const { templates } = get();
        let result = templates;
        if (query) {
          const lowerQuery = query.toLowerCase();
          result = result.filter(t =>
            t.name.toLowerCase().includes(lowerQuery) ||
            (t.displayName ?? '').toLowerCase().includes(lowerQuery) ||
            t.description.toLowerCase().includes(lowerQuery) ||
            (t.metadata?.tags ?? []).some((tag: string) => tag.toLowerCase().includes(lowerQuery))
          );
        }
        if (tags && tags.length > 0) {
          result = result.filter(t => {
            const templateTags: string[] = t.metadata?.tags ?? t.tags ?? [];
            return tags.every(tag => templateTags.some(
              (tTag: string) => tTag.toLowerCase().includes(tag.toLowerCase())
            ));
          });
        }
        return result;
      },

      // 获取所有市场模板
      getMarketplaceTemplates: () => {
        return get().templates;
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
        set({ templates: newTemplates, filteredTemplates: filterTemplates(newTemplates, get().selectedCategory, get().searchQuery, get().favoriteTemplateIds, get().selectedTags) });
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
        const { templates, searchQuery, selectedCategory, selectedTags, favoriteTemplateIds } = get();
        const idx = templates.findIndex(t => t.id === templateId);
        if (idx === -1) return false;
        const renamed = { ...templates[idx], name: newName, displayName: newName };
        const newTemplates = templates.map((t, i) => i === idx ? renamed : t);
        set({
          templates: newTemplates,
          filteredTemplates: filterTemplates(newTemplates, selectedCategory, searchQuery, favoriteTemplateIds, selectedTags),
        });
        return true;
      },

      // ---- E5: Fuse.js 模糊搜索（返回匹配列表，不修改状态）----
      searchTemplates: (query) => {
        const { templates, selectedCategory, selectedTags, favoriteTemplateIds } = get();
        // 先按分类+标签过滤，再模糊搜索
        const filtered = filterTemplates(templates, selectedCategory, '', favoriteTemplateIds, selectedTags);
        if (!query.trim()) return filtered;
        const fuse = new Fuse(filtered, {
          keys: ['name', 'displayName', 'description'],
          threshold: 0.4,
          includeScore: true,
        });
        return fuse.search(query).map(r => r.item);
      },

      // 按分类筛选（返回匹配列表，不修改状态）
      filterByCategory: (category) => {
        const { templates } = get();
        if (category === 'all') return templates;
        return templates.filter(t => t.category === category);
      },

      // ---- E5: 标签过滤 ----
      filterByTag: (tags) => {
        const { templates, selectedCategory, searchQuery, favoriteTemplateIds } = get();
        return filterTemplates(templates, selectedCategory, searchQuery, favoriteTemplateIds, tags);
      },

      setSelectedTags: (tags) => {
        const { templates, selectedCategory, searchQuery, favoriteTemplateIds } = get();
        const filtered = filterTemplates(templates, selectedCategory, searchQuery, favoriteTemplateIds, tags);
        set({ selectedTags: tags, filteredTemplates: filtered });
      },

      // ---- E4: 高级搜索与过滤 ----
      setFilterOptions: (options) => {
        const current = get().filterOptions;
        const merged = {
          tags: options.tags ?? current.tags,
          dateRange: options.dateRange ?? current.dateRange,
          searchQuery: options.searchQuery ?? current.searchQuery,
        } as FilterOptions;
        const filtered = applyFiltersImpl(get().templates, get().selectedCategory, merged, get().favoriteTemplateIds);
        set({ filterOptions: merged, filteredTemplates: filtered });
      },

      applyFilters: (options) => {
        const current = get().filterOptions;
        const merged = {
          tags: options.tags ?? current.tags,
          dateRange: options.dateRange ?? current.dateRange,
          searchQuery: options.searchQuery ?? current.searchQuery,
        } as FilterOptions;
        return applyFiltersImpl(get().templates, get().selectedCategory, merged, get().favoriteTemplateIds);
      },

      search: (options) => {
        const { templates, selectedCategory, favoriteTemplateIds, filterOptions } = get();
        const opts: FilterOptions = {
          tags: options.filters?.tags ?? filterOptions.tags,
          dateRange: options.filters?.dateRange ?? filterOptions.dateRange,
          searchQuery: options.query ?? filterOptions.searchQuery,
        };
        return applyFiltersImpl(templates, selectedCategory, opts, favoriteTemplateIds);
      },

      addCustomTag: (tag) => {
        const { filterOptions } = get();
        if (!filterOptions.tags.includes(tag)) {
          get().setFilterOptions({ tags: [...filterOptions.tags, tag] });
        }
      },

      removeCustomTag: (tag) => {
        const { filterOptions } = get();
        get().setFilterOptions({ tags: filterOptions.tags.filter(t => t !== tag) });
      },

      getCustomTags: () => get().filterOptions.tags,

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

      // ---- E4: 模板导入/导出管理 ----
      exportTemplates: () => {
        const { templates } = get();
        return {
          version: '1.0',
          exportedAt: new Date().toISOString(),
          templates,
        };
      },

      importTemplates: (json, strategy = 'skip') => {
        const { templates } = get();
        let parsed: { version?: string; templates: RequirementTemplate[] };
        try {
          parsed = JSON.parse(json);
        } catch {
          return { success: false, imported: 0, skipped: 0, error: 'Invalid JSON' };
        }
        if (!parsed.version || !Array.isArray(parsed.templates)) {
          return { success: false, imported: 0, skipped: 0, error: 'Invalid format: missing version or templates array' };
        }
        const existingIds = new Set(templates.map(t => t.id));
        const toAdd: RequirementTemplate[] = [];
        let skipped = 0;
        for (const t of parsed.templates) {
          if (existingIds.has(t.id)) {
            if (strategy === 'overwrite') {
              toAdd.push(t);
            } else if (strategy === 'rename') {
              toAdd.push({ ...t, id: `${t.id}_imported_${Date.now()}` });
            } else {
              skipped++;
            }
          } else {
            toAdd.push(t);
          }
        }
        if (toAdd.length > 0) {
          set({
            templates: [...templates, ...toAdd],
            filteredTemplates: filterTemplates([...templates, ...toAdd], get().selectedCategory, get().searchQuery, get().favoriteTemplateIds, get().selectedTags),
          });
        }
        return { success: true, imported: toAdd.length, skipped };
      },

      // ---- E5: 模板预览节点列表 ----
      getTemplateNodes: (templateId) => {
        const { templates } = get();
        const template = templates.find((t) => t.id === templateId);
        if (!template || !template.items) return [];

        const items = template.items;
        // Build outbound map: itemId -> count of items it depends on (outbound)
        const outboundMap: Record<string, number> = {};
        // Build inbound map: itemId -> count of items that depend on it (inbound)
        const inboundMap: Record<string, number> = {};

        for (const item of items) {
          outboundMap[item.id] = item.dependencies.length;
          for (const depId of item.dependencies) {
            inboundMap[depId] = (inboundMap[depId] ?? 0) + 1;
          }
        }

        return items.map((item) => ({
          id: item.id,
          title: item.title,
          type: item.type,
          description: item.description,
          priority: item.priority,
          inboundCount: inboundMap[item.id] ?? 0,
          outboundCount: outboundMap[item.id] ?? 0,
        }));
      },

      // S73-E2: 导入模板节点到画布
      importTemplateToCanvas: async (templateId, position = { x: 0, y: 0 }, mode = 'nodes-and-edges') => {
        const { templates } = get();
        const template = templates.find((t) => t.id === templateId);
        if (!template) {
          throw new Error(`Template not found: ${templateId}`);
        }

        // Delegate to the pure lib/canvas templateStore (IndexedDB-backed)
        const { importTemplateToCanvas: doImport } = await import('@/lib/canvas/templateStore');
        const result = await doImport(templateId, position, mode);

        const canvasStore = useDDSCanvasStore.getState();

        // Group imported nodes by their target chapter
        const nodesByChapter: Record<string, typeof result.nodes> = {};
        for (const node of result.nodes) {
          if (!nodesByChapter[node.chapter]) nodesByChapter[node.chapter] = [];
          nodesByChapter[node.chapter].push(node);
        }

        let nodeCount = 0;
        let edgeCount = 0;

        function nodeTypeToCardType(nodeType: string): string {
          const map: Record<string, string> = {
            'core': 'bounded-context',
            'supporting': 'bounded-context',
            'generic': 'bounded-context',
            'user-story': 'user-story',
            'flow-step': 'flow-step',
          };
          return map[nodeType] ?? 'bounded-context';
        }

        // Add nodes as cards in their target chapters
        for (const [chapter, chapterNodes] of Object.entries(nodesByChapter)) {
          for (const node of chapterNodes) {
            const cardType = nodeTypeToCardType(node.nodeType);
            const baseCard = {
              id: node.newId,
              type: cardType,
              name: node.name,
              description: node.name,
              responsibility: node.name,
              relations: [] as string[],
              createdAt: Date.now(),
              updatedAt: Date.now(),
            };
            try {
              canvasStore.addCard(chapter as Parameters<typeof canvasStore.addCard>[0], baseCard as Parameters<typeof canvasStore.addCard>[1]);
              nodeCount++;
            } catch (e) {
              canvasLogger.default.error('[TemplateStore] importTemplateToCanvas addCard failed:', e);
            }
          }
        }

        // Add edges (optional)
        if (mode === 'nodes-and-edges') {
          for (const edge of result.edges) {
            try {
              canvasStore.addEdge(edge.chapter as Parameters<typeof canvasStore.addEdge>[0], {
                id: edge.newId,
                sourceId: edge.sourceId,
                targetId: edge.targetId,
                type: edge.originalType,
                label: edge.label,
              } as Parameters<typeof canvasStore.addEdge>[1]);
              edgeCount++;
            } catch (e) {
              canvasLogger.default.error('[TemplateStore] importTemplateToCanvas addEdge failed:', e);
            }
          }
        }

        // Record usage
        get().recordUsage(templateId);

        return { nodeCount, edgeCount };
      },
    }),
    {
      name: 'vibex-template-store',
      partialize: (state) => ({ stats: state.stats }),
      onRehydrateStorage: () => (state) => {
        // S84-E4: fetch favorites from backend on store init (fire-and-forget)
        if (!state) return;
        fetch('/api/templates/favorites', { credentials: 'include' })
          .then(res => res.ok ? res.json() : null)
          .then(data => {
            if (data?.favorites && Array.isArray(data.favorites)) {
              const backendIds = data.favorites.map((f: { templateId: string }) => f.templateId);
              // Merge: keep local favorites + add any missing from backend (dedup)
              const merged = Array.from(new Set([...state.favoriteTemplateIds, ...backendIds]));
              state.favoriteTemplateIds = merged;
            }
          })
          .catch(() => { /* silent — local state is source of truth */ });
      },
    }
  )
);

// 辅助函数：过滤模板（支持分类 + 搜索词 + 收藏 + 标签交集过滤）
function filterTemplates(
  templates: RequirementTemplate[],
  category: TemplateCategory | 'all' | 'favorites',
  query: string,
  favoriteIds: string[] = [],
  selectedTags: string[] = []
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

  // ---- E5: 使用场景标签交集过滤 ----
  if (selectedTags.length > 0) {
    result = result.filter(t => {
      const templateTags: string[] = t.metadata?.tags ?? [];
      // 交集：模板必须包含所有选中的标签
      return selectedTags.every(tag => templateTags.includes(tag));
    });
  }

  return result;
}

/** ---- E4: 高级过滤实现（支持日期范围） ---- */
function applyFiltersImpl(
  templates: RequirementTemplate[],
  category: TemplateCategory | 'all' | 'favorites',
  filterOptions: FilterOptions,
  favoriteIds: string[] = []
): RequirementTemplate[] {
  let result = templates;

  // 分类过滤
  if (category === 'favorites') {
    result = result.filter(t => favoriteIds.includes(t.id));
  } else if (category !== 'all') {
    result = result.filter(t => t.category === category);
  }

  // 搜索词过滤
  if (filterOptions.searchQuery) {
    const lowerQuery = filterOptions.searchQuery.toLowerCase();
    result = result.filter(t =>
      t.name.toLowerCase().includes(lowerQuery) ||
      (t.displayName ?? '').toLowerCase().includes(lowerQuery) ||
      t.description.toLowerCase().includes(lowerQuery) ||
      (t.metadata?.tags ?? []).some((tag: string) => tag.toLowerCase().includes(lowerQuery))
    );
  }

  // 标签 AND 组合过滤
  if (filterOptions.tags.length > 0) {
    result = result.filter(t => {
      const templateTags: string[] = t.metadata?.tags ?? [];
      return filterOptions.tags.every(tag => templateTags.includes(tag));
    });
  }

  // ---- E4: 日期范围过滤（基于 metadata.createdAt）----
  if (filterOptions.dateRange.start !== null || filterOptions.dateRange.end !== null) {
    result = result.filter(t => {
      const createdAt = (t as { createdAt?: number }).createdAt;
      if (createdAt === undefined) return true; // 无创建时间的模板保留
      if (filterOptions.dateRange.start !== null && createdAt < filterOptions.dateRange.start) {
        return false;
      }
      if (filterOptions.dateRange.end !== null && createdAt > filterOptions.dateRange.end) {
        return false;
      }
      return true;
    });
  }

  return result;
}
