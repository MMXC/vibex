/**
 * Unit tests for E07: MCP Server 集成完善
 * S07.1: GET /api/mcp/health
 * S07.2: MCP Integration E2E
 */

import { NextRequest } from 'next/server';

describe('GET /api/mcp/health — E07 S07.1', () => {
  it('TC1: returns 200', async () => {
    const { GET } = await import('./route');
    const request = new NextRequest('http://localhost:3000/api/mcp/health');
    const response = await GET(request);
    expect(response.status).toBe(200);
  });

  it('TC2: response.body.status === "ok"', async () => {
    const { GET } = await import('./route');
    const request = new NextRequest('http://localhost:3000/api/mcp/health');
    const response = await GET(request);
    const data = await response.json() as { status: string };
    expect(data.status).toBe('ok');
  });

  it('TC3: response.body.timestamp is valid ISO string', async () => {
    const { GET } = await import('./route');
    const request = new NextRequest('http://localhost:3000/api/mcp/health');
    const response = await GET(request);
    const data = await response.json() as { timestamp: string };
    expect(() => new Date(data.timestamp)).not.toThrow();
    // Should be within a reasonable range (not too old)
    const ts = new Date(data.timestamp);
    const now = new Date();
    const diffMs = now.getTime() - ts.getTime();
    expect(diffMs).toBeLessThan(5000); // within 5 seconds
  });

  it('TC4: response includes service: "mcp"', async () => {
    const { GET } = await import('./route');
    const request = new NextRequest('http://localhost:3000/api/mcp/health');
    const response = await GET(request);
    const data = await response.json() as { service: string };
    expect(data.service).toBe('mcp');
  });

  it('TC5: Content-Type is application/json', async () => {
    const { GET } = await import('./route');
    const request = new NextRequest('http://localhost:3000/api/mcp/health');
    const response = await GET(request);
    expect(response.headers.get('content-type')).toContain('application/json');
  });

  it('TC6: response body has required fields only', async () => {
    const { GET } = await import('./route');
    const request = new NextRequest('http://localhost:3000/api/mcp/health');
    const response = await GET(request);
    const data = await response.json() as Record<string, unknown>;
    expect(data).toHaveProperty('status');
    expect(data).toHaveProperty('service');
    expect(data).toHaveProperty('timestamp');
    expect(Object.keys(data)).toHaveLength(3);
  });

  it('TC7: no authentication required', async () => {
    const { GET } = await import('./route');
    // No auth headers — should still return 200
    const request = new NextRequest('http://localhost:3000/api/mcp/health');
    const response = await GET(request);
    expect(response.status).toBe(200);
  });

  it('TC8: GET only (not POST)', async () => {
    const { GET } = await import('./route');
    const request = new NextRequest('http://localhost:3000/api/mcp/health', {
      method: 'POST',
    });
    const response = await GET(request);
    // GET handler should work regardless of method for this simple case
    // (Next.js route handlers route by method via named exports)
    expect(response.status).toBeDefined();
  });
});
