/**
 * AIDraftDrawer — Slide-in Drawer for AI Card Generation
 * Epic 3: F14, F16, F17
 *
 * Component-level state machine:
 * - IDLE    → initial state, drawer open, user can type prompt
 * - LOADING → AI is generating cards, user waits
 * - PREVIEW → cards returned, user can accept/edit/retry
 * - ERROR   → generation failed, user can retry
 *
 * chatHistory lives in component state, NOT in Zustand store.
 * Accept → calls ddsChapterActions.addCard() to persist to store.
 */

'use client';

import React, {
  memo,
  useState,
  useCallback,
  useRef,
  useEffect,
  type ChangeEvent,
  type FormEvent,
} from 'react';
import { useDDSCanvasStore, ddsChapterActions } from '@/stores/dds/DDSCanvasStore';
import type { DDSCard, DDSEdge, ChatMessage } from '@/types/dds';
import { CardPreview } from './CardPreview';
import styles from './AIDraftDrawer.module.css';

// ==================== Constants ====================

/** 30-second generation timeout */
const GENERATION_TIMEOUT_MS = 30_000;

/** AI card generation system prompt */
const CARD_GENERATION_SYSTEM_PROMPT = `You are an expert DDS (Domain-Driven Design) canvas assistant.

Given a user's natural language requirement, generate a set of Domain-Driven Design cards
that capture user stories, bounded contexts, or flow steps appropriate for the current chapter.

Respond ONLY with valid JSON in this exact format:
{
  "cards": [
    {
      "id": "card-{uuid}",
      "type": "user-story" | "bounded-context" | "flow-step",
      "title": "Card Title",
      "description": "Optional description",
      "position": { "x": 100, "y": 100 },
      "createdAt": "ISO timestamp",
      "updatedAt": "ISO timestamp",
      // user-story specific:
      "role": "Actor name",
      "action": "Desired action",
      "benefit": "Business benefit",
      "priority": "high" | "medium" | "low",
      // bounded-context specific:
      "name": "Context name",
      "responsibility": "Core responsibility",
      // flow-step specific:
      "stepName": "Step name",
      "actor": "Who performs this step"
    }
  ]
}

Rules:
- Generate 1-5 cards based on the complexity of the requirement
- Use unique UUIDs for each card id
- Position cards with slight random offset to avoid overlap
- Return ONLY the JSON, no markdown code blocks or explanation
`;

// ==================== Types ====================

type AIDraftState = 'IDLE' | 'LOADING' | 'PREVIEW' | 'ERROR';

// ==================== Helpers ====================

function generateId(): string {
  return `card-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Parse AI JSON response into DDSCard[].
 * Tries to extract JSON from markdown code blocks first.
 */
function parseCardsFromResponse(content: string): DDSCard[] {
  let jsonStr = content.trim();

  // Strip markdown code fences
  const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    jsonStr = fenceMatch[1]!.trim();
  }

  // Try direct parse
  try {
    const parsed = JSON.parse(jsonStr);
    if (Array.isArray(parsed)) return parsed;
    if (parsed.cards && Array.isArray(parsed.cards)) return parsed.cards;
    return [];
  } catch {
    // Try to find JSON object in the text
    const objMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (objMatch) {
      try {
        const parsed = JSON.parse(objMatch[0]);
        if (parsed.cards && Array.isArray(parsed.cards)) return parsed.cards;
        if (Array.isArray(parsed)) return parsed;
      } catch {
        // ignore
      }
    }
    return [];
  }
}

/**
 * E3-U4: Parse edges from AI response JSON
 * AI returns { cards, edges } where edges have source/target pointing to card IDs
 */
function parseEdgesFromResponse(content: string): DDSEdge[] {
  let jsonStr = content.trim();

  const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    jsonStr = fenceMatch[1]!.trim();
  }

  try {
    const parsed = JSON.parse(jsonStr);
    if (parsed.edges && Array.isArray(parsed.edges)) {
      return parsed.edges.map((e: Partial<DDSEdge>) => ({
        id: e.id ?? `edge-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        source: e.source ?? '',
        target: e.target ?? '',
        label: e.label ?? '',
        style: e.style ?? {},
        animated: e.animated ?? false,
      }));
    }
    return [];
  } catch {
    return [];
  }
}

// ==================== Props ====================

export interface AIDraftDrawerProps {
  /** Called when user accepts cards — opens the card editor */
  onEditCards?: (cards: DDSCard[]) => void;
}

