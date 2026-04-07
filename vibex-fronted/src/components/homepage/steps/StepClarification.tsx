// Step 4: Clarification Component - AI 需求澄清
// 在生成领域模型后，用户可以进行 AI 追问和需求澄清

import { useState, useCallback, useEffect, useRef } from 'react';
import { useConfirmationStore, type ClarificationRound } from '@/stores/confirmationStore';
import { useDesignStore } from '@/stores/designStore';
import { clarificationApi, type ChatResponse } from '@/lib/api/clarificationApi';
import type { StepComponentProps } from './types';
import styles from './StepClarification.module.css';

export function StepClarification({ onNavigate }: StepComponentProps) {
  // Subscribe to store state
  const domainModels = useConfirmationStore((s) => s.domainModels);
  const modelMermaidCode = useConfirmationStore((s) => s.modelMermaidCode);
  const requirementText = useConfirmationStore((s) => s.requirementText);
  const boundedContexts = useConfirmationStore((s) => s.boundedContexts);
  const selectedContextIds = useConfirmationStore((s) => s.selectedContextIds);
  const clarificationRounds = useConfirmationStore((s) => s.clarificationRounds);
  
  // Store actions
  const setCurrentStep = useConfirmationStore((s) => s.setCurrentStep);
  const addClarificationRound = useConfirmationStore((s) => s.addClarificationRound);
  const acceptClarificationRound = useConfirmationStore((s) => s.acceptClarificationRound);
  
  // Design store actions (for sync bridge)
  const addDesignClarificationRound = useDesignStore((s) => s.addClarificationRound);
  
  // Local state
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, clarificationRounds]);

  // Build context for API
  const buildContext = useCallback(() => {
    const selectedContexts = boundedContexts.filter(c => 
      selectedContextIds.includes(c.id)
    );
    return {
      requirementText,
      domainModels: domainModels.map(m => ({
        name: m.name,
        type: m.type,
        properties: m.properties.map((p: { name: string; type: string; required: boolean; description?: string }) => ({ name: p.name, type: p.type })),
      })),
      boundedContexts: selectedContexts.map(c => ({
        name: c.name,
        description: c.description,
      })),
      mermaidCode: modelMermaidCode,
    };
  }, [requirementText, domainModels, boundedContexts, selectedContextIds, modelMermaidCode]);

  // Handle send message
  const handleSend = useCallback(async () => {
    if (!inputMessage.trim() || isLoading) return;
    
    const userMessage = inputMessage.trim();
    setInputMessage('');
    setError(null);
    setIsLoading(true);
    
    // Add user message to chat history
    const newHistory = [...chatHistory, { role: 'user' as const, content: userMessage }];
    setChatHistory(newHistory);
    
    try {
      const response = await clarificationApi.continueClarification(userMessage, newHistory.slice(0, -1));
      
      if (response.error) {
        setError(response.error);
        setChatHistory(prev => prev.slice(0, -1));
      } else {
        // Add assistant response to chat history
        setChatHistory(prev => [...prev, { role: 'assistant' as const, content: response.reply }]);
        
        // Add clarification round to store
        const round: ClarificationRound = {
          id: `clarification-${Date.now()}`,
          question: userMessage,
          answer: response.reply,
          timestamp: Date.now(),
          isAccepted: false,
        };
        addClarificationRound(round);
        
        // Sync to designStore
        addDesignClarificationRound({
          id: round.id,
          question: round.question,
          answer: round.answer,
          timestamp: round.timestamp,
          isAccepted: round.isAccepted ?? false,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '发送失败');
      setChatHistory(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  }, [inputMessage, isLoading, chatHistory, addClarificationRound, addDesignClarificationRound]);

  // Handle key press (Enter to send)
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  // Handle accept clarification
  const handleAccept = useCallback((roundId: string) => {
    acceptClarificationRound(roundId);
  }, [acceptClarificationRound]);

  // Handle skip / proceed to flow
  const handleProceed = useCallback(() => {
    setCurrentStep('flow');
    onNavigate(5);
  }, [setCurrentStep, onNavigate]);

  // Handle go back
  const handlePrevious = useCallback(() => {
    setCurrentStep('model');
    onNavigate(3);
  }, [setCurrentStep, onNavigate]);

  // Check if we have domain models to clarify
  const hasDomainModels = domainModels.length > 0;

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h3>💬 需求澄清</h3>
        <p className={styles.description}>
          基于已生成的领域模型，您可以向 AI 追问任何关于需求的问题
        </p>
      </div>

      {/* Chat Messages */}
      <div className={styles.chatArea}>
        {chatHistory.length === 0 && clarificationRounds.length === 0 && (
          <div className={styles.emptyState}>
            <p>暂无对话记录</p>
            <p className={styles.hint}>
              {hasDomainModels 
                ? '开始询问关于领域模型的问题吧！' 
                : '请先生成领域模型后再进行澄清'}
            </p>
          </div>
        )}

        {/* Initial AI prompt if no history */}
        {chatHistory.length === 0 && clarificationRounds.length === 0 && hasDomainModels && (
          <div className={`${styles.message} assistant`}>
            <div className={styles.messageAvatar}>🤖</div>
            <div className={styles.messageContent}>
              <p>我已根据您的需求生成了 {domainModels.length} 个领域模型。</p>
              <p>您可以询问：</p>
              <ul>
                <li>这些模型之间的关系是什么？</li>
                <li>某个实体有哪些属性？</li>
                <li>如何实现某个功能？</li>
              </ul>
            </div>
          </div>
        )}

        {/* Chat history messages */}
        {chatHistory.map((msg, idx) => (
          <div key={idx} className={`${styles.message} ${msg.role}`}>
            <div className={styles.messageAvatar}>
              {msg.role === 'user' ? '👤' : '🤖'}
            </div>
            <div className={styles.messageContent}>
              <p>{msg.content}</p>
            </div>
          </div>
        ))}

        {/* Clarification rounds from store */}
        {clarificationRounds.map((round) => (
          <div key={round.id} className={`${styles.roundCard} ${round.isAccepted ? styles.accepted : ''}`}>
            <div className={styles.roundHeader}>
              <span className={styles.roundLabel}>第 {clarificationRounds.indexOf(round) + 1} 轮</span>
              {round.isAccepted && <span className={styles.acceptedBadge}>已采纳</span>}
            </div>
            <div className={styles.roundQuestion}>
              <strong>问：</strong>{round.question}
            </div>
            <div className={styles.roundAnswer}>
              <strong>答：</strong>{round.answer}
            </div>
            {!round.isAccepted && (
              <button 
                className={styles.acceptButton}
                onClick={() => handleAccept(round.id)}
              >
                采纳此回答
              </button>
            )}
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className={`${styles.message} assistant`}>
            <div className={styles.messageAvatar}>🤖</div>
            <div className={styles.messageContent}>
              <div className={styles.typing}>
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Error message */}
      {error && (
        <div className={styles.error}>
          ⚠️ {error}
        </div>
      )}

      {/* Input Area */}
      <div className={styles.inputArea}>
        <textarea
          className={styles.input}
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="输入您的问题，按 Enter 发送..."
          disabled={isLoading || !hasDomainModels}
          rows={2}
        />
        <button 
          className={styles.sendButton}
          onClick={handleSend}
          disabled={isLoading || !inputMessage.trim() || !hasDomainModels}
        >
          发送
        </button>
      </div>

      {/* Navigation Buttons */}
      <div className={styles.actions}>
        <button 
          className={styles.backButton}
          onClick={handlePrevious}
        >
          ← 上一步
        </button>
        <button 
          className={styles.skipButton}
          onClick={handleProceed}
        >
          跳过，直接生成业务流程 →
        </button>
      </div>
    </div>
  );
}

export default StepClarification;
