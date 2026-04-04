import { NextRequest } from 'next/server';

// Mock Prisma
const mockPrisma = {
  user: {
    findUnique: jest.fn(),
  },
};

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma),
}));

const mockVerifyPassword = jest.fn();
const mockGenerateToken = jest.fn();

jest.mock('@/lib/auth', () => ({
  verifyPassword: mockVerifyPassword,
  generateToken: mockGenerateToken,
}));

import { POST } from './route';

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('should return 400 if email is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ password: 'password123' }),
    });
    
    const response = await POST(request);
    const data = await response.json();
    
    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Invalid request body');
  });
  
  it('should return 400 if password is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com' }),
    });
    
    const response = await POST(request);
    const data = await response.json();
    
    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });
  
  it('should return 401 if user not found', async () => {
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    
    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'nonexistent@example.com', password: 'password123' }),
    });
    
    const response = await POST(request);
    const data = await response.json();
    
    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Invalid');
  });
  
  it('should return 401 if password is invalid', async () => {
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user123',
      email: 'test@example.com',
      password: 'hashedpassword',
    });
    mockVerifyPassword.mockResolvedValue(false);
    
    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com', password: 'wrongpassword' }),
    });
    
    const response = await POST(request);
    const data = await response.json();
    
    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
  });
  
  it('should return token and user on successful login', async () => {
    const mockUser = {
      id: 'user123',
      email: 'test@example.com',
      name: 'Test User',
      avatar: null,
      password: 'hashedpassword',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
    mockVerifyPassword.mockResolvedValue(true);
    mockGenerateToken.mockReturnValue('mock-token');
    
    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
    });
    
    const response = await POST(request);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.token).toBe('mock-token');
    expect(data.data.user.email).toBe('test@example.com');
  });
});
