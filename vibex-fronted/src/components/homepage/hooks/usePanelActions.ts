import { useCallback, useState } from 'react';
import type { AIMessage, PanelActions } from '../types';

export interface UsePanelActionsReturn extends PanelActions {
  messages: AIMessage[];
}

export const usePanelActions = (): UsePanelActionsReturn => {
  const [messages, setMessages] = useState<AIMessage[]>([]);

  const toggleSidebar = useCallback(() => {
    // Implemented in useHomePageState
  }, []);

  const toggleAIPanel = useCallback(() => {
    // Implemented in useHomePageState
  }, []);

  const setCurrentStep = useCallback((step: number) => {
    console.log('Set current step:', step);
  }, []);

  const setPreviewContent = useCallback((content: string) => {
    console.log('Set preview content:', content);
  }, []);

  const setInputValue = useCallback((value: string) => {
    console.log('Set input value:', value);
  }, []);

  const sendAIMessage = useCallback((content: string) => {
    const userMessage: AIMessage = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content,
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, userMessage]);

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: AIMessage = {
        id: `msg-${Date.now()}-ai`,
        role: 'assistant',
        content: `收到: ${content}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    }, 500);
  }, []);

  return {
    messages,
    toggleSidebar,
    toggleAIPanel,
    setCurrentStep,
    setPreviewContent,
    setInputValue,
    sendAIMessage,
  };
};

export default usePanelActions;
