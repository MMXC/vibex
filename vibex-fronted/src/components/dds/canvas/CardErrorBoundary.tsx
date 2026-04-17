/**
 * CardErrorBoundary — E5-U1/U2 Error State
 * Wraps card rendering. Shows styled error state when a card throws.
 */

'use client';

import React, { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  /** Card type for contextual error message */
  cardType?: string;
  className?: string;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class CardErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error.message };
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div
          className={this.props.className}
          style={{
            minHeight: '120px',
            padding: '16px',
            background: 'rgba(248, 113, 113, 0.06)',
            border: '1px solid rgba(248, 113, 113, 0.2)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'rgba(255,255,255,0.5)',
            fontSize: '12px',
            fontFamily: 'system-ui, sans-serif',
          }}
          role="alert"
          data-testid="card-error-boundary"
        >
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>⚠️</div>
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>
              {this.props.cardType === 'api-endpoint'
                ? 'API 端点渲染失败'
                : this.props.cardType === 'state-machine'
                ? '状态节点渲染失败'
                : '卡片渲染失败'}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px' }}>
              {this.state.errorMessage || '渲染错误'}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
