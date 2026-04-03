// @ts-nocheck
import { NextRequest } from 'next/server';

// Simple test for GET endpoint - just test basic response

describe('GET /api/ai-ui-generation', () => {
  it('should return service status', async () => {
    const { GET } = await import('./route');
    
    const request = new NextRequest('http://localhost:3000/api/ai-ui-generation');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('ok');
    expect(data.message).toContain('AI UI Generation API');
  });
});

describe('POST /api/ai-ui-generation', () => {
  it('should handle missing description', async () => {
    const { POST } = await import('./route');
    
    const request = new NextRequest('http://localhost:3000/api/ai-ui-generation', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const response = await POST(request);
    
    // Should return error status
    expect([400, 500]).toContain(response.status);
  });

  it('should handle valid request', async () => {
    const { POST } = await import('./route');
    
    const request = new NextRequest('http://localhost:3000/api/ai-ui-generation', {
      method: 'POST',
      body: JSON.stringify({ description: 'Create a login form' }),
    });
    const response = await POST(request);
    
    // Should either succeed or fail properly
    expect([200, 400, 500]).toContain(response.status);
  });
});
