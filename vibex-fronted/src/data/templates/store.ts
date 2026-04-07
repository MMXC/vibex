/**
 * Template Store - 需求模板状态管理
 */

import { create } from 'zustand';
import type { 
  RequirementTemplate, 
  RequirementTemplateItem,
  TemplateCategory,
  TemplateScene 
} from './types';

// 导入所有模板
import saasTemplate from './saas.json';
import ecommerceTemplate from './ecommerce.json';
import fintechTemplate from './fintech.json';
import healthcareTemplate from './healthcare.json';
import educationTemplate from './education.json';
import socialTemplate from './social.json';
import gameTemplate from './game.json';
import iotTemplate from './iot.json';
import enterpriseTemplate from './enterprise.json';
import mobileTemplate from './mobile.json';

interface TemplateStore {
  // 状态
  templates: RequirementTemplate[];
  currentTemplate: RequirementTemplate | null;
  currentItems: RequirementTemplateItem[];
  selectedCategory: TemplateCategory | null;
  selectedScene: TemplateScene | null;
  searchQuery: string;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadTemplates: () => void;
  setCurrentTemplate: (templateId: string) => void;
  setSelectedCategory: (category: TemplateCategory | null) => void;
  setSelectedScene: (scene: TemplateScene | null) => void;
  setSearchQuery: (query: string) => void;
  addTemplate: (template: RequirementTemplate) => void;
  removeTemplate: (templateId: string) => void;
  addItem: (item: RequirementTemplateItem) => void;
  updateItem: (itemId: string, updates: Partial<RequirementTemplateItem>) => void;
  removeItem: (itemId: string) => void;
  getFilteredTemplates: () => RequirementTemplate[];
}

// 模板列表
const ALL_TEMPLATES: RequirementTemplate[] = [
  saasTemplate as unknown as RequirementTemplate,
  ecommerceTemplate as unknown as RequirementTemplate,
  fintechTemplate as unknown as RequirementTemplate,
  healthcareTemplate as unknown as RequirementTemplate,
  educationTemplate as unknown as RequirementTemplate,
  socialTemplate as unknown as RequirementTemplate,
  gameTemplate as unknown as RequirementTemplate,
  iotTemplate as unknown as RequirementTemplate,
  enterpriseTemplate as unknown as RequirementTemplate,
  mobileTemplate as RequirementTemplate,
];

export const useTemplateStore = create<TemplateStore>((set, get) => ({
  // 初始状态
  templates: [],
  currentTemplate: null,
  currentItems: [],
  selectedCategory: null,
  selectedScene: null,
  searchQuery: '',
  isLoading: false,
  error: null,

  // 加载模板列表
  loadTemplates: () => {
    set({ isLoading: true, error: null });
    try {
      set({ 
        templates: ALL_TEMPLATES,
        isLoading: false 
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : '加载模板失败',
        isLoading: false 
      });
    }
  },

  // 设置当前模板
  setCurrentTemplate: (templateId: string) => {
    const template = get().templates.find(t => t.id === templateId);
    if (template) {
      set({ 
        currentTemplate: template,
        currentItems: template.items || []
      });
    }
  },

  // 设置分类筛选
  setSelectedCategory: (category: TemplateCategory | null) => {
    set({ selectedCategory: category });
  },

  // 设置场景筛选
  setSelectedScene: (scene: TemplateScene | null) => {
    set({ selectedScene: scene });
  },

  // 设置搜索关键词
  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
  },

  // 添加模板
  addTemplate: (template: RequirementTemplate) => {
    set(state => ({
      templates: [...state.templates, template]
    }));
  },

  // 删除模板
  removeTemplate: (templateId: string) => {
    set(state => ({
      templates: state.templates.filter(t => t.id !== templateId),
      currentTemplate: state.currentTemplate?.id === templateId 
        ? null 
        : state.currentTemplate
    }));
  },

  // 添加需求项
  addItem: (item: RequirementTemplateItem) => {
    set(state => ({
      currentItems: [...state.currentItems, item]
    }));
  },

  // 更新需求项
  updateItem: (itemId: string, updates: Partial<RequirementTemplateItem>) => {
    set(state => ({
      currentItems: state.currentItems.map(item =>
        item.id === itemId ? { ...item, ...updates } : item
      )
    }));
  },

  // 删除需求项
  removeItem: (itemId: string) => {
    set(state => ({
      currentItems: state.currentItems.filter(item => item.id !== itemId)
    }));
  },

  // 获取筛选后的模板
  getFilteredTemplates: () => {
    const { templates, selectedCategory, selectedScene, searchQuery } = get();
    
    return templates.filter(template => {
      // 分类筛选
      if (selectedCategory && template.category !== selectedCategory) {
        return false;
      }
      
      // 场景筛选
      if (selectedScene && !template.scenes.includes(selectedScene)) {
        return false;
      }
      
      // 搜索筛选
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          template.name.toLowerCase().includes(query) ||
          template.description.toLowerCase().includes(query) ||
          template.tags.some(tag => tag.toLowerCase().includes(query))
        );
      }
      
      return true;
    });
  },
}));

export default useTemplateStore;
