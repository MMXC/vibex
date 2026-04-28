'use client';

/**
 * StateMachineCard — S16-P1-2 Code Generator Real Components
 *
 * Renders a state machine with real props:
 * - states, transitions, initialState
 */

import React from 'react';
import type { StateMachineProps } from '@/types/codegen';
import styles from './StateMachineCard.module.css';

interface StateMachineCardProps {
  /** State machine data */
  stateMachine: StateMachineProps;
  selected?: boolean;
  onClick?: () => void;
}

export function StateMachineCard({
  stateMachine,
  selected = false,
  onClick,
}: StateMachineCardProps) {
  const { states, transitions, initialState } = stateMachine;
  const hasStates = states.length > 0;

  return (
    <div
      className={`${styles.card} ${selected ? styles['card--selected'] : ''}`}
      data-testid="statemachine-card"
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className={styles.header}>
        <span className={styles.stateCount} data-testid="state-count">
          {states.length} state{states.length !== 1 ? 's' : ''}
        </span>
        {initialState && (
          <span className={styles.initialState} data-testid="initial-state">
            → {initialState}
          </span>
        )}
      </div>

      {hasStates && (
        <div className={styles.stateList} data-testid="state-list">
          {states.map((state, i) => (
            <span
              key={i}
              className={`${styles.stateTag} ${
                state === initialState ? styles['stateTag--initial'] : ''
              }`}
              data-testid={`state-${i}`}
            >
              {state}
            </span>
          ))}
        </div>
      )}

      {transitions.length > 0 && (
        <div className={styles.transitions} data-testid="transitions">
          <span className={styles.transitionLabel}>
            {transitions.length} transition{transitions.length !== 1 ? 's' : ''}
          </span>
          {transitions.slice(0, 3).map((t, i) => (
            <div key={i} className={styles.transitionRow} data-testid={`transition-${i}`}>
              <code className={styles.fromState}>{t.from}</code>
              <span className={styles.arrow}>→</span>
              <code className={styles.eventName}>{t.event}</code>
              <span className={styles.arrow}>→</span>
              <code className={styles.toState}>{t.to}</code>
            </div>
          ))}
          {transitions.length > 3 && (
            <span className={styles.moreTransitions}>
              +{transitions.length - 3} more
            </span>
          )}
        </div>
      )}

      {!hasStates && (
        <p className={styles.empty}>No states defined</p>
      )}
    </div>
  );
}
