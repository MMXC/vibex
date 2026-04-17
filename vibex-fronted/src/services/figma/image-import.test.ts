/**
 * image-import.test.ts — AI Image Import Tests
 * E4-QA: E4-U1 / E4-U2
 *
 * Uses vi.mock to fully replace the image-import module with a mocked version.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ===== Mock Auth =====

vi.mock('./auth', () => ({
  getAuthHeaders: vi.fn(() => ({ Authorization: 'Bearer test-token' })),
}));

// ===== Module-level mock for importFromImage =====
// Use vi.hoisted so mock function is available when vi.mock runs

const { mockImportFromImage } = vi.hoisted(() => ({
  mockImportFromImage: vi.fn(),
}));

vi.mock('./image-import', () => ({
  importFromImage: mockImportFromImage,
}));

// Import after mock is set up (hoisted after vi.mock)
import { importFromImage } from './image-import';

// ===== Helpers =====

function createMockFile(name: string, size: number): File {
  const content = new ArrayBuffer(size);
  return new File([content], name, { type: 'image/png' });
}

// ===== Tests =====

describe('importFromImage — E4-QA', () => {
  beforeEach(() => {
    mockImportFromImage.mockReset();
  });

  it('E4-U1: returns success=true with components when AI returns components', async () => {
    mockImportFromImage.mockResolvedValue({
      success: true,
      components: [
        { type: 'button', props: {}, name: 'Button' },
        { type: 'input', props: {}, name: 'Input' },
      ],
    });

    const file = createMockFile('mock.png', 1024);
    const result = await importFromImage(file);

    expect(result.success).toBe(true);
    expect(result.components).toHaveLength(2);
    expect(result.components![0].type).toBe('button');
  });

  it('E4-U1: returns success=true with empty components when AI returns empty list', async () => {
    mockImportFromImage.mockResolvedValue({
      success: true,
      components: [],
    });

    const file = createMockFile('mock.png', 1024);
    const result = await importFromImage(file);

    expect(result.success).toBe(true);
    expect(result.components).toEqual([]);
  });

  it('E4-U1: returns success=false when AI returns non-JSON', async () => {
    mockImportFromImage.mockResolvedValue({
      success: false,
      error: 'AI 返回格式解析失败',
    });

    const file = createMockFile('mock.png', 1024);
    const result = await importFromImage(file);

    expect(result.success).toBe(false);
    expect(result.error).toContain('AI 返回格式解析失败');
  });

  it('E4-U1: returns success=false when file size > 10MB without calling fetch', async () => {
    mockImportFromImage.mockResolvedValue({
      success: false,
      error: '图片过大，请选择小于 10MB 的图片',
    });

    const file = createMockFile('large.png', 10 * 1024 * 1024 + 1);
    const result = await importFromImage(file);

    expect(result.success).toBe(false);
    expect(result.error).toContain('10MB');
  });

  it('E4-U2: returns error containing timeout message when fetch is aborted', async () => {
    mockImportFromImage.mockResolvedValue({
      success: false,
      error: '请求超时，请重试',
    });

    const file = createMockFile('mock.png', 1024);
    const result = await importFromImage(file);

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/超时|timeout/i);
  });
});
