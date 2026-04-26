/**
 * DesignTokenService — extractTokens Unit Tests
 * E1 Design-to-Code Pipeline
 */

import { describe, it, expect, vi } from 'vitest';
import { extractTokens } from '../DesignTokenService';
import type { DesignNode } from '@/types/codegen';

describe('extractTokens', () => {
  it('extracts tokens from nodes', () => {
    const nodes: DesignNode[] = [
      { id: '1', type: 'frame', name: 'Card' },
      { id: '2', type: 'text', name: 'Title' },
    ];
    const result = extractTokens(nodes);
    expect(result.tokens).toBeDefined();
    expect(result.nodeCount).toBe(2);
    expect(result.truncated).toBe(false);
  });

  it('warns and truncates at 200 nodes', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const nodes: DesignNode[] = Array.from({ length: 201 }, (_, i) => ({
      id: `n${i}`, type: 'frame', name: `Node ${i}`,
    }));
    const result = extractTokens(nodes);
    expect(result.truncated).toBe(true);
    expect(result.nodeCount).toBe(200);
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('respects custom maxNodes option', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const nodes: DesignNode[] = Array.from({ length: 11 }, (_, i) => ({
      id: `n${i}`, type: 'frame', name: `Node ${i}`,
    }));
    const result = extractTokens(nodes, { maxNodes: 10 });
    expect(result.truncated).toBe(true);
    expect(result.nodeCount).toBe(10);
    warnSpy.mockRestore();
  });

  it('throws on invalid nodes array', () => {
    expect(() => extractTokens(null as any)).toThrow();
    expect(() => extractTokens(undefined as any)).toThrow();
  });
});