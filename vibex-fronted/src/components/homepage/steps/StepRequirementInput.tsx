// Step 1: Requirement Input Component

import { useCallback } from 'react';
import { useConfirmationStore } from '@/stores/confirmationStore';
import { PreviewArea } from '../PreviewArea/PreviewArea';
import { ThinkingPanel } from '../ThinkingPanel/ThinkingPanel';
import { InputArea } from '../InputArea/InputArea';
import type { StepComponentProps } from './types';

export function StepRequirementInput({ onNavigate, isActive }: StepComponentProps) {
  // Subscribe to store state
  const requirementText = useConfirmationStore((s) => s.requirementText);
  const setRequirementText = useConfirmationStore((s) => s.setRequirementText);
  const contextMermaidCode = useConfirmationStore((s) => s.contextMermaidCode);
  const boundedContexts = useConfirmationStore((s) => s.boundedContexts);

  // Get actions from store
  const setCurrentStep = useConfirmationStore((s) => s.setCurrentStep);
  const goToNextStep = useConfirmationStore((s) => s.goToNextStep);

  // Handle navigation to next step
  const handleNext = useCallback(() => {
    if (boundedContexts.length > 0) {
      setCurrentStep('context');
      onNavigate(2);
    }
  }, [boundedContexts, setCurrentStep, onNavigate]);

  // Check if we can proceed to next step
  const canProceed = boundedContexts.length > 0;

  return (
    <div className="step-requirement-input">
      {/* Preview Section */}
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

      {/* Input Section */}
      <div className="input-section">
        <InputArea
          currentStep={1}
          requirementText={requirementText}
          onRequirementChange={setRequirementText}
          onGenerate={handleNext}
          isGenerating={false}
          boundedContexts={boundedContexts}
        />
      </div>
    </div>
  );
}

export default StepRequirementInput;
