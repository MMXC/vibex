/**
 * useHomePage - HomePage 业务逻辑 Hook
 * 
 * 封装首页所有状态管理和业务逻辑
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useDDDStream, useDomainModelStream, useBusinessFlowStream } from '@/hooks/useDDDStream';
import type { BoundedContext } from '@/services/api/types/prototype/domain';
import type { DomainModel, BusinessFlow } from '@/types/homepage';

export interface UseHomePageReturn {
  // Auth
  isAuthenticated: boolean;
  
  // State
  requirementText: string;
  setRequirementText: (text: string) => void;
  currentStep: number;
  completedStep: number;
  boundedContexts: BoundedContext[];
  contextMermaidCode: string;
  domainModels: DomainModel[];
  modelMermaidCode: string;
  businessFlow: BusinessFlow | null;
  flowMermaidCode: string;
  generationError: string;
  panelSizes: number[];
  maximizedPanel: string | null;
  minimizedPanel: string | null;
  
  // DDD Stream
  streamStatus: string;
  streamError: string | null;
  modelStreamStatus: string;
  modelStreamError: string | null;
  flowStreamStatus: string;
  flowStreamError: string | null;
  
  // Computed
  isGenerating: boolean;
  
  // Actions
  generateContexts: (text: string) => void;
  abortContexts: () => void;
  generateDomainModels: (text: string, contexts: BoundedContext[]) => void;
  abortModels: () => void;
  generateBusinessFlow: (models: DomainModel[]) => void;
  abortFlow: () => void;
  setCurrentStep: (step: number) => void;
  setPanelSizes: (sizes: number[]) => void;
  setMaximizedPanel: (panel: string | null) => void;
  setMinimizedPanel: (panel: string | null) => void;
}

export function useHomePage(): UseHomePageReturn {
  const { isAuthenticated, checkAuth, syncFromStorage } = useAuthStore();
  
  // Main state
  const [requirementText, setRequirementText] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const [completedStep, setCompletedStep] = useState(1);
  const [boundedContexts, setBoundedContexts] = useState<BoundedContext[]>([]);
  const [contextMermaidCode, setContextMermaidCode] = useState('');
  const [domainModels, setDomainModels] = useState<DomainModel[]>([]);
  const [modelMermaidCode, setModelMermaidCode] = useState('');
  const [businessFlow, setBusinessFlow] = useState<BusinessFlow | null>(null);
  const [flowMermaidCode, setFlowMermaidCode] = useState('');
  const [generationError, setGenerationError] = useState('');
  const [panelSizes, setPanelSizes] = useState<number[]>([60, 40]);
  const [maximizedPanel, setMaximizedPanel] = useState<string | null>(null);
  const [minimizedPanel, setMinimizedPanel] = useState<string | null>(null);

  // SSE Hooks
  const {
    thinkingMessages: _ctxMessages,
    contexts: streamContexts,
    mermaidCode: streamMermaidCode,
    status: streamStatus,
    errorMessage: streamError,
    generateContexts,
    abort: abortContexts,
  } = useDDDStream();

  const {
    thinkingMessages: _modelMessages,
    domainModels: streamDomainModels,
    mermaidCode: streamModelMermaidCode,
    status: modelStreamStatus,
    errorMessage: modelStreamError,
    generateDomainModels,
    abort: abortModels,
  } = useDomainModelStream();

  const {
    thinkingMessages: _flowMessages,
    businessFlow: streamBusinessFlow,
    mermaidCode: streamFlowMermaidCode,
    status: flowStreamStatus,
    errorMessage: flowStreamError,
    generateBusinessFlow,
    abort: abortFlow,
  } = useBusinessFlowStream();

  // Initialize auth
  useEffect(() => {
    syncFromStorage();
    checkAuth();
  }, [syncFromStorage, checkAuth]);

  // Sync SSE results - Contexts
  useEffect(() => {
    if (streamStatus === 'done') {
      setBoundedContexts(streamContexts);
      setContextMermaidCode(streamMermaidCode);
      if (streamContexts.length > 0 || streamMermaidCode) {
        setCurrentStep(2);
        setCompletedStep(2);
      }
    }
  }, [streamStatus, streamContexts, streamMermaidCode]);

  // Sync SSE results - Domain Models
  useEffect(() => {
    if (modelStreamStatus === 'done') {
      setDomainModels(streamDomainModels as DomainModel[]);
      setModelMermaidCode(streamModelMermaidCode);
      if (streamDomainModels.length > 0 || streamModelMermaidCode) {
        setCurrentStep(3);
        setCompletedStep(3);
      }
    }
  }, [modelStreamStatus, streamDomainModels, streamModelMermaidCode]);

  // Sync SSE results - Business Flow
  useEffect(() => {
    if (flowStreamStatus === 'done') {
      setBusinessFlow(streamBusinessFlow as unknown as BusinessFlow);
      setFlowMermaidCode(streamFlowMermaidCode);
      if (streamBusinessFlow || streamFlowMermaidCode) {
        setCurrentStep(4);
        setCompletedStep(4);
      }
    }
  }, [flowStreamStatus, streamBusinessFlow, streamFlowMermaidCode]);

  // Persist panel sizes
  useEffect(() => {
    const saved = localStorage.getItem('vibex-panel-sizes');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 2) setPanelSizes(parsed);
      } catch (e) { /* ignore */ }
    }
  }, []);

  return {
    // Auth
    isAuthenticated,
    
    // State
    requirementText,
    setRequirementText,
    currentStep,
    completedStep,
    boundedContexts,
    contextMermaidCode,
    domainModels,
    modelMermaidCode,
    businessFlow,
    flowMermaidCode,
    generationError,
    panelSizes,
    maximizedPanel,
    minimizedPanel,
    
    // Stream status
    streamStatus,
    streamError,
    modelStreamStatus,
    modelStreamError,
    flowStreamStatus,
    flowStreamError,
    
    // Computed
    isGenerating: streamStatus === 'thinking' || modelStreamStatus === 'thinking' || flowStreamStatus === 'thinking',
    
    // Actions
    generateContexts,
    abortContexts,
    generateDomainModels,
    abortModels,
    generateBusinessFlow,
    abortFlow,
    setCurrentStep,
    setPanelSizes,
    setMaximizedPanel,
    setMinimizedPanel,
  };
}

export default useHomePage;
