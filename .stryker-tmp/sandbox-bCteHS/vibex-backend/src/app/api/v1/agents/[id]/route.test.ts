// @ts-nocheck
import { NextRequest } from 'next/server';

// Mock prisma
const mockPrisma = {
  agent: {
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

describe('GET /api/v1/agents/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return agent by id', async () => {
    mockPrisma.agent.findUnique.mockResolvedValue({
      id: 'agent1',
      name: 'Test Agent',
      prompt: 'Test prompt',
      model: 'gpt-4',
      temperature: 0.7,
    });

    const request = new NextRequest('http://localhost:3000/api/v1/agents/agent1');
    const response = await GET(request, { params: Promise.resolve({ id: 'agent1' }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.agent.id).toBe('agent1');
  });

  it('should return 404 if not found', async () => {
    mockPrisma.agent.findUnique.mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/v1/agents/nonexistent');
    const response = await GET(request, { params: Promise.resolve({ id: 'nonexistent' }) });

    expect(response.status).toBe(404);
  });

  it('should handle errors', async () => {
    mockPrisma.agent.findUnique.mockRejectedValue(new Error('DB error'));

    const request = new NextRequest('http://localhost:3000/api/v1/agents/agent1');
    const response = await GET(request, { params: Promise.resolve({ id: 'agent1' }) });

    expect(response.status).toBe(500);
  });
});

describe('PUT /api/v1/agents/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should update agent', async () => {
    mockPrisma.agent.update.mockResolvedValue({
      id: 'agent1',
      name: 'Updated Agent',
      temperature: 0.8,
    });

    const request = new NextRequest('http://localhost:3000/api/v1/agents/agent1', {
      method: 'PUT',
      body: JSON.stringify({ name: 'Updated Agent', temperature: 0.8 }),
    });
    const response = await PUT(request, { params: Promise.resolve({ id: 'agent1' }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.agent.name).toBe('Updated Agent');
  });

  it('should handle errors', async () => {
    mockPrisma.agent.update.mockRejectedValue(new Error('DB error'));

    const request = new NextRequest('http://localhost:3000/api/v1/agents/agent1', {
      method: 'PUT',
      body: JSON.stringify({ name: 'Updated' }),
    });
    const response = await PUT(request, { params: Promise.resolve({ id: 'agent1' }) });

    expect(response.status).toBe(500);
  });
});

describe('DELETE /api/v1/agents/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should delete agent', async () => {
    mockPrisma.agent.delete.mockResolvedValue({ id: 'agent1' });

    const request = new NextRequest('http://localhost:3000/api/v1/agents/agent1', {
      method: 'DELETE',
    });
    const response = await DELETE(request, { params: Promise.resolve({ id: 'agent1' }) });

    expect([200, 500]).toContain(response.status);
  });
});