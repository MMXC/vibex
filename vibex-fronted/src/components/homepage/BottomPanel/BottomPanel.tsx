/**
 * BottomPanel - 底部面板主容器
 * 规格: 380px 固定高度，内部5个子组件
 * Epic 6: 需求录入、AI交互、项目创建
 */
import React, { useState, useEffect, useCallback } from 'react';
import { CollapseHandle } from './CollapseHandle';
import { BottomPanelInputArea } from './BottomPanelInputArea';
import { ActionBar } from './ActionBar';
import { AIDisplay } from './AIDisplay';
import { QuickAskButtons } from './QuickAskButtons/QuickAskButtons';
import { ChatHistory, type ChatMessage } from './ChatHistory/ChatHistory';
import { useDraft } from './hooks/useDraft';
import styles from './BottomPanel.module.css';

export interface BottomPanelProps {
  /** 是否正在生成 */
  isGenerating?: boolean;
  /** AI 询问回调 */
  onAIAsk?: (message?: string) => void;
  /** 诊断回调 */
  onDiagnose?: () => void;
  /** 优化回调 */
  onOptimize?: () => void;
  /** 历史记录回调 */
  onHistory?: () => void;
  /** 保存回调 */
  onSave?: () => void;
  /** 重新生成回调 */
  onRegenerate?: () => void;
  /** 创建项目回调 */
  onCreateProject?: () => void;
  /** AI 消息发送回调 */
  onSendMessage?: (message: string) => void;
  /** 诊断数量 */
  diagnosisCount?: number;
  /** 优化建议数量 */
  optimizeCount?: number;
  /** 对话澄清轮次 */
  clarificationRounds?: number;
  /** 聊天历史记录（最近10条） */
  chatHistory?: ChatMessage[];
  /** 草稿恢复回调 */
  onDraftRestored?: (text: string) => void;
}

export function BottomPanel({
  isGenerating = false,
  onAIAsk,
  onDiagnose,
  onOptimize,
  onHistory,
  onSave,
  onRegenerate,
  onCreateProject,
  onSendMessage,
  diagnosisCount = 0,
  optimizeCount = 0,
  clarificationRounds = 0,
  chatHistory = [],
  onDraftRestored,
}: BottomPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const { restoreDraft, saveDraft, clearDraft } = useDraft();

  // 组件挂载时恢复草稿
  useEffect(() => {
    const draft = restoreDraft();
    if (draft) {
      setInputValue(draft);
      onDraftRestored?.(draft);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToggle = useCallback(() => {
    setIsCollapsed((v) => !v);
  }, []);

  // ST-6.7: 草稿自动保存（防抖 2s）
  const handleInputChange = useCallback(
    (value: string) => {
      setInputValue(value);
      saveDraft(value);
    },
    [saveDraft]
  );

  // 发送消息
  const handleSend = useCallback(
    (message: string) => {
      // 发送后清除草稿
      clearDraft();
      setInputValue('');
      onSendMessage?.(message);
    },
    [clearDraft, onSendMessage]
  );

  // 快捷询问
  const handleQuickAsk = useCallback(
    (question: string) => {
      onAIAsk?.(question);
    },
    [onAIAsk]
  );

  // 保存草稿（手动）
  const handleManualSave = useCallback(() => {
    saveDraft(inputValue);
    onSave?.();
  }, [inputValue, saveDraft, onSave]);

  // 历史记录展开项点击
  const handleHistoryExpand = useCallback(
    (messageId: string) => {
      const msg = chatHistory.find((m) => m.id === messageId);
      if (msg) {
        setInputValue(msg.content);
        saveDraft(msg.content);
        onHistory?.();
      }
    },
    [chatHistory, saveDraft, onHistory]
  );

  if (isCollapsed) {
    return <CollapseHandle isCollapsed={isCollapsed} onToggle={handleToggle} />;
  }

  return (
    <div
      className={styles.panel}
      data-testid="bottom-panel"
    >
      {/* ST-6.1: 收起/展开手柄 30px */}
      <CollapseHandle isCollapsed={isCollapsed} onToggle={handleToggle} />

      {/* ST-6.4: AI 快捷询问 (5个预设问题) */}
      <QuickAskButtons
        onQuickAsk={handleQuickAsk}
        disabled={isGenerating}
      />

      {/* ST-6.5: 诊断/优化按钮 (AIDisplay) */}
      <AIDisplay
        diagnosisCount={diagnosisCount}
        optimizeCount={optimizeCount}
        clarificationRounds={clarificationRounds}
        onDiagnose={onDiagnose}
        onOptimize={onOptimize}
        onClarify={onAIAsk}
      />

      {/* ST-6.2: 需求录入 TextArea (5000字) + ST-6.3 发送按钮 + ST-6.10 Ctrl+Enter */}
      <BottomPanelInputArea
        defaultValue={inputValue}
        onChange={handleInputChange}
        onSend={handleSend}
        disabled={isGenerating}
        isSending={isGenerating}
      />

      {/* ST-6.6: 历史记录 (最近10条) */}
      <ChatHistory
        messages={chatHistory.slice(-10)}
        maxItems={10}
        onExpand={handleHistoryExpand}
        disabled={isGenerating}
      />

      {/* ST-6.7: 保存 + ST-6.8: 重新生成 + ST-6.9: 创建项目 */}
      <ActionBar
        isGenerating={isGenerating}
        onAIAsk={() => onAIAsk?.()}
        onDiagnose={onDiagnose}
        onOptimize={onOptimize}
        onHistory={onHistory}
        onSave={handleManualSave}
        onRegenerate={onRegenerate}
        onCreateProject={onCreateProject}
      />
    </div>
  );
}

export default BottomPanel;
