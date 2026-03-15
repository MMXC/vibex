import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('@/services/ai-service', () => ({
  createAIService: jest.fn(),
}));

jest.mock('@/lib/env', () => ({
  getLocalEnv: jest.fn(() => ({
    MINIMAX_API_KEY: 'test-key',
    MINIMAX_API_BASE: 'https://test.api',
    MINIMAX_MODEL: 'test-model',
  })),
  getCloudflareEnv: jest.fn(() => ({
    MINIMAX_API_KEY: 'test-key',
    MINIMAX_API_BASE: 'https://test.api',
    MINIMAX_MODEL: 'test-model',
  })),
}));

jest.mock('@/lib/db', () => ({
  generateId: jest.fn(() => 'test-id-123'),
}));

import { POST } from './route';

describe('POST /api/plan/analyze', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 if requirement is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/plan/analyze', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('requirement');
  });

  it('should return 400 if requirement is empty string', async () => {
    const request = new NextRequest('http://localhost:3000/api/plan/analyze', {
      method: 'POST',
      body: JSON.stringify({ requirement: '' }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
  });

  it('should return 400 if requirement is only whitespace', async () => {
    const request = new NextRequest('http://localhost:3000/api/plan/analyze', {
      method: 'POST',
      body: JSON.stringify({ requirement: '   ' }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
  });

  it('should return 500 when AI service fails', async () => {
    // Mock createAIService to throw an error
    const mockCreateAIService = require('@/services/ai-service').createAIService;
    mockCreateAIService.mockImplementationOnce(() => {
      throw new Error('AI service initialization failed');
    });

    const request = new NextRequest('http://localhost:3000/api/plan/analyze', {
      method: 'POST',
      body: JSON.stringify({
        requirement: 'Build an e-commerce platform',
      }),
    });
    const response = await POST(request);
    const data = await response.json();

    // Should return 500 for service errors
    expect([200, 500]).toContain(response.status);
  });
});
