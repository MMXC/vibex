/**
 * Navigation Store
 * Global and project navigation state management
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ==================== Types ====================

export interface NavItem {
  id: string;
  label: string;
  icon?: string;
  href: string;
  badge?: number;
  children?: NavItem[];
}

export interface ProjectContext {
  id: string;
  name: string;
  role: 'owner' | 'editor' | 'viewer';
}

export interface NavigationState {
  // Global navigation
  globalNavItems: NavItem[];
  currentGlobalNav: string;

  // Project navigation
  currentProject: ProjectContext | null;
  projectNavItems: NavItem[];
  currentProjectNav: string;

  // Breadcrumbs
  breadcrumbs: BreadcrumbItem[];

  // Mobile state
  isMobileMenuOpen: boolean;

  // Actions
  setGlobalNav: (id: string) => void;
  setProjectNav: (id: string) => void;
  setCurrentProject: (project: ProjectContext | null) => void;
  setProjectNavItems: (items: NavItem[]) => void;
  setBreadcrumbs: (breadcrumbs: BreadcrumbItem[]) => void;
  toggleMobileMenu: () => void;
  closeMobileMenu: () => void;
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
  isCurrent?: boolean;
}

// ==================== Default Data ====================

const DEFAULT_GLOBAL_NAV: NavItem[] = [
  { id: 'projects', label: '项目', href: '/dashboard' },
  { id: 'templates', label: '模板', href: '/templates' },
  { id: 'settings', label: '设置', href: '/user-settings' },
];

const DEFAULT_PROJECT_NAV: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', href: '' },
  { id: 'chat', label: '对话', href: '/chat' },
  { id: 'requirements', label: '需求', href: '/requirements' },
  { id: 'domain', label: '领域模型', href: '/domain' },
  { id: 'flow', label: '流程图', href: '/flow' },
  { id: 'pages', label: '页面', href: '/pages' },
  { id: 'settings', label: '设置', href: '/project-settings' },
];

// ==================== Store ====================

export const useNavigationStore = create<NavigationState>()(
  persist(
    (set) => ({
      // Initial state
      globalNavItems: DEFAULT_GLOBAL_NAV,
      currentGlobalNav: 'projects',

      currentProject: null,
      projectNavItems: DEFAULT_PROJECT_NAV,
      currentProjectNav: 'dashboard',

      breadcrumbs: [],

      isMobileMenuOpen: false,

      // Actions
      setGlobalNav: (id) => set({ currentGlobalNav: id }),

      setProjectNav: (id) => set({ currentProjectNav: id }),

      setCurrentProject: (project) =>
        set({
          currentProject: project,
          currentProjectNav: 'dashboard', // Reset to dashboard when switching projects
        }),

      setProjectNavItems: (items) => set({ projectNavItems: items }),

      setBreadcrumbs: (breadcrumbs) => set({ breadcrumbs }),

      toggleMobileMenu: () =>
        set((state) => ({
          isMobileMenuOpen: !state.isMobileMenuOpen,
        })),

      closeMobileMenu: () => set({ isMobileMenuOpen: false }),
    }),
    {
      name: 'vibex-navigation',
      partialize: (state) => ({
        currentGlobalNav: state.currentGlobalNav,
        currentProject: state.currentProject,
        currentProjectNav: state.currentProjectNav,
      }),
    }
  )
);

// ==================== Selectors ====================

export const selectCurrentGlobalNav = (state: NavigationState) =>
  state.globalNavItems.find((item) => item.id === state.currentGlobalNav);

export const selectCurrentProjectNav = (state: NavigationState) =>
  state.projectNavItems.find((item) => item.id === state.currentProjectNav);

export const selectBreadcrumbs = (state: NavigationState) => state.breadcrumbs;