// ==================== Component ====================

export const AIDraftDrawer = memo(function AIDraftDrawer({
  onEditCards,
}: AIDraftDrawerProps) {
  const isDrawerOpen = useDDSCanvasStore((s) => s.isDrawerOpen);
  const toggleDrawer = useDDSCanvasStore((s) => s.toggleDrawer);
  const activeChapter = useDDSCanvasStore((s) => s.activeChapter);

  // ---- Component state (NOT in Zustand) ----
  const [state, setState] = useState<AIDraftState>('IDLE');
  const [inputValue, setInputValue] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [generatedCards, setGeneratedCards] = useState<DDSCard[]>([]);
  // E3-U4: Edges generated by AI
  const [generatedEdges, setGeneratedEdges] = useState<DDSEdge[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Refs
  const abortControllerRef = useRef<AbortController | null>(null);
  const messageListRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const lastPromptRef = useRef<string>('');

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [chatHistory, state, generatedCards]);

  // Reset state when drawer closes
  useEffect(() => {
    if (!isDrawerOpen) {
      setState('IDLE');
      setInputValue('');
      setChatHistory([]);
      setGeneratedCards([]);
      setErrorMessage(null);
      abortControllerRef.current?.abort();
    }
  }, [isDrawerOpen]);

  // ---- AI Generation ----

  const generateCards = useCallback(
    async (userPrompt: string) => {
      // Cancel any in-flight request
      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();

      const controller = abortControllerRef.current;
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, GENERATION_TIMEOUT_MS);

      setState('LOADING');
      setErrorMessage(null);

      const userMsg: ChatMessage = {
        id: generateId(),
        role: 'user',
        content: userPrompt,
        timestamp: new Date().toISOString(),
      };

      setChatHistory((prev) => [...prev, userMsg]);
      lastPromptRef.current = userPrompt;

      try {
        const response = await fetch(`${window.location.origin}/api/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(typeof window !== 'undefined'
              ? { Authorization: `Bearer ${localStorage.getItem('auth_token') ?? ''}` }
              : {}),
          },
          body: JSON.stringify({
            message: userPrompt,
            history: chatHistory.map((m) => ({
              role: m.role,
              content: m.content,
            })),
            systemPrompt: CARD_GENERATION_SYSTEM_PROMPT,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err.error ?? `HTTP ${response.status}`);
        }

        const data = await response.json();
        const content = data.content ?? '';

        const assistantMsg: ChatMessage = {
          id: generateId(),
          role: 'assistant',
          content,
          timestamp: new Date().toISOString(),
        };

        setChatHistory((prev) => [...prev, assistantMsg]);

        const cards = parseCardsFromResponse(content);

        if (cards.length === 0) {
          setErrorMessage('AI 返回了无效的数据，请尝试更详细的描述。');
          setState('ERROR');
        } else {
          // Stamp timestamps
          const now = new Date().toISOString();
          const stamped = cards.map((c) => ({
            ...c,
            id: c.id || generateId(),
            createdAt: c.createdAt ?? now,
            updatedAt: now,
          }));
          setGeneratedCards(stamped);
          const edges = parseEdgesFromResponse(content);
          setGeneratedEdges(edges);
          setState('PREVIEW');
        }
      } catch (err) {
        clearTimeout(timeoutId);

        if (err instanceof Error && err.name === 'AbortError') {
          setErrorMessage('生成超时（30秒），请重试。');
        } else {
          setErrorMessage(
            err instanceof Error
              ? err.message
              : '生成失败，请检查网络连接。'
          );
        }
        setState('ERROR');
      }
    },
    [chatHistory]
  );

  // ---- Handlers ----

  const handleSend = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      const prompt = inputValue.trim();
      if (!prompt || state === 'LOADING') return;

      setInputValue('');
      generateCards(prompt);
    },
    [inputValue, state, generateCards]
  );

  const handleInputChange = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      setInputValue(e.target.value);
      // Auto-resize
      if (inputRef.current) {
        inputRef.current.style.height = 'auto';
        inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 128)}px`;
      }
    },
    []
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend(e as unknown as FormEvent);
      }
    },
    [handleSend]
  );

  const handleAccept = useCallback(() => {
    const chapter = activeChapter;
    generatedCards.forEach((card) => {
      ddsChapterActions.addCard(chapter, card);
    });
    // E3-U4: Also add edges that were generated
    generatedEdges.forEach((edge) => {
      ddsChapterActions.addEdge(chapter, edge);
    });
    setState('IDLE');
    setGeneratedCards([]);
    setGeneratedEdges([]);
    setChatHistory([]);
    toggleDrawer();
  }, [activeChapter, generatedCards, generatedEdges, toggleDrawer]);
  const handleEdit = useCallback(() => {
    if (onEditCards) {
      onEditCards(generatedCards);
    }
  }, [generatedCards, onEditCards]);

  const handleRetry = useCallback(() => {
    if (lastPromptRef.current) {
      setState('IDLE');
      setGeneratedCards([]);
      setErrorMessage(null);
      generateCards(lastPromptRef.current);
    }
  }, [generateCards]);

  const handleClose = useCallback(() => {
    abortControllerRef.current?.abort();
    toggleDrawer();
  }, [toggleDrawer]);

  const isLoading = state === 'LOADING';
  const canSend = inputValue.trim().length > 0 && !isLoading;

  return (
    <>
      {/* Overlay */}
      <div
        className={`${styles.overlay} ${isDrawerOpen ? styles.open : ''}`}
        onClick={handleClose}
        aria-hidden="true"
        data-testid="drawer-overlay"
      />

      {/* Drawer */}
      <aside
        className={`${styles.drawer} ${isDrawerOpen ? styles.open : ''}`}
        role="dialog"
        aria-label="AI 卡片生成"
        aria-modal="true"
        data-testid="ai-draft-drawer"
      >
        {/* Header */}
        <div className={styles.header}>
          <h2 className={styles.title}>
            <span>✨</span> AI 卡片生成
          </h2>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={handleClose}
            aria-label="关闭抽屉"
            data-testid="drawer-close"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className={styles.body}>
          {/* Message List */}
          <div className={styles.messageList} ref={messageListRef}>
            {chatHistory.length === 0 && state !== 'LOADING' && (
              <div
                style={{
                  textAlign: 'center',
                  color: 'var(--color-text-muted, #8a8a9a)',
                  fontSize: '0.875rem',
                  padding: '2rem',
                }}
                data-testid="empty-hint"
              >
                描述你的需求，AI 将生成对应的 DDD 卡片
              </div>
            )}

            {chatHistory.map((msg) => (
              <div
                key={msg.id}
                className={`${styles.message} ${styles[msg.role]}`}
                data-testid={`message-${msg.role}`}
              >
                <div className={styles.messageBubble}>{msg.content}</div>
                <span className={styles.messageTime}>
                  {formatTime(new Date(msg.timestamp))}
                </span>
              </div>
            ))}

            {isLoading && (
              <div className={styles.message} data-testid="loading-indicator">
                <div className={styles.loading}>
                  <span className={styles.loadingDot} />
                  <span className={styles.loadingDot} />
                  <span className={styles.loadingDot} />
                  <span>生成中...</span>
                </div>
              </div>
            )}
          </div>

          {/* Preview Section (only when PREVIEW state) */}
          {state === 'PREVIEW' && generatedCards.length > 0 && (
            <div className={styles.previewSection} data-testid="preview-section">
              <CardPreview
                cards={generatedCards}
                edges={generatedEdges}
                onAccept={handleAccept}
                onEdit={handleEdit}
                onRetry={handleRetry}
                isLoading={isLoading}
              />
            </div>
          )}

          {/* Error Banner */}
          {state === 'ERROR' && errorMessage && (
            <div className={styles.errorBanner} data-testid="error-banner">
              {errorMessage}
              <button
                type="button"
                onClick={handleRetry}
                style={{
                  marginLeft: 'auto',
                  background: 'rgba(239,68,68,0.2)',
                  border: '1px solid rgba(239,68,68,0.4)',
                  color: '#fca5a5',
                  borderRadius: '0.25rem',
                  padding: '0.125rem 0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                }}
              >
                重试
              </button>
            </div>
          )}
        </div>

        {/* Input Area */}
        <form className={styles.inputArea} onSubmit={handleSend} data-testid="input-form">
          <textarea
            ref={inputRef}
            className={styles.input}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="描述你的需求，例如：用户登录、订单管理等..."
            disabled={isLoading}
            rows={1}
            aria-label="输入需求描述"
            data-testid="chat-input"
          />
          <button
            type="submit"
            className={styles.sendBtn}
            disabled={!canSend}
            aria-label="发送"
            data-testid="send-btn"
          >
            ↑
          </button>
        </form>
      </aside>
    </>
  );
});

export default AIDraftDrawer;
