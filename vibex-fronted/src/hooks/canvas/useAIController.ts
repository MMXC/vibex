/**
 * useAIController — AI generation state and logic for CanvasPage
 *
 * Extracts from CanvasPage.tsx:
 *  - requirementInput state (user text input)
 *  - generatingState state (generation in progress)
 *  - quickGenerate callback (SSE stream → fallback to sync mock)
 *  - AI thinking state from sessionStore
 *
 * All handlers are via useCallback to avoid reference churn.
 *
 * Epic: canvas-split-hooks / E4-useAIController
 * Epic2-SSE: SSE streamGenerate integration with fallback
 */

import { useState, useCallback } from 'react';
import { useSessionStore } from '@/lib/canvas/stores/sessionStore';
import { useContextStore } from '@/lib/canvas/stores/contextStore';
import { useFlowStore } from '@/lib/canvas/stores/flowStore';
import { useComponentStore } from '@/lib/canvas/stores/componentStore';
import { canvasSseAnalyze } from '@/lib/canvas/api/canvasSseApi';
import type { BoundedContextDraft, BoundedContextNode, ComponentNode } from '@/lib/canvas/types';
import type { BoundedContext } from '@/lib/canvas/api/canvasSseApi';
import { useToast } from '@/components/ui/Toast';

export type GeneratingState = 'idle' | 'generating' | 'done' | 'error' | 'fallback';

export interface UseAIControllerReturn {
  // === State ===
  requirementInput: string;
  setRequirementInput: (v: string) => void;
  /** @deprecated use generatingState instead */
  isQuickGenerating: boolean;
  generatingState: GeneratingState;
  // === Session store selectors ===
  aiThinking: boolean;
  aiThinkingMessage: string | null;
  requirementText: string;
  setRequirementText: (v: string) => void;
  flowGenerating: boolean;
  // === Actions ===
  quickGenerate: () => Promise<void>;
}

