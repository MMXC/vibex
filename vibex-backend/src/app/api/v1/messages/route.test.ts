import { NextRequest } from 'next/server';

// Mock Prisma
const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  message: {
    findMany: jest.fn(),
    create: jest.fn(),
    findFirst: jest.fn(),
  },
  project: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
  },
};

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma),
}));

jest.mock('@/lib/auth', () => ({
  getAuthUser: jest.fn(),
  hashPassword: jest.fn(),
}));

import { GET as MessagesGET, POST as MessagesPOST } from '../messages/route';

// Tests for GET /api/messages
describe('GET /api/messages', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 if not authenticated', async () => {
    const { getAuthUser } = require('@/lib/auth');
    getAuthUser.mockReturnValue(null);

    const request = new NextRequest('http://localhost:3000/api/messages?projectId=proj123');
    const response = await MessagesGET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
  });

  it('should return 400 if projectId is missing', async () => {
    const { getAuthUser } = require('@/lib/auth');
    getAuthUser.mockReturnValue({ userId: 'user123', email: 'test@example.com' });

    const request = new NextRequest('http://localhost:3000/api/messages');
    const response = await MessagesGET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('projectId');
  });

  it('should return 404 if project not found', async () => {
    const { getAuthUser } = require('@/lib/auth');
    getAuthUser.mockReturnValue({ userId: 'user123', email: 'test@example.com' });
    mockPrisma.project.findFirst.mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/messages?projectId=proj123');
    const response = await MessagesGET(request);
    const data = await response.json();

    expect(response.status).toBe(404);
  });

  it('should return messages successfully', async () => {
    const { getAuthUser } = require('@/lib/auth');
    getAuthUser.mockReturnValue({ userId: 'user123', email: 'test@example.com' });
    mockPrisma.project.findFirst.mockResolvedValue({ id: 'proj123', userId: 'user123' });
    mockPrisma.message.findMany.mockResolvedValue([
      { id: 'msg1', role: 'user', content: 'Hello', projectId: 'proj123', createdAt: new Date() },
    ]);

    const request = new NextRequest('http://localhost:3000/api/messages?projectId=proj123');
    const response = await MessagesGET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveLength(1);
  });
});

// Tests for POST /api/messages
describe('POST /api/messages', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 if not authenticated', async () => {
    const { getAuthUser } = require('@/lib/auth');
    getAuthUser.mockReturnValue(null);

    const request = new NextRequest('http://localhost:3000/api/messages', {
      method: 'POST',
      body: JSON.stringify({ content: 'Hello', projectId: 'proj123' }),
    });
    const response = await MessagesPOST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
  });

  it('should return 400 if required fields missing', async () => {
    const { getAuthUser } = require('@/lib/auth');
    getAuthUser.mockReturnValue({ userId: 'user123', email: 'test@example.com' });

    const request = new NextRequest('http://localhost:3000/api/messages', {
      method: 'POST',
      body: JSON.stringify({ content: 'Hello' }),
    });
    const response = await MessagesPOST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
  });

  it('should create message successfully', async () => {
    const { getAuthUser } = require('@/lib/auth');
    getAuthUser.mockReturnValue({ userId: 'user123', email: 'test@example.com' });
    mockPrisma.project.findFirst.mockResolvedValue({ id: 'proj123', userId: 'user123' });
    mockPrisma.message.create.mockResolvedValue({
      id: 'msg123',
      role: 'user',
      content: 'Hello',
      projectId: 'proj123',
      createdAt: new Date(),
    });

    const request = new NextRequest('http://localhost:3000/api/messages', {
      method: 'POST',
      body: JSON.stringify({ content: 'Hello', projectId: 'proj123' }),
    });
    const response = await MessagesPOST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data.content).toBe('Hello');
  });
});
