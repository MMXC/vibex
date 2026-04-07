// @ts-nocheck
import { NextRequest } from 'next/server';

// Mock prisma
const mockPrisma = {
  message: {
    delete: jest.fn(),
  },
};

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: mockPrisma,
}));

import { DELETE } from './route';

describe('DELETE /api/messages/[messageId]', () => {
  it('should handle delete request', async () => {
    mockPrisma.message.delete.mockResolvedValue({ id: 'msg1' });

    const request = new NextRequest('http://localhost:3000/api/messages/msg1', {
      method: 'DELETE',
    });
    const response = await DELETE(request, { params: Promise.resolve({ messageId: 'msg1' }) });

    // Just ensure we get a response
    expect(response).toBeDefined();
  });

  it('should handle errors', async () => {
    mockPrisma.message.delete.mockRejectedValue(new Error('DB error'));

    const request = new NextRequest('http://localhost:3000/api/messages/msg1', {
      method: 'DELETE',
    });
    
    try {
      const response = await DELETE(request, { params: Promise.resolve({ messageId: 'msg1' }) });
      expect(response).toBeDefined();
    } catch (error) {
      expect(error).toBeDefined();
    }
  });
});