/**
 * agentStore.injectContext — Unit Tests
 * Sprint 6 U5: Agent Session Management
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useAgentStore } from '@/stores/agentStore';

describe('agentStore.injectContext', () => {
  beforeEach(() => {
    // Reset codeGenContext between tests so state doesn't leak
    useAgentStore.setState({ codeGenContext: null });
  });

  it('valid context is accepted', () => {
    const ctx = {
      type: 'codegen' as const,
      generatedCode: 'export const x = 1;',
      nodes: [{ id: 'n1', type: 'frame', name: 'Button' }],
      schemaVersion: '1.0.0',
      exportedAt: '2026-04-27T00:00:00.000Z',
    };
    useAgentStore.getState().injectContext(ctx);
    // Re-read state after mutation (set is synchronous but store ref may be stale)
    expect(useAgentStore.getState().codeGenContext).toEqual(ctx);
  });

  it('throws on invalid type field', () => {
    const ctx = { type: 'invalid', generatedCode: '', nodes: [], schemaVersion: '1.0.0', exportedAt: '2026-04-27' };
    expect(() => useAgentStore.getState().injectContext(ctx)).toThrow(/type.*codegen/);
  });

  it('throws on missing generatedCode', () => {
    const ctx = { type: 'codegen', nodes: [], schemaVersion: '1.0.0', exportedAt: '2026-04-27' } as any;
    expect(() => useAgentStore.getState().injectContext(ctx)).toThrow(/generatedCode.*string/);
  });

  it('throws on nodes not array', () => {
    const ctx = { type: 'codegen', generatedCode: 'x', nodes: 'not-array', schemaVersion: '1.0.0', exportedAt: '2026-04-27' } as any;
    expect(() => useAgentStore.getState().injectContext(ctx)).toThrow(/nodes.*array/);
  });

  it('throws on node without id', () => {
    const ctx = { type: 'codegen', generatedCode: 'x', nodes: [{ type: 'frame' }], schemaVersion: '1.0.0', exportedAt: '2026-04-27' } as any;
    expect(() => useAgentStore.getState().injectContext(ctx)).toThrow(/node\.id.*string/);
  });
});