// Step 1: Requirement Input Component

import { useCallback } from 'react';
import { useConfirmationStore } from '@/stores/confirmationStore';
import { useDDDStream } from '@/hooks/useDDDStream';
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
  const setBoundedContexts = useConfirmationStore((s) => s.setBoundedContexts);
  const setContextMermaidCode = useConfirmationStore((s) => s.setContextMermaidCode);

  // DDD Stream hook for SSE API calls
  const {
    thinkingMessages,
    contexts,
    mermaidCode,
    status,
    errorMessage,
    generateContexts,
    abort,
  } = useDDDStream();

  // Handle generate contexts
  const handleGenerate = useCallback(() => {
    if (requirementText.trim()) {
      generateContexts(requirementText);
    }
  }, [requirementText, generateContexts]);

  // Handle generation complete - navigate to step 2
  const handleComplete = useCallback(() => {
    if (contexts.length > 0) {
      // Save to store
      setBoundedContexts(contexts);
      if (mermaidCode) {
        setContextMermaidCode(mermaidCode);
      }
      // Navigate to step 2
      setCurrentStep('context');
      onNavigate(2);
    }
  }, [contexts, mermaidCode, setBoundedContexts, setContextMermaidCode, setCurrentStep, onNavigate]);

  // Check if we can proceed to next step
  const canProceed = boundedContexts.length > 0;

  // Map status to thinking panel status
  const panelStatus = status === 'thinking' ? 'thinking' 
    : status === 'done' ? 'done' 
    : status === 'error' ? 'error' 
    : 'idle';

  return (
    <div className="step-requirement-input">
      {/* Preview Section */}
      <div className="preview-section">
        <PreviewArea
          content={mermaidCode || contextMermaidCode}
          isLoading={status === 'thinking'}
        />
      </div>

      {/* Thinking Section */}
      <div className="thinking-section">
        <ThinkingPanel
          thinkingMessages={thinkingMessages}
          contexts={contexts}
          mermaidCode={mermaidCode || contextMermaidCode}
          status={panelStatus}
          errorMessage={errorMessage}
          onAbort={abort}
        />
      </div>

      {/* Input Section */}
      <div className="input-section">
        <InputArea
          currentStep={1}
          requirementText={requirementText}
          onRequirementChange={setRequirementText}
          onGenerate={handleGenerate}
          isGenerating={status === 'thinking'}
          boundedContexts={contexts}
        />
      </div>

      {/* Auto-navigate when generation completes */}
      {status === 'done' && contexts.length > 0 && !canProceed && (
        <EffectTrigger onComplete={handleComplete} />
      )}
    </div>
  );
}

// Effect trigger component for auto-navigation
import { useEffect, useRef } from 'react';
function EffectTrigger({ onComplete }: { onComplete: () => void }) {
  const calledRef = useRef(false);
  useEffect(() => {
    if (!calledRef.current) {
      calledRef.current = true;
      // Small delay to ensure store is updated
      setTimeout(onComplete, 100);
    }
  }, [onComplete]);
  return null;
}

export default StepRequirementInput;
