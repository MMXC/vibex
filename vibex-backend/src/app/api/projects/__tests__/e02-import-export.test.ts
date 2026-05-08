/**
 * E02 Import/Export API Route Tests
 * Tests for GET /api/projects/:id/export and POST /api/projects/import
 * Sprint31 E02-U1/U2/U3
 */

import { NextRequest } from 'next/server';

// Mock Prisma
const mockPrisma = {
  project: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  uINode: {
    findMany: jest.fn(),
    createMany: jest.fn(),
  },
  businessDomain: {
    findMany: jest.fn(),
    createMany: jest.fn(),
  },
  flowData: {
    findMany: jest.fn(),
    createMany: jest.fn(),
  },
  page: {
    findMany: jest.fn(),
    createMany: jest.fn(),
  },
  requirement: {
    findMany: jest.fn(),
    createMany: jest.fn(),
  },
};

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma),
}));

// Mock env
jest.mock('@/lib/env', () => ({
  getLocalEnv: jest.fn(() => ({ JWT_SECRET: 'test-secret' })),
}));

// Mock auth
jest.mock('@/lib/authFromGateway', () => ({
  getAuthUserFromRequest: jest.fn(),
}));

import { GET } from '../[id]/export/route';
import { POST } from '../import/route';
import { getAuthUserFromRequest } from '@/lib/authFromGateway';

const mockAuth = { userId: '550e8400-e29b-41d4-a716-446655440000', email: 'test@example.com' };

describe('E02-U1: GET /api/projects/:id/export', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getAuthUserFromRequest as jest.Mock).mockReturnValue({ success: true, user: mockAuth });
  });

  it('should return 401 when not authenticated', async () => {
    (getAuthUserFromRequest as jest.Mock).mockReturnValue({ success: false, user: null });
    const request = new NextRequest('http://localhost:3000/api/projects/proj_123/export');
    const response = await GET(request, { params: Promise.resolve({ id: 'proj_123' }) });
    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe('PERMISSION_DENIED');
  });

  it('should export project as v1.0 JSON', async () => {
    mockPrisma.project.findUnique.mockResolvedValue({
      id: 'proj_123',
      name: 'Test Project',
      description: 'A test project',
    });
    mockPrisma.uINode.findMany.mockResolvedValue([
      { id: 'node1', name: 'Button', nodeType: 'component', projectId: 'proj_123' },
    ]);
    mockPrisma.businessDomain.findMany.mockResolvedValue([]);
    mockPrisma.flowData.findMany.mockResolvedValue([]);
    mockPrisma.page.findMany.mockResolvedValue([
      { id: 'page1', name: 'Home', content: '{}', projectId: 'proj_123' },
    ]);
    mockPrisma.requirement.findMany.mockResolvedValue([]);

    const request = new NextRequest('http://localhost:3000/api/projects/proj_123/export');
    const response = await GET(request, { params: Promise.resolve({ id: 'proj_123' }) });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.version).toBe('1.0');
    expect(data.project.name).toBe('Test Project');
    expect(data.project.description).toBe('A test project');
    expect(data.uiNodes).toHaveLength(1);
    expect(data.pages).toHaveLength(1);
    expect(data.exportedAt).toBeDefined();
  });

  it('should return 404 when project not found', async () => {
    mockPrisma.project.findUnique.mockResolvedValue(null);
    mockPrisma.uINode.findMany.mockResolvedValue([]);
    mockPrisma.businessDomain.findMany.mockResolvedValue([]);
    mockPrisma.flowData.findMany.mockResolvedValue([]);
    mockPrisma.page.findMany.mockResolvedValue([]);
    mockPrisma.requirement.findMany.mockResolvedValue([]);

    const request = new NextRequest('http://localhost:3000/api/projects/nonexistent/export');
    const response = await GET(request, { params: Promise.resolve({ id: 'nonexistent' }) });
    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toBe('PROJECT_NOT_FOUND');
  });

  it('should include all data in export', async () => {
    mockPrisma.project.findUnique.mockResolvedValue({
      id: 'proj_123',
      name: 'Test',
      description: null,
    });
    mockPrisma.uINode.findMany.mockResolvedValue([]);
    mockPrisma.businessDomain.findMany.mockResolvedValue([]);
    mockPrisma.flowData.findMany.mockResolvedValue([]);
    mockPrisma.page.findMany.mockResolvedValue([]);
    mockPrisma.requirement.findMany.mockResolvedValue([]);

    const request = new NextRequest('http://localhost:3000/api/projects/proj_123/export');
    const response = await GET(request, { params: Promise.resolve({ id: 'proj_123' }) });
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.businessDomains).toEqual([]);
    expect(data.flowData).toEqual([]);
    expect(data.requirements).toEqual([]);
  });
});

