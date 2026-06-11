/**
 * route.test.ts — /api/canvas/[id]/comments API tests
 * Sprint86 E1: 画布评论标注系统
 *
 * Tests:
 * 1. GET: list comments for a canvas, missing canvasId → handled via route params
 * 2. GET: paginated results with default limit
 * 3. GET: filtered by nodeId
 * 4. GET: 500 on DB failure
 * 5. POST: create comment, missing required fields → 400
 * 6. POST: create comment successfully → 201
 * 7. POST: 500 on DB failure
 */
import { NextRequest } from 'next/server';

// Mock DB functions — defined inside jest.mock factory
jest.mock('@/lib/db', () => {
  const mockQueryDB = jest.fn();
  const mockQueryOne = jest.fn();
  const mockExecuteDB = jest.fn();
  const mockGenerateId = jest.fn();
  (global as Record<string, unknown>).__commentQueryDB = mockQueryDB;
  (global as Record<string, unknown>).__commentQueryOne = mockQueryOne;
  (global as Record<string, unknown>).__commentExecuteDB = mockExecuteDB;
  (global as Record<string, unknown>).__commentGenerateId = mockGenerateId;
  return {
    queryDB: mockQueryDB,
    queryOne: mockQueryOne,
    executeDB: mockExecuteDB,
    generateId: mockGenerateId,
  };
});

jest.mock('@/lib/log-sanitizer', () => {
  const mockSafeError = jest.fn();
  (global as Record<string, unknown>).__commentSafeError = mockSafeError;
  return { safeError: mockSafeError };
});

const mockQueryDB = () => (global as Record<string, unknown>).__commentQueryDB as jest.Mock;
const mockQueryOne = () => (global as Record<string, unknown>).__commentQueryOne as jest.Mock;
const mockExecuteDB = () => (global as Record<string, unknown>).__commentExecuteDB as jest.Mock;
const mockGenerateId = () => (global as Record<string, unknown>).__commentGenerateId as jest.Mock;
const mockSafeError = () => (global as Record<string, unknown>).__commentSafeError as jest.Mock;

import { GET as listComments, POST as createComment } from './route';

const mockEnv = { DB: {} };

const mockCommentRow = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: 'comment-1',
  canvas_id: 'canvas-1',
  node_id: 'node-1',
  parent_id: null,
  author_id: 'user-1',
  author_name: 'Alice',
  content: 'This node needs more detail',
  mentions: '["user-2"]',
  is_resolved: 0,
  created_at: '2026-06-11T10:00:00.000Z',
  updated_at: '2026-06-11T10:00:00.000Z',
  ...overrides,
});

