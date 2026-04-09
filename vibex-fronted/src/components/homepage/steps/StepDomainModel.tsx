// Step 3: Domain Model Component

import { useCallback } from 'react';
import { useConfirmationStore } from '@/stores/confirmationStore';
import { useDomainModelStream } from '@/hooks/useDDDStream';
import { MermaidPreview } from '@/components/ui/MermaidPreview';
import { ThinkingPanel } from '../ThinkingPanel/ThinkingPanel';
import type { StepComponentProps } from './types';

export function StepDomainModel({ onNavigate, isActive }: StepComponentProps) {
  // Subscribe to store state
  const domainModels = useConfirmationStore((s) => s.domainModels);
  const modelMermaidCode = useConfirmationStore((s) => s.modelMermaidCode);
  const boundedContexts = useConfirmationStore((s) => s.boundedContexts);
  const selectedContextIds = useConfirmationStore((s) => s.selectedContextIds);
  const requirementText = useConfirmationStore((s) => s.requirementText);

  // Store actions
  const setCurrentStep = useConfirmationStore((s) => s.setCurrentStep);
  const setDomainModels = useConfirmationStore((s) => s.setDomainModels);
  const setModelMermaidCode = useConfirmationStore((s) => s.setModelMermaidCode);

  // Domain Model Stream hook
  const {
    thinkingMessages,
    domainModels: generatedModels,
    mermaidCode,
    status,
    errorMessage,
    generateDomainModels,
    abort,
  } = useDomainModelStream();

  // Handle generate domain models
  const handleGenerate = useCallback(() => {
    const selectedContexts = boundedContexts.filter(c => 
      selectedContextIds.includes(c.id)
    );
    if (requirementText && selectedContexts.length > 0) {
      generateDomainModels(requirementText, selectedContexts);
    }
  }, [requirementText, boundedContexts, selectedContextIds, generateDomainModels]);

  // Handle navigation to next step (Business Flow)
  const handleNext = useCallback(() => {
    const models = generatedModels.length > 0 ? generatedModels : domainModels;
    if (models.length > 0) {
      setDomainModels(models);
      if (mermaidCode) {
        setModelMermaidCode(mermaidCode);
      }
      setCurrentStep('flow');
      onNavigate(4);
    }
  }, [generatedModels, domainModels, mermaidCode, setDomainModels, setModelMermaidCode, setCurrentStep, onNavigate]);

  // Handle navigation to previous step
  const handlePrevious = useCallback(() => {
    setCurrentStep('context');
    onNavigate(2);
  }, [setCurrentStep, onNavigate]);

  // Check if we can proceed
  const canProceed = (generatedModels.length > 0 || domainModels.length > 0);

  // Current models to display
  const displayModels = generatedModels.length > 0 ? generatedModels : domainModels;
  const displayMermaid = mermaidCode || modelMermaidCode;

  // Map status to thinking panel status
  const panelStatus = status === 'thinking' ? 'thinking' 
    : status === 'done' ? 'done' 
    : status === 'error' ? 'error' 
    : 'idle';

  return (
    <div className="step-domain-model">
      {/* Preview Section - Domain Model Diagram */}
      <div className="preview-section">
        {status === 'thinking' ? (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.6)', flexDirection: 'column', gap: '12px' }}>
            <div style={{ width: '24px', height: '24px', border: '2px solid rgba(255,255,255,0.2)', borderTopColor: '#00d4ff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <span>AI 正在生成领域模型...</span>
            <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : displayMermaid ? (
          <MermaidPreview code={displayMermaid} diagramType="classDiagram" height="100%" />
        ) : (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.4)' }}>
            生成领域模型后，类图将显示在这里
          </div>
        )}
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

      {/* Domain Models Display */}
      <div className="input-section">
        <div className="domain-model-viewer">
          <h3>领域模型</h3>
          <p className="hint">基于 {selectedContextIds.length} 个限界上下文生成的领域模型</p>
          
          {displayModels.length === 0 ? (
            <div className="empty-state">
              <p>暂无领域模型</p>
              <button 
                className="btn-primary"
                onClick={handleGenerate}
                disabled={status === 'thinking' || selectedContextIds.length === 0}
              >
                {status === 'thinking' ? '生成中...' : '生成领域模型'}
              </button>
            </div>
          ) : (
            <>
              <div className="model-list">
                {displayModels.map((model) => (
                  <div key={model.id} className="model-item">
                    <div className="model-header">
                      <span className="model-name">{model.name}</span>
                      <span className="model-type">{model.type}</span>
                    </div>
                    <div className="model-properties">
                      {model.properties?.map((prop: { name: string; type: string; required: boolean; description?: string }) => (
                        <span key={prop.name} className="property">
                          {prop.name}: {prop.type}
                          {prop.required && <span className="required">*</span>}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

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
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default StepDomainModel;
