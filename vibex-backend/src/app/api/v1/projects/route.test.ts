import { NextRequest } from 'next/server';

// Mock Prisma
const mockPrisma = {
  project: {
    findMany: jest.fn(),
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

import { GET, POST } from './route';

describe('GET /api/projects', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return projects', async () => {
    mockPrisma.project.findMany.mockResolvedValue([
      { id: 'proj1', name: 'Project 1', userId: 'user123', description: null, createdAt: new Date(), updatedAt: new Date(), pages: [] },
    ]);

    const request = new NextRequest('http://localhost:3000/api/projects');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.projects).toHaveLength(1);
  });

  it('should filter projects by userId query param', async () => {
    mockPrisma.project.findMany.mockResolvedValue([]);

    const request = new NextRequest('http://localhost:3000/api/projects?userId=user456');
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(mockPrisma.project.findMany).toHaveBeenCalledWith({
      where: { userId: 'user456' },
      include: { pages: true },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('should handle errors', async () => {
    mockPrisma.project.findMany.mockRejectedValue(new Error('DB error'));

    const request = new NextRequest('http://localhost:3000/api/projects');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toContain('Failed');
  });
});

describe('POST /api/projects', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 if name is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/projects', {
      method: 'POST',
      body: JSON.stringify({ userId: 'user123' }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('name');
  });

  it('should return 400 if userId is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/projects', {
      method: 'POST',
      body: JSON.stringify({ name: 'New Project' }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('userId');
  });

  it('should create project successfully', async () => {
    const mockProject = {
      id: 'proj123',
      name: 'New Project',
      description: 'Description',
      userId: 'user123',
      createdAt: new Date(),
      updatedAt: new Date(),
      pages: [],
    };
    mockPrisma.project.create.mockResolvedValue(mockProject);

    const request = new NextRequest('http://localhost:3000/api/projects', {
      method: 'POST',
      body: JSON.stringify({ name: 'New Project', description: 'Description', userId: 'user123' }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.project.name).toBe('New Project');
  });

  it('should handle errors', async () => {
    mockPrisma.project.create.mockRejectedValue(new Error('DB error'));

    const request = new NextRequest('http://localhost:3000/api/projects', {
      method: 'POST',
      body: JSON.stringify({ name: 'New Project', userId: 'user123' }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toContain('Failed');
  });
});
