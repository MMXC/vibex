/**
 * useAIController — AI generation state and logic for CanvasPage
 *
 * Extracts from CanvasPage.tsx:
 *  - requirementInput state (user text input)
 *  - isQuickGenerating state (generation in progress)
 *  - quickGenerate callback (mock AI: contexts → flows → components)
 *  - AI thinking state from sessionStore
 *
 * All handlers are via useCallback to avoid reference churn.
 *
 * Epic: canvas-split-hooks / E4-useAIController
 */

import { useState, useCallback } from 'react';
import { useSessionStore } from '@/lib/canvas/stores/sessionStore';
import { useContextStore } from '@/lib/canvas/stores/contextStore';
import { useFlowStore } from '@/lib/canvas/stores/flowStore';
import { useComponentStore } from '@/lib/canvas/stores/componentStore';
import { isValidFlowNodes } from '@/lib/canvas/type-guards';
import type { BoundedContextDraft, BoundedContextNode, ComponentNode } from '@/lib/canvas/types';
import { useToast } from '@/components/ui/Toast';

export interface UseAIControllerReturn {
  // === State ===
  requirementInput: string;
  setRequirementInput: (v: string) => void;
  isQuickGenerating: boolean;
  // === Session store selectors ===
  aiThinking: boolean;
  aiThinkingMessage: string | null;
  requirementText: string;
  setRequirementText: (v: string) => void;
  flowGenerating: boolean;
  // === Actions ===
  quickGenerate: () => Promise<void>;
}

export function useAIController(): UseAIControllerReturn {
  const toast = useToast();

  // === Local state ===
  const [requirementInput, setRequirementInput] = useState('');
  const [isQuickGenerating, setIsQuickGenerating] = useState(false);

  // === Session store ===
  const aiThinking = useSessionStore((s) => s.aiThinking);
  const aiThinkingMessage = useSessionStore((s) => s.aiThinkingMessage);
  const requirementText = useSessionStore((s) => s.requirementText);
  const setRequirementText = useSessionStore((s) => s.setRequirementText);
  const flowGenerating = useSessionStore((s) => s.flowGenerating);

  // === Store setters ===
  const setContextNodes = useContextStore((s) => s.setContextNodes);
  const setComponentNodes = useComponentStore((s) => s.setComponentNodes);
  const autoGenerateFlows = useFlowStore((s) => s.autoGenerateFlows);

  const quickGenerate = useCallback(async () => {
    if (!requirementInput.trim()) {
      toast.showToast('请先输入需求', 'warning');
      return;
    }
    if (isQuickGenerating || aiThinking || flowGenerating) {
      return;
    }
    setIsQuickGenerating(true);
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
        return;
      }
      // Step 2: Auto-generate flows
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
      toast.showToast('三树生成完成', 'success');
    } catch (err) {
      toast.showToast(err instanceof Error ? err.message : '生成失败', 'error');
    } finally {
      setIsQuickGenerating(false);
    }
  }, [
    requirementInput,
    isQuickGenerating,
    aiThinking,
    flowGenerating,
    setContextNodes,
    autoGenerateFlows,
    setComponentNodes,
    toast,
  ]);

  return {
    requirementInput,
    setRequirementInput,
    isQuickGenerating,
    aiThinking,
    aiThinkingMessage,
    requirementText,
    setRequirementText,
    flowGenerating,
    quickGenerate,
  };
}
