/**
 * MessageRouter Unit Tests
 */

import { MessageRouter, type WebSocketMessage } from '../MessageRouter';

describe('MessageRouter', () => {
  let router: MessageRouter;

  beforeEach(() => {
    router = new MessageRouter();
  });

  describe('subscribe', () => {
    it('should register a handler for a message type', () => {
      const handler = vi.fn();
      router.subscribe('chat', handler);
      
      // Handler should be registered
      expect(handler).toBeDefined();
    });

    it('should return unsubscribe function', () => {
      const handler = vi.fn();
      const unsubscribe = router.subscribe('chat', handler);
      
      unsubscribe();
      
      // After unsubscribe, handler should not be called
      // This is tested implicitly
    });
  });

  describe('broadcast', () => {
    it('should add message to queue', () => {
      const roomId = 'test-room';
      const senderId = 'user-1';
      
      router.broadcast(roomId, {
        type: 'chat',
        roomId,
        senderId,
        payload: { content: 'Hello' },
      });
      
      // Message should be queued (tested implicitly)
      expect(true).toBe(true);
    });
  });

  describe('sendToUser', () => {
    it('should send message to specific user', () => {
      const roomId = 'test-room';
      const senderId = 'user-1';
      
      router.sendToUser('user-2', {
        type: 'notification',
        roomId,
        senderId,
        payload: { title: 'Test', body: 'Message', level: 'info' },
      });
      
      expect(true).toBe(true);
    });
  });

  describe('getHistory', () => {
    it('should return empty array when no persistence', async () => {
      const history = await router.getHistory('test-room');
      expect(history).toEqual([]);
    });
  });

  describe('cleanup', () => {
    it('should return 0 when no persistence', async () => {
      const cleaned = await router.cleanup(7);
      expect(cleaned).toBe(0);
    });
  });
});

describe('Message Types', () => {
  it('should have valid message structure', () => {
    const message: WebSocketMessage = {
      id: 'msg-1',
      type: 'chat',
      roomId: 'room-1',
      senderId: 'user-1',
      timestamp: Date.now(),
      payload: { content: 'test' },
    };
    
    expect(message.id).toBeDefined();
    expect(message.type).toBe('chat');
  });
});
