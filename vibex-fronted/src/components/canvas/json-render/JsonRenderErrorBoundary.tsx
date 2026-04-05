/**
 * JsonRenderErrorBoundary — Error boundary for json-render preview
 * 
 * Catches rendering errors and shows a fallback UI instead of crashing.
 * Required by AGENTS.md: "预览组件必须有 ErrorBoundary"
 */
'use client';

import React, { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class JsonRenderErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[JsonRenderErrorBoundary]', error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex items-center justify-center h-full bg-red-50 rounded-lg border border-red-200 p-4">
          <div className="text-center">
            <p className="text-sm font-medium text-red-700">预览渲染失败</p>
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
