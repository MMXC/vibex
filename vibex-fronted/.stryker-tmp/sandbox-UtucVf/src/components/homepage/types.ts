// @ts-nocheck
// Homepage Component Types

export interface NavbarProps {
  title?: string;
  onMenuToggle?: () => void;
  onSettingsClick?: () => void;
}

export interface SidebarProps {
  isCollapsed?: boolean;
  onCollapse?: (collapsed: boolean) => void;
  menuItems?: SidebarMenuItem[];
}

export interface SidebarMenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
}

export interface PreviewAreaProps {
  content?: string;
  isLoading?: boolean;
  onRefresh?: () => void;
}

export interface InputAreaProps {
  value?: string;
  placeholder?: string;
  onChange?: (value: string) => void;
  onSubmit?: () => void;
  disabled?: boolean;
}

export interface AIPanelProps {
  isOpen?: boolean;
  messages?: AIMessage[];
  onClose?: () => void;
  onSendMessage?: (message: string) => void;
  /** ID of the newest thinking item to apply pulse animation */
  newItemId?: string;
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}

export interface HomePageState {
  sidebarCollapsed: boolean;
  aiPanelOpen: boolean;
  currentStep: number;
  previewContent: string;
  inputValue: string;
  aiMessages: AIMessage[];
}

export interface PanelActions {
  toggleSidebar: () => void;
  toggleAIPanel: () => void;
  setCurrentStep: (step: number) => void;
  setPreviewContent: (content: string) => void;
  setInputValue: (value: string) => void;
  sendAIMessage: (message: string) => void;
}

// Re-export ThinkingPanel types from UI components
export type { ThinkingPanelProps } from '@/components/ui/ThinkingPanel';
export type { DDDStreamStatus, ThinkingStep } from '@/hooks/useDDDStream';
export type { BoundedContext } from '@/services/api/types/prototype/domain';
