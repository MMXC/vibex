/**
 * Smart Recommender Store - F1.3 推荐展示组件
 * Zustand store，用于管理智能模板推荐状态
 * 性能目标: < 100ms 响应
 */

/** Dev-only logger */
const devLog = (...args: unknown[]) => {
  if (process.env.NODE_ENV !== 'production') canvasLogger.default.debug(...args);
};

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { canvasLogger } from '@/lib/canvas/canvasLogger';

import { 
  extractKeywords, 
  KeywordExtractionResult,
  quickKeywordCheck 
} from '@/utils/design/keywordExtractor';
import { 
  smartMatchTemplate, 
  getTemplateRecommendations,
  ExtendedTemplate,
  ExtendedMatchResult 
} from '@/utils/design/enhancedMatcher';

export interface Recommendation {
  template: ExtendedTemplate;
  confidence: number;
  reason: string;
  matchedKeywords: string[];
}

interface RecommenderState {
  // 状态
  currentInput: string;
  keywords: KeywordExtractionResult | null;
  matchResult: ExtendedMatchResult | null;
  recommendations: Recommendation[];
  isLoading: boolean;
  isExpanded: boolean;
  lastUpdateTime: number;
  
  // 操作
  setInput: (input: string) => void;
  generateRecommendations: (input: string) => void;
  toggleExpanded: () => void;
  clearRecommendations: () => void;
  selectRecommendation: (templateId: string) => Recommendation | null;
}

// 生成推荐原因
function generateReason(keywords: KeywordExtractionResult, template: ExtendedTemplate): string {
  const matched = keywords.keywords.filter(k => 
    template.keywords.some(tk => tk.includes(k.keyword) || k.keyword.includes(tk))
  );
  
  if (matched.length > 0) {
    return `匹配关键词: ${matched.slice(0, 3).map(k => k.keyword).join(', ')}`;
  }
  
  if (template.industry) {
    return `适合${template.industry}领域`;
  }
  
  return '热门模板推荐';
}

export const useSmartRecommenderStore = create<RecommenderState>()(
  persist(
    (set, get) => ({
      // 初始状态
      currentInput: '',
      keywords: null,
      matchResult: null,
      recommendations: [],
      isLoading: false,
      isExpanded: false,
      lastUpdateTime: 0,

      // 设置输入（带防抖的实时更新）
      setInput: (input: string) => {
        set({ currentInput: input });
        
        // 快速关键词检查（< 10ms）
        const quickKeywords = quickKeywordCheck(input);
        
        // 如果有明确关键词，生成推荐
        if (quickKeywords.length > 0 && input.length >= 3) {
          get().generateRecommendations(input);
        } else if (input.length < 3) {
          // 输入太短，清空推荐
          set({ 
            keywords: null, 
            matchResult: null, 
            recommendations: [] 
          });
        }
      },

      // 生成推荐
      generateRecommendations: (input: string) => {
        if (!input || input.trim().length < 2) return;
        
        set({ isLoading: true });
        
        try {
          // 1. 提取关键词（< 50ms）
          const keywords = extractKeywords(input);
          
          // 2. 智能匹配（< 50ms）
          const matchResult = smartMatchTemplate(input, keywords);
          
          // 3. 获取推荐列表
          const rawRecommendations = getTemplateRecommendations(input, 3);
          
          // 4. 构建推荐结果
          const recommendations: Recommendation[] = rawRecommendations.map(r => ({
            template: r.template,
            confidence: r.confidence,
            reason: generateReason(keywords, r.template),
            matchedKeywords: matchResult.matchedKeywords,
          }));
          
          set({
            keywords,
            matchResult,
            recommendations,
            isLoading: false,
            lastUpdateTime: Date.now(),
            isExpanded: recommendations.length > 0,
          });
        } catch (error) {
          canvasLogger.default.error('[SmartRecommender] Generation failed:', error);
          set({ isLoading: false });
        }
      },

      // 切换展开状态
      toggleExpanded: () => {
        set(state => ({ isExpanded: !state.isExpanded }));
      },

      // 清除推荐
      clearRecommendations: () => {
        set({
          currentInput: '',
          keywords: null,
          matchResult: null,
          recommendations: [],
          isExpanded: false,
        });
      },

      // 选择推荐
      selectRecommendation: (templateId: string) => {
        const { recommendations } = get();
        const selected = recommendations.find(r => r.template.id === templateId);
        
        if (selected) {
          // 记录选择（可用于后续分析）
          devLog('[SmartRecommender] Selected:', selected.template.name);
        }
        
        return selected || null;
      },
    }),
    {
      name: 'vibex-smart-recommender',
      partialize: (state) => ({
        // 只持久化展开状态
        isExpanded: state.isExpanded,
      }),
    }
  )
);

/**
 * Hook: 获取推荐（用于组件中使用）
 */
export function useTemplateRecommendations(input: string): {
  recommendations: Recommendation[];
  isLoading: boolean;
  keywords: KeywordExtractionResult | null;
} {
  const store = useSmartRecommenderStore();
  
  // 同步输入
  if (input !== store.currentInput) {
    store.setInput(input);
  }
  
  return {
    recommendations: store.recommendations,
    isLoading: store.isLoading,
    keywords: store.keywords,
  };
}

export default useSmartRecommenderStore;
