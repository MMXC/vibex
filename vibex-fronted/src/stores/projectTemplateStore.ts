/**
 * Project Template Store
 * 
 * DDD 项目模板状态管理
 * 管理项目模板数据、筛选和项目创建
 */

import { create } from 'zustand';
import type { 
  ProjectTemplate, 
  ProjectTemplateCategory,
  ProjectTemplateFilter 
} from '@/types/project-template';

import ecommerceTemplate from '@/data/project-templates/ecommerce.json';
import userManagementTemplate from '@/data/project-templates/user-management.json';
import genericBusinessTemplate from '@/data/project-templates/generic-business.json';

// 内置模板列表
const DEFAULT_TEMPLATES: ProjectTemplate[] = [
  ecommerceTemplate as ProjectTemplate,
  userManagementTemplate as ProjectTemplate,
  genericBusinessTemplate as ProjectTemplate,
];

interface ProjectTemplateState {
  // 状态
  templates: ProjectTemplate[];
  selectedCategory: ProjectTemplateCategory | 'all';
  searchQuery: string;
  selectedTemplate: ProjectTemplate | null;
  isPreviewOpen: boolean;
  isCreating: boolean;
  
  // 操作 - 模板选择
  setSelectedCategory: (category: ProjectTemplateCategory | 'all') => void;
  setSearchQuery: (query: string) => void;
  selectTemplate: (template: ProjectTemplate | null) => void;
  openPreview: (template: ProjectTemplate) => void;
  closePreview: () => void;
  
  // 操作 - 模板应用
  getFilteredTemplates: () => ProjectTemplate[];
  createFromTemplate: (templateId: string, projectName: string) => Promise<{ projectId: string }>;
}

export const useProjectTemplateStore = create<ProjectTemplateState>()(
  (set, get) => ({
    // 初始状态
    templates: DEFAULT_TEMPLATES,
    selectedCategory: 'all',
    searchQuery: '',
    selectedTemplate: null,
    isPreviewOpen: false,
    isCreating: false,
    
    // 设置分类筛选
    setSelectedCategory: (category) => set({ selectedCategory: category }),
    
    // 设置搜索关键词
    setSearchQuery: (query) => set({ searchQuery: query }),
    
    // 选择模板
    selectTemplate: (template) => set({ selectedTemplate: template }),
    
    // 打开预览
    openPreview: (template) => set({ selectedTemplate: template, isPreviewOpen: true }),
    
    // 关闭预览
    closePreview: () => set({ isPreviewOpen: false }),
    
    // 获取筛选后的模板列表
    getFilteredTemplates: () => {
      const { templates, selectedCategory, searchQuery } = get();
      
      return templates.filter((template) => {
        // 分类筛选
        if (selectedCategory !== 'all' && template.category !== selectedCategory) {
          return false;
        }
        
        // 搜索筛选
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          const matchesName = template.name.toLowerCase().includes(query);
          const matchesDesc = template.description.toLowerCase().includes(query);
          const matchesTags = template.tags.some(tag => tag.toLowerCase().includes(query));
          if (!matchesName && !matchesDesc && !matchesTags) {
            return false;
          }
        }
        
        return true;
      });
    },
    
    // 从模板创建项目
    createFromTemplate: async (templateId, projectName) => {
      set({ isCreating: true });
      
      try {
        const template = get().templates.find(t => t.id === templateId);
        if (!template) {
          throw new Error('Template not found');
        }
        
        // TODO: 替换为实际的 API 调用
        // const response = await fetch('/api/projects/from-template', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({ templateId, projectName }),
        // });
        // const data = await response.json();
        
        // 模拟 API 延迟
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const projectId = `project-${Date.now()}`;
        
        console.log(`[ProjectTemplate] Created project "${projectName}" from template "${template.name}"`, {
          contexts: template.contexts.map(c => c.name),
          flows: template.flows.map(f => f.name),
        });
        
        set({ isCreating: false });
        return { projectId };
      } catch (error) {
        set({ isCreating: false });
        throw error;
      }
    },
  })
);

// 分类配置
export const TEMPLATE_CATEGORIES = [
  { id: 'all', label: '全部', icon: '🌟' },
  { id: 'business', label: '业务系统', icon: '🏢' },
  { id: 'user', label: '用户管理', icon: '👤' },
  { id: 'ecommerce', label: '电商', icon: '🛒' },
  { id: 'general', label: '通用', icon: '📦' },
] as const;
