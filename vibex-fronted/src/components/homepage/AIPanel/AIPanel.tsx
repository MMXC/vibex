import React from 'react';
import styles from './AIPanel.module.css';
import type { AIPanelProps, AIMessage } from '../types';

export const AIPanel: React.FC<AIPanelProps> = ({
  isOpen = false,
  messages = [],
  onClose,
  onSendMessage,
}) => {
  const [inputValue, setInputValue] = React.useState('');

  const handleSend = () => {
    if (inputValue.trim()) {
      onSendMessage?.(inputValue);
      setInputValue('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.aiPanel}>
      <div className={styles.header}>
        <span className={styles.title}>AI 助手</span>
        <button 
          className={styles.closeButton}
          onClick={onClose}
        >
          ✕
        </button>
      </div>
      <div className={styles.messages}>
        {messages.length === 0 ? (
          <div className={styles.empty}>暂无消息</div>
        ) : (
          messages.map((msg: AIMessage) => (
            <div 
              key={msg.id} 
              className={`${styles.message} ${styles[msg.role]}`}
            >
              <div className={styles.messageContent}>
                {msg.content}
              </div>
            </div>
          ))
        )}
      </div>
      <div className={styles.inputArea}>
        <input
          className={styles.input}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="向 AI 提问..."
        />
        <button 
          className={styles.sendButton}
          onClick={handleSend}
          disabled={!inputValue.trim()}
        >
          发送
        </button>
      </div>
    </div>
  );
};

export default AIPanel;
