// ==================== 消息相关类型 ====================

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  projectId: string;
  createdAt?: string;
  quotedMessageId?: string;
  quotedContent?: string;
}

export interface MessageCreate {
  content: string;
  projectId: string;
  role?: 'user' | 'assistant' | 'system';
  quotedMessageId?: string;
}
