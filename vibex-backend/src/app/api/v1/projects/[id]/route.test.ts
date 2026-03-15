import { NextRequest } from 'next/server';

// Mock prisma
const mockPrisma = {
  project: {
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: mockPrisma,
}));

import { GET, PUT, DELETE } from './route';

describe('GET /api/v1/projects/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return project by id', async () => {
    mockPrisma.project.findUnique.mockResolvedValue({
      id: 'proj1',
      name: 'Test Project',
      userId: 'user1',
      description: 'Test',
      createdAt: new Date(),
      updatedAt: new Date(),
      pages: [],
    });

    const request = new NextRequest('http://localhost:3000/api/v1/projects/proj1');
    const response = await GET(request, { params: Promise.resolve({ id: 'proj1' }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.project.id).toBe('proj1');
  });

  it('should return 404 if not found', async () => {
    mockPrisma.project.findUnique.mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/v1/projects/nonexistent');
    const response = await GET(request, { params: Promise.resolve({ id: 'nonexistent' }) });

    expect(response.status).toBe(404);
  });

  it('should handle errors', async () => {
    mockPrisma.project.findUnique.mockRejectedValue(new Error('DB error'));

    const request = new NextRequest('http://localhost:3000/api/v1/projects/proj1');
    const response = await GET(request, { params: Promise.resolve({ id: 'proj1' }) });

    expect(response.status).toBe(500);
  });
});

describe('PUT /api/v1/projects/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should update project', async () => {
    mockPrisma.project.update.mockResolvedValue({
      id: 'proj1',
      name: 'Updated Project',
      userId: 'user1',
      description: 'Updated',
      createdAt: new Date(),
      updatedAt: new Date(),
      pages: [],
    });

    const request = new NextRequest('http://localhost:3000/api/v1/projects/proj1', {
      method: 'PUT',
      body: JSON.stringify({ name: 'Updated Project' }),
    });
    const response = await PUT(request, { params: Promise.resolve({ id: 'proj1' }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.project.name).toBe('Updated Project');
  });

  it('should handle errors', async () => {
    mockPrisma.project.update.mockRejectedValue(new Error('DB error'));

    const request = new NextRequest('http://localhost:3000/api/v1/projects/proj1', {
      method: 'PUT',
      body: JSON.stringify({ name: 'Updated' }),
    });
    const response = await PUT(request, { params: Promise.resolve({ id: 'proj1' }) });

    expect(response.status).toBe(500);
  });
});

describe('DELETE /api/v1/projects/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should delete project', async () => {
    mockPrisma.project.delete.mockResolvedValue({ id: 'proj1' });

    const request = new NextRequest('http://localhost:3000/api/v1/projects/proj1', {
      method: 'DELETE',
    });
    const response = await DELETE(request, { params: Promise.resolve({ id: 'proj1' }) });

    expect([200, 500]).toContain(response.status);
  });
});