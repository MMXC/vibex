/**
 * route-folders.test.ts — Template Folder CRUD API tests
 * S87-E5: 模板文件夹管理
 *
 * Tests:
 * 1. GET /api/templates/folders — unauthenticated → 401
 * 2. GET /api/templates/folders — authenticated, no folders → { folders: [] }
 * 3. GET /api/templates/folders — returns folders with templateCount
 * 4. POST /api/templates/folders — create folder, returns folder
 * 5. POST /api/templates/folders — missing name → 400
 */
jest.mock('@/lib/db', () => {
  const mockQueryDB = jest.fn();
  const mockQueryOne = jest.fn();
  const mockExecuteDB = jest.fn();
  const mockGenerateId = jest.fn(() => 'gen-folder-id');
  const mockSafeError = jest.fn((..._args: unknown[]) => { /* noop */ });
  (global as Record<string, unknown>).__folderQueryDB = mockQueryDB;
  (global as Record<string, unknown>).__folderQueryOne = mockQueryOne;
  (global as Record<string, unknown>).__folderExecuteDB = mockExecuteDB;
  return {
    queryDB: mockQueryDB,
    queryOne: mockQueryOne,
    executeDB: mockExecuteDB,
    generateId: mockGenerateId,
    safeError: mockSafeError,
    Env: {},
  };
});

jest.mock('@/lib/authFromGateway', () => ({
  getAuthUserFromRequest: jest.fn(),
}));

const mockQueryDB = () => (global as Record<string, unknown>).__folderQueryDB as jest.Mock;
const mockQueryOne = () => (global as Record<string, unknown>).__folderQueryOne as jest.Mock;
const mockExecuteDB = () => (global as Record<string, unknown>).__folderExecuteDB as jest.Mock;

import { NextRequest } from 'next/server';
import { GET, POST } from './route';

// Mock env with exec method for CREATE TABLE
const createMockEnv = (overrides?: { exec?: jest.Mock; prepare?: jest.Mock }) => ({
  DB: {
    exec: overrides?.exec ?? jest.fn().mockResolvedValue(undefined),
    prepare: overrides?.prepare ?? jest.fn(),
  },
});

// Shared mockEnv instance for backward compatibility with existing test bodies
const mockEnv = createMockEnv();

const mockUser = { userId: 'user-1', userName: 'Alice' };

const mockAuthSuccess = () => {
  const { getAuthUserFromRequest } = require('@/lib/authFromGateway');
  (getAuthUserFromRequest as jest.Mock).mockReturnValue({ success: true, user: mockUser });
};
const mockAuthFail = () => {
  const { getAuthUserFromRequest } = require('@/lib/authFromGateway');
  (getAuthUserFromRequest as jest.Mock).mockReturnValue({ success: false, user: null });
};

describe('GET /api/templates/folders', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthSuccess();
  });

  it('returns 401 when unauthenticated', async () => {
    mockAuthFail();
    const request = new NextRequest('http://localhost:3000/api/templates/folders');
    const response = await GET(request, { env: mockEnv } as never);
    expect(response.status).toBe(401);
  });

  it('returns empty folders array when no folders exist', async () => {
    mockExecuteDB().mockResolvedValueOnce(undefined); // CREATE TABLE IF NOT EXISTS
    mockQueryDB().mockResolvedValueOnce([]); // empty result

    const request = new NextRequest('http://localhost:3000/api/templates/folders');
    const response = await GET(request, { env: mockEnv } as never);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.folders).toEqual([]);
  });

  it('returns folders with templateCount', async () => {
    mockExecuteDB().mockResolvedValueOnce(undefined);
    mockQueryDB().mockResolvedValueOnce([
      { folder_id: 'f1', name: 'Work', icon: '💼', sort_order: 0, template_count: 3, created_at: '2026-06-01T00:00:00.000Z', updated_at: '2026-06-01T00:00:00.000Z' },
      { folder_id: 'f2', name: 'Personal', icon: '🏠', sort_order: 1, template_count: 1, created_at: '2026-06-01T00:00:00.000Z', updated_at: '2026-06-01T00:00:00.000Z' },
    ]);

    const request = new NextRequest('http://localhost:3000/api/templates/folders');
    const response = await GET(request, { env: mockEnv } as never);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.folders).toHaveLength(2);
    expect(data.folders[0]).toEqual({
      folderId: 'f1',
      name: 'Work',
      icon: '💼',
      sortOrder: 0,
      templateCount: 3,
      createdAt: '2026-06-01T00:00:00.000Z',
      updatedAt: '2026-06-01T00:00:00.000Z',
    });
    expect(data.folders[1].templateCount).toBe(1);
  });
});

describe('POST /api/templates/folders', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthSuccess();
  });

  it('creates a folder and returns it', async () => {
    mockExecuteDB().mockResolvedValueOnce(undefined);

    const request = new NextRequest('http://localhost:3000/api/templates/folders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Work Templates', icon: '💼' }),
    });
    const response = await POST(request, { env: mockEnv } as never);

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.folder.name).toBe('Work Templates');
    expect(data.folder.icon).toBe('💼');
    expect(data.folder.sortOrder).toBe(0);
    expect(data.folder.templateCount).toBe(0);
  });

  it('uses default icon when not provided', async () => {
    mockExecuteDB().mockResolvedValueOnce(undefined);

    const request = new NextRequest('http://localhost:3000/api/templates/folders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'My Folder' }),
    });
    const response = await POST(request, { env: mockEnv } as never);

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.folder.icon).toBe('📁');
  });

  it('returns 400 when name is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/templates/folders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const response = await POST(request, { env: mockEnv } as never);
    expect(response.status).toBe(400);
  });

  it('returns 400 when name is empty string', async () => {
    const request = new NextRequest('http://localhost:3000/api/templates/folders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '   ' }),
    });
    const response = await POST(request, { env: mockEnv } as never);
    expect(response.status).toBe(400);
  });

  it('returns 401 when unauthenticated', async () => {
    mockAuthFail();
    const request = new NextRequest('http://localhost:3000/api/templates/folders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test' }),
    });
    const response = await POST(request, { env: mockEnv } as never);
    expect(response.status).toBe(401);
  });
});
