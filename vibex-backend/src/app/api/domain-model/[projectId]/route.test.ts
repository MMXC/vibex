import { NextRequest } from 'next/server';

// Mock the domain-model service
const mockGenerateClassDiagram = jest.fn();
const mockGetDiagramMetadata = jest.fn();

jest.mock('@/services/domain-model', () => ({
  generateClassDiagram: (...args: any[]) => mockGenerateClassDiagram(...args),
  getDiagramMetadata: (...args: any[]) => mockGetDiagramMetadata(...args),
  ClassDiagramOptions: {},
}));

import { GET, POST } from './route';

describe('GET /api/domain-model/[projectId]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return placeholder response for GET request', async () => {
    const request = new NextRequest('http://localhost:3000/api/domain-model/proj123');
    const response = await GET(request, { params: Promise.resolve({ projectId: 'proj123' }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.projectId).toBe('proj123');
    expect(data.data.message).toBe('Use POST to generate diagram with entities');
  });

  it('should parse query options correctly', async () => {
    const request = new NextRequest('http://localhost:3000/api/domain-model/proj123?showProperties=false&showRelations=false&title=TestDiagram');
    const response = await GET(request, { params: Promise.resolve({ projectId: 'proj123' }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.options.showProperties).toBe(false);
    expect(data.data.options.showRelations).toBe(false);
    expect(data.data.options.title).toBe('TestDiagram');
  });
});

describe('POST /api/domain-model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 if entities is not an array', async () => {
    const request = new NextRequest('http://localhost:3000/api/domain-model', {
      method: 'POST',
      body: JSON.stringify({ entities: 'not an array' }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('entities');
  });

  it('should return 400 if entities is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/domain-model', {
      method: 'POST',
      body: JSON.stringify({ relations: [] }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('entities');
  });

  it('should generate diagram successfully with entities', async () => {
    mockGenerateClassDiagram.mockReturnValue('classDiagram\n  User "1" --> "*" Order');
    mockGetDiagramMetadata.mockReturnValue({
      entityCount: 2,
      relationCount: 1,
      aggregateRootCount: 1,
      entityCountByType: {
        aggregateRoot: 1,
        entity: 1,
        valueObject: 0,
      },
    });

    const request = new NextRequest('http://localhost:3000/api/domain-model', {
      method: 'POST',
      body: JSON.stringify({
        entities: [
          { name: 'User', type: 'aggregateRoot', properties: [] },
          { name: 'Order', type: 'entity', properties: [] },
        ],
        relations: [
          { source: 'User', target: 'Order', type: 'one-to-many' },
        ],
      }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.diagram).toContain('classDiagram');
    expect(data.data.metadata.entityCount).toBe(2);
  });

  it('should handle empty entities array', async () => {
    mockGenerateClassDiagram.mockReturnValue('');
    mockGetDiagramMetadata.mockReturnValue({
      entityCount: 0,
      relationCount: 0,
      aggregateRootCount: 0,
      entityCountByType: {
        aggregateRoot: 0,
        entity: 0,
        valueObject: 0,
      },
    });

    const request = new NextRequest('http://localhost:3000/api/domain-model', {
      method: 'POST',
      body: JSON.stringify({ entities: [] }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.metadata.entityCount).toBe(0);
  });

  it('should handle errors during generation', async () => {
    mockGenerateClassDiagram.mockImplementation(() => {
      throw new Error('Generation failed');
    });

    const request = new NextRequest('http://localhost:3000/api/domain-model', {
      method: 'POST',
      body: JSON.stringify({
        entities: [{ name: 'User', type: 'aggregateRoot', properties: [] }],
      }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Failed');
  });
});
