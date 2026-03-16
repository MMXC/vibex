// Step 3: Domain Model Component

import { useCallback } from 'react';
import { useConfirmationStore } from '@/stores/confirmationStore';
import { PreviewArea } from '../PreviewArea/PreviewArea';
import { ThinkingPanel } from '../ThinkingPanel/ThinkingPanel';
import type { StepComponentProps } from './types';

export function StepDomainModel({ onNavigate, isActive }: StepComponentProps) {
  // Subscribe to store state
  const domainModels = useConfirmationStore((s) => s.domainModels);
  const modelMermaidCode = useConfirmationStore((s) => s.modelMermaidCode);
  const boundedContexts = useConfirmationStore((s) => s.boundedContexts);
  const selectedContextIds = useConfirmationStore((s) => s.selectedContextIds);

  // Store actions
  const setCurrentStep = useConfirmationStore((s) => s.setCurrentStep);

  // Handle navigation to next step (Business Flow)
  const handleNext = useCallback(() => {
    if (domainModels.length > 0) {
      setCurrentStep('flow');
      onNavigate(4);
    }
  }, [domainModels, setCurrentStep, onNavigate]);

  // Handle navigation to previous step
  const handlePrevious = useCallback(() => {
    setCurrentStep('context');
    onNavigate(2);
  }, [setCurrentStep, onNavigate]);

  // Check if we can proceed
  const canProceed = domainModels.length > 0;

  return (
    <div className="step-domain-model">
      {/* Preview Section - Domain Model Diagram */}
      <div className="preview-section">
        <PreviewArea
          content={modelMermaidCode}
          isLoading={false}
        />
      </div>

      {/* Thinking Section */}
      <div className="thinking-section">
        <ThinkingPanel
          thinkingMessages={[]}
          contexts={boundedContexts}
          mermaidCode={modelMermaidCode}
          status="idle"
          errorMessage={null}
        />
      </div>

      {/* Domain Models Display */}
      <div className="input-section">
        <div className="domain-model-viewer">
          <h3>领域模型</h3>
          <p className="hint">基于 {selectedContextIds.length} 个限界上下文生成的领域模型</p>
          
          {domainModels.length === 0 ? (
            <div className="empty-state">
              <p>暂无领域模型</p>
              <p>请返回上一步生成领域模型</p>
            </div>
          ) : (
            <div className="model-list">
              {domainModels.map((model) => (
                <div key={model.id} className="model-item">
                  <div className="model-header">
                    <span className="model-name">{model.name}</span>
                    <span className="model-type">{model.type}</span>
                  </div>
                  <div className="model-properties">
                    {model.properties.map((prop) => (
                      <span key={prop.name} className="property">
                        {prop.name}: {prop.type}
                        {prop.required && <span className="required">*</span>}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
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
              生成业务流程 →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StepDomainModel;
