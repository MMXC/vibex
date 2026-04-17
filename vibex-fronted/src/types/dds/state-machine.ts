/**
 * State Machine Card Types
 * E2-U1
 */

import type { BaseCard } from './base';

export type StateType = 'initial' | 'normal' | 'final' | 'choice' | 'join' | 'fork';
export type TransitionType = 'normal' | 'conditional' | 'timeout';

export interface SMState {
  id: string;
  stateId: string;
  stateType: StateType;
  label: string;
  description?: string;
  entryAction?: string;
  exitAction?: string;
  doAction?: string;
  events?: string[];
}

export interface SMTransition {
  id: string;
  from: string;
  to: string;
  event: string;
  condition?: string;
  action?: string;
  type: TransitionType;
}

export interface StateMachineCard extends BaseCard {
  type: 'state-machine';
  states: SMState[];
  transitions: SMTransition[];
  initialState?: string;
}
