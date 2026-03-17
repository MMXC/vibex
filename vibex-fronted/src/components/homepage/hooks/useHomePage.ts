/**
 * useHomePage - HomePage 业务逻辑 Hook
 * 
 * 封装首页所有状态管理和业务逻辑
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useDDDStream, useDomainModelStream, useBusinessFlowStream } from '@/hooks/useDDDStream';
import type { BoundedContext } from '@/services/api/types/prototype/domain';
import type { DomainModel, BusinessFlow, PageStructure } from '@/types/homepage';

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
  
  // Selection state (F2: 步骤数据依赖建立)
  selectedContextIds: Set<string>;
  selectedModelIds: Set<string>;
  setSelectedContextIds: (ids: Set<string>) => void;
  setSelectedModelIds: (ids: Set<string>) => void;
  toggleContextSelection: (id: string) => void;
  toggleModelSelection: (id: string) => void;
  
  // Page Structure State (F4: 页面结构分析)
  pageStructure: PageStructure | null;
  pageStructureAnalyzed: boolean;
  analyzePageStructure: () => void;
  
  // DDD Stream
  streamStatus: string;
  streamError: string | null;
  modelStreamStatus: string;
  modelStreamError: string | null;
  flowStreamStatus: string;
  flowStreamError: string | null;
  
  // Error & Retry (F3: 错误恢复机制)
  currentError: string | null;
  isRetrying: boolean;
  retryCurrentStep: () => void;
  
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
  setCompletedStep: (step: number) => void;
  setPanelSizes: (sizes: number[]) => void;
  setMaximizedPanel: (panel: string | null) => void;
  setMinimizedPanel: (panel: string | null) => void;
}

export function useHomePage(): UseHomePageReturn {
  const { isAuthenticated, checkAuth, syncFromStorage } = useAuthStore();
  
  // Main state
  const [requirementText, setRequirementText] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const [completedStep, setCompletedStep] = useState(0); // F1: Start at 0 (no steps completed)
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

  // F2: Selection state for step data passing
  const [selectedContextIds, setSelectedContextIds] = useState<Set<string>>(new Set());
  const [selectedModelIds, setSelectedModelIds] = useState<Set<string>>(new Set());

  // F4: Page Structure State
  const [pageStructure, setPageStructure] = useState<PageStructure | null>(null);
  const [pageStructureAnalyzed, setPageStructureAnalyzed] = useState(false);

  // F3: Error and retry state
  const [currentError, setCurrentError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  
  // Store last generation params for retry
  const lastGenerationRef = useRef<{
    type: 'contexts' | 'models' | 'flow';
    params: unknown;
  } | null>(null);

  // SSE Hooks
  const {
    thinkingMessages: _ctxMessages,
    contexts: streamContexts,
    mermaidCode: streamMermaidCode,
    status: streamStatus,
    errorMessage: streamError,
    generateContexts: rawGenerateContexts,
    abort: abortContexts,
  } = useDDDStream();

  const {
    thinkingMessages: _modelMessages,
    domainModels: streamDomainModels,
    mermaidCode: streamModelMermaidCode,
    status: modelStreamStatus,
    errorMessage: modelStreamError,
    generateDomainModels: rawGenerateDomainModels,
    abort: abortModels,
  } = useDomainModelStream();

  const {
    thinkingMessages: _flowMessages,
    businessFlow: streamBusinessFlow,
    mermaidCode: streamFlowMermaidCode,
    status: flowStreamStatus,
    errorMessage: flowStreamError,
    generateBusinessFlow: rawGenerateBusinessFlow,
    abort: abortFlow,
  } = useBusinessFlowStream();

  // F3: Error handling - sync errors to currentError
  useEffect(() => {
    if (streamError) {
      setCurrentError(streamError);
    } else if (modelStreamError) {
      setCurrentError(modelStreamError);
    } else if (flowStreamError) {
      setCurrentError(flowStreamError);
    } else {
      setCurrentError(null);
    }
  }, [streamError, modelStreamError, flowStreamError]);

  // F3: Retry function
  const retryCurrentStep = useCallback(() => {
    if (!lastGenerationRef.current) return;
    
    setIsRetrying(true);
    setCurrentError(null);
    
    const { type, params } = lastGenerationRef.current;
    
    try {
      if (type === 'contexts' && typeof params === 'string') {
        rawGenerateContexts(params);
      } else if (type === 'models' && Array.isArray(params)) {
        rawGenerateDomainModels(requirementText, params as BoundedContext[]);
      } else if (type === 'flow' && Array.isArray(params)) {
        rawGenerateBusinessFlow(params as DomainModel[]);
      }
    } finally {
      setIsRetrying(false);
    }
  }, [requirementText, rawGenerateContexts, rawGenerateDomainModels, rawGenerateBusinessFlow]);

  // F2: Wrapped generate functions that store params for retry
  const generateContexts = useCallback((text: string) => {
    lastGenerationRef.current = { type: 'contexts', params: text };
    rawGenerateContexts(text);
  }, [rawGenerateContexts]);

  const generateDomainModels = useCallback((text: string, contexts: BoundedContext[]) => {
    lastGenerationRef.current = { type: 'models', params: contexts };
    rawGenerateDomainModels(text, contexts);
  }, [rawGenerateDomainModels]);

  const generateBusinessFlow = useCallback((models: DomainModel[]) => {
    lastGenerationRef.current = { type: 'flow', params: models };
    rawGenerateBusinessFlow(models);
  }, [rawGenerateBusinessFlow]);

  // F2: Toggle selection functions
  const toggleContextSelection = useCallback((id: string) => {
    setSelectedContextIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const toggleModelSelection = useCallback((id: string) => {
    setSelectedModelIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // F4: Analyze Page Structure function
  const analyzePageStructure = useCallback(() => {
    if (!businessFlow) return;
    
    // Mock 实现：创建基础页面结构
    const mockPageStructure: PageStructure = {
      id: `ps-${Date.now()}`,
      name: 'Generated Pages',
      pages: [
        { id: 'page-1', name: 'Home', path: '/', components: ['Header', 'Hero', 'Footer'] },
        { id: 'page-2', name: 'About', path: '/about', components: ['Header', 'Content', 'Footer'] },
      ],
      routes: [
        { path: '/', pageId: 'page-1' },
        { path: '/about', pageId: 'page-2' },
      ],
    };
    
    setPageStructure(mockPageStructure);
    setPageStructureAnalyzed(true);
    setCompletedStep(4);
    setCurrentStep(5);
  }, [businessFlow]);

  // Initialize auth
  useEffect(() => {
    syncFromStorage();
    checkAuth();
  }, [syncFromStorage, checkAuth]);

  // Sync SSE results - Contexts (F1: completedStep state fix)
  useEffect(() => {
    if (streamStatus === 'done') {
      setBoundedContexts(streamContexts);
      setContextMermaidCode(streamMermaidCode);
      if (streamContexts.length > 0 || streamMermaidCode) {
        // F1: Properly update completedStep and advance currentStep
        setCompletedStep(1);
        setCurrentStep(2);
      }
    }
  }, [streamStatus, streamContexts, streamMermaidCode]);

  // Sync SSE results - Domain Models (F1 & F2)
  useEffect(() => {
    if (modelStreamStatus === 'done') {
      setDomainModels(streamDomainModels as DomainModel[]);
      setModelMermaidCode(streamModelMermaidCode);
      if (streamDomainModels.length > 0 || streamModelMermaidCode) {
        // F1: Properly update completedStep and advance currentStep
        setCompletedStep(2);
        setCurrentStep(3);
      }
      // F2: Auto-select all contexts if none selected
      if (selectedContextIds.size === 0 && streamDomainModels.length > 0) {
        const allIds = new Set(streamDomainModels.map((_: unknown) => ( _ as { id: string }).id).filter(Boolean));
        setSelectedContextIds(allIds);
      }
    }
  }, [modelStreamStatus, streamDomainModels, streamModelMermaidCode, selectedContextIds.size]);

  // Sync SSE results - Business Flow (F1 & F2)
  useEffect(() => {
    if (flowStreamStatus === 'done') {
      setBusinessFlow(streamBusinessFlow as unknown as BusinessFlow);
      setFlowMermaidCode(streamFlowMermaidCode);
      if (streamBusinessFlow || streamFlowMermaidCode) {
        // F1: Properly update completedStep and advance currentStep
        setCompletedStep(3);
        setCurrentStep(4);
      }
      // F2: Auto-select all models if none selected
      if (selectedModelIds.size === 0 && streamDomainModels.length > 0) {
        const allIds = new Set(streamDomainModels.map((_: unknown) => ( _ as { id: string }).id).filter(Boolean));
        setSelectedModelIds(allIds);
      }
    }
  }, [flowStreamStatus, streamBusinessFlow, streamFlowMermaidCode, selectedModelIds.size, streamDomainModels]);

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
    
    // Selection state (F2)
    selectedContextIds,
    selectedModelIds,
    setSelectedContextIds,
    setSelectedModelIds,
    toggleContextSelection,
    toggleModelSelection,
    
    // Page Structure State (F4)
    pageStructure,
    pageStructureAnalyzed,
    analyzePageStructure,
    
    // Stream status
    streamStatus,
    streamError,
    modelStreamStatus,
    modelStreamError,
    flowStreamStatus,
    flowStreamError,
    
    // Error & Retry (F3)
    currentError,
    isRetrying,
    retryCurrentStep,
    
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
    setCompletedStep,
    setPanelSizes,
    setMaximizedPanel,
    setMinimizedPanel,
  };
}

export default useHomePage;
