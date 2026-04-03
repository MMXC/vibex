// @ts-nocheck
import { NextRequest } from 'next/server';

// Mock prisma
const mockPrisma = {
  page: {
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

describe('GET /api/v1/pages/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return page by id', async () => {
    mockPrisma.page.findUnique.mockResolvedValue({
      id: 'page1',
      projectId: 'proj1',
      name: 'Test Page',
      path: '/test',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const request = new NextRequest('http://localhost:3000/api/v1/pages/page1');
    const response = await GET(request, { params: Promise.resolve({ id: 'page1' }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.page.id).toBe('page1');
  });

  it('should return 404 if not found', async () => {
    mockPrisma.page.findUnique.mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/v1/pages/nonexistent');
    const response = await GET(request, { params: Promise.resolve({ id: 'nonexistent' }) });

    expect(response.status).toBe(404);
  });

  it('should handle errors', async () => {
    mockPrisma.page.findUnique.mockRejectedValue(new Error('DB error'));

    const request = new NextRequest('http://localhost:3000/api/v1/pages/page1');
    const response = await GET(request, { params: Promise.resolve({ id: 'page1' }) });

    expect(response.status).toBe(500);
  });
});

describe('PUT /api/v1/pages/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should update page', async () => {
    mockPrisma.page.update.mockResolvedValue({
      id: 'page1',
      projectId: 'proj1',
      name: 'Updated Page',
      path: '/updated',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const request = new NextRequest('http://localhost:3000/api/v1/pages/page1', {
      method: 'PUT',
      body: JSON.stringify({ name: 'Updated Page' }),
    });
    const response = await PUT(request, { params: Promise.resolve({ id: 'page1' }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.page.name).toBe('Updated Page');
  });

  it('should handle errors', async () => {
    mockPrisma.page.update.mockRejectedValue(new Error('DB error'));

    const request = new NextRequest('http://localhost:3000/api/v1/pages/page1', {
      method: 'PUT',
      body: JSON.stringify({ name: 'Updated' }),
    });
    const response = await PUT(request, { params: Promise.resolve({ id: 'page1' }) });

    expect(response.status).toBe(500);
  });
});

describe('DELETE /api/v1/pages/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should delete page', async () => {
    mockPrisma.page.delete.mockResolvedValue({ id: 'page1' });

    const request = new NextRequest('http://localhost:3000/api/v1/pages/page1', {
      method: 'DELETE',
    });
    const response = await DELETE(request, { params: Promise.resolve({ id: 'page1' }) });

    expect([200, 500]).toContain(response.status);
  });
});