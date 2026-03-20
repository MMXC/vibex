import { useState, useCallback } from 'react';

/** Dev-only logger to prevent sensitive data leaking in production */
const devLog = (...args: unknown[]) => {
  if (process.env.NODE_ENV !== 'production') console.log(...args);
};
import type { BoundedContext, DomainModel, BusinessFlow, HomeGeneration, StreamStatus } from '@/types/homepage';

/**
 * useHomeGeneration - 生成逻辑 Hook
 * 
 * 功能：
 * - 生成状态管理 (isGenerating, error, streamStatus)
 * - 限界上下文生成
 * - 领域模型生成
 * - 业务流程生成
 * - 项目创建
 */
export const useHomeGeneration = (
  onContextsGenerated?: (contexts: BoundedContext[]) => void,
  onDomainModelsGenerated?: (models: DomainModel[]) => void,
  onBusinessFlowGenerated?: (flow: BusinessFlow) => void,
  onProjectCreated?: () => void,
  onError?: (error: Error) => void
): HomeGeneration => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<Error | null>(null);
  const [streamStatus, setStreamStatus] = useState<StreamStatus>('idle');

  const clearError = useCallback(() => {
    setGenerationError(null);
  }, []);

  const generateContexts = useCallback(async (requirement: string) => {
    setIsGenerating(true);
    setGenerationError(null);
    setStreamStatus('streaming');
    
    try {
      // This would typically call the actual API
      // For now, we just set up the structure
      devLog('Generating contexts for:', requirement);
      // onContextsGenerated?.(contexts);
      setStreamStatus('complete');
    } catch (error) {
      const err = error instanceof Error ? error : new Error('生成失败');
      setGenerationError(err);
      setStreamStatus('error');
      onError?.(err);
    } finally {
      setIsGenerating(false);
    }
  }, [onContextsGenerated, onError]);

  const generateDomainModels = useCallback(async (contexts: BoundedContext[]) => {
    setIsGenerating(true);
    setGenerationError(null);
    setStreamStatus('streaming');
    
    try {
      devLog('Generating domain models for:', contexts.length, 'contexts');
      // onDomainModelsGenerated?.(models);
      setStreamStatus('complete');
    } catch (error) {
      const err = error instanceof Error ? error : new Error('生成失败');
      setGenerationError(err);
      setStreamStatus('error');
      onError?.(err);
    } finally {
      setIsGenerating(false);
    }
  }, [onDomainModelsGenerated, onError]);

  const generateBusinessFlow = useCallback(async (models: DomainModel[]) => {
    setIsGenerating(true);
    setGenerationError(null);
    setStreamStatus('streaming');
    
    try {
      devLog('Generating business flow for:', models.length, 'models');
      // onBusinessFlowGenerated?.(flow);
      setStreamStatus('complete');
    } catch (error) {
      const err = error instanceof Error ? error : new Error('生成失败');
      setGenerationError(err);
      setStreamStatus('error');
      onError?.(err);
    } finally {
      setIsGenerating(false);
    }
  }, [onBusinessFlowGenerated, onError]);

  const createProject = useCallback(async () => {
    setIsGenerating(true);
    setGenerationError(null);
    
    try {
      devLog('Creating project...');
      // onProjectCreated?.();
    } catch (error) {
      const err = error instanceof Error ? error : new Error('创建失败');
      setGenerationError(err);
      onError?.(err);
    } finally {
      setIsGenerating(false);
    }
  }, [onProjectCreated, onError]);

  const sendMessage = useCallback(async (message: string) => {
    devLog('Sending message:', message);
    // AI chat implementation would go here
  }, []);

  const abort = useCallback(() => {
    setIsGenerating(false);
    setStreamStatus('idle');
  }, []);

  const retry = useCallback(() => {
    // Retry the last operation
    clearError();
    setStreamStatus('idle');
  }, [clearError]);

  return {
    isGenerating,
    generationError,
    streamStatus,
    generateContexts,
    generateDomainModels,
    generateBusinessFlow,
    createProject,
    sendMessage,
    abort,
    retry,
    clearError,
  };
};

export default useHomeGeneration;