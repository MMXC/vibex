/**
 * sessionStore unit tests — Epic 5
 * Tests SSE status, AI thinking state, message history, and prototype queue.
 */
import { useSessionStore } from './sessionStore';

describe('useSessionStore', () => {
  beforeEach(() => {
    useSessionStore.setState({
      sseStatus: 'idle',
      sseError: null,
      aiThinking: false,
      aiThinkingMessage: null,
      flowGenerating: false,
      flowGeneratingMessage: null,
      requirementText: '',
      messages: [],
      projectId: null,
      prototypeQueue: [],
      isPolling: false,
    });
  });

  describe('SSE status', () => {
    it('should set SSE status', () => {
      useSessionStore.getState().setSseStatus('connecting');
      expect(useSessionStore.getState().sseStatus).toBe('connecting');
    });

    it('should set SSE status with error', () => {
      useSessionStore.getState().setSseStatus('error', 'Connection failed');
      expect(useSessionStore.getState().sseStatus).toBe('error');
      expect(useSessionStore.getState().sseError).toBe('Connection failed');
    });

    it('should clear SSE error on status change', () => {
      useSessionStore.getState().setSseStatus('error', 'Old error');
      useSessionStore.getState().setSseStatus('connected');
      expect(useSessionStore.getState().sseError).toBeNull();
    });
  });

  describe('AI thinking state', () => {
    it('should set AI thinking', () => {
      useSessionStore.getState().setAiThinking(true, 'Analyzing...');
      expect(useSessionStore.getState().aiThinking).toBe(true);
      expect(useSessionStore.getState().aiThinkingMessage).toBe('Analyzing...');
    });

    it('should clear AI thinking', () => {
      useSessionStore.getState().setAiThinking(true, 'Thinking...');
      useSessionStore.getState().setAiThinking(false);
      expect(useSessionStore.getState().aiThinking).toBe(false);
      expect(useSessionStore.getState().aiThinkingMessage).toBeNull();
    });

    it('should set flow generating', () => {
      useSessionStore.getState().setFlowGenerating(true, 'Generating flows...');
      expect(useSessionStore.getState().flowGenerating).toBe(true);
      expect(useSessionStore.getState().flowGeneratingMessage).toBe('Generating flows...');
    });

    it('should set requirement text', () => {
      useSessionStore.getState().setRequirementText('Build a patient management system');
      expect(useSessionStore.getState().requirementText).toBe('Build a patient management system');
    });
  });

  describe('message history', () => {
    it('should add a message', () => {
      useSessionStore.getState().addMessage({ type: 'user_action', content: 'Added context node' });
      const messages = useSessionStore.getState().messages;
      expect(messages.length).toBe(1);
      expect(messages[0].type).toBe('user_action');
      expect(messages[0].content).toBe('Added context node');
      expect(messages[0].id).toBeDefined();
      expect(messages[0].timestamp).toBeGreaterThan(0);
    });

    it('should add multiple messages', () => {
      useSessionStore.getState().addMessage({ type: 'user_action', content: 'Action 1' });
      useSessionStore.getState().addMessage({ type: 'ai_suggestion', content: 'Suggestion 1' });
      expect(useSessionStore.getState().messages.length).toBe(2);
    });

    it('should clear messages', () => {
      useSessionStore.getState().addMessage({ type: 'user_action', content: 'Action' });
      useSessionStore.getState().clearMessages();
      expect(useSessionStore.getState().messages).toEqual([]);
    });

    it('should include optional meta field', () => {
      useSessionStore.getState().addMessage({ type: 'user_action', content: 'Deleted node', meta: 'Node name' });
      expect(useSessionStore.getState().messages[0].meta).toBe('Node name');
    });
  });

  describe('prototype queue', () => {
    const mockPage = {
      pageId: 'page-1',
      name: 'HomePage',
      path: '/home',
      components: [],
      status: 'pending' as const,
    };

    it('should add pages to queue', () => {
      useSessionStore.getState().addToQueue([mockPage]);
      expect(useSessionStore.getState().prototypeQueue.length).toBe(1);
      expect(useSessionStore.getState().prototypeQueue[0].pageId).toBe('page-1');
    });

    it('should update queue item', () => {
      useSessionStore.getState().addToQueue([mockPage]);
      useSessionStore.getState().updateQueueItem('page-1', { status: 'confirmed' });
      expect(useSessionStore.getState().prototypeQueue[0].status).toBe('confirmed');
    });

    it('should remove queue item', () => {
      useSessionStore.getState().addToQueue([mockPage]);
      useSessionStore.getState().removeFromQueue('page-1');
      expect(useSessionStore.getState().prototypeQueue.length).toBe(0);
    });

    it('should set project id', () => {
      useSessionStore.getState().setProjectId('proj-123');
      expect(useSessionStore.getState().projectId).toBe('proj-123');
    });

    it('should set polling state', () => {
      useSessionStore.getState().setIsPolling(true);
      expect(useSessionStore.getState().isPolling).toBe(true);
    });

    it('should clear queue', () => {
      useSessionStore.getState().addToQueue([mockPage]);
      useSessionStore.getState().setProjectId('proj-123');
      useSessionStore.getState().clearQueue();
      expect(useSessionStore.getState().prototypeQueue).toEqual([]);
      expect(useSessionStore.getState().projectId).toBeNull();
    });
  });
});
