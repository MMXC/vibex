/**
 * image-ai-import.test.ts — E1-U1 Tests
 * Sprint6 E1-U1: Image AI 解析
 *
 * Tests for importFromImage function.
 * Uses vi.mock('./auth') to avoid network calls, then spies on globalThis.fetch.
 */

import { describe, it, expect, vi, beforeAll } from 'vitest';

// ===== Mock Auth (prevents network calls to auth service) =====

vi.mock('./auth', () => ({
  getAuthHeaders: vi.fn(() => ({ Authorization: 'Bearer test-token' })),
}));

// ===== Mock globalThis.fetch before importing module =====

const mockFetch = vi.fn();
const originalFetch = globalThis.fetch;

beforeAll(() => {
  globalThis.fetch = mockFetch as unknown as typeof globalThis.fetch;
});

// Import module AFTER fetch is mocked
const { importFromImage } = await import('../image-ai-import');

// ===== Helpers =====

function createMockFile(name: string, size: number): File {
  const content = new ArrayBuffer(size);
  return new File([content], name, { type: 'image/png' });
}

// ===== Tests =====

describe('importFromImage — E1-U1', () => {
  beforeAll(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
  });

  it('AC1: returns success=true with components when AI returns valid JSON', async () => {
    const mockComponents = [
      { type: 'button', props: { label: 'Submit' }, name: 'Submit Button', layout: { x: 0.1, y: 0.5, width: 0.2, height: 0.05 } },
      { type: 'input', props: { placeholder: 'Email' }, name: 'Email Input', layout: { x: 0.1, y: 0.3, width: 0.3, height: 0.05 } },
    ];
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ message: { content: JSON.stringify({ components: mockComponents }) } }),
    } as unknown as Response);

    const file = createMockFile('mock-ui.png', 1024);
    const result = await importFromImage(file);

    expect(result.success).toBe(true);
    expect(result.components).toHaveLength(2);
    expect(result.components![0].type).toBe('button');
    expect(result.components![0].name).toBe('Submit Button');
    expect(result.components![0].layout).toEqual({ x: 0.1, y: 0.5, width: 0.2, height: 0.05 });
    expect(result.components![1].type).toBe('input');
  });

  it('AC1: handles AI response with markdown code block wrapping JSON', async () => {
    const mockComponents = [{ type: 'text', props: { label: 'Hello' }, name: 'Title' }];
    const aiResponse = 'Here is the analysis:\n```json\n{"components": ' + JSON.stringify(mockComponents) + '\n}\n```';

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ message: { content: aiResponse } }),
    } as unknown as Response);

    const file = createMockFile('card.png', 512);
    const result = await importFromImage(file);

    expect(result.success).toBe(true);
    expect(result.components).toHaveLength(1);
    expect(result.components![0].type).toBe('text');
  });

  it('AC2: returns success=false with error when AI returns non-JSON text', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ message: { content: 'I cannot analyze this image.' } }),
    } as unknown as Response);

    const file = createMockFile('mock.png', 1024);
    const result = await importFromImage(file);

    expect(result.success).toBe(false);
    expect(result.error).toContain('解析失败');
  });

  it('AC2: returns success=false with error when fetch returns HTTP error', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      text: () => Promise.resolve('Internal Server Error'),
    } as unknown as Response);

    const file = createMockFile('mock.png', 1024);
    const result = await importFromImage(file);

    expect(result.success).toBe(false);
    expect(result.error).toContain('AI 请求失败');
  });

  it('AC3: returns error without calling fetch when file > 10MB', async () => {
    mockFetch.mockReset(); // clear any default

    const file = createMockFile('large.png', 10 * 1024 * 1024 + 1);
    const result = await importFromImage(file);

    expect(result.success).toBe(false);
    expect(result.error).toContain('10MB');
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('AC3: accepts exactly 10MB file (boundary case, should call fetch)', async () => {
    mockFetch.mockReset();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ message: { content: '{"components": []}' } }),
    } as unknown as Response);

    const file = createMockFile('exact-limit.png', 10 * 1024 * 1024);
    const result = await importFromImage(file);

    expect(result.success).toBe(true);
    expect(mockFetch).toHaveBeenCalled();
  });
});
