/**
 * Domain Entity API Tests - Real Implementation Tests
 * Tests the actual API implementation by mocking the httpClient
 */

import { domainEntityApi } from '@/services/api/modules/domain-entity';
import { httpClient } from '@/services/api/client';
import { cache } from '@/services/api/cache';

// Mock dependencies
vi.mock('@/services/api/client', () => ({
  httpClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('@/services/api/cache', () => ({
  cache: {
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
  },
  getCacheKey: vi.fn((...args) => args.join(':')),
}));

const mockHttpClient = httpClient as any<typeof httpClient>;
const mockCache = cache as any<typeof cache>;

describe('DomainEntityApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(global.navigator, 'onLine', {
      value: true,
      writable: true,
    });
  });

  describe('getDomainEntities', () => {
    it('should fetch domain entities from API', async () => {
      const mockEntities = [
        { id: 'entity-1', name: 'Entity 1', type: 'domain', requirementId: 'req-1' },
      ];
      mockHttpClient.get.mockResolvedValue({ domainEntities: mockEntities });
      mockCache.get.mockReturnValue(undefined);

      const result = await domainEntityApi.getDomainEntities('req-1');

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/domain-entities?requirementId=req-1'
      );
      expect(result).toEqual(mockEntities);
      expect(mockCache.set).toHaveBeenCalled();
    });

    it('should return cached entities when offline', async () => {
      const cachedEntities = [{ id: 'entity-1', name: 'Cached', type: 'domain', requirementId: 'req-1' }];
      
      Object.defineProperty(global.navigator, 'onLine', { value: false });
      mockCache.get.mockReturnValue(cachedEntities);

      const result = await domainEntityApi.getDomainEntities('req-1');

      expect(result).toEqual(cachedEntities);
      expect(mockHttpClient.get).not.toHaveBeenCalled();
    });
  });

  describe('getDomainEntity', () => {
    it('should fetch single domain entity from API', async () => {
      const mockEntity = { id: 'entity-1', name: 'Entity 1', type: 'domain', requirementId: 'req-1' };
      mockHttpClient.get.mockResolvedValue({ domain: mockEntity });
      mockCache.get.mockReturnValue(undefined);

      const result = await domainEntityApi.getDomainEntity('entity-1');

      expect(mockHttpClient.get).toHaveBeenCalledWith('/domains/entity-1');
      expect(result).toEqual(mockEntity);
    });
  });

  describe('createDomainEntity', () => {
    it('should create domain entity via API', async () => {
      const newEntity = { name: 'New Entity', type: 'domain', requirementId: 'req-1' };
      const createdEntity = { id: 'entity-1', ...newEntity, createdAt: '2026-01-01' };
      mockHttpClient.post.mockResolvedValue({ domain: createdEntity });

      const result = await domainEntityApi.createDomainEntity(newEntity);

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/requirements/req-1/domains',
        newEntity
      );
      expect(result).toEqual(createdEntity);
      expect(mockCache.remove).toHaveBeenCalled();
    });
  });

  describe('updateDomainEntity', () => {
    it('should update domain entity via API', async () => {
      const updates = { name: 'Updated Entity' };
      const updatedEntity = { id: 'entity-1', name: 'Updated Entity', type: 'domain', requirementId: 'req-1' };
      mockHttpClient.put.mockResolvedValue({ domain: updatedEntity });

      const result = await domainEntityApi.updateDomainEntity('entity-1', updates);

      expect(mockHttpClient.put).toHaveBeenCalledWith('/domains/entity-1', updates);
      expect(result).toEqual(updatedEntity);
    });

    it('should clear cache when requirementId provided', async () => {
      const updates = { name: 'Updated', requirementId: 'req-1' };
      const updatedEntity = { id: 'entity-1', name: 'Updated', type: 'domain', requirementId: 'req-1' };
      mockHttpClient.put.mockResolvedValue({ domain: updatedEntity });

      await domainEntityApi.updateDomainEntity('entity-1', updates);

      expect(mockCache.remove).toHaveBeenCalled();
    });
  });

  describe('deleteDomainEntity', () => {
    it('should delete domain entity via API', async () => {
      mockHttpClient.delete.mockResolvedValue({ success: true });

      const result = await domainEntityApi.deleteDomainEntity('entity-1', 'req-1');

      expect(mockHttpClient.delete).toHaveBeenCalledWith('/domains/entity-1');
      expect(result).toEqual({ success: true });
      expect(mockCache.remove).toHaveBeenCalled();
    });
  });
});