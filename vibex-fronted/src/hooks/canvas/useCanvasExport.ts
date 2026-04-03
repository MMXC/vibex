'use client';

/**
 * useCanvasExport — Canvas PNG/SVG/JSON/Markdown export hook
 * E4-F9: 多格式导出
 *
 * 使用 html-to-image 库，支持 PNG/SVG，SVG 失败自动降级 PNG
 * 导出范围支持 Context / Flow / Component / All 三树
 * JSON 导出完整画布数据，Markdown 导出结构化描述
 */

import { useCallback, useRef } from 'react';
import { toPng, toSvg } from 'html-to-image';
import { useContextStore } from '@/lib/canvas/stores/contextStore';
import { useFlowStore } from '@/lib/canvas/stores/flowStore';
import { useComponentStore } from '@/lib/canvas/stores/componentStore';
import { useSessionStore } from '@/lib/canvas/stores/sessionStore';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { BoundedContextNode, BusinessFlowNode, ComponentNode } from '@/lib/canvas/types'; // types referenced in buildCanvasExportData JSDoc

export type ExportFormat = 'png' | 'svg' | 'json' | 'markdown';
export type ExportScope = 'context' | 'flow' | 'component' | 'all';

interface ExportOptions {
  /** 导出格式: 'png' | 'svg' | 'json' | 'markdown' */
  format: ExportFormat;
  /** 导出范围 */
  scope: ExportScope;
  /** 文件名前缀 */
  filenamePrefix?: string;
  /** 缩放比例 (PNG 专用，默认 2x) */
  scale?: number;
  /** 背景色 */
  backgroundColor?: string;
}

interface UseCanvasExportReturn {
  /** 导出画布 */
  exportCanvas: (options: ExportOptions) => Promise<void>;
  /** 导出状态 */
  isExporting: boolean;
  /** 错误信息 */
  error: string | null;
  /** 取消导出 */
  cancelExport: () => void;
}

const DEFAULT_BG_COLOR = '#0f0f1a'; // 深色背景匹配主题

/**
 * Trigger browser download from data URL or text blob
 */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  // Revoke after a short delay to allow download to start
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Convert canvas store data to a structured export object
 */
function buildCanvasExportData(scope: ExportScope): Record<string, unknown> {
  const contextStore = useContextStore.getState();
  const flowStore = useFlowStore.getState();
  const componentStore = useComponentStore.getState();
  const sessionStore = useSessionStore.getState();
  const { contextNodes } = contextStore;
  const { flowNodes } = flowStore;
  const { componentNodes } = componentStore;
  const { phase } = contextStore;
  const { projectId } = sessionStore;

  const result: Record<string, unknown> = {
    exportedAt: new Date().toISOString(),
    version: '1.0.0',
    projectId: projectId ?? null,
    phase,
  };

  if (scope === 'all' || scope === 'context') {
    result.contextNodes = contextNodes;
  }
  if (scope === 'all' || scope === 'flow') {
    result.flowNodes = flowNodes;
  }
  if (scope === 'all' || scope === 'component') {
    result.componentNodes = componentNodes;
  }

  return result;
}

/**
 * Generate Markdown representation of canvas data
 */
function buildCanvasMarkdown(scope: ExportScope): string {
  const contextNodes = useContextStore.getState().contextNodes;
  const flowNodes = useFlowStore.getState().flowNodes;
  const componentNodes = useComponentStore.getState().componentNodes;

  const lines: string[] = [
    '# VibeX Canvas Export',
    '',
    `> Exported at: ${new Date().toLocaleString('zh-CN')}`,
    '',
  ];

  if (scope === 'all' || scope === 'context') {
    lines.push('## 限界上下文树 (Bounded Contexts)', '');
    if (contextNodes.length === 0) {
      lines.push('_暂无数据_', '');
    } else {
      contextNodes.forEach((ctx) => {
        const typeIcon = ctx.type === 'core' ? '🔴' : ctx.type === 'supporting' ? '🟡' : ctx.type === 'generic' ? '🟢' : '⚪';
        const statusIcon = ctx.isActive !== false ? '✅' : '⏳';
        lines.push(`### ${typeIcon} ${statusIcon} ${ctx.name}`, '');
        if (ctx.description) {
          lines.push(`> ${ctx.description}`, '');
        }
        lines.push(`- 类型: \`${ctx.type}\``, '');
        lines.push(`- 状态: ${ctx.status}`, '');
        if (ctx.children && ctx.children.length > 0) {
          lines.push(`- 子节点: ${ctx.children.join(', ')}`, '');
        }
        lines.push('');
      });
    }
  }

  if (scope === 'all' || scope === 'flow') {
    lines.push('## 业务流程树 (Business Flows)', '');
    if (flowNodes.length === 0) {
      lines.push('_暂无数据_', '');
    } else {
      flowNodes.forEach((flow) => {
        const statusIcon = flow.isActive !== false ? '✅' : '⏳';
        lines.push(`### ${statusIcon} ${flow.name}`, '');
        if (flow.steps && flow.steps.length > 0) {
          lines.push('**流程步骤:**', '');
          flow.steps.forEach((step, i) => {
            const stepStatus = step.isActive !== false ? '✅' : '⏳';
            lines.push(`${i + 1}. ${stepStatus} **[${step.actor}]** ${step.name}`);
            if (step.description) {
              lines.push(`   > ${step.description}`);
            }
          });
        }
        lines.push('');
      });
    }
  }

  if (scope === 'all' || scope === 'component') {
    lines.push('## 组件树 (Components)', '');
    if (componentNodes.length === 0) {
      lines.push('_暂无数据_', '');
    } else {
      componentNodes.forEach((comp) => {
        const statusIcon = comp.isActive !== false ? '✅' : '⏳';
        lines.push(`### ${statusIcon} ${comp.name}`, '');
        lines.push(`- 类型: \`${comp.type}\``, '');
        if (comp.api) {
          lines.push(`- API: \`${comp.api.method} ${comp.api.path}\``, '');
        }
        if (comp.previewUrl) {
          lines.push(`- 预览: ${comp.previewUrl}`, '');
        }
        lines.push('');
      });
    }
  }

  return lines.join('\n');
}

