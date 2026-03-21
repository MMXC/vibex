/**
 * BottomPanel - 底部面板主容器
 * 规格: 380px 固定高度，内部4个子组件
 */
import React, { useState } from 'react';
import { CollapseHandle } from './CollapseHandle';
import { BottomPanelInputArea } from './BottomPanelInputArea';
import { ActionBar } from './ActionBar';
import { AIDisplay } from './AIDisplay';
import styles from './BottomPanel.module.css';

export interface BottomPanelProps {
  /** 是否正在生成 */
  isGenerating?: boolean;
  /** AI 询问回调 */
  onAIAsk?: () => void;
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
}: BottomPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleToggle = () => setIsCollapsed((v) => !v);

  const handleSend = (message: string) => {
    onSendMessage?.(message);
  };

  if (isCollapsed) {
    return <CollapseHandle isCollapsed={isCollapsed} onToggle={handleToggle} />;
  }

  return (
    <div
      className={styles.panel}
      data-testid="bottom-panel"
    >
      <CollapseHandle isCollapsed={isCollapsed} onToggle={handleToggle} />
      <AIDisplay
        diagnosisCount={diagnosisCount}
        optimizeCount={optimizeCount}
        clarificationRounds={clarificationRounds}
        onDiagnose={onDiagnose}
        onOptimize={onOptimize}
        onClarify={onAIAsk}
      />
      <BottomPanelInputArea
        onSend={handleSend}
        disabled={isGenerating}
        isSending={isGenerating}
      />
      <ActionBar
        isGenerating={isGenerating}
        onAIAsk={onAIAsk}
        onDiagnose={onDiagnose}
        onOptimize={onOptimize}
        onHistory={onHistory}
        onSave={onSave}
        onRegenerate={onRegenerate}
        onCreateProject={onCreateProject}
      />
    </div>
  );
}

export default BottomPanel;
