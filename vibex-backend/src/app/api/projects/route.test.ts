import { NextRequest } from 'next/server';

// Mock Prisma
const mockPrisma = {
  project: {
    findMany: jest.fn(),
    count: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
    findById: jest.fn(),
  },
};

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma),
}));

// Mock env
jest.mock('@/lib/env', () => ({
  getLocalEnv: jest.fn(() => ({ JWT_SECRET: 'test-secret' })),
}));

// Mock auth
jest.mock('@/lib/authFromGateway', () => ({
  getAuthUserFromRequest: jest.fn(),
}));

import { GET } from './route';
import { getAuthUserFromRequest } from '@/lib/authFromGateway';

const mockAuth = { userId: '550e8400-e29b-41d4-a716-446655440000', email: 'test@example.com' };

describe('GET /api/projects', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    (getAuthUserFromRequest as jest.Mock).mockReturnValue(mockAuth);
  });

  it('should return 401 when not authenticated', async () => {
    (getAuthUserFromRequest as jest.Mock).mockReturnValue(null);
    const request = new NextRequest('http://localhost:3000/api/projects');
    const response = await GET(request);
    expect(response.status).toBe(401);
  });

  it('should return projects with pagination', async () => {
    const mockProjects = [
      { id: 'proj1', name: 'Project 1', userId: '550e8400-e29b-41d4-a716-446655440000', description: null, createdAt: new Date(), updatedAt: new Date(), deletedAt: null, status: 'active', isPublic: false, isTemplate: false, user: { id: 'u1', email: 'test@example.com' }, _count: { pages: 2, messages: 5 } },
    ];
    mockPrisma.project.findMany.mockResolvedValue(mockProjects);
    mockPrisma.project.count.mockResolvedValue(1);

    const request = new NextRequest('http://localhost:3000/api/projects');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.projects).toHaveLength(1);
    expect(data.projects[0].name).toBe('Project 1');
    expect(data.pagination).toBeDefined();
    expect(data.pagination.total).toBe(1);
    expect(data.meta).toBeDefined();
    expect(data.meta.responseTimeMs).toBeDefined();
  });

  it('should filter by search query q (combined with user filter)', async () => {
    mockPrisma.project.findMany.mockResolvedValue([]);
    mockPrisma.project.count.mockResolvedValue(0);

    const request = new NextRequest('http://localhost:3000/api/projects?q=test');
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(mockPrisma.project.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          AND: expect.arrayContaining([
            { OR: [{ name: { contains: 'test' } }, { description: { contains: 'test' } }] },
          ]),
        }),
      })
    );
  });

  it('should filter by status', async () => {
    mockPrisma.project.findMany.mockResolvedValue([]);
    mockPrisma.project.count.mockResolvedValue(0);

    const request = new NextRequest('http://localhost:3000/api/projects?status=active');
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(mockPrisma.project.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: 'active' }),
      })
    );
  });

  it('should filter by isPublic', async () => {
    mockPrisma.project.findMany.mockResolvedValue([]);
    mockPrisma.project.count.mockResolvedValue(0);

    const request = new NextRequest('http://localhost:3000/api/projects?isPublic=true');
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(mockPrisma.project.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ isPublic: true }),
      })
    );
  });

  it('should filter by isTemplate', async () => {
    mockPrisma.project.findMany.mockResolvedValue([]);
    mockPrisma.project.count.mockResolvedValue(0);

    const request = new NextRequest('http://localhost:3000/api/projects?isTemplate=true');
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(mockPrisma.project.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ isTemplate: true }),
      })
    );
  });

  it('should enforce max limit of 100', async () => {
    mockPrisma.project.findMany.mockResolvedValue([]);
    mockPrisma.project.count.mockResolvedValue(0);

    const request = new NextRequest('http://localhost:3000/api/projects?limit=500');
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(mockPrisma.project.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 100 })
    );
  });

  it('should handle pagination offset', async () => {
    mockPrisma.project.findMany.mockResolvedValue([]);
    mockPrisma.project.count.mockResolvedValue(0);

    const request = new NextRequest('http://localhost:3000/api/projects?offset=20&limit=10');
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(mockPrisma.project.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 10, skip: 20 })
    );
  });

  it('should include user and _count in response', async () => {
    mockPrisma.project.findMany.mockResolvedValue([]);
    mockPrisma.project.count.mockResolvedValue(0);

    const request = new NextRequest('http://localhost:3000/api/projects');
    await GET(request);

    expect(mockPrisma.project.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        include: {
          user: { select: { id: true, email: true } },
          _count: { select: { pages: true, messages: true } },
        },
      })
    );
  });

  it('should return response time in meta', async () => {
    mockPrisma.project.findMany.mockResolvedValue([]);
    mockPrisma.project.count.mockResolvedValue(0);

    const request = new NextRequest('http://localhost:3000/api/projects?q=foo');
    const response = await GET(request);
    const data = await response.json();

    expect(data.meta.query).toBe('foo');
    expect(typeof data.meta.responseTimeMs).toBe('number');
  });

  it('should handle hasMore in pagination', async () => {
    const mockProjects = Array(10).fill(null).map((_, i) => ({
      id: `proj${i}`, name: `Project ${i}`, userId: '550e8400-e29b-41d4-a716-446655440000',
      description: null, createdAt: new Date(), updatedAt: new Date(), deletedAt: null,
      status: 'active', isPublic: false, isTemplate: false,
      user: { id: 'u1', email: 'test@example.com' }, _count: { pages: 0, messages: 0 },
    }));
    mockPrisma.project.findMany.mockResolvedValue(mockProjects);
    mockPrisma.project.count.mockResolvedValue(25);

    const request = new NextRequest('http://localhost:3000/api/projects?limit=10&offset=0');
    const response = await GET(request);
    const data = await response.json();

    expect(data.pagination.hasMore).toBe(true);
  });

  it('should handle hasMore=false at end of results', async () => {
    mockPrisma.project.findMany.mockResolvedValue([
      { id: 'proj1', name: 'P1', userId: 'u1', description: null, createdAt: new Date(), updatedAt: new Date(), deletedAt: null, status: 'active', isPublic: false, isTemplate: false, user: { id: 'u1', email: 'e' }, _count: { pages: 0, messages: 0 } },
    ]);
    mockPrisma.project.count.mockResolvedValue(1);

    const request = new NextRequest('http://localhost:3000/api/projects?limit=10&offset=0');
    const response = await GET(request);
    const data = await response.json();

    expect(data.pagination.hasMore).toBe(false);
  });

  it('should include deprecation headers', async () => {
    mockPrisma.project.findMany.mockResolvedValue([]);
    mockPrisma.project.count.mockResolvedValue(0);

    const request = new NextRequest('http://localhost:3000/api/projects');
    const response = await GET(request);

    expect(response.headers.get('Deprecation')).toBe('true');
    expect(response.headers.get('Sunset')).toBe('Sat, 31 May 2026 23:59:59 GMT');
  });

  it('should filter by explicit userId when provided', async () => {
    mockPrisma.project.findMany.mockResolvedValue([]);
    mockPrisma.project.count.mockResolvedValue(0);

    const request = new NextRequest('http://localhost:3000/api/projects?userId=550e8400-e29b-41d4-a716-446655440000');
    const response = await GET(request);

    expect(response.status).toBe(200);
    // When explicit userId is provided, it replaces the auth user filter
    expect(mockPrisma.project.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: '550e8400-e29b-41d4-a716-446655440000' }),
      })
    );
  });

  it('should handle errors', async () => {
    mockPrisma.project.findMany.mockImplementation(() => Promise.reject(new Error('DB error')));
    mockPrisma.project.count.mockImplementation(() => Promise.reject(new Error('DB error')));

    const request = new NextRequest('http://localhost:3000/api/projects');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toContain('Failed');
  });
});
