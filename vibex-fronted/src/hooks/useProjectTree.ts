/**
 * useProjectTree — React Query hook for fetching project card tree data
 *
 * Features:
 * - React Query for caching + loading states
 * - Mock data fallback when API unavailable
 * - Feature Flag controlled (NEXT_PUBLIC_USE_CARD_TREE)
 * - Syncs with visualizationStore
 */

'use client';

import { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useVisualizationStore } from '@/stores/visualizationStore';
import type { CardTreeVisualizationRaw } from '@/types/visualization';
import type { BoundedContext } from '@/types/homepage';

// ==================== Feature Flag ====================

const FEATURE_FLAG = process.env.NEXT_PUBLIC_USE_CARD_TREE === 'true';

// ==================== API Client ====================

interface FlowDataResponse {
  flowData?: {
    id: string;
    name: string;
    nodes: string; // JSON string
    edges: string; // JSON string
    projectId: string;
    createdAt: string;
    updatedAt: string;
  };
  flowDataList?: Array<{
    id: string;
    name: string;
    projectId: string;
    createdAt: string;
    updatedAt: string;
  }>;
}

async function fetchFlowData(projectId: string): Promise<CardTreeVisualizationRaw> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const res = await fetch(`${baseUrl}/api/flow-data?projectId=${projectId}`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`Failed to fetch flow data: ${res.status}`);
    const data: FlowDataResponse = await res.json();

    // Parse FlowData into CardTree format
    if (data.flowData) {
      interface FlowNode {
        title?: string;
        label?: string;
        id?: string;
        description?: string;
        status?: CardTreeVisualizationRaw['nodes'][number]['status'];
        icon?: string;
        children?: Array<{ id?: string; label?: string; checked?: boolean; description?: string; action?: string }>;
      }
      const rawNodes = JSON.parse(data.flowData.nodes) as FlowNode[];
      return {
        nodes: rawNodes.map((n) => ({
          title: String(n.title || n.label || n.id || 'Untitled'),
          description: n.description,
          status: n.status || 'pending',
          icon: n.icon,
          children: (n.children || []).map((c) => ({
            id: String(c.id || ''),
            label: String(c.label || ''),
            checked: Boolean(c.checked),
            description: c.description,
            action: c.action,
          })),
          updatedAt: data.flowData!.updatedAt,
        })),
        projectId: data.flowData.projectId,
        name: data.flowData.name,
      };
    }

    return { nodes: [] };
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('请求超时（10秒）');
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

// ==================== Mock Data ====================

const MOCK_DATA: CardTreeVisualizationRaw = {
  nodes: [
    {
      title: '需求录入',
      description: '描述您的业务需求',
      status: 'done',
      icon: '📥',
      children: [
        { id: 'req-input', label: '填写需求描述', checked: true, action: 'fill-requirement' },
        { id: 'req-upload', label: '上传参考文件', checked: true, action: 'upload-file' },
        { id: 'req-submit', label: '提交分析', checked: true, action: 'submit-analysis' },
      ],
      updatedAt: new Date().toISOString(),
    },
    {
      title: '业务流程分析',
      description: '分析业务流程并生成图表',
      status: 'in-progress',
      icon: '📊',
      children: [
        { id: 'flow-generate', label: '生成流程图', checked: true, action: 'generate-flow' },
        { id: 'flow-review', label: '审核流程', checked: false, action: 'review-flow' },
        { id: 'flow-edit', label: '编辑流程', checked: false, action: 'edit-flow' },
        { id: 'flow-save', label: '保存流程', checked: false, action: 'save-flow' },
      ],
      updatedAt: new Date().toISOString(),
    },
    {
      title: 'UI组件分析',
      description: '分析UI组件关系',
      status: 'pending',
      icon: '🖥️',
      children: [
        { id: 'ui-analyze', label: '分析组件', checked: false, action: 'analyze-ui' },
        { id: 'ui-export', label: '导出组件图', checked: false, action: 'export-ui' },
        { id: 'ui-review', label: '审核组件', checked: false, action: 'review-ui' },
      ],
      updatedAt: new Date().toISOString(),
    },
    {
      title: '项目生成',
      description: '生成项目代码',
      status: 'pending',
      icon: '🚀',
      children: [
        { id: 'gen-config', label: '配置生成选项', checked: false, action: 'config-generation' },
        { id: 'gen-run', label: '开始生成', checked: false, action: 'run-generation' },
        { id: 'gen-download', label: '下载项目', checked: false, action: 'download-project' },
      ],
      updatedAt: new Date().toISOString(),
    },
  ],
  projectId: 'mock-project',
  name: '示例项目',
};

