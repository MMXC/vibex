/**
 * Dialogue Store Tests
 */

import { useDialogueStore, DialogueMessage } from './dialogueStore';

describe('DialogueStore', () => {
  beforeEach(() => {
    useDialogueStore.getState().reset();
  });

  describe('initial state', () => {
    it('should have empty messages', () => {
      const { messages } = useDialogueStore.getState();
      expect(messages).toEqual([]);
    });

    it('should have clarification phase', () => {
      const { phase } = useDialogueStore.getState();
      expect(phase).toBe('clarification');
    });

    it('should have zero completeness', () => {
      const { completeness } = useDialogueStore.getState();
      expect(completeness).toBe(0);
    });
  });

  describe('addMessage', () => {
    it('should add user message', () => {
      const { addMessage } = useDialogueStore.getState();
      addMessage({
        id: '1',
        role: 'user',
        content: 'Test message',
        timestamp: Date.now(),
      });
      const { messages } = useDialogueStore.getState();
      expect(messages.length).toBe(1);
      expect(messages[0].role).toBe('user');
    });

    it('should add assistant message', () => {
      const { addMessage } = useDialogueStore.getState();
      addMessage({
        id: '1',
        role: 'assistant',
        content: 'Response',
        timestamp: Date.now(),
      });
      const { messages } = useDialogueStore.getState();
      expect(messages[0].role).toBe('assistant');
    });
  });

  describe('setPhase', () => {
    it('should set phase to gathering', () => {
      const { setPhase } = useDialogueStore.getState();
      setPhase('gathering');
      expect(useDialogueStore.getState().phase).toBe('gathering');
    });

    it('should set phase to refining', () => {
      const { setPhase } = useDialogueStore.getState();
      setPhase('refining');
      expect(useDialogueStore.getState().phase).toBe('refining');
    });

    it('should set phase to complete', () => {
      const { setPhase } = useDialogueStore.getState();
      setPhase('complete');
      expect(useDialogueStore.getState().phase).toBe('complete');
    });
  });

  describe('setCompleteness', () => {
    it('should set completeness score', () => {
      const { setCompleteness } = useDialogueStore.getState();
      setCompleteness(75);
      expect(useDialogueStore.getState().completeness).toBe(75);
    });

    it('should clamp completeness to 0-100', () => {
      const { setCompleteness } = useDialogueStore.getState();
      setCompleteness(150);
      expect(useDialogueStore.getState().completeness).toBe(100);
    });
  });

  describe('setLoading', () => {
    it('should set loading state', () => {
      const { setLoading } = useDialogueStore.getState();
      setLoading(true);
      expect(useDialogueStore.getState().isLoading).toBe(true);
    });
  });

  describe('reset', () => {
    it('should reset to initial state', () => {
      const { addMessage, setPhase, setCompleteness, reset } = useDialogueStore.getState();
      addMessage({ id: '1', role: 'user', content: 'Test', timestamp: Date.now() });
      setPhase('complete');
      setCompleteness(100);
      reset();
      const state = useDialogueStore.getState();
      expect(state.messages).toEqual([]);
      expect(state.phase).toBe('clarification');
      expect(state.completeness).toBe(0);
    });
  });

  describe('clearMessages', () => {
    it('should clear all messages', () => {
      const { addMessage, clearMessages } = useDialogueStore.getState();
      addMessage({ id: '1', role: 'user', content: 'Test', timestamp: Date.now() });
      clearMessages();
      expect(useDialogueStore.getState().messages).toEqual([]);
    });
  });
});