describe('GET /api/canvas/[id]/comments', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns paginated comments for a canvas', async () => {
    mockQueryDB()
      .mockResolvedValueOnce([
        mockCommentRow({ id: 'comment-1', content: 'First comment' }),
        mockCommentRow({ id: 'comment-2', content: 'Second comment' }),
      ]);
    mockQueryOne().mockResolvedValueOnce({ cnt: 2 });

    const request = new NextRequest(
      'http://localhost:3000/api/canvas/canvas-1/comments?limit=20&offset=0'
    );
    const response = await listComments(request, {
      env: mockEnv as never,
      params: Promise.resolve({ id: 'canvas-1' }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.comments).toHaveLength(2);
    expect(data.total).toBe(2);
    expect(data.limit).toBe(20);
    expect(data.offset).toBe(0);
    // First comment
    expect(data.comments[0].id).toBe('comment-1');
    expect(data.comments[0].authorName).toBe('Alice');
    expect(data.comments[0].mentions).toEqual(['user-2']);
    expect(data.comments[0].isResolved).toBe(false);
    expect(data.comments[0].nodeId).toBe('node-1');
    expect(data.comments[0].parentId).toBeUndefined();
    // Verify SQL query
    expect(mockQueryDB()).toHaveBeenCalledWith(
      mockEnv,
      expect.stringContaining('SELECT'),
      expect.arrayContaining(['canvas-1'])
    );
    expect(mockQueryDB()).toHaveBeenCalledWith(
      mockEnv,
      expect.stringContaining('ORDER BY created_at DESC'),
      expect.any(Array)
    );
  });

  it('filters comments by nodeId', async () => {
    mockQueryDB().mockResolvedValueOnce([mockCommentRow({ node_id: 'node-specific' })]);
    mockQueryOne().mockResolvedValueOnce({ cnt: 1 });

    const request = new NextRequest(
      'http://localhost:3000/api/canvas/canvas-1/comments?nodeId=node-specific'
    );
    const response = await listComments(request, {
      env: mockEnv as never,
      params: Promise.resolve({ id: 'canvas-1' }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.comments).toHaveLength(1);
    expect(data.comments[0].nodeId).toBe('node-specific');
    expect(mockQueryDB()).toHaveBeenCalledWith(
      mockEnv,
      expect.stringContaining('node_id = ?'),
      expect.arrayContaining(['node-specific'])
    );
  });

  it('caps limit at 50', async () => {
    mockQueryDB().mockResolvedValueOnce([]);
    mockQueryOne().mockResolvedValueOnce({ cnt: 0 });

    const request = new NextRequest(
      'http://localhost:3000/api/canvas/canvas-1/comments?limit=200&offset=0'
    );
    const response = await listComments(request, {
      env: mockEnv as never,
      params: Promise.resolve({ id: 'canvas-1' }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.limit).toBe(50);
    expect(mockQueryDB()).toHaveBeenCalledWith(
      mockEnv,
      expect.any(String),
      expect.arrayContaining([50, 0])
    );
  });

  it('returns 500 on DB error', async () => {
    mockQueryDB().mockRejectedValueOnce(new Error('DB connection failed'));
    mockSafeError().mockImplementation(() => {});

    const request = new NextRequest(
      'http://localhost:3000/api/canvas/canvas-1/comments'
    );
    const response = await listComments(request, {
      env: mockEnv as never,
      params: Promise.resolve({ id: 'canvas-1' }),
    });

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toContain('Failed to fetch');
    expect(mockSafeError()).toHaveBeenCalled();
  });
});

describe('POST /api/canvas/[id]/comments', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 400 when required fields are missing', async () => {
    const body = { authorId: 'user-1' }; // missing authorName and content
    const request = new NextRequest(
      'http://localhost:3000/api/canvas/canvas-1/comments',
      { method: 'POST', body: JSON.stringify(body) }
    );
    const response = await createComment(request, {
      env: mockEnv as never,
      params: Promise.resolve({ id: 'canvas-1' }),
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('Missing required fields');
  });

  it('returns 400 when content is missing', async () => {
    const body = { authorId: 'user-1', authorName: 'Alice' }; // missing content
    const request = new NextRequest(
      'http://localhost:3000/api/canvas/canvas-1/comments',
      { method: 'POST', body: JSON.stringify(body) }
    );
    const response = await createComment(request, {
      env: mockEnv as never,
      params: Promise.resolve({ id: 'canvas-1' }),
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('Missing required fields');
  });

  it('creates a comment successfully and returns 201', async () => {
    mockGenerateId().mockReturnValue('comment-gen-id');
    mockExecuteDB().mockResolvedValueOnce({ meta: { changes: 1 } });

    const body = {
      nodeId: 'node-123',
      authorId: 'user-1',
      authorName: 'Alice',
      content: 'This looks great!',
      mentions: ['user-2', 'user-3'],
    };
    const request = new NextRequest(
      'http://localhost:3000/api/canvas/canvas-1/comments',
      { method: 'POST', body: JSON.stringify(body) }
    );
    const response = await createComment(request, {
      env: mockEnv as never,
      params: Promise.resolve({ id: 'canvas-1' }),
    });

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.id).toBe('comment-gen-id');
    expect(data.created_at).toBeTruthy();
    expect(mockExecuteDB()).toHaveBeenCalledWith(
      mockEnv,
      expect.stringContaining('INSERT INTO comments'),
      expect.arrayContaining(['comment-gen-id', 'canvas-1', 'user-1', 'Alice', 'This looks great!'])
    );
  });

  it('creates a reply comment with parentId', async () => {
    mockGenerateId().mockReturnValue('reply-id');
    mockExecuteDB().mockResolvedValueOnce({ meta: { changes: 1 } });

    const body = {
      nodeId: 'node-123',
      parentId: 'comment-parent-1',
      authorId: 'user-2',
      authorName: 'Bob',
      content: 'Good point!',
    };
    const request = new NextRequest(
      'http://localhost:3000/api/canvas/canvas-1/comments',
      { method: 'POST', body: JSON.stringify(body) }
    );
    const response = await createComment(request, {
      env: mockEnv as never,
      params: Promise.resolve({ id: 'canvas-1' }),
    });

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.id).toBe('reply-id');
    expect(mockExecuteDB()).toHaveBeenCalledWith(
      mockEnv,
      expect.stringContaining('INSERT INTO comments'),
      expect.arrayContaining(['reply-id', 'canvas-1', 'node-123', 'comment-parent-1'])
    );
  });

  it('returns 500 on DB error during creation', async () => {
    mockGenerateId().mockReturnValue('comment-err-id');
    mockExecuteDB().mockRejectedValueOnce(new Error('DB write failed'));
    mockSafeError().mockImplementation(() => {});

    const body = {
      authorId: 'user-1',
      authorName: 'Alice',
      content: 'Test comment',
    };
    const request = new NextRequest(
      'http://localhost:3000/api/canvas/canvas-1/comments',
      { method: 'POST', body: JSON.stringify(body) }
    );
    const response = await createComment(request, {
      env: mockEnv as never,
      params: Promise.resolve({ id: 'canvas-1' }),
    });

    expect(response.status).toBe(500);
    expect(mockSafeError()).toHaveBeenCalled();
  });
});
