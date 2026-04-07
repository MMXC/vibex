import { NextRequest } from 'next/server';

// Mock Prisma
const mockPrisma = {
  flowData: {
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  project: {
    findUnique: jest.fn(),
  },
};

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma),
}));

jest.mock('@/lib/auth', () => ({
  getAuthUser: jest.fn(),
}));

import { GET, PUT, DELETE } from './route';

// Tests for GET /api/flows/:flowId
describe('GET /api/flows/:flowId', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 if not authenticated', async () => {
    const { getAuthUser } = require('@/lib/auth');
    getAuthUser.mockReturnValue(null);

    const request = new NextRequest('http://localhost:3000/api/flows/flow123');
    const response = await GET(request, { params: Promise.resolve({ flowId: 'flow123' }) });
    const data = await response.json();

    expect(response.status).toBe(401);
  });

  it('should return 404 if flow not found', async () => {
    const { getAuthUser } = require('@/lib/auth');
    getAuthUser.mockReturnValue({ userId: 'user123', email: 'test@example.com' });
    mockPrisma.flowData.findUnique.mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/flows/flow123');
    const response = await GET(request, { params: Promise.resolve({ flowId: 'flow123' }) });
    const data = await response.json();

    expect(response.status).toBe(404);
  });

  it('should return 403 if user does not own flow', async () => {
    const { getAuthUser } = require('@/lib/auth');
    getAuthUser.mockReturnValue({ userId: 'user123', email: 'test@example.com' });
    mockPrisma.flowData.findUnique.mockResolvedValue({
      id: 'flow123',
      project: { userId: 'user456' },
    });

    const request = new NextRequest('http://localhost:3000/api/flows/flow123');
    const response = await GET(request, { params: Promise.resolve({ flowId: 'flow123' }) });
    const data = await response.json();

    expect(response.status).toBe(403);
  });

  it('should return flow successfully', async () => {
    const { getAuthUser } = require('@/lib/auth');
    getAuthUser.mockReturnValue({ userId: 'user123', email: 'test@example.com' });
    mockPrisma.flowData.findUnique.mockResolvedValue({
      id: 'flow123',
      name: 'Test Flow',
      nodes: '[{"id":"1"}]',
      edges: '[]',
      projectId: 'proj123',
      project: { userId: 'user123' },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const request = new NextRequest('http://localhost:3000/api/flows/flow123');
    const response = await GET(request, { params: Promise.resolve({ flowId: 'flow123' }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.name).toBe('Test Flow');
  });
});

// Tests for PUT /api/flows/:flowId
describe('PUT /api/flows/:flowId', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 404 if flow not found', async () => {
    const { getAuthUser } = require('@/lib/auth');
    getAuthUser.mockReturnValue({ userId: 'user123', email: 'test@example.com' });
    mockPrisma.flowData.findUnique.mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/flows/flow123', {
      method: 'PUT',
      body: JSON.stringify({ name: 'Updated Flow' }),
    });
    const response = await PUT(request, { params: Promise.resolve({ flowId: 'flow123' }) });
    const data = await response.json();

    expect(response.status).toBe(404);
  });

  it('should update flow successfully', async () => {
    const { getAuthUser } = require('@/lib/auth');
    getAuthUser.mockReturnValue({ userId: 'user123', email: 'test@example.com' });
    mockPrisma.flowData.findUnique.mockResolvedValue({
      id: 'flow123',
      project: { userId: 'user123' },
    });
    mockPrisma.flowData.update.mockResolvedValue({
      id: 'flow123',
      name: 'Updated Flow',
      nodes: '[{"id":"1"}]',
      edges: '[]',
      projectId: 'proj123',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const request = new NextRequest('http://localhost:3000/api/flows/flow123', {
      method: 'PUT',
      body: JSON.stringify({ name: 'Updated Flow', nodes: [{ id: '1' }] }),
    });
    const response = await PUT(request, { params: Promise.resolve({ flowId: 'flow123' }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.name).toBe('Updated Flow');
  });
});

// Tests for DELETE /api/flows/:flowId
describe('DELETE /api/flows/:flowId', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 404 if flow not found', async () => {
    const { getAuthUser } = require('@/lib/auth');
    getAuthUser.mockReturnValue({ userId: 'user123', email: 'test@example.com' });
    mockPrisma.flowData.findUnique.mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/flows/flow123', {
      method: 'DELETE',
    });
    const response = await DELETE(request, { params: Promise.resolve({ flowId: 'flow123' }) });
    const data = await response.json();

    expect(response.status).toBe(404);
  });

  it('should delete flow successfully', async () => {
    const { getAuthUser } = require('@/lib/auth');
    getAuthUser.mockReturnValue({ userId: 'user123', email: 'test@example.com' });
    mockPrisma.flowData.findUnique.mockResolvedValue({
      id: 'flow123',
      project: { userId: 'user123' },
    });
    mockPrisma.flowData.delete.mockResolvedValue({ id: 'flow123' });

    const request = new NextRequest('http://localhost:3000/api/flows/flow123', {
      method: 'DELETE',
    });
    const response = await DELETE(request, { params: Promise.resolve({ flowId: 'flow123' }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });
});
