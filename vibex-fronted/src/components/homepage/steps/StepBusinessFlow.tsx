// Step 4: Business Flow Component

import { useCallback } from 'react';
import { useConfirmationStore, type BusinessFlow as ConfirmationBusinessFlow } from '@/stores/confirmationStore';
import { useBusinessFlowStream } from '@/hooks/useDDDStream';
import { PreviewArea } from '../PreviewArea/PreviewArea';
import { ThinkingPanel } from '../ThinkingPanel/ThinkingPanel';
import type { StepComponentProps } from './types';

// Union type combining both BusinessFlow variants - use any for simplicity
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyBusinessFlow = any;

export function StepBusinessFlow({ onNavigate, isActive }: StepComponentProps) {
  // Subscribe to store state
  const businessFlow = useConfirmationStore((s) => s.businessFlow);
  const flowMermaidCode = useConfirmationStore((s) => s.flowMermaidCode);
  const domainModels = useConfirmationStore((s) => s.domainModels);
  const boundedContexts = useConfirmationStore((s) => s.boundedContexts);
  const requirementText = useConfirmationStore((s) => s.requirementText);

  // Store actions
  const setCurrentStep = useConfirmationStore((s) => s.setCurrentStep);
  const setBusinessFlow = useConfirmationStore((s) => s.setBusinessFlow);
  const setFlowMermaidCode = useConfirmationStore((s) => s.setFlowMermaidCode);

  // Business Flow Stream hook
  const {
    thinkingMessages,
    businessFlow: generatedFlow,
    mermaidCode,
    status,
    errorMessage,
    generateBusinessFlow,
    abort,
  } = useBusinessFlowStream();

  // Handle generate business flow
  const handleGenerate = useCallback(() => {
    if (domainModels.length > 0) {
      generateBusinessFlow(domainModels, requirementText);
    }
  }, [domainModels, requirementText, generateBusinessFlow]);

  // Handle navigation to next step (Project Create)
  const handleNext = useCallback(() => {
    const flow = generatedFlow || businessFlow;
    if (flow && 'states' in flow && (flow as { states?: unknown }).states && (flow as { states: { length: number } }).states.length > 0) {
      setBusinessFlow(flow as unknown as import("@/stores/confirmationStore").BusinessFlow);
      if (mermaidCode) {
        setFlowMermaidCode(mermaidCode);
      }
      setCurrentStep('success');
      onNavigate(5);
    }
  }, [generatedFlow, businessFlow, mermaidCode, setBusinessFlow, setFlowMermaidCode, setCurrentStep, onNavigate]);

  // Handle navigation to previous step
  const handlePrevious = useCallback(() => {
    setCurrentStep('model');
    onNavigate(3);
  }, [setCurrentStep, onNavigate]);

  // Check if we can proceed
  const currentFlow = generatedFlow || businessFlow;
  const canProceed = (currentFlow as AnyBusinessFlow).states && (currentFlow as AnyBusinessFlow).states.length > 0;

  // Current flow to display
  const displayFlow = (generatedFlow || businessFlow) as AnyBusinessFlow;
  const displayMermaid = mermaidCode || flowMermaidCode;

  // Map status to thinking panel status
  const panelStatus = status === 'thinking' ? 'thinking' 
    : status === 'done' ? 'done' 
    : status === 'error' ? 'error' 
    : 'idle';

  return (
    <div className="step-business-flow">
      {/* Preview Section - Flow Diagram */}
      <div className="preview-section">
        <PreviewArea
          content={displayMermaid}
          isLoading={status === 'thinking'}
        />
      </div>

      {/* Thinking Section */}
      <div className="thinking-section">
        <ThinkingPanel
          thinkingMessages={thinkingMessages}
          contexts={boundedContexts}
          mermaidCode={displayMermaid}
          status={panelStatus}
          errorMessage={errorMessage}
          onAbort={abort}
        />
      </div>

      {/* Business Flow Display */}
      <div className="input-section">
        <div className="business-flow-viewer">
          <h3>业务流程</h3>
          <p className="hint">基于 {domainModels.length} 个领域模型生成的业务流程</p>
          
          {!canProceed ? (
            <div className="empty-state">
              <p>暂无业务流程</p>
              <button 
                className="btn-primary"
                onClick={handleGenerate}
                disabled={status === 'thinking' || domainModels.length === 0}
              >
                {status === 'thinking' ? '生成中...' : '生成业务流程'}
              </button>
            </div>
          ) : (
            <div className="flow-details">
              <div className="flow-header">
                <span className="flow-name">{displayFlow.name}</span>
              </div>
              
              <div className="states-section">
                <h4>状态</h4>
                <div className="states-list">
                  {displayFlow.states?.map((state: { id: string; name: string; type: string; description: string }) => (
                    <div key={state.id} className={`state-item state-${state.type}`}>
                      <span className="state-name">{state.name}</span>
                      <span className="state-type">{state.type}</span>
                      <span className="state-desc">{state.description}</span>
                    </div>
                  ))}
                </div>
              </div>

              {displayFlow.transitions && displayFlow.transitions.length > 0 && (
                <div className="transitions-section">
                  <h4>转换</h4>
                  <div className="transitions-list">
                    {displayFlow.transitions.map((transition: { id: string; fromStateId: string; toStateId: string; event: string; condition?: string }) => (
                      <div key={transition.id} className="transition-item">
                        <span className="from">{transition.fromStateId}</span>
                        <span className="arrow">→</span>
                        <span className="to">{transition.toStateId}</span>
                        <span className="event">{transition.event}</span>
                        {transition.condition && (
                          <span className="condition">[{transition.condition}]</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="actions">
                <button 
                  className="btn-secondary"
                  onClick={handlePrevious}
                >
                  ← 上一步
                </button>
                <button
                  className="btn-primary"
                  onClick={handleNext}
                  disabled={!canProceed}
                >
                  创建项目 →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default StepBusinessFlow;
