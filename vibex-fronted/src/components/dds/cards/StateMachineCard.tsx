/**
 * StateMachineCard — State Machine Node Component
 * E2-U2
 */

'use client';
import React, { memo } from 'react';
import type { StateMachineCard as SMCardType } from '@/types/dds';
import styles from './StateMachineCard.module.css';

export interface StateMachineCardProps {
  card: SMCardType;
  selected?: boolean;
}

const STATE_ICONS: Record<string, string> = {
  initial: '⚡',
  normal: '⬤',
  final: '✓',
  choice: '◇',
  join: '⊕',
  fork: '⊗',
};

const STATE_COLORS: Record<string, string> = {
  initial: '#f59e0b',
  normal: '#3b82f6',
  final: '#10b981',
  choice: '#8b5cf6',
  join: '#06b6d4',
  fork: '#ec4899',
};

export const StateMachineCard = memo(function StateMachineCard({
  card,
  selected = false,
}: StateMachineCardProps) {
  return (
    <div className={`${styles.card} ${selected ? styles.selected : ''}`}>
      <div className={styles.header}>
        <span className={styles.icon}>⚙️</span>
        <span className={styles.title}>{card.title || '状态机'}</span>
        <span className={styles.count}>{card.states?.length ?? 0} states</span>
      </div>
      {card.states && card.states.length > 0 && (
        <div className={styles.states}>
          {card.states.slice(0, 5).map((state) => (
            <div key={state.id} className={styles.stateItem}>
              <span
                className={styles.stateDot}
                style={{ backgroundColor: STATE_COLORS[state.stateType] ?? '#6b7280' }}
              >
                {STATE_ICONS[state.stateType] ?? '⬤'}
              </span>
              <span className={styles.stateLabel}>{state.label || state.stateId}</span>
            </div>
          ))}
          {card.states.length > 5 && (
            <div className={styles.more}>+{card.states.length - 5} more</div>
          )}
        </div>
      )}
      {card.transitions && card.transitions.length > 0 && (
        <div className={styles.transitions}>
          <span>{card.transitions.length} transitions</span>
        </div>
      )}
    </div>
  );
});
