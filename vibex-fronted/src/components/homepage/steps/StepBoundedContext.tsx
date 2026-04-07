// Step 2: Bounded Context Component

import { useCallback, useState } from 'react';
import { useConfirmationStore } from '@/stores/confirmationStore';
import { PreviewArea } from '../PreviewArea/PreviewArea';
import { ThinkingPanel } from '../ThinkingPanel/ThinkingPanel';
import type { StepComponentProps } from './types';
import type { BoundedContext } from '@/services/api/types/prototype/domain';

export function StepBoundedContext({ onNavigate, isActive }: StepComponentProps) {
  // Subscribe to store state
  const requirementText = useConfirmationStore((s) => s.requirementText);
  const boundedContexts = useConfirmationStore((s) => s.boundedContexts);
  const selectedContextIds = useConfirmationStore((s) => s.selectedContextIds);
  const contextMermaidCode = useConfirmationStore((s) => s.contextMermaidCode);

  // Local state for selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(selectedContextIds)
  );

  // Store actions
  const setCurrentStep = useConfirmationStore((s) => s.setCurrentStep);
  const setSelectedContextIds = useConfirmationStore((s) => s.setSelectedContextIds);
  const setContextMermaidCode = useConfirmationStore((s) => s.setContextMermaidCode);

  // Handle context selection
  const handleContextToggle = useCallback((contextId: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(contextId)) {
        newSet.delete(contextId);
      } else {
        newSet.add(contextId);
      }
      setSelectedContextIds(Array.from(newSet));
      return newSet;
    });
  }, [setSelectedContextIds]);

  // Handle navigation to next step (Domain Model)
  const handleNext = useCallback(() => {
    if (selectedIds.size > 0) {
      setCurrentStep('model');
      onNavigate(3);
    }
  }, [selectedIds, setCurrentStep, onNavigate]);

  // Handle navigation to previous step
  const handlePrevious = useCallback(() => {
    setCurrentStep('input');
    onNavigate(1);
  }, [setCurrentStep, onNavigate]);

  // Check if we can proceed
  const canProceed = selectedIds.size > 0;

  return (
    <div className="step-bounded-context">
      {/* Preview Section - Context Diagram */}
      <div className="preview-section">
        <PreviewArea
          content={contextMermaidCode}
          isLoading={false}
        />
      </div>

      {/* Thinking Section */}
      <div className="thinking-section">
        <ThinkingPanel
          thinkingMessages={[]}
          contexts={boundedContexts}
          mermaidCode={contextMermaidCode}
          status="idle"
          errorMessage={null}
        />
      </div>

      {/* Context Selection */}
      <div className="input-section">
        <div className="context-selector">
          <h3>选择限界上下文</h3>
          <p className="hint">选择要用于生成领域模型的上下文</p>
          
          <div className="context-list">
            {boundedContexts.map((context) => (
              <div
                key={context.id}
                className={`context-item ${selectedIds.has(context.id) ? 'selected' : ''}`}
                onClick={() => handleContextToggle(context.id)}
              >
                <input
                  type="checkbox"
                  checked={selectedIds.has(context.id)}
                  onChange={() => handleContextToggle(context.id)}
                />
                <div className="context-info">
                  <span className="context-name">{context.name}</span>
                  <span className="context-type">{context.type}</span>
                  <span className="context-desc">{context.description}</span>
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
              生成领域模型 →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StepBoundedContext;
