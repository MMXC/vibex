/**
 * Collapsible Chat Component
 * 
 * AI Assistant panel that can be collapsed/expanded
 * Floats in bottom-right corner
 */

'use client';

import React, { useState, useEffect } from 'react';
import AIChatPanel, { ChatMessage } from '@/components/ui/AIChatPanel';
import styles from './CollapsibleChat.module.css';

export interface CollapsibleChatProps {
  /** Initial collapsed state */
  defaultCollapsed?: boolean;
  /** Chat messages */
  messages?: ChatMessage[];
  /** Send message handler */
  onSendMessage?: (message: string) => Promise<void>;
  /** Clear chat handler */
  onClear?: () => void;
  /** Loading state */
  loading?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Custom button text */
  buttonText?: string;
  /** Custom labels */
  labels?: {
    collapsed?: string;
    expanded?: string;
  };
}

export function CollapsibleChat({
  defaultCollapsed = true,
  messages = [],
  onSendMessage,
  onClear,
  loading = false,
  disabled = false,
  buttonText = 'AI 助手',
  labels,
}: CollapsibleChatProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [messagesState, setMessagesState] = useState<ChatMessage[]>(messages);

  // Update messages when prop changes
  useEffect(() => {
    setMessagesState(messages);
  }, [messages]);

  const handleSendMessage = async (message: string) => {
    // Add user message
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date(),
    };
    setMessagesState(prev => [...prev, userMessage]);

    if (onSendMessage) {
      await onSendMessage(message);
    }
  };

  const toggleChat = () => {
    setIsCollapsed(prev => !prev);
  };

  return (
    <div className={styles.container}>
      {/* Chat Panel */}
      <div 
        className={`${styles.chatPanel} ${isCollapsed ? styles.collapsed : styles.expanded}`}
      >
        {isCollapsed ? null : (
          <AIChatPanel
            messages={messagesState}
            onSendMessage={handleSendMessage}
            onClear={onClear}
            isLoading={loading}
            disabled={disabled}
          />
        )}
      </div>

      {/* Toggle Button */}
      <button 
        className={styles.toggleButton}
        onClick={toggleChat}
        aria-label={isCollapsed ? (labels?.expanded || buttonText) : (labels?.collapsed || '关闭聊天')}
        aria-expanded={!isCollapsed}
      >
        {isCollapsed ? (
          <>
            <span className={styles.icon}>💬</span>
            <span className={styles.buttonText}>{buttonText}</span>
          </>
        ) : (
          <>
            <span className={styles.icon}>✕</span>
            <span className={styles.buttonText}>{labels?.collapsed || '关闭'}</span>
          </>
        )}
      </button>
    </div>
  );
}

export default CollapsibleChat;
