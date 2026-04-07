/**
 * TreeErrorBoundary — Error boundary for tree panel rendering
 *
 * Catches rendering errors from tree components (BoundedContextTree,
 * BusinessFlowTree, ComponentTree) and shows a fallback UI instead of
 * crashing the entire canvas page. Each tree panel has its own isolated
 * boundary so one tree crashing doesn't affect the others.
 *
 * Part of: vibex-architect-proposals-vibex-proposals-20260412 / A-P1-2
 */
'use client';

import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { canvasLogger } from '@/lib/canvas/canvasLogger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class TreeErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    canvasLogger.default.error('[TreeErrorBoundary]', error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex items-center justify-center h-full bg-red-50 rounded-lg border-2 border-red-300 p-4">
          <div className="text-center">
            <p className="text-sm font-medium text-red-700">渲染失败</p>
            <p className="mt-1 text-xs text-red-500 truncate max-w-xs">
              {this.state.error?.message ?? '未知错误'}
            </p>
            <button
              className="mt-3 px-3 py-1.5 text-sm bg-white border border-red-300 text-red-700 rounded-lg hover:bg-red-50"
              onClick={() => this.setState({ hasError: false, error: null })}
            >
              重试
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
