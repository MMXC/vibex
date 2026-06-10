/**
 * route.test.ts — /api/notifications API tests
 * Sprint85 E3: 通知中心面板
 *
 * Tests:
 * 1. GET: list notifications, missing userId → 400
 * 2. GET: list with pagination
 * 3. GET: list with unread filter
 * 4. GET: list with type filter
 * 5. POST: create notification, missing fields → 400
 * 6. POST: create notification successfully → 201
 * 7. Error: 500 on DB failure
 */
import { NextRequest } from 'next/server';

// Mock DB functions
const mockQueryDB = jest.fn();
const mockQueryOne = jest.fn();
const mockExecuteDB = jest.fn();
const mockGenerateId = jest.fn();
const mockSafeError = jest.fn();

jest.mock('@/lib/db', () => ({
  queryDB: (...args: unknown[]) => mockQueryDB(...args),
  queryOne: (...args: unknown[]) => mockQueryOne(...args),
  executeDB: (...args: unknown[]) => mockExecuteDB(...args),
  generateId: (...args: unknown[]) => mockGenerateId(...args),
}));

jest.mock('@/lib/log-sanitizer', () => ({
  safeError: (...args: unknown[]) => mockSafeError(...args),
}));

import { GET as listNotifications, POST as createNotification } from './route';

const NOW = '2026-06-11T03:00:00.000Z';
const mockEnv = { DB: {} };

describe('GET /api/notifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 400 when userId is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/notifications');
    const response = await listNotifications(request, { env: mockEnv as never });
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('userId');
  });

  it('returns paginated notification list', async () => {
    mockQueryDB
      .mockResolvedValueOnce([
        {
          id: 'notif-1', user_id: 'user-1', type: 'mention', title: '@mention test',
          message: 'Alice mentioned you', sender_id: 'alice', sender_name: 'Alice',
          target_user_id: 'user-1', node_id: 'node-1', canvas_id: 'canvas-1',
          template_id: null, author_id: null, thumbnail: null,
          comment_id: null, reply_id: null, is_read: 0,
          created_at: '2026-06-10T12:00:00.000Z',
        },
        {
          id: 'notif-2', user_id: 'user-1', type: 'system', title: 'System notice',
          message: 'Canvas shared with you', sender_id: 'system', sender_name: 'System',
          target_user_id: 'user-1', node_id: null, canvas_id: 'canvas-2',
          template_id: null, author_id: null, thumbnail: null,
          comment_id: null, reply_id: null, is_read: 1,
          created_at: '2026-06-09T08:00:00.000Z',
        },
      ])
      .mockResolvedValueOnce([{ cnt: 2 }]);

    const request = new NextRequest(
      'http://localhost:3000/api/notifications?userId=user-1&limit=20&offset=0'
    );
    const response = await listNotifications(request, { env: mockEnv as never });
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.notifications).toHaveLength(2);
    expect(data.total).toBe(2);
    expect(data.limit).toBe(20);
    expect(data.offset).toBe(0);
    // First notification unread
    expect(data.notifications[0].isRead).toBe(false);
    expect(data.notifications[0].type).toBe('mention');
    expect(data.notifications[0].timestamp).toBe(new Date('2026-06-10T12:00:00.000Z').getTime());
    // Second notification read
    expect(data.notifications[1].isRead).toBe(true);
  });

  it('filters by unread only', async () => {
    mockQueryDB
      .mockResolvedValueOnce([
        {
          id: 'notif-1', user_id: 'user-1', type: 'mention', title: '@mention test',
          message: 'Alice mentioned you', sender_id: 'alice', sender_name: 'Alice',
          target_user_id: 'user-1', node_id: 'node-1', canvas_id: 'canvas-1',
          template_id: null, author_id: null, thumbnail: null,
          comment_id: null, reply_id: null, is_read: 0,
          created_at: '2026-06-10T12:00:00.000Z',
        },
      ])
      .mockResolvedValueOnce([{ cnt: 1 }]);

    const request = new NextRequest(
      'http://localhost:3000/api/notifications?userId=user-1&unread=true'
    );
    const response = await listNotifications(request, { env: mockEnv as never });
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.notifications).toHaveLength(1);
    expect(data.notifications[0].isRead).toBe(false);
    // Verify SQL had is_read = 0 filter
    expect(mockQueryDB).toHaveBeenCalledWith(
      mockEnv,
      expect.stringContaining('is_read = 0'),
      expect.any(Array)
    );
  });

  it('filters by type', async () => {
    mockQueryDB
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ cnt: 0 }]);

    const request = new NextRequest(
      'http://localhost:3000/api/notifications?userId=user-1&type=mention'
    );
    const response = await listNotifications(request, { env: mockEnv as never });
    expect(response.status).toBe(200);
    expect(mockQueryDB).toHaveBeenCalledWith(
      mockEnv,
      expect.stringContaining('type = ?'),
      expect.arrayContaining(['user-1', 'mention'])
    );
  });

  it('returns 500 on DB error', async () => {
    mockQueryDB.mockRejectedValueOnce(new Error('DB connection failed'));

    const request = new NextRequest(
      'http://localhost:3000/api/notifications?userId=user-1'
    );
    const response = await listNotifications(request, { env: mockEnv as never });
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toContain('Failed to fetch');
    expect(mockSafeError).toHaveBeenCalled();
  });
});

describe('POST /api/notifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 400 when required fields are missing', async () => {
    const body = { userId: 'user-1' }; // missing type, title, etc.
    const request = new NextRequest('http://localhost:3000/api/notifications', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    const response = await createNotification(request, { env: mockEnv as never });
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('Missing required fields');
  });

  it('creates a notification successfully and returns 201', async () => {
    mockGenerateId.mockReturnValue('notif-generated-id');
    mockExecuteDB.mockResolvedValueOnce({ meta: { changes: 1 } });

    const body = {
      userId: 'user-1',
      type: 'mention',
      title: '@mention',
      message: 'Bob mentioned you in Canvas',
      senderId: 'bob',
      senderName: 'Bob',
      targetUserId: 'user-1',
      nodeId: 'node-123',
      canvasId: 'canvas-456',
    };
    const request = new NextRequest('http://localhost:3000/api/notifications', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    const response = await createNotification(request, { env: mockEnv as never });
    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.id).toBe('notif-generated-id');
    expect(data.created_at).toBeTruthy();
    // Verify all fields are passed to executeDB
    expect(mockExecuteDB).toHaveBeenCalledWith(
      mockEnv,
      expect.stringContaining('INSERT INTO notifications'),
      expect.arrayContaining(['notif-generated-id', 'user-1', 'mention'])
    );
  });

  it('returns 500 on DB error during creation', async () => {
    mockGenerateId.mockReturnValue('notif-err-id');
    mockExecuteDB.mockRejectedValueOnce(new Error('DB write failed'));

    const body = {
      userId: 'user-1',
      type: 'system',
      title: 'System notice',
      message: 'Update available',
      senderId: 'system',
      senderName: 'System',
      targetUserId: 'user-1',
    };
    const request = new NextRequest('http://localhost:3000/api/notifications', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    const response = await createNotification(request, { env: mockEnv as never });
    expect(response.status).toBe(500);
    expect(mockSafeError).toHaveBeenCalled();
  });
});
