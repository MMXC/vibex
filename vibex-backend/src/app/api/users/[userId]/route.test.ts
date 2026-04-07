import { NextRequest } from 'next/server';

// Mock Prisma
const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  flowData: {
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  project: {
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

import { GET, PUT } from '../../users/[userId]/route';

// Tests for GET /api/users/:userId
describe('GET /api/users/:userId', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 if not authenticated', async () => {
    const { getAuthUser } = require('@/lib/auth');
    getAuthUser.mockReturnValue(null);

    const request = new NextRequest('http://localhost:3000/api/users/user123');
    const response = await GET(request, { params: Promise.resolve({ userId: 'user123' }) });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
  });

  it('should return 403 if trying to access other user', async () => {
    const { getAuthUser } = require('@/lib/auth');
    getAuthUser.mockReturnValue({ userId: 'user123', email: 'test@example.com' });

    const request = new NextRequest('http://localhost:3000/api/users/user456');
    const response = await GET(request, { params: Promise.resolve({ userId: 'user456' }) });
    const data = await response.json();

    expect(response.status).toBe(403);
  });

  it('should return 404 if user not found', async () => {
    const { getAuthUser } = require('@/lib/auth');
    getAuthUser.mockReturnValue({ userId: 'user123', email: 'test@example.com' });
    mockPrisma.user.findUnique.mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/users/user123');
    const response = await GET(request, { params: Promise.resolve({ userId: 'user123' }) });
    const data = await response.json();

    expect(response.status).toBe(404);
  });

  it('should return user successfully', async () => {
    const { getAuthUser } = require('@/lib/auth');
    getAuthUser.mockReturnValue({ userId: 'user123', email: 'test@example.com' });
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user123',
      email: 'test@example.com',
      name: 'Test User',
      avatar: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const request = new NextRequest('http://localhost:3000/api/users/user123');
    const response = await GET(request, { params: Promise.resolve({ userId: 'user123' }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.email).toBe('test@example.com');
  });
});

// Tests for PUT /api/users/:userId
describe('PUT /api/users/:userId', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 if not authenticated', async () => {
    const { getAuthUser } = require('@/lib/auth');
    getAuthUser.mockReturnValue(null);

    const request = new NextRequest('http://localhost:3000/api/users/user123', {
      method: 'PUT',
      body: JSON.stringify({ name: 'New Name' }),
    });
    const response = await PUT(request, { params: Promise.resolve({ userId: 'user123' }) });
    const data = await response.json();

    expect(response.status).toBe(401);
  });

  it('should return 403 if trying to update other user', async () => {
    const { getAuthUser } = require('@/lib/auth');
    getAuthUser.mockReturnValue({ userId: 'user123', email: 'test@example.com' });

    const request = new NextRequest('http://localhost:3000/api/users/user456', {
      method: 'PUT',
      body: JSON.stringify({ name: 'New Name' }),
    });
    const response = await PUT(request, { params: Promise.resolve({ userId: 'user456' }) });
    const data = await response.json();

    expect(response.status).toBe(403);
  });

  it('should update user successfully', async () => {
    const { getAuthUser, hashPassword } = require('@/lib/auth');
    getAuthUser.mockReturnValue({ userId: 'user123', email: 'test@example.com' });
    hashPassword.mockResolvedValue('hashedpassword');
    mockPrisma.user.update.mockResolvedValue({
      id: 'user123',
      email: 'test@example.com',
      name: 'New Name',
      avatar: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const request = new NextRequest('http://localhost:3000/api/users/user123', {
      method: 'PUT',
      body: JSON.stringify({ name: 'New Name' }),
    });
    const response = await PUT(request, { params: Promise.resolve({ userId: 'user123' }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.name).toBe('New Name');
  });
});
