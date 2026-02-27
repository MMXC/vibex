import { NextRequest } from 'next/server';

// Mock Prisma
const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
};

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma),
}));

jest.mock('@/lib/auth', () => ({
  hashPassword: jest.fn(),
  generateToken: jest.fn(),
}));

import { POST } from './route';
import { hashPassword, generateToken } from '@/lib/auth';

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 if email is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ password: 'password123' }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('required');
  });

  it('should return 400 if password is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com' }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
  });

  it('should return 400 if password is too short', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com', password: '123' }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('8 characters');
  });

  it('should return 409 if email already exists', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing' });
    (hashPassword as jest.Mock).mockResolvedValue('hashed');

    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email: 'existing@example.com', password: 'password123' }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.success).toBe(false);
    expect(data.error).toContain('exists');
  });

  it('should register successfully', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    (hashPassword as jest.Mock).mockResolvedValue('hashedpassword');
    (generateToken as jest.Mock).mockReturnValue('mock-token');

    const mockUser = {
      id: 'user123',
      email: 'test@example.com',
      name: 'Test',
      avatar: null,
      password: 'hashedpassword',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockPrisma.user.create.mockResolvedValue(mockUser);

    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com', password: 'password123', name: 'Test' }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data.token).toBe('mock-token');
  });

  it('should handle errors', async () => {
    mockPrisma.user.findUnique.mockRejectedValue(new Error('DB error'));

    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
  });
});
