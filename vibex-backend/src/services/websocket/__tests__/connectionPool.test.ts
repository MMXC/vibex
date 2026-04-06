/**
 * ConnectionPool Tests — E2-S2: Connection Pool Tests
 * Tests coverage: add, remove, get, getByRoom, getByUser,
 * getSize, updateHeartbeat, broadcastToRoom, sendToUser,
 * pruneStaleConnections, stop
 */

import { ConnectionPool, WebSocketConnection } from '../connectionPool';

// Mock logger
jest.mock('@/lib/log-sanitizer', () => ({
  devLog: jest.fn(),
  safeError: jest.fn(),
}));

function makeConnection(overrides: Partial<WebSocketConnection> = {}): WebSocketConnection {
  return {
    id: Math.random().toString(36),
    userId: 'user1',
    roomId: 'room1',
    socket: { send: jest.fn(), close: jest.fn() },
    connectedAt: Date.now(),
    lastHeartbeat: Date.now(),
    status: 'connected',
    ...overrides,
  };
}

describe('ConnectionPool', () => {
  let pool: ConnectionPool;

  beforeEach(() => {
    pool = new ConnectionPool({ maxConnections: 3, disconnectTimeout: 60000 });
  });

  afterEach(() => {
    pool.stop();
  });

  describe('add()', () => {
    it('adds a connection and returns true', () => {
      const conn = makeConnection();
      expect(pool.add(conn)).toBe(true);
      expect(pool.getSize()).toBe(1);
    });

    it('returns false when pool is full', () => {
      pool.add(makeConnection({ id: '1' }));
      pool.add(makeConnection({ id: '2' }));
      pool.add(makeConnection({ id: '3' }));
      expect(pool.add(makeConnection({ id: '4' }))).toBe(false);
      expect(pool.getSize()).toBe(3);
    });

    it('tracks lastHeartbeat when adding', () => {
      const conn = makeConnection();
      pool.add(conn);
      const retrieved = pool.get(conn.id);
      expect(retrieved?.lastHeartbeat).toBeDefined();
    });
  });

  describe('remove()', () => {
    it('removes an existing connection', () => {
      const conn = makeConnection();
      pool.add(conn);
      expect(pool.remove(conn.id)).toBeDefined();
      expect(pool.getSize()).toBe(0);
    });

    it('returns undefined for non-existent connection', () => {
      expect(pool.remove('nonexistent')).toBeUndefined();
    });
  });

  describe('get()', () => {
    it('returns connection by id', () => {
      const conn = makeConnection();
      pool.add(conn);
      expect(pool.get(conn.id)).toBeDefined();
    });

    it('returns undefined for non-existent id', () => {
      expect(pool.get('nonexistent')).toBeUndefined();
    });
  });

  describe('getByRoom()', () => {
    it('returns connections in a room', () => {
      pool.add(makeConnection({ id: '1', roomId: 'room1' }));
      pool.add(makeConnection({ id: '2', roomId: 'room1' }));
      pool.add(makeConnection({ id: '3', roomId: 'room2' }));
      expect(pool.getByRoom('room1')).toHaveLength(2);
    });

    it('returns empty array for empty room', () => {
      expect(pool.getByRoom('nonexistent')).toHaveLength(0);
    });
  });

  describe('getByUser()', () => {
    it('returns connections for a user', () => {
      pool.add(makeConnection({ id: '1', userId: 'user1' }));
      pool.add(makeConnection({ id: '2', userId: 'user1' }));
      pool.add(makeConnection({ id: '3', userId: 'user2' }));
      expect(pool.getByUser('user1')).toHaveLength(2);
    });

    it('returns empty array for unknown user', () => {
      expect(pool.getByUser('unknown')).toHaveLength(0);
    });
  });

  describe('getSize()', () => {
    it('returns 0 for empty pool', () => {
      expect(pool.getSize()).toBe(0);
    });

    it('returns correct count', () => {
      pool.add(makeConnection({ id: '1' }));
      pool.add(makeConnection({ id: '2' }));
      expect(pool.getSize()).toBe(2);
    });
  });

  describe('updateHeartbeat()', () => {
    it('updates heartbeat for existing connection', () => {
      const conn = makeConnection();
      pool.add(conn);
      expect(pool.updateHeartbeat(conn.id)).toBe(true);
    });

    it('returns false for non-existent connection', () => {
      expect(pool.updateHeartbeat('nonexistent')).toBe(false);
    });
  });

  describe('broadcastToRoom()', () => {
    it('broadcasts to all connections in room', () => {
      const conn1 = makeConnection({ id: '1', roomId: 'room1' });
      const conn2 = makeConnection({ id: '2', roomId: 'room1' });
      pool.add(conn1);
      pool.add(conn2);
      const count = pool.broadcastToRoom('room1', { type: 'ping' });
      expect(count).toBe(2);
    });

    it('returns 0 for empty room', () => {
      expect(pool.broadcastToRoom('nonexistent', { type: 'ping' })).toBe(0);
    });
  });

  describe('sendToUser()', () => {
    it('sends message to all user connections', () => {
      const conn1 = makeConnection({ id: '1', userId: 'user1' });
      const conn2 = makeConnection({ id: '2', userId: 'user1' });
      pool.add(conn1);
      pool.add(conn2);
      const count = pool.sendToUser('user1', { type: 'notification' });
      expect(count).toBe(2);
    });

    it('returns 0 for unknown user', () => {
      expect(pool.sendToUser('unknown', { type: 'notification' })).toBe(0);
    });
  });

  describe('pruneStaleConnections()', () => {
    it('closes connections past disconnectTimeout', () => {
      // Note: add() resets lastHeartbeat to Date.now(), so we need to
      // add connections and then manually set old lastHeartbeat
      pool.add(makeConnection({ id: 'fresh', lastHeartbeat: Date.now() }));
      // Manually set stale connection's lastHeartbeat to old value
      // (using any to access private property for testing)
      const conn = (pool as any).connections.get('fresh');
      const oldTime = Date.now() - 120000;
      conn.lastHeartbeat = oldTime;
      // Now prune should disconnect the stale connection
      pool.pruneStaleConnections();
      expect(conn.status).toBe('disconnecting');
    });

    it('keeps connections within timeout active', () => {
      pool.add(makeConnection({ id: '1' }));
      pool.add(makeConnection({ id: '2' }));
      pool.pruneStaleConnections();
      expect(pool.getSize()).toBe(2);
    });
  });

  describe('stop()', () => {
    it('closes all connections and clears pool', () => {
      pool.add(makeConnection({ id: '1' }));
      pool.add(makeConnection({ id: '2' }));
      pool.stop();
      expect(pool.getSize()).toBe(0);
    });
  });
});
