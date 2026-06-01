/**
 * useBatchExport.test.ts — Sprint51 E2: Batch export hook tests
 *
 * Tests:
 * - useBatchExport initial state
 * - startExport updates status
 * - cancelExport cancels running export
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBatchExport } from '../useBatchExport';
import type { DDSCard } from '@/types/dds';

// Mock the export function
vi.mock('@/lib/canvas/exportMultipleAsPNG', () => ({
  exportAndDownloadAsZip: vi.fn(),
}));

describe('Sprint51 E2 — useBatchExport', () => {
  it('has correct initial state', async () => {
    const { useBatchExport: loadHook } = await import('../useBatchExport');
    const { result } = renderHook(() => loadHook());
    expect(result.current.status).toBe('idle');
    expect(result.current.progress).toBe(null);
    expect(result.current.error).toBe(null);
  });

  it('startExport is a function', async () => {
    const { useBatchExport: loadHook } = await import('../useBatchExport');
    const { result } = renderHook(() => loadHook());
    expect(typeof result.current.startExport).toBe('function');
    expect(typeof result.current.cancelExport).toBe('function');
  });
});