describe('E02-U2: POST /api/projects/import', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getAuthUserFromRequest as jest.Mock).mockReturnValue({ success: true, user: mockAuth });
  });

  it('should return 401 when not authenticated', async () => {
    (getAuthUserFromRequest as jest.Mock).mockReturnValue({ success: false, user: null });
    const body = JSON.stringify({
      version: '1.0',
      project: { name: 'Test', description: 'Test' },
    });
    const request = new NextRequest('http://localhost:3000/api/projects/import', {
      method: 'POST',
      body,
    });
    const response = await POST(request);
    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe('PERMISSION_DENIED');
  });

  it('should return 400 for invalid JSON body', async () => {
    const request = new NextRequest('http://localhost:3000/api/projects/import', {
      method: 'POST',
      body: '{invalid json}',
      headers: { 'content-type': 'application/json' },
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('INVALID_JSON');
  });

  it('should return 400 for invalid version', async () => {
    const body = JSON.stringify({
      version: '2.0',
      project: { name: 'Test' },
    });
    const request = new NextRequest('http://localhost:3000/api/projects/import', {
      method: 'POST',
      body,
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('INVALID_VERSION');
  });

  it('should return 400 for missing project name', async () => {
    const body = JSON.stringify({
      version: '1.0',
      project: { name: '' },
    });
    const request = new NextRequest('http://localhost:3000/api/projects/import', {
      method: 'POST',
      body,
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('INVALID_PROJECT_NAME');
  });

  it('should return 400 for project name too long', async () => {
    const body = JSON.stringify({
      version: '1.0',
      project: { name: 'a'.repeat(300) },
    });
    const request = new NextRequest('http://localhost:3000/api/projects/import', {
      method: 'POST',
      body,
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('INVALID_PROJECT_NAME');
  });

  it('should import valid v1.0 JSON successfully', async () => {
    mockPrisma.project.create.mockResolvedValue({
      id: 'new_proj_123',
      name: 'Imported Project',
      description: 'From export',
      userId: mockAuth.userId,
      status: 'draft',
    });
    mockPrisma.page.createMany.mockResolvedValue({ count: 1 });
    mockPrisma.uINode.createMany.mockResolvedValue({ count: 0 });
    mockPrisma.businessDomain.createMany.mockResolvedValue({ count: 0 });
    mockPrisma.flowData.createMany.mockResolvedValue({ count: 0 });
    mockPrisma.requirement.createMany.mockResolvedValue({ count: 0 });

    const body = JSON.stringify({
      version: '1.0',
      project: { name: 'Imported Project', description: 'From export' },
      pages: [{ id: 'page1', name: 'Home', content: '{}' }],
      uiNodes: [{ id: 'node1', name: 'Button', nodeType: 'component' }],
      businessDomains: [],
      flowData: [],
      requirements: [],
    });
    const request = new NextRequest('http://localhost:3000/api/projects/import', {
      method: 'POST',
      body,
    });
    const response = await POST(request);
    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.projectId).toBe('new_proj_123');
    expect(data.projectName).toBe('Imported Project');
    expect(data.importedAt).toBeDefined();
  });

  it('should import with only required fields (minimal payload)', async () => {
    mockPrisma.project.create.mockResolvedValue({
      id: 'new_proj_min',
      name: 'Minimal Project',
      description: null,
      userId: mockAuth.userId,
      status: 'draft',
    });
    mockPrisma.page.createMany.mockResolvedValue({ count: 0 });
    mockPrisma.uINode.createMany.mockResolvedValue({ count: 0 });
    mockPrisma.businessDomain.createMany.mockResolvedValue({ count: 0 });
    mockPrisma.flowData.createMany.mockResolvedValue({ count: 0 });
    mockPrisma.requirement.createMany.mockResolvedValue({ count: 0 });

    const body = JSON.stringify({
      version: '1.0',
      project: { name: 'Minimal Project' },
    });
    const request = new NextRequest('http://localhost:3000/api/projects/import', {
      method: 'POST',
      body,
    });
    const response = await POST(request);
    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.success).toBe(true);
  });

  it('should handle IMPORT_FAILED on DB error', async () => {
    mockPrisma.project.create.mockRejectedValue(new Error('DB connection failed'));

    const body = JSON.stringify({
      version: '1.0',
      project: { name: 'Test' },
    });
    const request = new NextRequest('http://localhost:3000/api/projects/import', {
      method: 'POST',
      body,
    });
    const response = await POST(request);
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe('IMPORT_FAILED');
  });

  it('should reject missing version field as INVALID_VERSION', async () => {
    const body = JSON.stringify({
      project: { name: 'Test' },
    });
    const request = new NextRequest('http://localhost:3000/api/projects/import', {
      method: 'POST',
      body,
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    // Missing version → INVALID_VERSION (version path triggers this code path)
    expect(data.error).toBe('INVALID_VERSION');
  });

  it('should reject invalid page id type', async () => {
    const body = JSON.stringify({
      version: '1.0',
      project: { name: 'Test' },
      pages: [{ id: 123 }],
    });
    const request = new NextRequest('http://localhost:3000/api/projects/import', {
      method: 'POST',
      body,
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('INVALID_JSON');
  });

  it('should import with all optional fields populated', async () => {
    mockPrisma.project.create.mockResolvedValue({
      id: 'full_proj',
      name: 'Full Project',
      description: 'Full description',
      userId: mockAuth.userId,
      status: 'draft',
    });
    mockPrisma.page.createMany.mockResolvedValue({ count: 1 });
    mockPrisma.uINode.createMany.mockResolvedValue({ count: 1 });
    mockPrisma.businessDomain.createMany.mockResolvedValue({ count: 1 });
    mockPrisma.flowData.createMany.mockResolvedValue({ count: 1 });
    mockPrisma.requirement.createMany.mockResolvedValue({ count: 1 });

    const body = JSON.stringify({
      version: '1.0',
      exportedAt: '2026-05-08T00:00:00.000Z',
      exportedBy: 'test-user',
      project: { name: 'Full Project', description: 'Full description' },
      uiNodes: [{
        id: 'node1', name: 'Button', nodeType: 'component',
        description: 'A button', linkedFlowNodeId: 'flow1',
        children: '[]', annotations: '[]',
        positionX: 100, positionY: 200, checked: false,
        priority: 'high', status: 'active',
      }],
      businessDomains: [{
        id: 'bd1', name: 'User Domain', description: 'User management',
        domainType: 'core', features: 'Auth, Profile',
        relationships: '[]',
      }],
      flowData: [{
        id: 'flow1', name: 'Main Flow',
        nodes: '[]', position: '{}', style: '{}',
      }],
      pages: [{
        id: 'page1', name: 'Home', content: '{"test":true}',
      }],
      requirements: [{
        id: 'req1', text: 'Must support import', status: 'done',
      }],
    });
    const request = new NextRequest('http://localhost:3000/api/projects/import', {
      method: 'POST',
      body,
    });
    const response = await POST(request);
    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.success).toBe(true);
  });
});
