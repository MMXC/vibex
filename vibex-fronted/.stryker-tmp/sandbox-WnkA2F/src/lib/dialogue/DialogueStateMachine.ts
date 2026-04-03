/**
 * Dialogue State Machine
 * 管理对话状态转换
 */
// @ts-nocheck


export type DialoguePhase = 
  | 'clarification' 
  | 'gathering' 
  | 'refining' 
  | 'complete';

export interface DialogueState {
  phase: DialoguePhase;
  turn: number;
  topic: string;
  context: Record<string, unknown>;
  completeness: number;
}

export type DialogueEvent =
  | { type: 'USER_MESSAGE'; payload: { text: string } }
  | { type: 'CLARIFICATION_COMPLETE' }
  | { type: 'CONTEXT_SUFFICIENT' }
  | { type: 'REFINEMENT_COMPLETE' }
  | { type: 'RESET' };

const transitions: Record<DialoguePhase, (event: DialogueEvent) => DialoguePhase> = {
  clarification: (event) => {
    if (event.type === 'CLARIFICATION_COMPLETE') return 'gathering';
    return 'clarification';
  },
  gathering: (event) => {
    if (event.type === 'CONTEXT_SUFFICIENT') return 'refining';
    return 'gathering';
  },
  refining: (event) => {
    if (event.type === 'REFINEMENT_COMPLETE') return 'complete';
    return 'refining';
  },
  complete: () => 'complete',
};

export function createInitialState(): DialogueState {
  return {
    phase: 'clarification',
    turn: 0,
    topic: '',
    context: {},
    completeness: 0,
  };
}

export function reduce(state: DialogueState, event: DialogueEvent): DialogueState {
  const newPhase = transitions[state.phase](event);
  
  const newState: DialogueState = {
    ...state,
    phase: newPhase,
  };

  if (event.type === 'USER_MESSAGE') {
    newState.turn += 1;
    // Extract topic from first message
    if (newState.turn === 1) {
      const words = event.payload.text.split(' ').slice(0, 3).join(' ');
      newState.topic = words;
    }
  }

  return newState;
}

export function isComplete(state: DialogueState): boolean {
  return state.phase === 'complete';
}

export function getNextAction(state: DialogueState): string {
  switch (state.phase) {
    case 'clarification':
      return 'ask_clarifying_question';
    case 'gathering':
      return 'request_missing_info';
    case 'refining':
      return 'confirm_details';
    case 'complete':
      return 'generate_summary';
  }
}
