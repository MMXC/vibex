/**
 * route.test — S91 E1: AI Template Generation
 * Jest tests for /api/templates/ai-generate
 */

import { GET, POST } from './route';

// Mock the auth helper
jest.mock('@/lib/authFromGateway', () => ({
  getAuthUserFromRequest: jest.fn(),
}));

// Mock the db helpers
jest.mock('@/lib/db', () => ({
  generateId: jest.fn(() => 'test-job-id-123'),
  safeError: jest.fn(),
  Env: {},
}));

// Mock the LLM generator
jest.mock('@/lib/llm/templateGenerator', () => ({
  generateTemplateFromPrompt: jest.fn(),
}));

const mockAuth = require('@/lib/authFromGateway').getAuthUserFromRequest;
const mockGenerateId = require('@/lib/db').generateId;
const mockTemplateGenerator = require('@/lib/llm/templateGenerator').generateTemplateFromPrompt;

// Minimal mock env
const mockEnv = {
  DB: {
    prepare: jest.fn(() => ({
      bind: jest.fn(() => ({
        all: jest.fn(() => Promise.resolve({ results: [] })),
        run: jest.fn(() => Promise.resolve({ success: true })),
        first: jest.fn(() => Promise.resolve(null)),
      })),
    })),
  },
  JWT_SECRET: 'test-secret',
};

describe('POST /api/templates/ai-generate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockReturnValue({ success: false });
    const req = new Request('http://localhost/api/templates/ai-generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'test prompt' }),
    });
    const res = await POST(req, { env: mockEnv });
    expect(res.status).toBe(401);
  });

  it('returns 400 when prompt is missing', async () => {
    mockAuth.mockReturnValue({ success: true, user: { userId: 'user1' } });
    const req = new Request('http://localhost/api/templates/ai-generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const res = await POST(req, { env: mockEnv });
    expect(res.status).toBe(400);
  });

  it('returns 400 when prompt is too short', async () => {
    mockAuth.mockReturnValue({ success: true, user: { userId: 'user1' } });
    const req = new Request('http://localhost/api/templates/ai-generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'hi' }),
    });
    const res = await POST(req, { env: mockEnv });
    expect(res.status).toBe(400);
  });

  it('creates job and returns 202 when prompt is valid', async () => {
    mockAuth.mockReturnValue({ success: true, user: { userId: 'user1' } });
    const req = new Request('http://localhost/api/templates/ai-generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'a landing page with products' }),
    });
    const res = await POST(req, { env: mockEnv });
    expect(res.status).toBe(202);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.jobId).toBe('test-job-id-123');
    expect(data.status).toBe('pending');
  });
});

describe('GET /api/templates/ai-generate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockReturnValue({ success: false });
    const req = new Request('http://localhost/api/templates/ai-generate');
    const res = await GET(req, { env: mockEnv });
    expect(res.status).toBe(401);
  });

  it('returns jobs list when authenticated', async () => {
    mockAuth.mockReturnValue({ success: true, user: { userId: 'user1' } });
    const mockJobs = [
      { id: 'job1', prompt: 'test', status: 'completed', created_at: 123456, updated_at: 123456 },
    ];
    mockEnv.DB.prepare = jest.fn(() => ({
      bind: jest.fn(() => ({
        all: jest.fn(() => Promise.resolve({ results: mockJobs })),
      })),
    }));
    const req = new Request('http://localhost/api/templates/ai-generate');
    const res = await GET(req, { env: mockEnv });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.jobs).toHaveLength(1);
  });
});
