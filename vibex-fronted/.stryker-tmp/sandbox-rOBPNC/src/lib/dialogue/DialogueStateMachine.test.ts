/**
 * Dialogue State Machine Tests
 */
// @ts-nocheck


import { createInitialState, reduce, isComplete, getNextAction, DialogueEvent } from './DialogueStateMachine';

describe('DialogueStateMachine', () => {
  describe('createInitialState', () => {
    it('should create initial state', () => {
      const state = createInitialState();
      expect(state.phase).toBe('clarification');
      expect(state.turn).toBe(0);
      expect(state.completeness).toBe(0);
    });
  });

  describe('reduce', () => {
    it('should handle USER_MESSAGE', () => {
      const state = createInitialState();
      const event = { type: 'USER_MESSAGE', payload: { text: 'Test message' } };
      const newState = reduce(state, event);
      expect(newState.turn).toBe(1);
    });

    it('should transition from clarification to gathering on CLARIFICATION_COMPLETE', () => {
      const state = createInitialState();
      const event = { type: 'CLARIFICATION_COMPLETE' };
      const newState = reduce(state, event);
      expect(newState.phase).toBe('gathering');
    });

    it('should transition from gathering to refining on CONTEXT_SUFFICIENT', () => {
      const state = { ...createInitialState(), phase: 'gathering' as const };
      const event = { type: 'CONTEXT_SUFFICIENT' };
      const newState = reduce(state, event);
      expect(newState.phase).toBe('refining');
    });

    it('should transition from refining to complete on REFINEMENT_COMPLETE', () => {
      const state = { ...createInitialState(), phase: 'refining' as const };
      const event = { type: 'REFINEMENT_COMPLETE' };
      const newState = reduce(state, event);
      expect(newState.phase).toBe('complete');
    });

    it('should stay in complete phase', () => {
      const state = { ...createInitialState(), phase: 'complete' as const };
      const event = { type: 'USER_MESSAGE', payload: { text: 'test' } };
      const newState = reduce(state, event);
      expect(newState.phase).toBe('complete');
    });
  });

  describe('isComplete', () => {
    it('should return true when phase is complete', () => {
      const state = { ...createInitialState(), phase: 'complete' as const };
      expect(isComplete(state)).toBe(true);
    });

    it('should return false when phase is not complete', () => {
      const state = createInitialState();
      expect(isComplete(state)).toBe(false);
    });
  });

  describe('getNextAction', () => {
    it('should return ask_clarifying_question for clarification phase', () => {
      const state = createInitialState();
      expect(getNextAction(state)).toBe('ask_clarifying_question');
    });

    it('should return request_missing_info for gathering phase', () => {
      const state = { ...createInitialState(), phase: 'gathering' as const };
      expect(getNextAction(state)).toBe('request_missing_info');
    });

    it('should return confirm_details for refining phase', () => {
      const state = { ...createInitialState(), phase: 'refining' as const };
      expect(getNextAction(state)).toBe('confirm_details');
    });

    it('should return generate_summary for complete phase', () => {
      const state = { ...createInitialState(), phase: 'complete' as const };
      expect(getNextAction(state)).toBe('generate_summary');
    });
  });
});