// ==================== Local Data Converter ====================

/** Icon map for bounded context types */
const CONTEXT_TYPE_ICONS: Record<string, string> = {
  core: '🟣',
  supporting: '🔵',
  generic: '⚪',
  external: '🌐',
};

/**
 * Convert BoundedContext[] to CardTreeVisualizationRaw
 *
 * Epic 2: 本地数据模式 - 首页已有 boundedContexts 数据直接转换为 CardTree 格式
 */
export function boundedContextsToCardTree(
  contexts: BoundedContext[],
  projectId?: string
): CardTreeVisualizationRaw {
  if (!contexts || contexts.length === 0) {
    return { nodes: [], projectId, name: '项目分析' };
  }

  const nodes: CardTreeVisualizationRaw['nodes'] = contexts.map((ctx) => {
    // Determine status based on context type (core=in-progress, others=pending)
    const status = ctx.type === 'core' ? 'in-progress' : 'pending';

    // Convert relationships to children
    const children = ctx.relationships?.map((rel) => ({
      id: rel.id,
      label: `${rel.type === 'upstream' ? '⬆️' : rel.type === 'downstream' ? '⬇️' : '↔️'} ${rel.description || '关联'}`,
      checked: false,
      description: `→ ${rel.toContextId}`,
    })) ?? [];

    return {
      title: ctx.name,
      description: ctx.description,
      status: status as CardTreeVisualizationRaw['nodes'][number]['status'],
      icon: CONTEXT_TYPE_ICONS[ctx.type] ?? '📁',
      children,
      updatedAt: new Date().toISOString(),
    };
  });

  return {
    nodes,
    projectId,
    name: 'DDD 分析结果',
  };
}

// ==================== Hook ====================

export interface UseProjectTreeOptions {
  /** Project ID to fetch */
  projectId: string | null;
  /** Enable mock data fallback (default: true) */
  useMockOnError?: boolean;
  /** Skip fetching (e.g., feature flag off) */
  skip?: boolean;
  /** Local data mode: use boundedContexts directly instead of API (Epic 2) */
  localData?: {
    boundedContexts: BoundedContext[];
  };
}

export interface UseProjectTreeReturn {
  /** CardTree data */
  data: CardTreeVisualizationRaw | null;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: Error | null;
  /** Whether feature flag is enabled */
  featureEnabled: boolean;
  /** Whether using mock data */
  isMockData: boolean;
  /** Manually trigger refetch */
  refetch: () => void;
}

/**
 * useProjectTree — Fetches card tree data for a project
 *
 * @param projectId - Project ID to fetch data for
 * @param options - Configuration options
 * @returns Card tree data with React Query states
 */
export function useProjectTree({
  projectId,
  useMockOnError = true,
  skip = !FEATURE_FLAG,
  localData,
}: UseProjectTreeOptions): UseProjectTreeReturn {
  const { setVisualizationData } = useVisualizationStore();

  const query = useQuery<CardTreeVisualizationRaw, Error>({
    queryKey: ['project-tree', projectId],
    queryFn: () => fetchFlowData(projectId!),
    enabled: Boolean(projectId) && !skip,
    staleTime: 30_000, // 30 seconds
    retry: 1,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
  });

  // Determine effective data (local data mode takes priority)
  const effectiveData = useMemo(() => {
    // Epic 2: Local data mode — use boundedContexts directly
    if (localData?.boundedContexts) {
      return boundedContextsToCardTree(localData.boundedContexts, projectId ?? undefined);
    }
    if (query.data) return query.data;
    if (query.isError && useMockOnError) return MOCK_DATA;
    if (skip) return MOCK_DATA; // Feature flag off → show mock
    if (!projectId) return MOCK_DATA; // No project yet → show demo data
    return null;
  }, [localData, query.data, query.isError, query.isLoading, useMockOnError, skip, projectId]);

  const isMockData = Boolean(
    !localData?.boundedContexts &&
    ((query.isError && useMockOnError) || (skip && !query.data))
  );

  // Sync to visualizationStore
  useEffect(() => {
    if (effectiveData) {
      setVisualizationData({
        type: 'cardtree',
        raw: effectiveData,
        parsedAt: new Date().toISOString(),
      });
    }
  }, [effectiveData, setVisualizationData]);

  return {
    data: effectiveData,
    isLoading: query.isLoading,
    error: query.isError ? query.error : null,
    featureEnabled: FEATURE_FLAG,
    isMockData,
    refetch: query.refetch,
  };
}

// ==================== Exports ====================

export const IS_CARD_TREE_ENABLED = FEATURE_FLAG;
