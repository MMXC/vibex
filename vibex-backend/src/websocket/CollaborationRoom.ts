/**
 * WebSocket Collaboration Room - Durable Object
 * 
 * 实现实时协作功能：
 * - WebSocket 连接管理
 * - 在线状态同步 (Presence)
 * - 协作锁 (Collaboration Lock)
 * - 消息广播
 * 
 * 基于架构设计文档: docs/vibex-phase2-core-20260316/architecture.md
 */

import { DurableObject } from 'cloudflare:workers';

// ==================== Types ====================

export interface Connection {
  id: string;
  userId: string;
  userName: string;
  projectId: string;
  webSocket: WebSocket;
}

export interface WSMessage<T = unknown> {
  type: string;
  payload: T;
  timestamp: number;
}

export interface PresenceUpdate {
  userId: string;
  userName: string;
  status: 'online' | 'offline' | 'editing';
  projectId: string;
}

export interface LockRequest {
  resourceId: string;
  resourceType: 'project' | 'flow' | 'page';
}

export interface LockResult {
  success: boolean;
  lockedBy?: {
    userId: string;
    userName: string;
  };
  expiresAt?: Date;
}

export interface BroadcastMessage {
  content: string;
  senderId: string;
  senderName: string;
  projectId: string;
}

// ==================== Collaboration Room ====================

export class CollaborationRoom extends DurableObject {
  private connections: Map<string, Connection> = new Map();
  private locks: Map<string, { userId: string; userName: string; expiresAt: number }> = new Map();

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    
    if (url.pathname === '/ws') {
      return this.handleWebSocket(request);
    }
    
    return new Response('Not found', { status: 404 });
  }

  private async handleWebSocket(request: Request): Promise<Response> {
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair) as WebSocket[];
    
    server.accept();
    
    const userId = request.headers.get('x-user-id') || 'anonymous';
    const userName = request.headers.get('x-user-name') || 'Anonymous';
    const projectId = request.headers.get('x-project-id') || '';
    
    const connectionId = crypto.randomUUID();
    const connection: Connection = {
      id: connectionId,
      userId,
      userName,
      projectId,
      webSocket: server,
    };
    
    this.connections.set(connectionId, connection);
    
    // 广播上线状态
    this.broadcast({
      type: 'presence:update',
      payload: {
        userId,
        userName,
        status: 'online',
        projectId,
      },
      timestamp: Date.now(),
    }, connectionId);
    
    // 设置消息处理
    server.addEventListener('message', (event) => {
      try {
        const message = JSON.parse(event.data as string) as WSMessage;
        this.handleMessage(connectionId, message);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    });
    
    // 设置关闭处理
    server.addEventListener('close', () => {
      this.connections.delete(connectionId);
      this.broadcast({
        type: 'presence:update',
        payload: {
          userId,
          userName,
          status: 'offline',
          projectId,
        },
        timestamp: Date.now(),
      }, connectionId);
    });
    
    // 发送连接成功消息
    server.send(JSON.stringify({
      type: 'connection:established',
      payload: {
        connectionId,
        userId,
        userName,
      },
      timestamp: Date.now(),
    }));
    
    return new Response(null, { status: 101, webSocket: client });
  }

  private handleMessage(connectionId: string, message: WSMessage): void {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    switch (message.type) {
      case 'lock:acquire':
        this.acquireLock(connection, message.payload as LockRequest);
        break;
      case 'lock:release':
        this.releaseLock(connection, message.payload as { resourceId: string });
        break;
      case 'broadcast:message':
        this.broadcast({
          ...message,
          payload: {
            ...message.payload as object,
            senderId: connection.userId,
            senderName: connection.userName,
          },
        }, connectionId);
        break;
      case 'presence:update':
        this.updatePresence(connection, message.payload as Partial<PresenceUpdate>);
        break;
      default:
        console.log('Unknown message type:', message.type);
    }
  }

  private acquireLock(connection: Connection, payload: LockRequest): void {
    const existingLock = this.locks.get(payload.resourceId);
    const now = Date.now();
    
    if (existingLock && existingLock.expiresAt > now) {
      connection.webSocket.send(JSON.stringify({
        type: 'lock:result',
        payload: {
          success: false,
          lockedBy: {
            userId: existingLock.userId,
            userName: existingLock.userName,
          },
        },
        timestamp: now,
      }));
      return;
    }
    
    // 获取锁
    this.locks.set(payload.resourceId, {
      userId: connection.userId,
      userName: connection.userName,
      expiresAt: now + 5 * 60 * 1000, // 5 分钟过期
    });
    
    connection.webSocket.send(JSON.stringify({
      type: 'lock:result',
      payload: {
        success: true,
        expiresAt: new Date(now + 5 * 60 * 1000),
      },
      timestamp: now,
    }));
    
    // 广播锁状态变化
    this.broadcast({
      type: 'lock:acquired',
      payload: {
        resourceId: payload.resourceId,
        resourceType: payload.resourceType,
        userId: connection.userId,
        userName: connection.userName,
      },
      timestamp: now,
    });
  }

  private releaseLock(connection: Connection, payload: { resourceId: string }): void {
    const lock = this.locks.get(payload.resourceId);
    const now = Date.now();
    
    if (lock?.userId === connection.userId) {
      this.locks.delete(payload.resourceId);
      
      connection.webSocket.send(JSON.stringify({
        type: 'lock:released',
        payload: {
          resourceId: payload.resourceId,
        },
        timestamp: now,
      }));
      
      // 广播锁释放
      this.broadcast({
        type: 'lock:released',
        payload: {
          resourceId: payload.resourceId,
          releasedBy: connection.userId,
        },
        timestamp: now,
      });
    }
  }

  private updatePresence(connection: Connection, payload: Partial<PresenceUpdate>): void {
    this.broadcast({
      type: 'presence:update',
      payload: {
        userId: connection.userId,
        userName: connection.userName,
        status: payload.status || 'online',
        projectId: connection.projectId,
      },
      timestamp: Date.now(),
    }, connection.id);
  }

  private broadcast(message: WSMessage, excludeId?: string): void {
    const messageStr = JSON.stringify(message);
    
    for (const [id, conn] of this.connections) {
      if (id !== excludeId) {
        try {
          conn.webSocket.send(messageStr);
        } catch (error) {
          console.error('Failed to send message to connection:', id, error);
        }
      }
    }
  }

  // 获取房间内的所有连接
  getConnections(): Connection[] {
    return Array.from(this.connections.values());
  }

  // 获取在线用户列表
  getOnlineUsers(): Array<{ userId: string; userName: string; projectId: string }> {
    const users = new Map<string, { userId: string; userName: string; projectId: string }>();
    
    for (const conn of this.connections.values()) {
      users.set(conn.userId, {
        userId: conn.userId,
        userName: conn.userName,
        projectId: conn.projectId,
      });
    }
    
    return Array.from(users.values());
  }

  // 获取当前的锁状态
  getLocks(): Array<{ resourceId: string; userId: string; userName: string; expiresAt: number }> {
    return Array.from(this.locks.entries()).map(([resourceId, lock]) => ({
      resourceId,
      ...lock,
    }));
  }
}

// ==================== Durable Object Stub Factory ====================

/**
 * 获取指定项目的协作房间 Durable Object stub
 */
export function getCollaborationRoomStub(env: DurableObjectNamespace, projectId: string): CollaborationRoom {
  const id = env.idFromName(projectId);
  return env.get(id) as unknown as CollaborationRoom;
}
