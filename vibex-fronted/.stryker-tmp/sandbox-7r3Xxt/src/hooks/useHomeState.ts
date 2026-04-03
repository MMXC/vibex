/**
 * Home State Hook
 * Manages homepage state including steps, requirements, generation results, and AI messages
 */
// @ts-nocheck


import { useCallback, useMemo, useState } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { HOME_STORAGE_KEY } from '@/constants/homepage';
import type {
  HomeState,
  BoundedContext,
  DomainModel,
  BusinessFlow,
  MermaidCodes,
  AIMessage,
  PersistedHomeState,
} from '@/types/homepage';

// 初始 Mermaid codes
const INITIAL_MERMAID_CODES: MermaidCodes = {
  contexts: undefined,
  models: undefined,
  flows: undefined,
};

// 生成唯一 ID
const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

export function useHomeState(): HomeState {
  // 持久化状态
  const [persistedState, setPersistedState] = useLocalStorage<PersistedHomeState>(
    HOME_STORAGE_KEY,
    {
      panelSizes: [15, 60, 25],
      selectedNodes: [],
      lastRequirementText: '',
      savedAt: new Date().toISOString(),
    }
  );

  // 内存状态 (不持久化)
  const [currentStep, setCurrentStep] = useState(1);
  const [completedStep, setCompletedStep] = useState(0);
  const [requirementText, setRequirementText] = useState('');
  const [mermaidCodes, setMermaidCodes] = useState<MermaidCodes>(INITIAL_MERMAID_CODES);
  const [boundedContexts, setBoundedContexts] = useState<BoundedContext[]>([]);
  const [domainModels, setDomainModels] = useState<DomainModel[]>([]);
  const [businessFlow, setBusinessFlow] = useState<BusinessFlow | null>(null);
  const [selectedNodes, setSelectedNodes] = useState<Set<string>>(new Set());
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [thinkingMessages, setThinkingMessages] = useState<string[]>([]);

  // 同步 requirementText 到持久化存储
  const handleSetRequirementText = useCallback(
    (text: string) => {
      setRequirementText(text);
      setPersistedState((prev) => ({
        ...prev,
        lastRequirementText: text,
        savedAt: new Date().toISOString(),
      }));
    },
    [setPersistedState]
  );

  // 节点选择
  const toggleNode = useCallback(
    (nodeId: string) => {
      setSelectedNodes((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(nodeId)) {
          newSet.delete(nodeId);
        } else {
          newSet.add(nodeId);
        }
        return newSet;
      });

      // 同步到持久化存储
      setPersistedState((prev) => ({
        ...prev,
        selectedNodes: selectedNodes.has(nodeId)
          ? prev.selectedNodes.filter((id) => id !== nodeId)
          : [...prev.selectedNodes, nodeId],
      }));
    },
    [setPersistedState, selectedNodes]
  );

  // 添加 AI 消息
  const addMessage = useCallback(
    (message: Omit<AIMessage, 'id' | 'timestamp'>) => {
      const newMessage: AIMessage = {
        ...message,
        id: generateId(),
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, newMessage]);
    },
    []
  );

  // 清空消息
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  // 添加思考消息
  const addThinkingMessage = useCallback((message: string) => {
    setThinkingMessages((prev) => [...prev, message]);
  }, []);

  // 清空思考消息
  const clearThinkingMessages = useCallback(() => {
    setThinkingMessages([]);
  }, []);

  // 完成当前步骤
  const completeCurrentStep = useCallback(() => {
    if (currentStep > completedStep) {
      setCompletedStep(currentStep);
    }
  }, [currentStep, completedStep]);

  // 重置状态
  const reset = useCallback(() => {
    setCurrentStep(1);
    setCompletedStep(0);
    setRequirementText('');
    setMermaidCodes(INITIAL_MERMAID_CODES);
    setBoundedContexts([]);
    setDomainModels([]);
    setBusinessFlow(null);
    setSelectedNodes(new Set());
    setMessages([]);
    setThinkingMessages([]);
    setPersistedState({
      panelSizes: [15, 60, 25],
      selectedNodes: [],
      lastRequirementText: '',
      savedAt: new Date().toISOString(),
    });
  }, [setPersistedState]);

  return useMemo(
    () => ({
      // 步骤状态
      currentStep,
      completedStep,
      setCurrentStep,
      setCompletedStep: completeCurrentStep,

      // 需求状态
      requirementText,
      setRequirementText: handleSetRequirementText,

      // Mermaid 代码
      mermaidCodes,
      setMermaidCodes,

      // 生成结果
      boundedContexts,
      domainModels,
      businessFlow,
      setBoundedContexts,
      setDomainModels,
      setBusinessFlow,

      // 节点选择
      selectedNodes,
      toggleNode,

      // AI 消息
      messages,
      addMessage,
      clearMessages,

      // 思考消息
      thinkingMessages,
      addThinkingMessage,
      clearThinkingMessages,

      // 重置
      reset,
    }),
    [
      currentStep,
      completedStep,
      requirementText,
      mermaidCodes,
      boundedContexts,
      domainModels,
      businessFlow,
      selectedNodes,
      messages,
      thinkingMessages,
      handleSetRequirementText,
      completeCurrentStep,
      toggleNode,
      addMessage,
      clearMessages,
      addThinkingMessage,
      clearThinkingMessages,
      reset,
    ]
  );
}

export default useHomeState;
