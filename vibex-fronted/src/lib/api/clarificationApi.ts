/**
 * Clarification API Client
 * 对话式需求澄清 API 客户端
 */

export interface ChatRequest {
  message: string;
  history: { role: 'user' | 'assistant'; content: string }[];
  context?: Record<string, unknown>;
}

export interface ChatResponse {
  reply: string;
  quickReplies?: string[];
  completeness: number;
  suggestions?: string[];
  nextAction: string;
  error?: string;
}

export class ClarificationApi {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || '/api/clarify/chat';
  }

  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: '请求失败' }));
        return { 
          reply: '', 
          completeness: 0, 
          nextAction: 'error',
          error: error.error || '请求失败'
        };
      }

      return await response.json();
    } catch (error) {
      return {
        reply: '',
        completeness: 0,
        nextAction: 'error',
        error: error instanceof Error ? error.message : '网络错误',
      };
    }
  }

  async startClarification(initialMessage: string): Promise<ChatResponse> {
    return this.sendMessage({
      message: initialMessage,
      history: [],
    });
  }

  async continueClarification(
    message: string,
    history: { role: 'user' | 'assistant'; content: string }[]
  ): Promise<ChatResponse> {
    return this.sendMessage({
      message,
      history,
    });
  }
}

// Singleton instance
export const clarificationApi = new ClarificationApi();

export default clarificationApi;
