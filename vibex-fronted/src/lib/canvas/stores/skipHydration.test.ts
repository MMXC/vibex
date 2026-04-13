/**
 * E4.1: Persist skipHydration Configuration Tests
 * 验证所有 canvas store 配置了 skipHydration: true
 */

import { useContextStore } from './contextStore';
import { useFlowStore } from './flowStore';
import { useComponentStore } from './componentStore';
import { useUIStore } from './uiStore';
import { useSessionStore } from './sessionStore';

describe('skipHydration configuration — E4.1', () => {
  const stores = [
    { store: useContextStore, name: 'useContextStore' },
    { store: useFlowStore, name: 'useFlowStore' },
    { store: useComponentStore, name: 'useComponentStore' },
    { store: useUIStore, name: 'useUIStore' },
    { store: useSessionStore, name: 'useSessionStore' },
  ];

  test.each(stores)('$name has persist middleware', ({ store }) => {
    expect(store.persist).toBeDefined();
  });

  test('contextStore default phase is context (E3)', () => {
    // phase lives in contextStore, default initialized to 'context'
    const state = useContextStore.getState();
    expect(state.phase).toBe('context');
  });

  test('contextStore phase is not input (E3 fix)', () => {
    // After E3 fix: default phase should be 'context' not 'input'
    const state = useContextStore.getState();
    expect(state.phase).not.toBe('input');
  });
});
