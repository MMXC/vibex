import { NextRequest } from 'next/server';

// Mock the domain-model service
const mockGenerateClassDiagram = jest.fn();
const mockGetDiagramMetadata = jest.fn();

jest.mock('@/services/domain-model', () => ({
  generateClassDiagram: (...args: any[]) => mockGenerateClassDiagram(...args),
  getDiagramMetadata: (...args: any[]) => mockGetDiagramMetadata(...args),
}));

import { GET, POST } from './route';

describe('GET /api/v1/domain-model/[projectId]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return placeholder response', async () => {
    const request = new NextRequest('http://localhost:3000/api/v1/domain-model/proj123');
    const response = await GET(request, { params: Promise.resolve({ projectId: 'proj123' }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.projectId).toBe('proj123');
  });

  it('should parse query options', async () => {
    const request = new NextRequest('http://localhost:3000/api/v1/domain-model/proj123?showProperties=false');
    const response = await GET(request, { params: Promise.resolve({ projectId: 'proj123' }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.options.showProperties).toBe(false);
  });
});

describe('POST /api/v1/domain-model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 if entities is not an array', async () => {
    const request = new NextRequest('http://localhost:3000/api/v1/domain-model', {
      method: 'POST',
      body: JSON.stringify({ entities: 'not an array' }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('entities');
  });

  it('should generate diagram with entities', async () => {
    mockGenerateClassDiagram.mockReturnValue('classDiagram\n  User --> Order');
    mockGetDiagramMetadata.mockReturnValue({
      entityCount: 2,
      relationCount: 1,
      aggregateRootCount: 1,
      entityCountByType: { aggregateRoot: 1, entity: 1, valueObject: 0 },
    });

    const request = new NextRequest('http://localhost:3000/api/v1/domain-model', {
      method: 'POST',
      body: JSON.stringify({
        entities: [
          { name: 'User', type: 'aggregateRoot', properties: [] },
          { name: 'Order', type: 'entity', properties: [] },
        ],
      }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.diagram).toContain('classDiagram');
  });

  it('should handle errors', async () => {
    mockGenerateClassDiagram.mockImplementation(() => {
      throw new Error('Generation failed');
    });

    const request = new NextRequest('http://localhost:3000/api/v1/domain-model', {
      method: 'POST',
      body: JSON.stringify({
        entities: [{ name: 'User', type: 'aggregateRoot', properties: [] }],
      }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
  });
});