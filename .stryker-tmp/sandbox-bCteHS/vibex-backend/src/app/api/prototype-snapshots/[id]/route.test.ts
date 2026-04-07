// @ts-nocheck
import { NextRequest } from 'next/server';

// Mock prisma
const mockPrisma = {
  prototypeSnapshot: {
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

describe('GET /api/prototype-snapshots/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return snapshot by id', async () => {
    mockPrisma.prototypeSnapshot.findUnique.mockResolvedValue({
      id: 'snap1',
      projectId: 'proj1',
      name: 'Test',
      version: 1,
    });

    const request = new NextRequest('http://localhost:3000/api/prototype-snapshots/snap1');
    const response = await GET(request, { params: Promise.resolve({ id: 'snap1' }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.prototypeSnapshot.id).toBe('snap1');
  });

  it('should return 404 if not found', async () => {
    mockPrisma.prototypeSnapshot.findUnique.mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/prototype-snapshots/nonexistent');
    const response = await GET(request, { params: Promise.resolve({ id: 'nonexistent' }) });

    expect(response.status).toBe(404);
  });

  it('should handle errors', async () => {
    mockPrisma.prototypeSnapshot.findUnique.mockRejectedValue(new Error('DB error'));

    const request = new NextRequest('http://localhost:3000/api/prototype-snapshots/snap1');
    const response = await GET(request, { params: Promise.resolve({ id: 'snap1' }) });

    expect(response.status).toBe(500);
  });
});

describe('PUT /api/prototype-snapshots/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should update snapshot', async () => {
    mockPrisma.prototypeSnapshot.update.mockResolvedValue({
      id: 'snap1',
      name: 'Updated',
    });

    const request = new NextRequest('http://localhost:3000/api/prototype-snapshots/snap1', {
      method: 'PUT',
      body: JSON.stringify({ name: 'Updated' }),
    });
    const response = await PUT(request, { params: Promise.resolve({ id: 'snap1' }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.prototypeSnapshot.name).toBe('Updated');
  });

  it('should handle errors', async () => {
    mockPrisma.prototypeSnapshot.update.mockRejectedValue(new Error('DB error'));

    const request = new NextRequest('http://localhost:3000/api/prototype-snapshots/snap1', {
      method: 'PUT',
      body: JSON.stringify({ name: 'Updated' }),
    });
    const response = await PUT(request, { params: Promise.resolve({ id: 'snap1' }) });

    expect(response.status).toBe(500);
  });
});

describe('DELETE /api/prototype-snapshots/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should delete snapshot', async () => {
    mockPrisma.prototypeSnapshot.delete.mockResolvedValue({ id: 'snap1' });

    const request = new NextRequest('http://localhost:3000/api/prototype-snapshots/snap1', {
      method: 'DELETE',
    });
    const response = await DELETE(request, { params: Promise.resolve({ id: 'snap1' }) });

    expect(response.status).toBe(200);
  });

  it('should handle errors', async () => {
    mockPrisma.prototypeSnapshot.delete.mockRejectedValue(new Error('DB error'));

    const request = new NextRequest('http://localhost:3000/api/prototype-snapshots/snap1', {
      method: 'DELETE',
    });
    const response = await DELETE(request, { params: Promise.resolve({ id: 'snap1' }) });

    expect(response.status).toBe(500);
  });
});