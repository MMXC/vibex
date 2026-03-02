/**
 * AI Design Chat API Routes
 * 
 * Provides specialized AI chat endpoints for design conversations in VibeX.
 * Supports streaming responses for real-time interaction.
 * 
 * @module routes/ai-design-chat
 */

import { Hono } from 'hono';
import { CloudflareEnv } from '../lib/env';

const aiDesignChat = new Hono<{ Bindings: CloudflareEnv }>();

// ==================== Types ====================

interface DesignChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface DesignChatRequest {
  message: string;
  conversationId?: string;
  projectId?: string;
  context?: {
    currentPage?: string;
    currentComponent?: string;
    designGoals?: string[];
  };
}

interface DesignChatResponse {
  content: string;
  conversationId: string;
  suggestions?: string[];
  designRecommendations?: string[];
}

// ==================== System Prompt ====================

const DESIGN_SYSTEM_PROMPT = `You are VibeX AI Design Assistant, an expert UI/UX design assistant helping users create beautiful, functional prototypes.

Your role:
- Help users design web and mobile interfaces
- Provide design recommendations based on best practices
- Suggest color schemes, layouts, and component combinations
- Assist with UI/UX decisions and explain design rationale
- Generate design ideas and iterate on user feedback

Guidelines:
- Be concise but informative
- Provide specific, actionable suggestions
- Consider accessibility and user experience
- Suggest modern, clean design patterns
- When appropriate, recommend specific UI components from popular libraries

You can access the prototype being designed to provide context-aware suggestions.`;

// ==================== Helper Functions ====================

async function* streamFromMiniMax(
  apiKey: string,
  apiBase: string,
  model: string,
  messages: DesignChatMessage[],
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

// In-memory conversation storage (for demo; use DB in production)
const conversations = new Map<string, DesignChatMessage[]>();

// ==================== Routes ====================

// GET /api/ai-design-chat - Health check and info
aiDesignChat.get('/', (c) => {
  return c.json({
    status: 'ok',
    message: 'AI Design Chat API is running. Use POST with { message: "your message", projectId?: "..." }',
    endpoints: {
      POST: 'Send a design chat message',
      GET: 'Health check',
      DELETE: 'Clear conversation by ID',
    },
  });
});

// DELETE /api/ai-design-chat - Clear conversation
aiDesignChat.delete('/', async (c) => {
  const { conversationId } = await c.req.query();
  
  if (conversationId) {
    conversations.delete(conversationId);
    return c.json({ success: true, message: `Conversation ${conversationId} cleared` });
  }
  
  // Clear all conversations
  conversations.clear();
  return c.json({ success: true, message: 'All conversations cleared' });
});

// POST /api/ai-design-chat - Stream design chat
aiDesignChat.post('/', async (c) => {
  try {
    const env = c.env;
    const apiKey = env.MINIMAX_API_KEY;
    const apiBase = env.MINIMAX_API_BASE || 'https://api.minimax.chat/v1';
    const model = env.MINIMAX_MODEL || 'abab6.5s-chat';

    if (!apiKey) {
      return c.json({ error: 'MINIMAX_API_KEY is not configured' }, 500);
    }

    const body = await c.req.json<DesignChatRequest>();
    const { message, conversationId, projectId, context } = body;

    if (!message) {
      return c.json({ error: 'Message is required' }, 400);
    }

    // Generate or use provided conversation ID
    const convId = conversationId || `design_${Date.now()}`;
    
    // Get existing conversation history or initialize
    let conversationHistory = conversations.get(convId) || [];
    
    // If this is a new conversation, add system prompt
    if (conversationHistory.length === 0) {
      let systemMessage = DESIGN_SYSTEM_PROMPT;
      
      // Add project context if provided
      if (projectId || context) {
        systemMessage += `\n\nCurrent Design Context:`;
        if (projectId) {
          systemMessage += `\n- Project ID: ${projectId}`;
        }
        if (context?.currentPage) {
          systemMessage += `\n- Current Page: ${context.currentPage}`;
        }
        if (context?.currentComponent) {
          systemMessage += `\n- Current Component: ${context.currentComponent}`;
        }
        if (context?.designGoals && context.designGoals.length > 0) {
          systemMessage += `\n- Design Goals: ${context.designGoals.join(', ')}`;
        }
      }
      
      conversationHistory.push({ role: 'system', content: systemMessage });
    }

    // Add user message
    conversationHistory.push({ role: 'user', content: message });

    const messages: DesignChatMessage[] = [...conversationHistory];

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        try {
          // Send conversation start
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ conversationId: convId, type: 'start' })}\n\n`)
          );

          let fullContent = '';

          // Stream from MiniMax
          for await (const chunk of streamFromMiniMax(apiKey, apiBase, model, messages, convId)) {
            controller.enqueue(encoder.encode(chunk));
            
            // Extract content for storage
            try {
              const chunkData = JSON.parse(chunk.slice(6));
              if (chunkData.content) {
                fullContent += chunkData.content;
              }
            } catch {
              // Skip parsing errors
            }
          }

          // Add assistant response to conversation history
          if (fullContent) {
            conversationHistory.push({ role: 'assistant', content: fullContent });
            conversations.set(convId, conversationHistory);
          }

          // Send done signal
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, conversationId: convId })}\n\n`));
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

// GET /api/ai-design-chat/history - Get conversation history
aiDesignChat.get('/history', async (c) => {
  const { conversationId } = await c.req.query();
  
  if (!conversationId) {
    return c.json({ error: 'conversationId is required' }, 400);
  }
  
  const history = conversations.get(conversationId) || [];
  
  return c.json({
    conversationId,
    messages: history,
    messageCount: history.length,
  });
});

export default aiDesignChat;
