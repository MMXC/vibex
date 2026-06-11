/**
 * route.test.ts — /api/canvas/[id]/comments/[commentId]/read API tests
 * Sprint86 E1: 画布评论标注系统
 *
 * Tests:
 * 1. POST: mark comment as resolved → 200
 * 2. POST: comment not found → 404
 * 3. POST: 500 on DB error
 */
import { NextRequest } from 'next/server';

jest.mock('@/lib/db', () => {
  const mockExecuteDB = jest.fn();
  (global as Record<string, unknown>).__readCommentExecuteDB = mockExecuteDB;
  return {
    executeDB: mockExecuteDB,
  };
});

jest.mock('@/lib/log-sanitizer', () => {
  const mockSafeError = jest.fn();
  (global as Record<string, unknown>).__readCommentSafeError = mockSafeError;
  return { safeError: mockSafeError };
});

const mockExecuteDB = () =>
  (global as Record<string, unknown>).__readCommentExecuteDB as jest.Mock;
const mockSafeError = () =>
  (global as Record<string, unknown>).__readCommentSafeError as jest.Mock;

import { POST as markRead } from './route';

const mockEnv = { DB: {} };

describe('POST /api/canvas/[id]/comments/[commentId]/read', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('marks a comment as resolved and returns success', async () => {
    mockExecuteDB().mockResolvedValueOnce({ meta: { changes: 1 } });

    const request = new NextRequest(
      'http://localhost:3000/api/canvas/canvas-1/comments/comment-1/read',
      { method: 'POST', body: JSON.stringify({ userId: 'user-1' }) }
    );
    const response = await markRead(request, {
      env: mockEnv as never,
      params: Promise.resolve({ id: 'canvas-1', commentId: 'comment-1' }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(mockExecuteDB()).toHaveBeenCalledWith(
      mockEnv,
      expect.stringContaining('UPDATE comments SET is_resolved = 1'),
      expect.arrayContaining(['comment-1'])
    );
  });

  it('returns 404 when comment is not found', async () => {
    mockExecuteDB().mockResolvedValueOnce({ meta: { changes: 0 } });

    const request = new NextRequest(
      'http://localhost:3000/api/canvas/canvas-1/comments/nonexistent/read',
      { method: 'POST' }
    );
    const response = await markRead(request, {
      env: mockEnv as never,
      params: Promise.resolve({ id: 'canvas-1', commentId: 'nonexistent' }),
    });

    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toContain('not found');
  });

  it('returns 500 on DB error', async () => {
    mockExecuteDB().mockRejectedValueOnce(new Error('DB write failed'));
    mockSafeError().mockImplementation(() => {});

    const request = new NextRequest(
      'http://localhost:3000/api/canvas/canvas-1/comments/comment-1/read',
      { method: 'POST' }
    );
    const response = await markRead(request, {
      env: mockEnv as never,
      params: Promise.resolve({ id: 'canvas-1', commentId: 'comment-1' }),
    });

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toContain('Failed to mark');
    expect(mockSafeError()).toHaveBeenCalled();
  });
});
