import { NextRequest } from 'next/server';
import { hashPassword, generateToken } from '@/lib/auth';

// Mock Prisma
const mockPrisma = {
  user: {
    findUnique: jest.fn(),
  },
};

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma),
}));

jest.mock('@/lib/auth', () => ({
  hashPassword: jest.fn(),
  verifyPassword: jest.fn(),
  generateToken: jest.fn(),
}));

import { POST } from './route';
import { PrismaClient } from '@prisma/client';
import { verifyPassword, generateToken } from '@/lib/auth';

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
    expect(data.error).toContain('required');
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
    (verifyPassword as jest.Mock).mockResolvedValue(false);
    
    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com', password: 'wrongpassword' }),
    });
    
    const response = await POST(request);
    const data = await response.json();
    
    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
  });
  
  // AC-1.1.1: Set-Cookie has HttpOnly
  it('should set httpOnly auth_token cookie on successful login', async () => {
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
    (verifyPassword as jest.Mock).mockResolvedValue(true);
    (generateToken as jest.Mock).mockReturnValue('mock-token');
    
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

    const setCookie = response.headers.get('set-cookie') || '';
    expect(setCookie).toMatch(/auth_token=mock-token/i);
    expect(setCookie).toMatch(/HttpOnly/i);
  });

  // AC-1.1.2: SameSite=Lax
  it('should set cookie with SameSite=Lax', async () => {
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
    (verifyPassword as jest.Mock).mockResolvedValue(true);
    (generateToken as jest.Mock).mockReturnValue('mock-token');
    
    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
    });
    
    const response = await POST(request);
    const setCookie = response.headers.get('set-cookie') || '';
    expect(setCookie).toMatch(/SameSite=Lax/i);
  });

  // AC-1.1.3: Max-Age=604800 (7 days)
  it('should set cookie with Max-Age=604800', async () => {
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
    (verifyPassword as jest.Mock).mockResolvedValue(true);
    (generateToken as jest.Mock).mockReturnValue('mock-token');
    
    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
    });
    
    const response = await POST(request);
    const setCookie = response.headers.get('set-cookie') || '';
    expect(setCookie).toMatch(/Max-Age=604800/i);
  });

  // AC-1.1.5: Login with whitespace-only email returns 401 (user not found)
  // Route validates `!email` which is false for '  ' (truthy), so it proceeds to DB
  it('should return 401 when email is whitespace-only string', async () => {
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: '  ', password: 'password123' }),
    });
    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  // AC-1.1.6: Login with whitespace-only password returns 401 (invalid password)
  // Route validates `!password` which is false for '   ' (truthy), so it proceeds to DB
  it('should return 401 when password is whitespace-only string', async () => {
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user123',
      email: 'test@example.com',
      password: 'hashedpassword',
      name: 'Test User',
      avatar: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    (verifyPassword as jest.Mock).mockResolvedValue(false);
    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com', password: '   ' }),
    });
    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  // AC-1.1.7: Login with empty JSON body should return 400
  it('should return 400 for empty JSON body', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const response = await POST(request);
    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.error).toContain('required');
  });

  // AC-1.1.8: User with null password should return 401
  it('should return 401 if user password field is null', async () => {
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user123',
      email: 'nullpw@example.com',
      password: null,
      name: 'Null PW User',
      avatar: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    (verifyPassword as jest.Mock).mockResolvedValue(false);

    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'nullpw@example.com', password: 'password123' }),
    });
    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it('should handle unexpected error during login', async () => {
    (mockPrisma.user.findUnique as jest.Mock).mockRejectedValue(new Error('Database connection failed'));
    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
    });
    const response = await POST(request);
    const data = await response.json();
    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
  });
});
