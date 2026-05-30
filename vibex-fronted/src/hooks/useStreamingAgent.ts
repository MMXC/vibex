/**
 * useStreamingAgent.ts — Sprint43 E2: AI Agent SSE Streaming
 * Sprint44 P001-E1: add onChunk callback for character counting
 * Sprint45 P001-E1: AI 断线重连 — retry logic, exponential backoff, IndexedDB chunk persistence
 *
 * Hook for calling POST /api/ai/generate with SSE streaming support.
 * Manages AbortController, chunk accumulation, loading state, and retry with backoff.
 *
 * Usage:
 *   const { messages, isStreaming, error, retrying, lastError, sendMessage, abort } = useStreamingAgent({ maxRetries: 3 });
 */

'use client';

import { useRef, useState, useCallback } from 'react';
import {
  persistStreamingChunk,
  loadStreamingChunk,
  clearStreamingChunk,
} from '@/lib/streamingChunkDB';

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
  /** S44-E1: called for each SSE chunk received */
  onChunk?: (chunk: string) => void;
  /**
   * S45-E1: Maximum number of retry attempts on connection failure.
   * Uses exponential backoff: 1s → 2s → 4s.
   * Default: 0 (no retries, backward compatible).
   */
  maxRetries?: number;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Core stream-reading inner function.
 * Extracted so it can be called once initially and again on each retry.
 */
async function streamOneAttempt(
  assistantMsgId: string,
  messageText: string,
  conversationId: string | undefined,
  controller: AbortController,
  setMessages: (fn: (prev: StreamingMessage[]) => StreamingMessage[]) => void,
  onChunk: ((chunk: string) => void) | undefined,
  persistKey: string,
  initialContent: string
): Promise<{ done: boolean; fullContent: string }> {
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
  let accumulated = initialContent;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    const batchLines: string[] = [];
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data: ')) continue;
      batchLines.push(trimmed);
    }

    for (const line of batchLines) {
      const dataStr = line.slice(6);
      try {
        const data = JSON.parse(dataStr);

        if (data.error) throw new Error(data.error);

        if (data.content !== undefined) {
          accumulated += data.content;
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMsgId
                ? { ...msg, content: accumulated }
                : msg
            )
          );
          onChunk?.(data.content);
        }

        if (data.done) {
          // Persist final content before completing
          await persistStreamingChunk(persistKey, accumulated);
          await clearStreamingChunk(persistKey);
          return { done: true, fullContent: accumulated };
        }
      } catch {
        // Skip malformed JSON lines
      }
    }

    // Persist accumulated chunks after each batch (S45-E1: IndexedDB chunk write)
    await persistStreamingChunk(persistKey, accumulated);
  }

  return { done: true, fullContent: accumulated };
}

export function useStreamingAgent(options: UseStreamingAgentOptions = {}) {
  const {
    onComplete,
    onError,
    onChunk,
    maxRetries = 0,
  } = options;

  const [messages, setMessages] = useState<StreamingMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** S45-E1: Number of retry attempts made so far (0 = first attempt, 1 = first retry, etc.) */
  const [retrying, setRetrying] = useState(0);
  /** S45-E1: Most recent error that triggered the last retry */
  const [lastError, setLastError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const currentMessageIdRef = useRef<string | null>(null);
  const messageTextRef = useRef<string>('');
  const conversationIdRef = useRef<string | undefined>(undefined);
  const optionsRef = useRef(options);
  // Keep optionsRef in sync without causing re-renders
  optionsRef.current = options;

  /**
   * Send a message and stream the AI response via SSE.
   * Automatically retries on failure with exponential backoff (1s → 2s → 4s).
   */
  const sendMessage = useCallback(async (messageText: string, conversationId?: string) => {
    // Abort any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    messageTextRef.current = messageText;
    conversationIdRef.current = conversationId;

    const userMsgId = `user_${Date.now()}`;
    const assistantMsgId = `assistant_${Date.now()}`;
    const persistKey = `stream_${assistantMsgId}`;

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

    // Add placeholder assistant message (S45-E1: try recovering any prior chunks first)
    let initialContent = '';
    try {
      initialContent = await loadStreamingChunk(persistKey);
    } catch {
      // IndexedDB unavailable — start fresh
    }

    setMessages((prev) => [
      ...prev,
      {
        id: assistantMsgId,
        role: 'assistant',
        content: initialContent,
        timestamp: Date.now(),
      },
    ]);

    setIsStreaming(true);
    setError(null);
    setRetrying(0);
    setLastError(null);
    currentMessageIdRef.current = assistantMsgId;

    const controller = new AbortController();
    abortControllerRef.current = controller;

    let attempt = 0;
    let finalContent = initialContent;

    while (attempt <= maxRetries) {
      try {
        if (attempt > 0) {
          // S45-E1: exponential backoff — 1s, 2s, 4s
          const backoffMs = Math.pow(2, attempt - 1) * 1000;
          setRetrying(attempt);
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMsgId
                ? { ...msg, content: msg.content + `\n[Retrying… attempt ${attempt}/${maxRetries}]` }
                : msg
            )
          );
          await sleep(backoffMs);
        }

        const result = await streamOneAttempt(
          assistantMsgId,
          messageText,
          conversationId ?? '',
          controller,
          setMessages,
          optionsRef.current.onChunk,
          persistKey,
          finalContent
        );
        finalContent = result.fullContent;
        optionsRef.current.onComplete?.(finalContent);
        return; // success — exit retry loop
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Stream failed';

        // If aborted, stop retrying
        if (err instanceof Error && err.name === 'AbortError') {
          setIsStreaming(false);
          setError('Request aborted');
          optionsRef.current.onError?.('Request aborted');
          return;
        }

        const remaining = maxRetries - attempt;
        if (remaining > 0) {
          // More retries left — log and continue
          setLastError(errorMessage);
          attempt++;
          // Save current content before next attempt
          try {
            const currentContent = messages.find((m) => m.id === assistantMsgId)?.content ?? '';
            await persistStreamingChunk(persistKey, currentContent);
          } catch {
            // Ignore persistence errors during retry
          }
        } else {
          // All retries exhausted — give up
          setError(errorMessage);
          setLastError(errorMessage);
          optionsRef.current.onError?.(errorMessage);
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMsgId
                ? { ...msg, content: `⚠️ ${errorMessage}` }
                : msg
            )
          );
          break;
        }
      }
    }

    setIsStreaming(false);
    abortControllerRef.current = null;
  }, [maxRetries]); // eslint-disable-line react-hooks/exhaustive-deps

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
    setRetrying(0);
    setLastError(null);
  }, []);

  return {
    messages,
    isStreaming,
    error,
    retrying,
    lastError,
    sendMessage,
    abort,
    clear,
  };
}
