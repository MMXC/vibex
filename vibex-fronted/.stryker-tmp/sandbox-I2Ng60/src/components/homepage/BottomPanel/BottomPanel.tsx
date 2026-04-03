/**
 * BottomPanel - 底部面板主容器
 * 规格: 380px 固定高度，内部5个子组件
 * Epic 6: 需求录入、AI交互、项目创建
 * E3-S3.2: 快捷键支持 (Ctrl+S 保存, Ctrl+Z 撤销, Ctrl+Shift+Z 重做, Ctrl+P 预览)
 */
// @ts-nocheck

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { CollapseHandle } from './CollapseHandle';
import { BottomPanelInputArea } from './BottomPanelInputArea';
import { ActionBar } from './ActionBar';
import { AIDisplay } from './AIDisplay';
import { QuickAskButtons } from './QuickAskButtons/QuickAskButtons';
import { ChatHistory, type ChatMessage } from './ChatHistory/ChatHistory';
import { useDraft } from './hooks/useDraft';
import { useToast } from '@/components/ui/Toast';
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
  onHistory?: (messageId?: string) => void;
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
  /** 收起/展开回调（通知父组件） */
  onCollapseToggle?: (collapsed: boolean) => void;
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
  onCollapseToggle,
}: BottomPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  // E3-S3.2: 撤销/重做栈（用于 Ctrl+Z / Ctrl+Shift+Z）
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);
  const { restoreDraft, saveDraft, clearDraft } = useDraft();
  const { showToast } = useToast();
  // 记录 inputValue 是否已入栈（避免重复入栈）
  const lastPushedRef = useRef<string>('');

  // 组件挂载时恢复草稿
  useEffect(() => {
    const draft = restoreDraft();
    if (draft) {
      setInputValue(draft);
      onDraftRestored?.(draft);
      lastPushedRef.current = draft;
    }
     
  }, []);

  // 用于在 useEffect 中访问最新回调（避免循环依赖）
  const saveCallbackRef = useRef<(() => void) | null>(null);
  const inputValueRef = useRef(inputValue);
  const chatHistoryRef = useRef(chatHistory);

  // E2-S3: 更新 refs（必须在 useEffect 中，不能在渲染期间）
  useEffect(() => {
    inputValueRef.current = inputValue;
    chatHistoryRef.current = chatHistory;
  }, [inputValue, chatHistory]);

  // E3-S3.2: 快捷键绑定 (Ctrl+S 保存, Ctrl+Z 撤销, Ctrl+Shift+Z 重做, Ctrl+P 预览)
  // 注意: 此 useEffect 必须在 handleManualSave 定义之后
  useEffect(() => {
    let ignoreNextInput = false;

    const handleKeyDown = (e: KeyboardEvent) => {
      // 忽略在 input/textarea 中的快捷键（让浏览器默认行为生效）
      const target = e.target as HTMLElement;
      const isInputArea =
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'INPUT' ||
        target.isContentEditable;

      // Ctrl+S: 保存
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveCallbackRef.current?.();
        return;
      }

      // Ctrl+P: 预览模式切换
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        setIsPreviewMode((prev) => {
          const next = !prev;
          showToast(next ? '预览模式已开启' : '预览模式已关闭', 'info');
          return next;
        });
        return;
      }

      // Ctrl+Z: 撤销（恢复上一条历史消息到输入框）
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'z') {
        if (isInputArea) return; // 在输入区让浏览器处理
        e.preventDefault();
        const currentHistory = chatHistoryRef.current;
        if (currentHistory.length === 0) {
          showToast('无可撤销', 'warning');
          return;
        }
        const currentValue = inputValueRef.current;
        // 将当前输入框内容入 redo 栈
        if (currentValue && currentValue !== lastPushedRef.current) {
          setRedoStack((prev) => [currentValue, ...prev]);
        }
        // 取出最近一条历史消息
        const lastMsg = currentHistory[currentHistory.length - 1];
        if (lastMsg) {
          setInputValue(lastMsg.content);
          saveDraft(lastMsg.content);
          lastPushedRef.current = lastMsg.content;
          onHistory?.(lastMsg.id);
          showToast('已撤销', 'success');
          // 标记接下来由 onHistory 触发的 setInputValue 忽略
          ignoreNextInput = true;
        }
        return;
      }

      // Ctrl+Shift+Z 或 Ctrl+Y: 重做
      if (
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') ||
        ((e.ctrlKey || e.metaKey) && e.key === 'y')
      ) {
        if (isInputArea) return;
        e.preventDefault();
        setRedoStack((prev) => {
          if (prev.length === 0) {
            showToast('无可重做', 'warning');
            return prev;
          }
          const [next, ...rest] = prev;
          const currentValue = inputValueRef.current;
          // 将当前内容入 undo 栈
          if (currentValue) {
            setUndoStack((undoPrev) => [...undoPrev, currentValue]);
          }
          setInputValue(next);
          saveDraft(next);
          lastPushedRef.current = next;
          showToast('已重做', 'success');
          return rest;
        });
        return;
      }
    };

    const handleInput = (e: Event) => {
      if (ignoreNextInput) {
        ignoreNextInput = false;
        return;
      }
      // 用户在新输入时清空 redo 栈
      const newVal = (e.target as HTMLTextAreaElement).value;
      if (newVal !== lastPushedRef.current) {
        setRedoStack([]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    const textarea = document.querySelector('[data-testid="requirement-input"]') as HTMLTextAreaElement | null;
    textarea?.addEventListener('input', handleInput);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      textarea?.removeEventListener('input', handleInput);
    };
     
  }, [saveDraft, showToast, onHistory]);

  const handleToggle = useCallback(() => {
    setIsCollapsed((v) => {
      const next = !v;
      onCollapseToggle?.(next);
      return next;
    });
  }, [onCollapseToggle]);

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

  // E2-S3: 同步 handleManualSave 到 ref（供 useEffect 使用）
  useEffect(() => {
    saveCallbackRef.current = handleManualSave;
  }, [handleManualSave]);

  // 历史记录展开项点击 (E3-S3.2: 入栈管理)
  const handleHistoryExpand = useCallback(
    (messageId: string) => {
      const msg = chatHistory.find((m) => m.id === messageId);
      if (msg) {
        // 当前内容入 redo，清空 redo 栈（用户选择历史 = 放弃当前编辑）
        if (inputValue) {
          setRedoStack([]);
        }
        setInputValue(msg.content);
        saveDraft(msg.content);
        lastPushedRef.current = msg.content;
        onHistory?.();
      }
    },
    [chatHistory, inputValue, saveDraft, onHistory]
  );

  if (isCollapsed) {
    return <CollapseHandle isCollapsed={isCollapsed} onToggle={handleToggle} />;
  }

  return (
    <div
      className={`${styles.panel} ${isPreviewMode ? styles.previewMode : ''}`}
      data-testid="bottom-panel"
      aria-label={isPreviewMode ? '预览模式' : undefined}
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
