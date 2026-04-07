/**
 * Message Router
 * 消息路由、广播、持久化
 */
// @ts-nocheck


export type MessageType = 
  | 'cursor'      // 光标位置
  | 'selection'   // 选中文本
  | 'chat'        // 聊天消息
  | 'notification' // 系统通知
  | 'sync'        // 同步消息
  | 'presence'    // 在线状态
  | 'room';       // 房间消息

export interface BaseMessage {
  id: string;
  type: MessageType;
  roomId: string;
  senderId: string;
  timestamp: number;
  payload: unknown;
}

export interface CursorMessage extends BaseMessage {
  type: 'cursor';
  payload: {
    x: number;
    y: number;
    element?: string;
  };
}

export interface ChatMessage extends BaseMessage {
  type: 'chat';
  payload: {
    content: string;
    mentions?: string[];
    replyTo?: string;
  };
}

export interface NotificationMessage extends BaseMessage {
  type: 'notification';
  payload: {
    title: string;
    body: string;
    level: 'info' | 'success' | 'warning' | 'error';
  };
}

export type WebSocketMessage = CursorMessage | ChatMessage | NotificationMessage | BaseMessage;

/**
 * Message Router Class
 */
export class MessageRouter {
  private handlers: Map<MessageType, Set<(message: WebSocketMessage) => void>>;
  private persistence: MessagePersistence | null;
  private messageQueue: WebSocketMessage[];
  private processing: boolean;

  constructor(options?: { persistence?: MessagePersistence }) {
    this.handlers = new Map();
    this.persistence = options?.persistence || null;
    this.messageQueue = [];
    this.processing = false;

    // 初始化所有消息类型处理器
    const types: MessageType[] = ['cursor', 'selection', 'chat', 'notification', 'sync', 'presence', 'room'];
    types.forEach(type => {
      this.handlers.set(type, new Set());
    });
  }

  /**
   * 注册消息处理器
   */
  subscribe(type: MessageType, handler: (message: WebSocketMessage) => void): () => void {
    const handlers = this.handlers.get(type);
    if (!handlers) return () => {};

    handlers.add(handler);

    // 返回取消订阅函数
    return () => {
      handlers.delete(handler);
    };
  }

  /**
   * 广播消息到房间所有成员
   */
  broadcast(roomId: string, message: Omit<BaseMessage, 'id' | 'timestamp'>): void {
    const fullMessage: BaseMessage = {
      ...message,
      id: this.generateId(),
      timestamp: Date.now(),
    };

    // 添加到队列
    this.messageQueue.push(fullMessage);

    // 异步处理消息
    this.processQueue();

    // 持久化
    if (this.persistence) {
      this.persistence.save(fullMessage).catch(console.error);
    }
  }

  /**
   * 发送消息给特定用户
   */
  sendToUser(userId: string, message: Omit<BaseMessage, 'id' | 'timestamp'>): void {
    const fullMessage: BaseMessage = {
      ...message,
      id: this.generateId(),
      timestamp: Date.now(),
    };

    this.notifyHandlers(fullMessage);
  }

  /**
   * 消息队列处理
   */
  private async processQueue(): Promise<void> {
    if (this.processing || this.messageQueue.length === 0) return;

    this.processing = true;

    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift()!;
      this.notifyHandlers(message);
    }

    this.processing = false;
  }

  /**
   * 通知所有订阅者
   */
  private notifyHandlers(message: BaseMessage): void {
    const handlers = this.handlers.get(message.type);
    if (!handlers) return;

    handlers.forEach(handler => {
      try {
        handler(message);
      } catch (error) {
        console.error(`Message handler error:`, error);
      }
    });
  }

  /**
   * 生成消息 ID
   */
  private generateId(): string {
    return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }

  /**
   * 获取房间历史消息
   */
  async getHistory(roomId: string, limit = 50): Promise<BaseMessage[]> {
    if (!this.persistence) return [];
    return this.persistence.getHistory(roomId, limit);
  }

  /**
   * 清理旧消息
   */
  async cleanup(olderThanDays: number): Promise<number> {
    if (!this.persistence) return 0;
    return this.persistence.cleanup(olderThanDays);
  }
}

/**
 * Message Persistence Interface
 */
export interface MessagePersistence {
  save(message: BaseMessage): Promise<void>;
  getHistory(roomId: string, limit: number): Promise<BaseMessage[]>;
  cleanup(olderThanDays: number): Promise<number>;
}

/**
 * 消息统计
 */
export interface MessageStats {
  totalMessages: number;
  messagesByType: Record<MessageType, number>;
  messagesByRoom: Record<string, number>;
  averageLatency: number;
}

export function createMessageStats(): MessageStats {
  return {
    totalMessages: 0,
    messagesByType: {
      cursor: 0,
      selection: 0,
      chat: 0,
      notification: 0,
      sync: 0,
      presence: 0,
      room: 0,
    },
    messagesByRoom: {},
    averageLatency: 0,
  };
}

export default MessageRouter;