/**
 * Canvas export hook
 *
 * @example
 * const { exportCanvas, isExporting } = useCanvasExport();
 * await exportCanvas({ format: 'json', scope: 'all' });
 * await exportCanvas({ format: 'markdown', scope: 'context' });
 * await exportCanvas({ format: 'png', scope: 'all' });
 */
export function useCanvasExport(): UseCanvasExportReturn {
  const isExportingRef = useRef(false);
  const cancelledRef = useRef(false);

  const exportCanvas = useCallback(async (options: ExportOptions) => {
    const {
      format,
      scope,
      filenamePrefix = 'vibex-canvas',
      scale = 2,
      backgroundColor = DEFAULT_BG_COLOR,
    } = options;

    if (isExportingRef.current) return;
    isExportingRef.current = true;
    cancelledRef.current = false;

    try {
      const timestamp = new Date().toISOString().slice(0, 10);

      // Handle JSON and Markdown exports (no DOM needed)
      if (format === 'json' || format === 'markdown') {
        if (cancelledRef.current) {
          isExportingRef.current = false;
          return;
        }

        if (format === 'json') {
          const data = buildCanvasExportData(scope);
          const json = JSON.stringify(data, null, 2);
          const blob = new Blob([json], { type: 'application/json' });
          const filename = `${filenamePrefix}-${scope}-${timestamp}.json`;
          downloadBlob(blob, filename);
        } else {
          const markdown = buildCanvasMarkdown(scope);
          const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
          const filename = `${filenamePrefix}-${scope}-${timestamp}.md`;
          downloadBlob(blob, filename);
        }

        isExportingRef.current = false;
        return;
      }

      // Handle PNG/SVG exports (requires DOM element)
      let targetElement: HTMLElement | null = null;

      if (scope === 'all') {
        // Export entire canvas container
        targetElement = document.querySelector('[data-canvas-container]') as HTMLElement;
        if (!targetElement) {
          targetElement = document.querySelector('.treePanelsGrid, [class*="treePanelsGrid"]') as HTMLElement;
        }
      } else {
        // Export specific tree panel
        const scopeSelectors: Record<string, string> = {
          context: '[data-tree="context"] [class*="treePanelBody"], [data-testid="context-tree"]',
          flow: '[data-tree="flow"] [class*="treePanelBody"], [data-testid="flow-tree"]',
          component: '[data-tree="component"] [class*="treePanelBody"], [data-testid="component-tree"]',
          all: '[class*="treePanelsGrid"]',
        };
        targetElement = document.querySelector(scopeSelectors[scope]) as HTMLElement;
      }

      if (!targetElement) {
        throw new Error(`无法找到导出目标元素 (scope: ${scope})`);
      }

      if (cancelledRef.current) {
        isExportingRef.current = false;
        return;
      }

      const filename = `${filenamePrefix}-${scope}-${timestamp}.${format}`;

      if (format === 'svg') {
        // Try SVG first, fallback to PNG on failure
        try {
          const dataUrl = await toSvg(targetElement, {
            backgroundColor,
            width: targetElement.scrollWidth,
            height: targetElement.scrollHeight,
            style: {
              transform: 'none',
            },
          });

          downloadDataUrl(dataUrl, filename);
        } catch (svgError) {
          console.warn('[useCanvasExport] SVG export failed, falling back to PNG:', svgError);
          const pngDataUrl = await toPng(targetElement, {
            backgroundColor,
            pixelRatio: scale,
            width: targetElement.scrollWidth,
            height: targetElement.scrollHeight,
            style: {
              transform: 'none',
            },
          });
          const pngFilename = filename.replace('.svg', '.png');
          downloadDataUrl(pngDataUrl, pngFilename);
        }
      } else {
        // PNG export
        const dataUrl = await toPng(targetElement, {
          backgroundColor,
          pixelRatio: scale,
          width: targetElement.scrollWidth,
          height: targetElement.scrollHeight,
          style: {
            transform: 'none',
          },
        });

        downloadDataUrl(dataUrl, filename);
      }
    } finally {
      isExportingRef.current = false;
    }
  }, []);

  const cancelExport = useCallback(() => {
    cancelledRef.current = true;
    isExportingRef.current = false;
  }, []);

  return {
    exportCanvas,
    isExporting: isExportingRef.current,
    error: null,
    cancelExport,
  };
}

/**
 * Trigger browser download from data URL
 */
function downloadDataUrl(dataUrl: string, filename: string): void {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
