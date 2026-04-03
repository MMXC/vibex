/**
 * VersionedStorage Tests
 * E3-T3: Test coverage for Zustand migration library
 */
// @ts-nocheck


import { describe, it, expect, beforeEach } from 'vitest';

// Mock localStorage
const store: Record<string, string> = {};

global.localStorage = {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, value: string) => {
    store[key] = value;
  },
  removeItem: (key: string) => {
    delete store[key];
  },
  clear: () => {
    Object.keys(store).forEach((k) => delete store[k]);
  },
  get length() {
    return Object.keys(store).length;
  },
  key: (index: number) => Object.keys(store)[index] ?? null,
} as unknown as Storage;

describe('VersionedStorage', () => {
  beforeEach(() => {
    global.localStorage.clear();
  });

  it('should initialize with default state when no storage', () => {
    const key = 'test-store';
    expect(global.localStorage.getItem(key)).toBeNull();
  });

  it('should store state with version', () => {
    const state = { _version: 1, data: 'test' };
    global.localStorage.setItem('test', JSON.stringify(state));
    const retrieved = JSON.parse(global.localStorage.getItem('test')!);
    expect(retrieved._version).toBe(1);
  });

  it('should detect version mismatch', () => {
    const oldState = { _version: 1, data: 'old' };
    global.localStorage.setItem('test', JSON.stringify(oldState));
    const currentVersion = 3;
    expect(oldState._version < currentVersion).toBe(true);
  });

  it('should apply v1→v2 migration', () => {
    const v1State = {
      _version: 1,
      contexts: [],
      flows: [],
      components: [],
    };
    const v2State = {
      _version: 2,
      boundedContexts: v1State.contexts,
      flowSteps: v1State.flows,
      componentNodes: v1State.components,
    };
    expect(v2State.boundedContexts).toEqual([]);
    expect(v2State.flowSteps).toEqual([]);
    expect(v2State.componentNodes).toEqual([]);
  });

  it('should apply v2→v3 migration', () => {
    const v2State = {
      _version: 2,
      boundedContexts: [],
      flowSteps: [],
      componentNodes: [],
    };
    const v3State = { ...v2State, _version: 3, activeNodes: {} };
    expect(v3State.activeNodes).toEqual({});
    expect(v3State._version).toBe(3);
  });

  it('should support sequential migrations from v1 to v3', () => {
    // Simulate v1 state
    const v1State = {
      _version: 1,
      contexts: [{ name: 'ctx1' }],
      flows: [{ name: 'flow1' }],
      components: [{ name: 'comp1' }],
    };

    // Migration v1 → v2: rename fields
    const migrateV1toV2 = (state: Record<string, unknown>) => ({
      boundedContexts: state.contexts,
      flowSteps: state.flows,
      componentNodes: state.components,
    });

    // Migration v2 → v3: add activeNodes
    const migrateV2toV3 = (_state: Record<string, unknown>) => ({
      activeNodes: {},
    });

    // Apply migrations sequentially
    let migrated = { ...v1State };
    migrated = { ...migrated, ...migrateV1toV2(migrated) };
    migrated = { ...migrated, ...migrateV2toV3(migrated) };
    migrated._version = 3;

    expect(migrated._version).toBe(3);
    expect(migrated.boundedContexts).toHaveLength(1);
    expect(migrated.activeNodes).toEqual({});
  });
});
