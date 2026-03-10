/**
 * WebSocket Message Router
 * WebSocket 消息路由服务
 * 
 * 功能:
 * - 消息解析
 * - 消息路由
 * - 消息队列
 */

import { getConnectionPool, WebSocketConnection } from './connectionPool';

export type MessageType = 
  | 'join'
  | 'leave'
  | 'cursor'
  | 'edit'
  | 'chat'
  | 'ping'
  | 'pong';

export interface WSMessage {
  type: MessageType;
  payload: any;
  roomId: string;
  userId: string;
  timestamp?: number;
}

export interface WSResponse {
  type: string;
  payload: any;
  timestamp: number;
}

export class MessageRouter {
  private pendingMessages: Map<string, WSMessage[]> = new Map();

  /**
   * 处理 incoming 消息
   */
  async handleMessage(connectionId: string, rawMessage: string): Promise<WSResponse | null> {
    try {
      const message: WSMessage = JSON.parse(rawMessage);
      
      // Add timestamp if not present
      if (!message.timestamp) {
        message.timestamp = Date.now();
      }

      // Route message based on type
      switch (message.type) {
        case 'join':
          return this.handleJoin(connectionId, message);
        case 'leave':
          return this.handleLeave(connectionId, message);
        case 'cursor':
          return this.handleCursor(connectionId, message);
        case 'edit':
          return this.handleEdit(connectionId, message);
        case 'chat':
          return this.handleChat(connectionId, message);
        case 'ping':
          return this.handlePing(connectionId, message);
        default:
          return this.createResponse('error', { error: 'Unknown message type' });
      }
    } catch (error) {
      console.error('Failed to handle message:', error);
      return this.createResponse('error', { error: 'Invalid message format' });
    }
  }

  /**
   * 处理加入房间
   */
  private async handleJoin(connectionId: string, message: WSMessage): Promise<WSResponse> {
    const pool = getConnectionPool();
    const connection = pool.get(connectionId);

    if (!connection) {
      return this.createResponse('error', { error: 'Connection not found' });
    }

    // Update connection's room
    connection.roomId = message.payload.roomId;

    // Broadcast to room
    const roomConnections = pool.getByRoom(message.payload.roomId);
    for (const conn of roomConnections) {
      if (conn.id !== connectionId) {
        pool.sendToUser(conn.userId, this.createResponse('user_joined', {
          userId: message.userId,
          userName: message.payload.userName,
          roomId: message.payload.roomId,
        }));
      }
    }

    // Confirm join
    return this.createResponse('joined', {
      roomId: message.payload.roomId,
      userId: message.userId,
    });
  }

  /**
   * 处理离开房间
   */
  private async handleLeave(connectionId: string, message: WSMessage): Promise<WSResponse> {
    const pool = getConnectionPool();
    const connection = pool.get(connectionId);

    if (connection) {
      // Broadcast to room
      pool.broadcastToRoom(connection.roomId, this.createResponse('user_left', {
        userId: message.userId,
        roomId: connection.roomId,
      }));
    }

    return this.createResponse('left', { roomId: message.payload.roomId });
  }

  /**
   * 处理光标移动
   */
  private handleCursor(connectionId: string, message: WSMessage): WSResponse {
    const pool = getConnectionPool();
    const connection = pool.get(connectionId);

    if (!connection) {
      return this.createResponse('error', { error: 'Connection not found' });
    }

    // Broadcast cursor position to room
    pool.broadcastToRoom(connection.roomId, this.createResponse('cursor_update', {
      userId: message.userId,
      x: message.payload.x,
      y: message.payload.y,
      elementId: message.payload.elementId,
    }));

    return this.createResponse('cursor_ack', { received: true });
  }

  /**
   * 处理编辑内容
   */
  private handleEdit(connectionId: string, message: WSMessage): WSResponse {
    const pool = getConnectionPool();
    const connection = pool.get(connectionId);

    if (!connection) {
      return this.createResponse('error', { error: 'Connection not found' });
    }

    // Broadcast edit to room
    pool.broadcastToRoom(connection.roomId, this.createResponse('content_sync', {
      userId: message.userId,
      operation: message.payload.operation,
      path: message.payload.path,
      data: message.payload.data,
    }));

    return this.createResponse('edit_ack', { received: true });
  }

  /**
   * 处理聊天消息
   */
  private handleChat(connectionId: string, message: WSMessage): WSResponse {
    const pool = getConnectionPool();
    const connection = pool.get(connectionId);

    if (!connection) {
      return this.createResponse('error', { error: 'Connection not found' });
    }

    // Broadcast chat message to room
    const chatMessage = this.createResponse('chat_message', {
      userId: message.userId,
      userName: message.payload.userName,
      content: message.payload.content,
      timestamp: message.timestamp,
    });

    pool.broadcastToRoom(connection.roomId, chatMessage);

    return this.createResponse('chat_ack', { received: true });
  }

  /**
   * 处理 ping
   */
  private handlePing(connectionId: string, message: WSMessage): WSResponse {
    const pool = getConnectionPool();
    pool.updateHeartbeat(connectionId);

    return this.createResponse('pong', { timestamp: Date.now() });
  }

  /**
   * 创建响应消息
   */
  private createResponse(type: string, payload: any): WSResponse {
    return {
      type,
      payload,
      timestamp: Date.now(),
    };
  }

  /**
   * 队列消息 (离线用户)
   */
  queueMessage(userId: string, message: WSMessage): void {
    const key = `offline:${userId}`;
    const queue = this.pendingMessages.get(key) || [];
    queue.push(message);
    
    // Keep only last 100 messages
    if (queue.length > 100) {
      queue.shift();
    }
    
    this.pendingMessages.set(key, queue);
  }

  /**
   * 获取离线消息
   */
  getOfflineMessages(userId: string): WSMessage[] {
    const key = `offline:${userId}`;
    const messages = this.pendingMessages.get(key) || [];
    this.pendingMessages.delete(key);
    return messages;
  }
}

// 全局消息路由器实例
let globalMessageRouter: MessageRouter | null = null;

export function getMessageRouter(): MessageRouter {
  if (!globalMessageRouter) {
    globalMessageRouter = new MessageRouter();
  }
  return globalMessageRouter;
}

export default MessageRouter;
