import { Message, MessageCreate } from '../types/message';
import { SuccessResponse } from '../types/common';
import { httpClient } from '../client';
import { retry } from '../retry';
import { cache, getCacheKey } from '../cache';
import { unwrapField } from '../unwrappers';

// ==================== 接口定义 ====================

export interface MessageApi {
  getMessages(projectId: string): Promise<Message[]>;
  createMessage(message: MessageCreate): Promise<Message>;
  deleteMessage(messageId: string): Promise<SuccessResponse>;
}

// ==================== 实现 ====================

class MessageApiImpl implements MessageApi {
  private isOnline(): boolean {
    if (typeof navigator !== 'undefined') {
      return navigator.onLine;
    }
    return true;
  }

  async getMessages(projectId: string): Promise<Message[]> {
    const cacheKey = getCacheKey('messages', projectId);
    const cached = cache.get<Message[]>(cacheKey);

    if (!this.isOnline() && cached) {
      return cached;
    }

    const result = await retry.execute(async () => {
      return await httpClient.get<Message[]>('/messages', {
        params: { projectId },
      });
    });
    const messages = unwrapField<Message[]>(result, 'messages')!;
    cache.set(cacheKey, messages);
    return messages;
  }

  async createMessage(message: MessageCreate): Promise<Message> {
    const result = await retry.execute(async () => {
      return await httpClient.post<Message>('/messages', message);
    });
    cache.remove(getCacheKey('messages', message.projectId));
    return result;
  }

  async deleteMessage(messageId: string): Promise<SuccessResponse> {
    const result = await retry.execute(async () => {
      return await httpClient.delete<SuccessResponse>(`/messages/${messageId}`);
    });
    return result;
  }
}

// ==================== 工厂函数 ====================

export function createMessageApi(): MessageApi {
  return new MessageApiImpl();
}

// ==================== 单例导出 ====================

export const messageApi = createMessageApi();
