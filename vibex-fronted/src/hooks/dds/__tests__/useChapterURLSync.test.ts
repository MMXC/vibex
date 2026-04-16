/**
 * useChapterURLSync Unit Tests
 * Epic 2: E2-U1-AC1 URL sync
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

// ============================================
// Mock Next.js navigation
// ============================================

vi.mock('next/navigation', () => ({
  useSearchParams: vi.fn(() => new URLSearchParams()),
  useRouter: vi.fn(() => ({ replace: vi.fn() })),
  usePathname: vi.fn(() => '/dds-canvas'),
}));

// ============================================
// Mock DDSCanvasStore
// ============================================

const mockSetActiveChapter = vi.fn();

vi.mock('@/stores/dds', () => ({
  useDDSCanvasStore: vi.fn(() => ({
    activeChapter: 'requirement',
    setActiveChapter: mockSetActiveChapter,
  })),
}));

// ============================================
// Tests
// ============================================

import { useChapterURLSync } from '../useChapterURLSync';

describe('useChapterURLSync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('is exported as a function', () => {
    expect(typeof useChapterURLSync).toBe('function');
  });

  it('can be rendered without throwing (hook smoke test)', () => {
    // renderHook is needed since hooks must be called inside React components
    expect(() => renderHook(() => useChapterURLSync())).not.toThrow();
  });
});
