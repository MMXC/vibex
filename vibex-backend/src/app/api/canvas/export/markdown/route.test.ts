/**
 * /api/canvas/export/markdown — Tests
 * S89-E5: Advanced Export Formats
 */
import { NextRequest } from 'next/server';
import { POST } from './route';

// Mock Env type
const mockEnv = {};

describe('POST /api/canvas/export/markdown', () => {
  it('returns markdown with single card', async () => {
    const cards = [{ id: 'card-001', type: 'chapter', title: 'Chapter 1', description: 'Test content' }];
    const response = await POST(
      new NextRequest('http://localhost/api/canvas/export/markdown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cards, canvasName: 'Test Canvas' }),
      }),
      { params: {}, env: mockEnv as any }
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toContain('text/markdown');
    expect(response.headers.get('Content-Disposition')).toContain('Test%20Canvas.md');

    const text = await response.text();
    expect(text).toContain('# Test Canvas');
    expect(text).toContain('## Chapter 1');
    expect(text).toContain('Test content');
    expect(text).toContain('card-001');
  });

  it('returns empty document for empty cards array', async () => {
    const response = await POST(
      new NextRequest('http://localhost/api/canvas/export/markdown', {
        method: 'POST',
        body: JSON.stringify({ cards: [], canvasName: 'Empty Canvas' }),
      }),
      { params: {}, env: mockEnv as any }
    );

    expect(response.status).toBe(200);
    const text = await response.text();
    expect(text).toContain('# Empty Canvas');
    // Should still have header even with no cards
  });

  it('handles cards without optional fields', async () => {
    const cards = [{ id: 'card-only-id' }];
    const response = await POST(
      new NextRequest('http://localhost', {
        method: 'POST',
        body: JSON.stringify({ cards }),
      }),
      { params: {}, env: mockEnv as any }
    );

    expect(response.status).toBe(200);
    const text = await response.text();
    expect(text).toContain('# Canvas Export'); // default name
    expect(text).toContain('card-only-id');
  });

  it('returns 400 for invalid JSON', async () => {
    const response = await POST(
      new NextRequest('http://localhost', {
        method: 'POST',
        body: 'not json',
      }),
      { params: {}, env: mockEnv as any }
    );

    expect(response.status).toBe(400);
  });
});
