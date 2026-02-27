import { NextRequest } from 'next/server';

// Mock Prisma
const mockPrisma = {
  page: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma),
}));

import { GET, POST } from './route';

describe('GET /api/pages', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return pages', async () => {
    mockPrisma.page.findMany.mockResolvedValue([
      { id: 'page1', name: 'Page 1', projectId: 'proj123', content: null, createdAt: new Date(), updatedAt: new Date() },
    ]);

    const request = new NextRequest('http://localhost:3000/api/pages');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.pages).toHaveLength(1);
  });

  it('should filter by projectId', async () => {
    mockPrisma.page.findMany.mockResolvedValue([]);

    const request = new NextRequest('http://localhost:3000/api/pages?projectId=proj123');
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(mockPrisma.page.findMany).toHaveBeenCalledWith({
      where: { projectId: 'proj123' },
      include: { project: true },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('should handle errors', async () => {
    mockPrisma.page.findMany.mockRejectedValue(new Error('DB error'));

    const request = new NextRequest('http://localhost:3000/api/pages');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toContain('Failed');
  });
});

describe('POST /api/pages', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 if name is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/pages', {
      method: 'POST',
      body: JSON.stringify({ projectId: 'proj123' }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('name');
  });

  it('should return 400 if projectId is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/pages', {
      method: 'POST',
      body: JSON.stringify({ name: 'New Page' }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('projectId');
  });

  it('should create page successfully', async () => {
    const mockPage = {
      id: 'page123',
      name: 'New Page',
      projectId: 'proj123',
      content: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockPrisma.page.create.mockResolvedValue(mockPage);

    const request = new NextRequest('http://localhost:3000/api/pages', {
      method: 'POST',
      body: JSON.stringify({ name: 'New Page', projectId: 'proj123' }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.page.name).toBe('New Page');
  });
});
