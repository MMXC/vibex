/**
 * sessionStore logout — Epic2 S2.2 tests
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { useSessionStore } from '../sessionStore';

describe('sessionStore.logout — S2.2', () => {
  beforeEach(() => {
    useSessionStore.setState({
      projectId: 'test-project',
      projectName: 'Test Project',
      sseStatus: 'connected',
      sseError: null,
      messages: [{ id: '1', role: 'user', content: 'hello' }],
      prototypeQueue: [{ id: 'p1' } as any],
    });
  });

  it('clears projectId to null', () => {
    useSessionStore.getState().logout();
    expect(useSessionStore.getState().projectId).toBeNull();
  });

  it('clears projectName to null', () => {
    useSessionStore.getState().logout();
    expect(useSessionStore.getState().projectName).toBeNull();
  });

  it('resets sseStatus to idle', () => {
    useSessionStore.getState().logout();
    expect(useSessionStore.getState().sseStatus).toBe('idle');
  });

  it('clears messages', () => {
    useSessionStore.getState().logout();
    expect(useSessionStore.getState().messages).toEqual([]);
  });

  it('clears prototypeQueue', () => {
    useSessionStore.getState().logout();
    expect(useSessionStore.getState().prototypeQueue).toEqual([]);
  });
});
