import { useState, useCallback } from 'react';
import type { HomePageState, AIMessage } from '../types';

export interface UseHomePageStateReturn extends HomePageState {
  toggleSidebar: () => void;
  toggleAIPanel: () => void;
  setCurrentStep: (step: number) => void;
  setPreviewContent: (content: string) => void;
  setInputValue: (value: string) => void;
}

export const useHomePageState = (): UseHomePageStateReturn => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [aiPanelOpen, setAIPanelOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [previewContent, setPreviewContent] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [aiMessages, setAIMessages] = useState<AIMessage[]>([]);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => !prev);
  }, []);

  const toggleAIPanel = useCallback(() => {
    setAIPanelOpen((prev) => !prev);
  }, []);

  return {
    sidebarCollapsed,
    aiPanelOpen,
    currentStep,
    previewContent,
    inputValue,
    aiMessages,
    toggleSidebar,
    toggleAIPanel,
    setCurrentStep,
    setPreviewContent,
    setInputValue,
  };
};

export default useHomePageState;