function useAIControllerImpl(): UseAIControllerReturn {
  const toast = useToast();

  // === Local state ===
  const [requirementInput, setRequirementInput] = useState('');
  const [generatingState, setGeneratingState] = useState<GeneratingState>('idle');

  // === Session store ===
  const aiThinking = useSessionStore((s) => s.aiThinking);
  const aiThinkingMessage = useSessionStore((s) => s.aiThinkingMessage);
  const requirementText = useSessionStore((s) => s.requirementText);
  const setRequirementText = useSessionStore((s) => s.setRequirementText);
  const flowGenerating = useSessionStore((s) => s.flowGenerating);
  const setAiThinking = useSessionStore((s) => s.setAiThinking);
  const setFlowGenerating = useSessionStore((s) => s.setFlowGenerating);

  // === Store setters ===
  const setContextNodes = useContextStore((s) => s.setContextNodes);
  const setComponentNodes = useComponentStore((s) => s.setComponentNodes);
  const autoGenerateFlows = useFlowStore((s) => s.autoGenerateFlows);

  // ─── Fallback: sync mock (single-layer, called on SSE error) ───────────────
  const fallbackToSyncGenerate = useCallback(async () => {
    setGeneratingState('fallback');
    setAiThinking(true, '同步生成中...');

    try {
      // Step 1: Generate contexts (inline mock)
      const ctxDrafts: BoundedContextDraft[] = [
        { name: '需求管理', description: '处理用户需求录入与管理', type: 'core' },
        { name: '订单处理', description: '处理订单创建、支付和履约', type: 'core' },
        { name: '通知服务', description: '消息推送和通知管理', type: 'supporting' },
      ];
      const newCtxNodes: BoundedContextNode[] = ctxDrafts.map((d, i) => ({
        nodeId: `ctx-gen-${Date.now()}-${i}`,
        name: d.name,
        description: d.description,
        type: d.type,
        status: 'pending' as const,
        children: [],
      }));
      setContextNodes(newCtxNodes);
      const ctxs = newCtxNodes.filter((c) => c.isActive !== false);
      if (ctxs.length === 0) {
        toast.showToast('未生成任何 Context 节点，请检查需求输入', 'error');
        setAiThinking(false);
        setGeneratingState('idle');
        return;
      }
      // Step 2: Auto-generate flows
      setAiThinking(true, '生成业务流程中...');
      await autoGenerateFlows(ctxs);
      // Step 3: Generate components (inline mock)
      const flows = useFlowStore.getState().flowNodes;
      const newCompNodes: ComponentNode[] = flows.map((f, i) => ({
        nodeId: `comp-gen-${Date.now()}-${i}`,
        flowId: f.nodeId,
        name: `${f.name}页面`,
        type: 'page' as const,
        props: { layout: 'full-width', theme: 'light' },
        api: {
          method: 'GET',
          path: `/api/${f.name.toLowerCase().replace(/\s+/g, '-')}`,
          params: [],
        },
        previewUrl: undefined,
        status: 'pending' as const,
        children: [],
      }));
      setComponentNodes(newCompNodes);
      toast.showToast('同步生成完成', 'success');
      setAiThinking(false);
      setGeneratingState('done');
    } catch (err) {
      toast.showToast(err instanceof Error ? err.message : '同步生成失败', 'error');
      setAiThinking(false);
      setGeneratingState('idle');
    }
  }, [setContextNodes, autoGenerateFlows, setComponentNodes, setAiThinking, toast]);

  // ─── Main quickGenerate: SSE stream ───────────────────────────────────────
  const quickGenerate = useCallback(async () => {
    if (!requirementInput.trim()) {
      toast.showToast('请先输入需求', 'warning');
      return;
    }
    if (generatingState !== 'idle' || aiThinking || flowGenerating) {
      return;
    }

    setGeneratingState('generating');
    setRequirementText(requirementInput);
    setAiThinking(true, 'AI 分析中...');

    // Pending nodes collected from SSE steps
    let pendingCtxNodes: BoundedContextNode[] = [];
    let pendingCompNodes: ComponentNode[] = [];

    try {
      await canvasSseAnalyze(requirementInput, {
        // thinking 事件 → 更新 AI thinking 消息
        onThinking: (content, _delta) => {
          setAiThinking(true, content);
        },

        // step_context 事件 → 收集 context nodes（暂存，done 时统一写入）
        onStepContext: (_content, _mermaidCode, _confidence, boundedContexts) => {
          if (!boundedContexts || boundedContexts.length === 0) return;
          const newNodes: BoundedContextNode[] = boundedContexts.map((ctx: BoundedContext) => ({
            nodeId: `ctx-sse-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            name: ctx.name,
            description: ctx.description,
            type: ctx.type as BoundedContextNode['type'],
            status: 'pending' as const,
            children: [],
          }));
          pendingCtxNodes.push(...newNodes);
        },

        // step_model 事件 → AI 正在分析模型（记录日志，不单独处理）
        onStepModel: (_content) => {
          // model 节点暂不写入 store，跟随 context/flow/component 三树逻辑
        },

        // step_flow 事件 → AI 正在生成 flow（记录 thinking 状态）
        onStepFlow: (_content) => {
          setFlowGenerating(true, '生成业务流程中...');
        },

        // step_components 事件 → 收集 component nodes（暂存，done 时统一写入）
        onStepComponents: (_content, _mermaidCode, _confidence) => {
          // 暂存，待 done 时用 flowNodes 生成
        },

        // done 事件 → 写入所有节点，完成生成
        onDone: (_projectId, _summary) => {
          // Write pending context nodes
          if (pendingCtxNodes.length > 0) {
            setContextNodes(pendingCtxNodes);
          }

          // Auto-generate flows from confirmed contexts, then components
          const ctxs = pendingCtxNodes.filter((c) => c.isActive !== false);
          if (ctxs.length > 0) {
            setFlowGenerating(true, '生成业务流程中...');
            autoGenerateFlows(ctxs).then(() => {
              const flows = useFlowStore.getState().flowNodes;
              const newCompNodes: ComponentNode[] = flows.map((f, i) => ({
                nodeId: `comp-sse-${Date.now()}-${i}`,
                flowId: f.nodeId,
                name: `${f.name}页面`,
                type: 'page' as const,
                props: { layout: 'full-width', theme: 'light' },
                api: {
                  method: 'GET',
                  path: `/api/${f.name.toLowerCase().replace(/\s+/g, '-')}`,
                  params: [],
                },
                previewUrl: undefined,
                status: 'pending' as const,
                children: [],
              }));
              setComponentNodes(newCompNodes);
              setFlowGenerating(false);
            });
          }

          setAiThinking(false);
          toast.showToast('三树生成完成', 'success');
          setGeneratingState('done');
        },

        // error 事件 → 回退到同步 mock
        onError: (message, _code) => {
          toast.showToast(message || 'SSE 生成失败，切换到同步模式', 'error');
          setAiThinking(false);
          setGeneratingState('error');
          fallbackToSyncGenerate();
        },
      });
    } catch (err) {
      // Unexpected error (e.g. network, timeout)
      const msg = err instanceof Error ? err.message : '生成失败';
      toast.showToast(msg, 'error');
      setAiThinking(false);
      setGeneratingState('error');
      fallbackToSyncGenerate();
    }
  }, [
    requirementInput,
    generatingState,
    aiThinking,
    flowGenerating,
    setRequirementText,
    setAiThinking,
    setFlowGenerating,
    setContextNodes,
    autoGenerateFlows,
    setComponentNodes,
    fallbackToSyncGenerate,
    toast,
  ]);

  return {
    requirementInput,
    setRequirementInput,
    isQuickGenerating: generatingState !== 'idle',
    generatingState,
    aiThinking,
    aiThinkingMessage,
    requirementText,
    setRequirementText,
    flowGenerating,
    quickGenerate,
  };
}

// Re-export type for consumers
export type { BoundedContext } from '@/lib/canvas/api/canvasSseApi';

export { useAIControllerImpl as useAIController };
