/**
 * ProgressiveRenderer - 渐进式渲染组件
 * 
 * 通过 SSE 连接接收 AI 流式生成的设计内容
 * 实时更新 Zustand stores 和图表组件
 */

'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useContextStore } from '@/stores/confirmation/contextStore';
import { useModelStore } from '@/stores/confirmation/modelStore';
import { useFlowStore } from '@/stores/confirmation/flowStore';
import type { BoundedContext as StoreBoundedContext } from '@/stores/confirmation/types';
import type { DomainModel as StoreDomainModel } from '@/stores/confirmation/types';

// 使用 store 的类型
type BoundedContext = StoreBoundedContext;
type DomainEntity = StoreDomainModel;

// SSE 事件类型
type ProgressiveEvent =
  | { type: 'context:add'; data: BoundedContext }
  | { type: 'context:update'; data: { id: string; changes: Partial<BoundedContext> } }
  | { type: 'entity:add'; data: DomainEntity }
  | { type: 'entity:update'; data: { id: string; changes: Partial<DomainEntity> } }
  | { type: 'entity:delete'; data: { id: string } }
  | { type: 'relationship:add'; data: Relationship }
  | { type: 'flow:step:add'; data: FlowStep }
  | { type: 'flow:step:update'; data: { id: string; changes: Partial<FlowStep> } }
  | { type: 'progress'; data: { step: string; progress: number; message: string } }
  | { type: 'complete'; data: { summary: string; stats: { entities: number; relations: number } } }
  | { type: 'error'; data: { code: string; message: string; recoverable: boolean } };

interface Relationship {
  id: string;
  sourceId: string;
  targetId: string;
  type: 'association' | 'aggregation' | 'composition' | 'inheritance';
  label?: string;
}

interface FlowStep {
  id: string;
  name: string;
  description: string;
  type: 'start' | 'process' | 'decision' | 'end';
  position?: { x: number; y: number };
}

export interface ProgressiveRendererProps {
  requirement: string;
  enabled?: boolean;
  onProgress?: (progress: number, message: string) => void;
  onComplete?: (summary: string, stats: { entities: number; relations: number }) => void;
  onError?: (error: { code: string; message: string; recoverable: boolean }) => void;
}

type ConnectionState = 'idle' | 'connecting' | 'streaming' | 'complete' | 'error';

const MAX_RETRY_COUNT = 3;
const RETRY_DELAY = 2000;

export function ProgressiveRenderer({
  requirement,
  enabled = true,
  onProgress,
  onComplete,
  onError,
}: ProgressiveRendererProps) {
  const eventSourceRef = useRef<EventSource | null>(null);
  const retryCountRef = useRef(0);

  const [state, setState] = useState<ConnectionState>('idle');
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');

  // Store actions
  const boundedContexts = useContextStore((s) => s.boundedContexts);
  const setBoundedContexts = useContextStore((s) => s.setBoundedContexts);
  const domainModels = useModelStore((s) => s.domainModels);
  const setDomainModels = useModelStore((s) => s.setDomainModels);
  const businessFlow = useFlowStore((s) => s.businessFlow);
  const setBusinessFlow = useFlowStore((s) => s.setBusinessFlow);

  // 添加/更新辅助函数
  const addBoundedContext = useCallback((ctx: BoundedContext) => {
    setBoundedContexts([...boundedContexts, ctx]);
  }, [boundedContexts, setBoundedContexts]);

  const updateBoundedContext = useCallback((id: string, changes: Partial<BoundedContext>) => {
    setBoundedContexts(
      boundedContexts.map((c) => (c.id === id ? { ...c, ...changes } : c))
    );
  }, [boundedContexts, setBoundedContexts]);

  const addDomainModel = useCallback((entity: DomainEntity) => {
    setDomainModels([...domainModels, entity]);
  }, [domainModels, setDomainModels]);

  const updateDomainModel = useCallback((id: string, changes: Partial<DomainEntity>) => {
    setDomainModels(
      domainModels.map((e) => (e.id === id ? { ...e, ...changes } : e))
    );
  }, [domainModels, setDomainModels]);

  const removeDomainModel = useCallback((id: string) => {
    setDomainModels(domainModels.filter((e) => e.id !== id));
  }, [domainModels, setDomainModels]);

  const addFlowStep = useCallback((step: FlowStep) => {
    const newFlowState = {
      id: step.id,
      name: step.name,
      type: step.type === 'start' ? 'initial' as const : step.type === 'end' ? 'final' as const : 'intermediate' as const,
      description: step.description,
    };
    setBusinessFlow({
      ...businessFlow,
      states: [...businessFlow.states, newFlowState],
    });
  }, [businessFlow, setBusinessFlow]);

  // 处理 SSE 事件
  const handleEvent = useCallback(
    (event: MessageEvent) => {
      try {
        const data: ProgressiveEvent = JSON.parse(event.data);

        switch (data.type) {
          case 'context:add':
            addBoundedContext(data.data);
            break;

          case 'context:update':
            updateBoundedContext(data.data.id, data.data.changes);
            break;

          case 'entity:add':
            addDomainModel(data.data);
            break;

          case 'entity:update':
            updateDomainModel(data.data.id, data.data.changes);
            break;

          case 'entity:delete':
            removeDomainModel(data.data.id);
            break;

          case 'relationship:add':
            // 关系存储在 domainModel 的 relationships 中
            break;

          case 'flow:step:add':
            addFlowStep(data.data);
            break;

          case 'flow:step:update':
            // 简化处理：重新设置整个 businessFlow
            break;

          case 'progress':
            setProgress(data.data.progress);
            setProgressMessage(data.data.message);
            onProgress?.(data.data.progress, data.data.message);
            break;

          case 'complete':
            setState('complete');
            onComplete?.(data.data.summary, data.data.stats);
            break;

          case 'error':
            setState('error');
            onError?.(data.data);
            break;
        }
      } catch (err) {
        console.error('Failed to parse SSE event:', err);
      }
    },
    [
      addBoundedContext,
      updateBoundedContext,
      addDomainModel,
      updateDomainModel,
      removeDomainModel,
      addFlowStep,
      onProgress,
      onComplete,
      onError,
    ]
  );

  // 建立 SSE 连接
  const connect = useCallback(() => {
    if (!requirement.trim()) return;

    // 关闭现有连接
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    setState('connecting');

    // 构建 SSE URL
    const params = new URLSearchParams({
      requirement: encodeURIComponent(requirement),
      sessionId: crypto.randomUUID(),
    });

    const url = `/api/design/stream?${params.toString()}`;
    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setState('streaming');
      retryCountRef.current = 0;
    };

    eventSource.onmessage = handleEvent;

    eventSource.onerror = () => {
      setState('error');
      eventSource.close();

      // 自动重连
      if (retryCountRef.current < MAX_RETRY_COUNT) {
        retryCountRef.current += 1;
        setTimeout(connect, RETRY_DELAY);
      }
    };
  }, [requirement, handleEvent]);

  // 断开连接
  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setState('idle');
  }, []);

  // 监听 requirement 变化自动连接/断开
  useEffect(() => {
    if (enabled && requirement.trim()) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, requirement, connect, disconnect]);

  // 暴露状态给父组件
  return {
    state,
    progress,
    progressMessage,
    connect,
    disconnect,
  };
}

export default ProgressiveRenderer;
