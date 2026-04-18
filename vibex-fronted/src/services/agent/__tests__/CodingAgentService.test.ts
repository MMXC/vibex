/**
 * CodingAgentService.test.ts — Sprint6 U3/U4/U5 Tests
 *
 * Tests the mock agent service (U3 blocked — sessions_spawn not available).
 * The mock returns consistent results for UI testing.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useAgentStore } from '@/stores/agentStore';
import {
  createSession,
  getSessionStatus,
  terminateSession,
  mockAgentCall,
  acceptCodeBlock,
  rejectCodeBlock,
} from '../CodingAgentService';

describe('CodingAgentService — U3/U4/U5 Mock', () => {
  beforeEach(() => {
    useAgentStore.setState({ sessions: [], activeSessionKey: null });
  });

  describe('createSession — U3 Mock (blocked)', () => {
    it('U3 AC1: createSession returns a sessionKey string', async () => {
      const key = await createSession({ task: 'Add user auth' });
      expect(typeof key).toBe('string');
      expect(key.length).toBeGreaterThan(0);
    });

    it('creates session in store', async () => {
      const key = await createSession({ task: 'Test task' });
      const sessions = useAgentStore.getState().sessions;
      expect(sessions).toHaveLength(1);
      expect(sessions[0].sessionKey).toBe(key);
      expect(sessions[0].task).toBe('Test task');
    });

    it('marks activeSessionKey', async () => {
      const key = await createSession({ task: 'Test' });
      expect(useAgentStore.getState().activeSessionKey).toBe(key);
    });
  });

  describe('getSessionStatus — U3 Mock', () => {
    it('U3 AC2: getSessionStatus returns status string', async () => {
      const key = await createSession({ task: 'Test' });
      const status = await getSessionStatus(key);
      expect(typeof status).toBe('string');
      expect(['idle', 'starting', 'running', 'complete', 'error', 'terminated']).toContain(status);
    });

    it('returns error for unknown sessionKey', async () => {
      const status = await getSessionStatus('unknown-key');
      expect(status).toBe('error');
    });
  });

  describe('terminateSession — U3 Mock', () => {
    it('U3 AC3: terminateSession changes status to terminated', async () => {
      const key = await createSession({ task: 'Test' });
      await terminateSession(key);
      const status = await getSessionStatus(key);
      expect(status).toBe('terminated');
    });
  });

  describe('mockAgentCall — U4 Mock', () => {
    it('returns array of messages', async () => {
      const messages = await mockAgentCall('Add pagination');
      expect(Array.isArray(messages)).toBe(true);
      expect(messages.length).toBeGreaterThan(0);
    });

    it('message has id, role, content, timestamp', async () => {
      const messages = await mockAgentCall('Add pagination');
      const msg = messages[0];
      expect(msg.id).toBeDefined();
      expect(msg.role).toBe('agent');
      expect(typeof msg.content).toBe('string');
      expect(typeof msg.timestamp).toBe('number');
    });
  });

  describe('acceptCodeBlock / rejectCodeBlock — U4', () => {
    it('acceptCodeBlock sets accepted=true on block', async () => {
      const key = await createSession({ task: 'Test' });
      const messages = await mockAgentCall('Test');
      useAgentStore.setState({
        sessions: [
          {
            sessionKey: key,
            task: 'Test',
            status: 'complete',
            createdAt: Date.now(),
            messages,
          },
        ],
      });

      const msgId = messages[1]?.id;
      acceptCodeBlock(key, msgId, 0);

      const session = useAgentStore.getState().sessions.find((s) => s.sessionKey === key);
      expect(session?.messages[1]?.codeBlocks?.[0].accepted).toBe(true);
    });

    it('rejectCodeBlock sets accepted=false', async () => {
      const key = await createSession({ task: 'Test' });
      const messages = await mockAgentCall('Test');
      useAgentStore.setState({
        sessions: [
          {
            sessionKey: key,
            task: 'Test',
            status: 'complete',
            createdAt: Date.now(),
            messages,
          },
        ],
      });

      const msgId = messages[1]?.id;
      rejectCodeBlock(key, msgId, 0);

      const session = useAgentStore.getState().sessions.find((s) => s.sessionKey === key);
      expect(session?.messages[1]?.codeBlocks?.[0].accepted).toBe(false);
    });
  });

  describe('agentStore — U5', () => {
    it('addSession adds to sessions array', () => {
      const store = useAgentStore.getState();
      store.addSession({
        sessionKey: 's1',
        task: 'Task 1',
        status: 'complete',
        createdAt: Date.now(),
        messages: [],
      });
      expect(useAgentStore.getState().sessions).toHaveLength(1);
    });

    it('removeSession removes session', () => {
      const store = useAgentStore.getState();
      store.addSession({ sessionKey: 's1', task: 'T', status: 'complete', createdAt: Date.now(), messages: [] });
      store.removeSession('s1');
      expect(useAgentStore.getState().sessions).toHaveLength(0);
    });

    it('clearSessions removes all sessions', () => {
      const store = useAgentStore.getState();
      store.addSession({ sessionKey: 's1', task: 'T', status: 'complete', createdAt: Date.now(), messages: [] });
      store.addSession({ sessionKey: 's2', task: 'T', status: 'complete', createdAt: Date.now(), messages: [] });
      store.clearSessions();
      expect(useAgentStore.getState().sessions).toHaveLength(0);
    });
  });
});
