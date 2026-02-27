import { NextRequest } from 'next/server';

// Mock Prisma
const mockPrisma = {
  agent: {
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

describe('GET /api/agents', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return agents', async () => {
    mockPrisma.agent.findMany.mockResolvedValue([
      { id: 'agent1', name: 'Agent 1', prompt: 'You are a helpful assistant', model: 'abab6.5s-chat', temperature: 0.7, userId: 'user123', createdAt: new Date(), updatedAt: new Date() },
    ]);

    const request = new NextRequest('http://localhost:3000/api/agents');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.agents).toHaveLength(1);
  });

  it('should filter by userId', async () => {
    mockPrisma.agent.findMany.mockResolvedValue([]);

    const request = new NextRequest('http://localhost:3000/api/agents?userId=user456');
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(mockPrisma.agent.findMany).toHaveBeenCalledWith({
      where: { userId: 'user456' },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('should handle errors', async () => {
    mockPrisma.agent.findMany.mockRejectedValue(new Error('DB error'));

    const request = new NextRequest('http://localhost:3000/api/agents');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toContain('Failed');
  });
});

describe('POST /api/agents', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 if name is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/agents', {
      method: 'POST',
      body: JSON.stringify({ prompt: 'You are helpful', userId: 'user123' }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('name');
  });

  it('should return 400 if prompt is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/agents', {
      method: 'POST',
      body: JSON.stringify({ name: 'New Agent', userId: 'user123' }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('prompt');
  });

  it('should return 400 if userId is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/agents', {
      method: 'POST',
      body: JSON.stringify({ name: 'New Agent', prompt: 'You are helpful' }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('userId');
  });

  it('should create agent successfully', async () => {
    const mockAgent = {
      id: 'agent123',
      name: 'New Agent',
      prompt: 'You are helpful',
      model: 'abab6.5s-chat',
      temperature: 0.7,
      userId: 'user123',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockPrisma.agent.create.mockResolvedValue(mockAgent);

    const request = new NextRequest('http://localhost:3000/api/agents', {
      method: 'POST',
      body: JSON.stringify({ name: 'New Agent', prompt: 'You are helpful', userId: 'user123' }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.agent.name).toBe('New Agent');
  });
});
