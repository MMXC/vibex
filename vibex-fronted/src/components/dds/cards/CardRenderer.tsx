/**
 * CardRenderer — Card Type Dispatcher
 *
 * 根据 card.type 分发到对应的卡片组件：
 * - 'user-story'       → RequirementCard
 * - 'bounded-context'  → BoundedContextCard
 * - 'flow-step'        → FlowStepCard
 * - unknown type       → fallback (error boundary)
 *
 * Epic 1: F9
 */

'use client';

import React, { memo } from 'react';
import type { DDSCard } from '@/types/dds';
import { RequirementCard } from './RequirementCard';
import { BoundedContextCard } from './BoundedContextCard';
import { FlowStepCard } from './FlowStepCard';
import { APIEndpointCard } from './APIEndpointCard';
import { CardErrorBoundary } from '@/components/dds/canvas/CardErrorBoundary';
import { StateMachineCard } from './StateMachineCard';
import type { APIEndpointCard as APIEndpointCardType, StateMachineCard as SMCardType } from '@/types/dds';

export interface CardRendererProps {
  card: DDSCard;
  selected?: boolean;
  onSelect?: (id: string) => void;
  /** For FlowStepCard step number display */
  stepNumber?: number;
}

// Fallback for unknown card types
function UnknownCardFallback({ type }: { type: string }) {
  return (
    <div
      style={{
        background: 'rgba(239, 68, 68, 0.1)',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        borderRadius: '0.5rem',
        padding: '1rem',
        color: '#ef4444',
        fontSize: '0.8rem',
      }}
      role="alert"
    >
      <strong>未知卡片类型</strong>
      <p style={{ margin: '0.25rem 0 0', color: '#fca5a5' }}>
        type: <code>{type}</code>
      </p>
    </div>
  );
}

export const CardRenderer = memo(function CardRenderer({
  card,
  selected = false,
  onSelect,
  stepNumber,
}: CardRendererProps) {
  const { type } = card;

  switch (type) {
    case 'user-story':
      return (
        <RequirementCard
          card={card}
          selected={selected}
          onSelect={onSelect}
        />
      );

    case 'bounded-context':
      return (
        <BoundedContextCard
          card={card}
          selected={selected}
          onSelect={onSelect}
        />
      );

    case 'flow-step':
      return (
        <FlowStepCard
          card={card}
          selected={selected}
          onSelect={onSelect}
          stepNumber={stepNumber}
        />
      );

    case 'api-endpoint':
      return (
        <CardErrorBoundary cardType="api-endpoint">
          <APIEndpointCard card={card as APIEndpointCardType} selected={selected} />
        </CardErrorBoundary>
      );

    case 'state-machine':
      return (
        <CardErrorBoundary cardType="state-machine">
          <StateMachineCard card={card as SMCardType} selected={selected} />
        </CardErrorBoundary>
      );

    default: {
      // TypeScript exhaustive check — this branch should never be reached
      return <UnknownCardFallback type={type} />;
    }
  }
});
