/**
 * WebSocket Connection Pool Service
 * WebSocket 连接池管理服务
 * 
 * 功能:
 * - 连接建立与认证
 * - 连接池管理
 * - 心跳保活
 * - 断线检测
 */

import { Context, Next } from 'hono';
import { devLog, safeError } from '@/lib/log-sanitizer';

export interface WebSocketConnection {
  id: string;
  userId: string;
  roomId: string;
  socket: any; // WebSocket
  connectedAt: number;
  lastHeartbeat: number;
  status: 'connecting' | 'connected' | 'disconnecting' | 'disconnected';
}

export interface ConnectionPoolConfig {
  maxConnections: number;
  heartbeatInterval: number; // ms
  disconnectTimeout: number; // ms
  maxReconnectAttempts: number;
}

const DEFAULT_CONFIG: ConnectionPoolConfig = {
  maxConnections: 100,
  heartbeatInterval: 30000, // 30s
  disconnectTimeout: 300000, // 5min
  maxReconnectAttempts: 5,
};

// E3-S1: Circuit breaker constants
const CB_THRESHOLD = 5;    // failures before circuit opens
const CB_RESET_MS = 60000; // 1min before attempting reset

export class ConnectionPool {
  private connections: Map<string, WebSocketConnection> = new Map();
  private config: ConnectionPoolConfig;
  private failureCount = 0;
  private lastFailureAt = 0;

  constructor(config: Partial<ConnectionPoolConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    // Workers 环境中禁止 setInterval，改用被动清理
  }

  /**
   * 添加连接
   */
  add(connection: WebSocketConnection): boolean {
    // E3-S1: Circuit breaker - reject if too many recent failures
    if (this.isCircuitOpen()) {
      safeError('ConnectionPool: circuit breaker open, rejecting connection');
      return false;
    }

    if (this.connections.size >= this.config.maxConnections) {
      safeError(`Connection pool full (${this.config.maxConnections} connections)`);
      return false;
    }

    this.connections.set(connection.id, {
      ...connection,
      status: 'connected',
      connectedAt: Date.now(),
      lastHeartbeat: Date.now(),
    });

    // 被动清理过期连接
    this.pruneStaleConnections();

    devLog('ConnectionPool: connection added');
    return true;
  }

  /**
   * 移除连接
   */
  remove(connectionId: string): WebSocketConnection | undefined {
    const connection = this.connections.get(connectionId);
    if (connection) {
      this.connections.delete(connectionId);
      devLog('ConnectionPool: connection removed');
    }
    return connection;
  }

  /**
   * 获取连接
   */
  get(connectionId: string): WebSocketConnection | undefined {
    return this.connections.get(connectionId);
  }

  /**
   * 获取房间内所有连接
   */
  getByRoom(roomId: string): WebSocketConnection[] {
    return Array.from(this.connections.values()).filter(
      (conn) => conn.roomId === roomId
    );
  }

  /**
   * 获取用户连接
   */
  getByUser(userId: string): WebSocketConnection[] {
    return Array.from(this.connections.values()).filter(
      (conn) => conn.userId === userId
    );
  }

  /**
   * 获取所有连接数
   */
  getSize(): number {
    return this.connections.size;
  }

  /**
   * 更新心跳时间
   */
  updateHeartbeat(connectionId: string): boolean {
    const connection = this.connections.get(connectionId);
    if (connection) {
      connection.lastHeartbeat = Date.now();
      // 被动清理：顺便检查其他过期连接
      this.pruneStaleConnections();
      return true;
    }
    return false;
  }

  /**
   * 广播消息到房间
   */
  broadcastToRoom(roomId: string, message: any): number {
    const roomConnections = this.getByRoom(roomId);
    let sent = 0;

    for (const conn of roomConnections) {
      try {
        if (conn.socket && conn.status === 'connected') {
          conn.socket.send(JSON.stringify(message));
          sent++;
        }
      } catch (error) {
        safeError(`Failed to send to connection ${conn.id}:`, error);
      }
    }

    return sent;
  }

  /**
   * 发送消息给用户
   */
  sendToUser(userId: string, message: any): number {
    const userConnections = this.getByUser(userId);
    let sent = 0;

    for (const conn of userConnections) {
      try {
        if (conn.socket && conn.status === 'connected') {
          conn.socket.send(JSON.stringify(message));
          sent++;
        }
      } catch (error) {
        safeError(`Failed to send to user ${userId}:`, error);
      }
    }

    return sent;
  }

  /**
   * 被动清理过期连接（Workers 兼容，无 setInterval）
   * 在 add() / updateHeartbeat() 时调用
   */
  pruneStaleConnections(): void {
    const now = Date.now();
    const timeout = this.config.disconnectTimeout;

    for (const [id, conn] of this.connections) {
      const timeSinceHeartbeat = now - conn.lastHeartbeat;

      if (timeSinceHeartbeat > timeout) {
        devLog('ConnectionPool: stale connection pruned');
        this.handleDisconnect(id);
      }
    }
  }

  /**
   * 处理断线
   */
  private handleDisconnect(connectionId: string): void {
    const conn = this.connections.get(connectionId);
    if (!conn) return;

    conn.status = 'disconnecting';

    try {
      if (conn.socket && conn.socket.close) {
        conn.socket.close(1000, 'Heartbeat timeout');
      }
    } catch (error) {
      safeError(`Error closing connection ${connectionId}:`, error);
    }

    this.remove(connectionId);
  }

  /**
   * E3-S1: Circuit breaker check
   * Returns true if circuit is open (too many recent failures)
   */
  private isCircuitOpen(): boolean {
    if (this.failureCount === 0) return false;
    const now = Date.now();
    // If enough time has passed, reset the circuit
    if (now - this.lastFailureAt > CB_RESET_MS) {
      this.failureCount = 0;
      this.lastFailureAt = 0;
      return false;
    }
    return this.failureCount >= CB_THRESHOLD;
  }

  /**
   * E3-S1: Record a connection failure for circuit breaker
   */
  recordFailure(): void {
    this.failureCount++;
    this.lastFailureAt = Date.now();
  }

  /**
   * 停止连接池
   */
  stop(): void {
    // Close all connections
    for (const [id, conn] of this.connections) {
      try {
        if (conn.socket && conn.socket.close) {
          conn.socket.close(1000, 'Server shutting down');
        }
      } catch (error) {
        safeError(`Error closing connection ${id}:`, error);
      }
    }

    this.connections.clear();
    devLog('Connection pool stopped');
  }
}

// 全局连接池实例
let globalConnectionPool: ConnectionPool | null = null;

export function getConnectionPool(): ConnectionPool {
  if (!globalConnectionPool) {
    globalConnectionPool = new ConnectionPool();
  }
  return globalConnectionPool;
}

export function createConnectionPool(config?: Partial<ConnectionPoolConfig>): ConnectionPool {
  globalConnectionPool = new ConnectionPool(config);
  return globalConnectionPool;
}

export default ConnectionPool;
