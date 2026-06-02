/**
 * EmbeddedAgentPanel — Slide-in Drawer for AI Coding Agent Sessions
 * Sprint57 E2: Canvas-Inline AI Session Panel
 *
 * Shows a list of agent sessions + chat history.
 * "Insert to Canvas" adds the last AI response as a DDS card.
 *
 * State machine:
 * - LIST: session list visible, no chat shown
 * - CHAT: a session is selected, chat visible
 */

'use client';

import React, {
  memo,
  useState,
  useCallback,
  useRef,
  useEffect,
} from 'react';
import { useAgentStore } from '@/stores/agentStore';
import { useDDSCanvasStore, ddsChapterActions } from '@/stores/dds/DDSCanvasStore';
import type { AgentSession, AgentMessage } from '@/services/agent/CodingAgentService';
import type { DDSCard } from '@/types/dds';
import styles from './EmbeddedAgentPanel.module.css';

// ==================== Types ====================

type DrawerView = 'list' | 'chat';

// ==================== Helpers ====================

function formatTimestamp(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function generateCardId(): string {
  return `agent-card-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function messageToCard(
  session: AgentSession,
  message: AgentMessage,
  chapter: string
): DDSCard {
  return {
    id: generateCardId(),
    type: 'agent-response',
    title: `[${session.name ?? session.task}] AI 回复`,
    description: message.content,
    position: { x: 100 + Math.random() * 200, y: 100 + Math.random() * 200 },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    // Agent-specific fields stored in metadata
    metadata: {
      sessionKey: session.sessionKey,
      messageId: message.id,
      role: message.role,
      codeBlocks: message.codeBlocks,
    },
  };
}

// ==================== SessionList ====================

interface SessionListProps {
  sessions: AgentSession[];
  activeKey: string | null;
  onSelect: (sessionKey: string) => void;
}

const SessionList = memo<SessionListProps>(function SessionList({
  sessions,
  activeKey,
  onSelect,
}) {
  if (sessions.length === 0) {
    return (
      <div className={styles.noSessions}>
        <span>暂无 AI Session</span>
        <span style={{ fontSize: '11px' }}>在 Agent 面板中创建 Session 后即可在此访问</span>
      </div>
    );
  }

  return (
    <div className={styles.sessionList}>
      {sessions.map((session) => {
        const isActive = session.sessionKey === activeKey;
        const lastMsg = session.messages[session.messages.length - 1];
        return (
          <button
            key={session.sessionKey}
            className={`${styles.sessionItem} ${isActive ? styles.active : ''}`}
            onClick={() => onSelect(session.sessionKey)}
            aria-pressed={isActive}
            style={{ textAlign: 'left', width: '100%', cursor: 'pointer' }}
          >
            <div className={styles.sessionName}>
              {session.name ?? session.task}
            </div>
            <div className={styles.sessionMeta}>
              <span>{session.status}</span>
              {lastMsg && (
                <span>
                  {lastMsg.role}:{' '}
                  {lastMsg.content.slice(0, 30)}
                  {lastMsg.content.length > 30 ? '…' : ''}
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
});

// ==================== ChatArea ====================

interface ChatAreaProps {
  session: AgentSession;
  onInsertToCanvas: () => void;
  onBack: () => void;
}

const ChatArea = memo<ChatAreaProps>(function ChatArea({
  session,
  onInsertToCanvas,
  onBack,
}) {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [session.messages, scrollToBottom]);

  // Find the last agent message for "Insert to Canvas"
  const lastAgentMsg = [...session.messages]
    .reverse()
    .find((m) => m.role === 'agent');

  return (
    <div className={styles.chatArea}>
      {/* Header */}
      <div className={styles.header}>
        <button
          onClick={onBack}
          style={{
            background: 'none',
            border: 'none',
            color: '#9ca3af',
            cursor: 'pointer',
            fontSize: '12px',
            padding: '4px 6px',
          }}
          aria-label="返回会话列表"
        >
          ← 返回
        </button>
        <span className={styles.title} style={{ flex: 1, textAlign: 'center' }}>
          {session.name ?? session.task}
        </span>
        <div style={{ width: 40 }} />
      </div>

      {/* Messages */}
      <div className={styles.messages}>
        {session.messages.length === 0 && (
          <div className={`${styles.messageBubble} ${styles.system}`}>
            开始发送消息与 AI 对话
          </div>
        )}
        {session.messages.map((msg) => (
          <div
            key={msg.id}
            className={`${styles.messageBubble} ${
              msg.role === 'user'
                ? styles.user
                : msg.role === 'agent'
                ? styles.agent
                : styles.system
            }`}
          >
            {msg.content}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Insert Button */}
      {lastAgentMsg && (
        <div style={{ padding: '0 12px 4px' }}>
          <button
            className={styles.insertButton}
            onClick={onInsertToCanvas}
            aria-label="将 AI 回复插入画布"
          >
            ✏️ Insert to Canvas
          </button>
        </div>
      )}

      {/* Input */}
      <div className={styles.inputArea}>
        <textarea
          className={styles.input}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="发送消息给 AI…"
          rows={1}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              if (inputValue.trim()) {
                // Would call agentStore.addMessage here
                // For now, just clear the input
                setInputValue('');
              }
            }
          }}
          aria-label="AI 消息输入框"
        />
        <button
          className={styles.sendButton}
          disabled={!inputValue.trim()}
          onClick={() => {
            if (inputValue.trim()) {
              setInputValue('');
            }
          }}
          aria-label="发送消息"
        >
          发送
        </button>
      </div>
    </div>
  );
});

// ==================== EmbeddedAgentPanel ====================

export interface EmbeddedAgentPanelProps {
  /** Controlled open state — useEmbeddedAgent drives this */
  isOpen: boolean;
  onClose: () => void;
}

/**
 * EmbeddedAgentPanel — Right-side drawer showing agent sessions.
 * Mounted inside DDSCanvasPage. Use useEmbeddedAgent hook to control.
 */
export const EmbeddedAgentPanel = memo<EmbeddedAgentPanelProps>(function EmbeddedAgentPanel({
  isOpen,
  onClose,
}) {
  const sessions = useAgentStore((s) => s.sessions);
  const activeSessionKey = useAgentStore((s) => s.activeSessionKey);
  const activeChapter = useDDSCanvasStore((s) => s.activeChapter);
  const addCard = ddsChapterActions.addCard;

  const [view, setView] = useState<DrawerView>('list');

  const activeSession = sessions.find((s) => s.sessionKey === activeSessionKey) ?? null;

  const handleSelectSession = useCallback((sessionKey: string) => {
    useAgentStore.getState().setActiveSession(sessionKey);
    setView('chat');
  }, []);

  const handleBack = useCallback(() => {
    setView('list');
  }, []);

  const handleInsertToCanvas = useCallback(() => {
    if (!activeSession) return;
    const lastAgentMsg = [...activeSession.messages]
      .reverse()
      .find((m) => m.role === 'agent');
    if (!lastAgentMsg) return;
    const card = messageToCard(activeSession, lastAgentMsg, activeChapter);
    addCard(activeChapter, card);
  }, [activeSession, activeChapter, addCard]);

  const overlayClass = `${styles.overlay} ${isOpen ? styles.open : ''}`;
  const drawerClass = `${styles.drawer} ${isOpen ? styles.open : ''}`;

  return (
    <>
      {/* Overlay */}
      <div className={overlayClass} onClick={onClose} aria-hidden="true" />

      {/* Drawer */}
      <div
        className={drawerClass}
        role="dialog"
        aria-modal="true"
        aria-label="AI Agent Panel"
      >
        {/* Header — always shown */}
        <div className={styles.header}>
          <span className={styles.title}>🤖 AI Sessions</span>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="关闭面板"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        {view === 'list' && (
          <SessionList
            sessions={sessions}
            activeKey={activeSessionKey}
            onSelect={handleSelectSession}
          />
        )}
        {view === 'chat' && activeSession && (
          <ChatArea
            session={activeSession}
            onInsertToCanvas={handleInsertToCanvas}
            onBack={handleBack}
          />
        )}
      </div>
    </>
  );
});

export default EmbeddedAgentPanel;
