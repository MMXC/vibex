/**
 * Homepage Components Index
 */

// Existing components
export { StepNavigator } from './StepNavigator';
export type { Step, StepNavigatorProps } from './StepNavigator';

export { MainContent } from './MainContent';
export type { MainContentProps } from './MainContent';

export { CollapsibleChat } from './CollapsibleChat';
export type { CollapsibleChatProps } from './CollapsibleChat';

// New modular components (Epic 2, 3, 4)
export { default as HomePage } from './HomePage';
export { StepContainer } from './StepContainer';
export { Navbar } from './Navbar/Navbar';
export { Sidebar } from './Sidebar/Sidebar';
export { PreviewArea } from './PreviewArea/PreviewArea';
export { PreviewCanvas } from './PreviewArea/PreviewCanvas';
export { InputArea } from './InputArea/InputArea';
export { AIPanel } from './AIPanel/AIPanel';
export { ThinkingPanel } from './ThinkingPanel/ThinkingPanel';

// Hooks
export { useHomePageState } from './hooks/useHomePageState';
export { usePanelActions } from './hooks/usePanelActions';
export { useHomeGeneration } from './hooks/useHomeGeneration';
export { useHomePanel } from './hooks/useHomePanel';

// Types from @/types/homepage (excluding Step to avoid conflict)
export type {
  BoundedContext,
  DomainModel,
  BusinessFlow,
  NavbarComponentProps,
  SidebarComponentProps,
  PreviewCanvasProps,
  InputAreaComponentProps,
  AIPanelComponentProps,
  HomeState,
  HomeGeneration,
  HomePanel,
} from '@/types/homepage';