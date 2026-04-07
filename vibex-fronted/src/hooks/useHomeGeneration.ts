/**
 * Home Generation Hook
 * Manages AI generation logic for bounded contexts, domain models, and business flows
 */

import { useCallback, useMemo, useRef, useState } from 'react';
import { dddApi } from '@/services/api';
import { GENERATION_TIMEOUT } from '@/constants/homepage';
import type {
  HomeGeneration,
  BoundedContext,
  DomainModel,
  BusinessFlow,
  StreamStatus,
  GenerationResult,
  MermaidCodes,
} from '@/types/homepage';

interface UseHomeGenerationOptions {
  onSuccess?: (result: GenerationResult) => void;
  onError?: (error: Error) => void;
}

export function useHomeGeneration(
  state: {
    requirementText: string;
    boundedContexts: BoundedContext[];
    domainModels: DomainModel[];
    businessFlow: BusinessFlow | null;
    setBoundedContexts: (contexts: BoundedContext[]) => void;
    setDomainModels: (models: DomainModel[]) => void;
    setBusinessFlow: (flow: BusinessFlow | null) => void;
    addMessage: (message: Omit<import('@/types/homepage').AIMessage, 'id' | 'timestamp'>) => void;
    addThinkingMessage: (message: string) => void;
    clearThinkingMessages: () => void;
    mermaidCodes: MermaidCodes;
    setMermaidCodes: (codes: MermaidCodes) => void;
  },
  options?: UseHomeGenerationOptions
): HomeGeneration {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<Error | null>(null);
  const [streamStatus, setStreamStatus] = useState<StreamStatus>('idle');
  const abortControllerRef = useRef<AbortController | null>(null);

  // 生成限界上下文
  const generateContexts = useCallback(
    async (requirement: string) => {
      if (!requirement.trim()) {
        const error = new Error('需求文本不能为空');
        setGenerationError(error);
        options?.onError?.(error);
        return;
      }

      setIsGenerating(true);
      setGenerationError(null);
      setStreamStatus('streaming');
      state.clearThinkingMessages();

      try {
        const response = await dddApi.generateBoundedContext(requirement);

        if (response.success && response.boundedContexts) {
          const contexts = response.boundedContexts as BoundedContext[];
          state.setBoundedContexts(contexts);

          // 生成 Mermaid 代码
          if (response.mermaidCode) {
            state.setMermaidCodes({
              ...state.mermaidCodes,
              contexts: response.mermaidCode,
            });
          }

          // 添加 AI 消息
          state.addMessage({
            role: 'assistant',
            content: `已生成 ${contexts.length} 个限界上下文：${contexts.map((c) => c.name).join('、')}`,
          });

          options?.onSuccess?.({ type: 'contexts', data: contexts });
        } else {
          throw new Error(response.error || '生成限界上下文失败');
        }
      } catch (error) {
        setGenerationError(error as Error);
        options?.onError?.(error as Error);
        setStreamStatus('error');
      } finally {
        setIsGenerating(false);
        if (!generationError) {
          setStreamStatus('complete');
        }
      }
    },
    [state, options, generationError]
  );

  // 生成领域模型
  const generateDomainModels = useCallback(
    async (contexts: BoundedContext[]) => {
      if (!contexts.length) {
        const error = new Error('请先生成限界上下文');
        setGenerationError(error);
        options?.onError?.(error);
        return;
      }

      setIsGenerating(true);
      setGenerationError(null);
      setStreamStatus('streaming');
      state.clearThinkingMessages();

      try {
        const response = await dddApi.generateDomainModel(
          contexts,
          state.requirementText
        );

        if (response.success && response.domainModels) {
          const models = response.domainModels as DomainModel[];
          state.setDomainModels(models);

          // 生成 Mermaid 代码
          if (response.mermaidCode) {
            state.setMermaidCodes({
              ...state.mermaidCodes,
              models: response.mermaidCode,
            });
          }

          // 添加 AI 消息
          state.addMessage({
            role: 'assistant',
            content: `已生成 ${models.length} 个领域模型`,
          });

          options?.onSuccess?.({ type: 'models', data: models });
        } else {
          throw new Error(response.error || '生成领域模型失败');
        }
      } catch (error) {
        setGenerationError(error as Error);
        options?.onError?.(error as Error);
        setStreamStatus('error');
      } finally {
        setIsGenerating(false);
        if (!generationError) {
          setStreamStatus('complete');
        }
      }
    },
    [state, options, generationError]
  );

  // 生成业务流程
  const generateBusinessFlow = useCallback(
    async (models: DomainModel[]) => {
      if (!models.length) {
        const error = new Error('请先生成领域模型');
        setGenerationError(error);
        options?.onError?.(error);
        return;
      }

      setIsGenerating(true);
      setGenerationError(null);
      setStreamStatus('streaming');
      state.clearThinkingMessages();

      try {
        const response = await dddApi.generateBusinessFlow(
          models,
          state.requirementText
        );

        if (response.success && response.businessFlow) {
          const flow = response.businessFlow as BusinessFlow;
          state.setBusinessFlow(flow);

          // 生成 Mermaid 代码
          if (response.mermaidCode) {
            state.setMermaidCodes({
              ...state.mermaidCodes,
              flows: response.mermaidCode,
            });
          }

          // 添加 AI 消息
          state.addMessage({
            role: 'assistant',
            content: `已生成业务流程：${flow.name}`,
          });

          options?.onSuccess?.({ type: 'flows', data: flow });
        } else {
          throw new Error(response.error || '生成业务流程失败');
        }
      } catch (error) {
        setGenerationError(error as Error);
        options?.onError?.(error as Error);
        setStreamStatus('error');
      } finally {
        setIsGenerating(false);
        if (!generationError) {
          setStreamStatus('complete');
        }
      }
    },
    [state, options, generationError]
  );

  // 创建项目
  const createProject = useCallback(async () => {
    const { boundedContexts, domainModels, businessFlow } = state;

    if (!boundedContexts.length || !domainModels.length || !businessFlow) {
      const error = new Error('请完成前序步骤后再创建项目');
      setGenerationError(error);
      options?.onError?.(error);
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);

    try {
      // TODO: 实现项目创建 API 调用
      options?.onSuccess?.({ type: 'project', data: null });
    } catch (error) {
      setGenerationError(error as Error);
      options?.onError?.(error as Error);
    } finally {
      setIsGenerating(false);
    }
  }, [state, options]);

  // 发送消息
  const sendMessage = useCallback(
    async (message: string) => {
      state.addMessage({ role: 'user', content: message });
      setStreamStatus('streaming');

      try {
        // TODO: 实现 AI 对话 API 调用
        state.addMessage({ role: 'assistant', content: '已收到您的消息' });
        setStreamStatus('complete');
      } catch (error) {
        setGenerationError(error as Error);
        setStreamStatus('error');
      }
    },
    [state]
  );

  // 中止生成
  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsGenerating(false);
      setStreamStatus('idle');
    }
  }, []);

  // 重试
  const retry = useCallback(() => {
    // TODO: 实现重试逻辑
  }, []);

  // 清除错误
  const clearError = useCallback(() => {
    setGenerationError(null);
  }, []);

  return useMemo(
    () => ({
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
    }),
    [
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
    ]
  );
}

export default useHomeGeneration;
