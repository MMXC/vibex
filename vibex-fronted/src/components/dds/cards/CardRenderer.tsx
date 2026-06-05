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
import { NodeEditorLock } from '@/components/canvas/NodeEditorLock';
import { NodeFocusOverlay } from '@/components/canvas/NodeFocusOverlay';
import type { APIEndpointCard as APIEndpointCardType, StateMachineCard as SMCardType } from '@/types/dds';

export interface CardRendererProps {
  card: DDSCard;
  selected?: boolean;
  onSelect?: (id: string) => void;
  /** For FlowStepCard step number display */
  stepNumber?: number;
  /** E2-U3: 冲突高亮标记 */
  conflict?: boolean;
  /** S44-P003-E3: 节点锁定标记 */
  locked?: boolean;
  /** S44-P003-E3: 锁定者用户名 */
  lockedBy?: string;
  /** S65-E2: 此节点正被远程用户聚焦（显示 NodeFocusOverlay） */
  focused?: boolean;
}

/** Lock icon overlay — rendered at top-right of card */
function LockOverlay({ userName }: { userName?: string }) {
  return (
    <div
      title={userName ? `🔒 locked by ${userName}` : '🔒 locked'}
      style={{
        position: 'absolute',
        top: 4,
        right: 4,
        width: 20,
        height: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(59, 130, 246, 0.85)',
        borderRadius: '50%',
        color: '#fff',
        fontSize: 10,
        zIndex: 10,
        pointerEvents: 'none',
      }}
    >
      🔒
    </div>
  );
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
  conflict = false,
  locked = false,
  lockedBy,
  focused = false,
}: CardRendererProps) {
  const { type } = card;

  const wrapper = (children: React.ReactNode) => (
    <div style={{ position: 'relative' }}>
      {children}
      {locked && <LockOverlay userName={lockedBy} />}
      {/* S62-E1: Show remote editor badge when another user is editing this node */}
      <NodeEditorLock nodeId={card.id} />
      {/* S65-E2: Show remote focus indicator (reads directly from presenceStore) */}
      <NodeFocusOverlay nodeId={card.id} />
    </div>
  );

  switch (type) {
    case 'user-story':
      return wrapper(
        <RequirementCard
          card={card}
          selected={selected}
          onSelect={onSelect}
          conflict={conflict}
        />
      );

    case 'bounded-context':
      return wrapper(
        <BoundedContextCard
          card={card}
          selected={selected}
          onSelect={onSelect}
          conflict={conflict}
        />
      );

    case 'flow-step':
      return wrapper(
        <FlowStepCard
          card={card}
          selected={selected}
          onSelect={onSelect}
          stepNumber={stepNumber}
          conflict={conflict}
        />
      );

    case 'api-endpoint':
      return wrapper(
        <CardErrorBoundary cardType="api-endpoint">
          <APIEndpointCard card={card as APIEndpointCardType} selected={selected} />
        </CardErrorBoundary>
      );

    case 'state-machine':
      return wrapper(
        <CardErrorBoundary cardType="state-machine">
          <StateMachineCard card={card as SMCardType} selected={selected} />
        </CardErrorBoundary>
      );

    default: {
      // TypeScript exhaustive check — this branch should never be reached
      return (
        <div
          data-conflict={conflict ? 'true' : undefined}
          className={conflict ? 'conflictHighlight' : undefined}
        >
          {locked && <LockOverlay userName={lockedBy} />}
          <UnknownCardFallback type={type} />
        </div>
      );
    }
  }
});
