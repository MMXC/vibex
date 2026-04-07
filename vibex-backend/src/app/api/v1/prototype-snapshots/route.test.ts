import { NextRequest } from 'next/server';

// Mock prisma
const mockPrisma = {
  prototypeSnapshot: {
    findMany: jest.fn(),
    create: jest.fn(),
  },
};

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: mockPrisma,
}));

import { GET, POST } from './route';

import { authHeader } from '@/lib/__tests__/testAuth';
describe('GET /api/v1/prototype-snapshots', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return all snapshots', async () => {
    mockPrisma.prototypeSnapshot.findMany.mockResolvedValue([
      { id: 'snap1', projectId: 'proj1', name: 'Snapshot 1', version: 1, createdAt: new Date() },
    ]);

    const request = new NextRequest('http://localhost:3000/api/v1/prototype-snapshots', { headers: authHeader() });
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.prototypeSnapshots).toHaveLength(1);
  });

  it('should filter by projectId', async () => {
    mockPrisma.prototypeSnapshot.findMany.mockResolvedValue([]);

    const request = new NextRequest('http://localhost:3000/api/v1/prototype-snapshots?projectId=proj123', { headers: authHeader() });
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(mockPrisma.prototypeSnapshot.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { projectId: 'proj123' },
      })
    );
  });

  it('should handle errors', async () => {
    mockPrisma.prototypeSnapshot.findMany.mockRejectedValue(new Error('DB error'));

    const request = new NextRequest('http://localhost:3000/api/v1/prototype-snapshots', { headers: authHeader() });
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toContain('Failed');
  });
});

describe('POST /api/v1/prototype-snapshots', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 if projectId is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/v1/prototype-snapshots', { headers: authHeader() }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('projectId');
  });

  it('should return 400 if content is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/v1/prototype-snapshots', { headers: authHeader() }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('content');
  });

  it('should create snapshot', async () => {
    mockPrisma.prototypeSnapshot.findMany.mockResolvedValue([]);
    mockPrisma.prototypeSnapshot.create.mockResolvedValue({
      id: 'snap1',
      projectId: 'proj1',
      name: 'Test',
      version: 1,
      createdAt: new Date(),
    });

    const request = new NextRequest('http://localhost:3000/api/v1/prototype-snapshots', {
      method: 'POST',
      body: JSON.stringify({ projectId: 'proj1', content: { test: true } }),
      headers: authHeader(),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.prototypeSnapshot.version).toBe(1);
  });

  it('should handle errors', async () => {
    mockPrisma.prototypeSnapshot.findMany.mockRejectedValue(new Error('DB error'));

    const request = new NextRequest('http://localhost:3000/api/v1/prototype-snapshots', {
      method: 'POST',
      body: JSON.stringify({ projectId: 'proj1', content: {} }),
      headers: authHeader(),
    });
    const response = await POST(request);

    expect(response.status).toBe(500);
  });
});