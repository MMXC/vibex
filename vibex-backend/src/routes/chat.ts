import { Hono } from 'hono';
import { CloudflareEnv } from '../lib/env';
import { getSessionManager } from '../services/context';
import { StructuredContext, CompressionConfig } from '../services/context/types';

const chat = new Hono<{ Bindings: CloudflareEnv }>();

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

async function* streamFromMiniMax(
  apiKey: string,
  apiBase: string,
  model: string,
  messages: ChatMessage[],
  conversationId: string
): AsyncGenerator<string> {
  const url = `${apiBase}/text/chatcompletion_v2`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  };

  const body = JSON.stringify({
    model: model,
    messages: messages,
    stream: true,
    temperature: 0.7,
  });

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body,
    });

    if (!response.ok) {
      const errorText = await response.text();
      yield `data: ${JSON.stringify({ error: `MiniMax API error: ${response.status} - ${errorText}` })}\n\n`;
      return;
    }

    if (!response.body) {
      yield `data: ${JSON.stringify({ error: 'No response body from MiniMax API' })}\n\n`;
      return;
    }

    const decoder = new TextDecoder();
    const reader = response.body.getReader();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data:')) continue;

          const data = trimmed.slice(5).trim();
          if (data === '[DONE]') {
            yield `data: ${JSON.stringify({ done: true })}\n\n`;
            return;
          }

          try {
            const parsed = JSON.parse(data);
            if (parsed.choices?.[0]?.delta?.content) {
              const content = parsed.choices[0].delta.content;
              yield `data: ${JSON.stringify({ content, conversationId })}\n\n`;
            }
          } catch {
            // Skip invalid JSON
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    yield `data: ${JSON.stringify({ error: `Stream error: ${errorMessage}` })}\n\n`;
  }
}

// GET /api/chat - Health check
chat.get('/', (c) => {
  return c.json({
    status: 'ok',
    message: 'Chat API is running. Use POST with { message: "your message" }',
  });
});

// POST /api/chat - Stream chat
chat.post('/', async (c) => {
  try {
    const env = c.env;
    const apiKey = env.MINIMAX_API_KEY;
    const apiBase = env.MINIMAX_API_BASE || 'https://api.minimax.chat/v1';
    const model = env.MINIMAX_MODEL || 'abab6.5s-chat';

    if (!apiKey) {
      return c.json({ error: 'MINIMAX_API_KEY is not configured' }, 500);
    }

    const body = await c.req.json();
    const { message, conversationId } = body;

    if (!message) {
      return c.json({ error: 'Message is required' }, 400);
    }

    const messages: ChatMessage[] = [{ role: 'user', content: message }];
    const convId = conversationId || `conv_${Date.now()}`;

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ conversationId: convId })}\n\n`)
          );

          for await (const chunk of streamFromMiniMax(apiKey, apiBase, model, messages, convId)) {
            controller.enqueue(encoder.encode(chunk));
          }

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: errorMessage })}\n\n`)
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: errorMessage }, 500);
  }
});

interface ChatWithContextRequest {
  message: string
  sessionId?: string
  structuredContext?: StructuredContext
  config?: Partial<CompressionConfig>
}

// POST /api/chat/with-context - 带上下文的流式聊天
chat.post('/with-context', async (c) => {
  try {
    const env = c.env
    const apiKey = env.MINIMAX_API_KEY
    const apiBase = env.MINIMAX_API_BASE || 'https://api.minimax.chat/v1'
    const model = env.MINIMAX_MODEL || 'abab6.5s-chat'

    if (!apiKey) {
      return c.json({ error: 'MINIMAX_API_KEY is not configured' }, 500)
    }

    const body = await c.req.json() as ChatWithContextRequest
    const { message, sessionId, structuredContext, config } = body

    if (!message) {
      return c.json({ error: 'Message is required' }, 400)
    }

    // 使用或创建会话
    const sessionIdFinal = sessionId || `ctx_${Date.now()}`
    const sessionManager = getSessionManager(config)
    const session = sessionManager.getOrCreate(sessionIdFinal)

    // 设置结构化上下文
    if (structuredContext) {
      sessionManager.setStructuredContext(sessionIdFinal, structuredContext)
    }

    // 添加用户消息并检查压缩
    const compressionResult = await sessionManager.addMessage(sessionIdFinal, {
      role: 'user',
      content: message,
    })

    // 获取用于 LLM 的上下文
    const contextMessages = sessionManager.getContextForLLM(sessionIdFinal)

    // 构建发送给 AI 的消息
    const llmMessages: ChatMessage[] = [
      ...contextMessages,
      { role: 'user', content: message },
    ]

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()

        try {
          // 发送会话 ID 和压缩信息
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ 
                sessionId: sessionIdFinal,
                compressed: compressionResult?.success ?? false,
                compressionRatio: compressionResult?.compressionRatio,
                tokenCount: session.tokenCount
              })}\n\n`
            )
          )

          // 流式调用 AI
          for await (const chunk of streamFromMiniMax(
            apiKey, 
            apiBase, 
            model, 
            llmMessages, 
            sessionIdFinal
          )) {
            controller.enqueue(encoder.encode(chunk))
          }

          // 发送完成信息
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ 
                done: true,
                summary: compressionResult?.summary,
                originalTokens: compressionResult?.originalTokenCount,
                newTokens: compressionResult?.newTokenCount
              })}\n\n`
            )
          )
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: errorMessage })}\n\n`)
          )
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return c.json({ error: errorMessage }, 500)
  }
})

// GET /api/chat/with-context/stats/:sessionId - 获取会话统计
chat.get('/with-context/stats/:sessionId', async (c) => {
  const sessionId = c.req.param('sessionId')
  const sessionManager = getSessionManager()
  const stats = sessionManager.getStats(sessionId)
  
  return c.json(stats)
})

// DELETE /api/chat/with-context/session/:sessionId - 删除会话
chat.delete('/with-context/session/:sessionId', async (c) => {
  const sessionId = c.req.param('sessionId')
  const sessionManager = getSessionManager()
  const destroyed = sessionManager.destroy(sessionId)
  
  return c.json({ success: destroyed })
})

export default chat;