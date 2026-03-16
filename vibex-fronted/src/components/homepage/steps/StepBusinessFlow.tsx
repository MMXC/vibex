// Step 4: Business Flow Component

import { useCallback } from 'react';
import { useConfirmationStore } from '@/stores/confirmationStore';
import { PreviewArea } from '../PreviewArea/PreviewArea';
import { ThinkingPanel } from '../ThinkingPanel/ThinkingPanel';
import type { StepComponentProps } from './types';

export function StepBusinessFlow({ onNavigate, isActive }: StepComponentProps) {
  // Subscribe to store state
  const businessFlow = useConfirmationStore((s) => s.businessFlow);
  const flowMermaidCode = useConfirmationStore((s) => s.flowMermaidCode);
  const domainModels = useConfirmationStore((s) => s.domainModels);

  // Store actions
  const setCurrentStep = useConfirmationStore((s) => s.setCurrentStep);

  // Handle navigation to next step (Project Create)
  const handleNext = useCallback(() => {
    if (businessFlow.states && businessFlow.states.length > 0) {
      setCurrentStep('success');
      onNavigate(5);
    }
  }, [businessFlow, setCurrentStep, onNavigate]);

  // Handle navigation to previous step
  const handlePrevious = useCallback(() => {
    setCurrentStep('model');
    onNavigate(3);
  }, [setCurrentStep, onNavigate]);

  // Check if we can proceed
  const canProceed = businessFlow.states && businessFlow.states.length > 0;

  return (
    <div className="step-business-flow">
      {/* Preview Section - Flow Diagram */}
      <div className="preview-section">
        <PreviewArea
          content={flowMermaidCode}
          isLoading={false}
        />
      </div>

      {/* Thinking Section */}
      <div className="thinking-section">
        <ThinkingPanel
          thinkingMessages={[]}
          contexts={[]}
          mermaidCode={flowMermaidCode}
          status="idle"
          errorMessage={null}
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
              <p>请返回上一步生成业务流程</p>
            </div>
          ) : (
            <div className="flow-details">
              <div className="flow-header">
                <span className="flow-name">{businessFlow.name}</span>
              </div>
              
              <div className="states-section">
                <h4>状态</h4>
                <div className="states-list">
                  {businessFlow.states?.map((state) => (
                    <div key={state.id} className={`state-item state-${state.type}`}>
                      <span className="state-name">{state.name}</span>
                      <span className="state-type">{state.type}</span>
                      <span className="state-desc">{state.description}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="transitions-section">
                <h4>转换</h4>
                <div className="transitions-list">
                  {businessFlow.transitions?.map((transition) => (
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
      </div>
    </div>
  );
}

export default StepBusinessFlow;
