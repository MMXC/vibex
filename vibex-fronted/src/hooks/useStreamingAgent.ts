/**
 * useStreamingAgent.ts — Sprint43 E2: AI Agent SSE Streaming
 *
 * Hook for calling POST /api/ai/generate with SSE streaming support.
 * Manages AbortController, chunk accumulation, and loading state.
 *
 * Usage:
 *   const { messages, isStreaming, error, sendMessage, abort } = useStreamingAgent();
 */

'use client';

import { useRef, useState, useCallback } from 'react';

export interface StreamingMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface UseStreamingAgentOptions {
  /** Called when the stream completes successfully */
  onComplete?: (fullContent: string) => void;
  /** Called on stream error */
  onError?: (error: string) => void;
}

export function useStreamingAgent(options: UseStreamingAgentOptions = {}) {
  const [messages, setMessages] = useState<StreamingMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const currentMessageIdRef = useRef<string | null>(null);

  /**
   * Send a message and stream the AI response via SSE.
   */
  const sendMessage = useCallback(async (messageText: string, conversationId?: string) => {
    // Abort any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const userMsgId = `user_${Date.now()}`;
    const assistantMsgId = `assistant_${Date.now()}`;

    // Add user message immediately
    setMessages((prev) => [
      ...prev,
      {
        id: userMsgId,
        role: 'user',
        content: messageText,
        timestamp: Date.now(),
      },
    ]);

    // Add placeholder assistant message
    setMessages((prev) => [
      ...prev,
      {
        id: assistantMsgId,
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
      },
    ]);

    setIsStreaming(true);
    setError(null);
    currentMessageIdRef.current = assistantMsgId;

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({
          message: messageText,
          stream: true,
          conversationId,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
        throw new Error(errData.error || `HTTP ${response.status}`);
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;

          const dataStr = trimmed.slice(6);
          try {
            const data = JSON.parse(dataStr);

            if (data.error) {
              throw new Error(data.error);
            }

            if (data.content !== undefined && currentMessageIdRef.current) {
              // Append chunk to assistant message
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === currentMessageIdRef.current
                    ? { ...msg, content: msg.content + data.content }
                    : msg
                )
              );
            }

            if (data.done) {
              break;
            }
          } catch {
            // Skip malformed JSON lines
          }
        }
      }

      const fullContent = messages.find((m) => m.id === assistantMsgId)?.content ?? '';
      options.onComplete?.(fullContent);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Stream failed';
      setError(errorMessage);
      options.onError?.(errorMessage);

      // Update assistant message to show error
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId
            ? { ...msg, content: `⚠️ ${errorMessage}` }
            : msg
        )
      );
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  }, [options]);

  /**
   * Abort the current streaming request.
   */
  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
    }
  }, []);

  /**
   * Clear all messages.
   */
  const clear = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    isStreaming,
    error,
    sendMessage,
    abort,
    clear,
  };
}
