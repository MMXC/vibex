/**
 * MacroRecorder — S92-E1: Canvas Workflow Automation
 *
 * Captures canvas operations during recording mode.
 * Wraps the canvas to intercept node/edge mutations and record them as steps.
 *
 * Usage: Wrap the canvas content with <MacroRecorder canvasId={id}>…</MacroRecorder>
 * When store.recordingState !== 'idle', operations are intercepted and recorded.
 */
import React, { useEffect, useRef } from 'react';
import { useMacroStore } from '@/stores/macroStore';
import type { MacroStep, MacroStepType } from '@/stores/macroStore';

interface MacroRecorderProps {
  canvasId: string;
  children: React.ReactNode;
  /** Hook for intercepting canvas mutations (DDSCanvasStore etc.) */
  onInterceptMutation?: (
    type: MacroStepType,
    data: Record<string, unknown>
  ) => void;
}

/**
 * MacroRecorder — injects recording logic into the canvas pipeline.
 *
 * When recording is active:
 * - Listens for canvas mutation events
 * - Converts them to MacroStep entries
 * - Calls store.addStep() to append to current recording
 *
 * Components within the canvas should emit 'canvas-macro-step' custom events
 * with { type, data } payload to participate in recording.
 */
export function MacroRecorder({ canvasId, children, onInterceptMutation }: MacroRecorderProps) {
  const { recordingState, addStep } = useMacroStore();
  const isRecordingRef = useRef(false);

  useEffect(() => {
    isRecordingRef.current = recordingState === 'recording';
  }, [recordingState]);

  useEffect(() => {
    if (recordingState !== 'recording') return;

    const handleMutation = (event: Event) => {
      if (!isRecordingRef.current) return;
      const customEvent = event as CustomEvent<{ type: MacroStepType; data: Record<string, unknown> }>;
      const { type, data } = customEvent.detail;

      const step: MacroStep = {
        type,
        timestamp: Date.now(),
        data: { ...data },
      };

      addStep(step);
      onInterceptMutation?.(type, data);
    };

    // Listen for canvas macro mutation events
    const element = document.getElementById(`canvas-${canvasId}`) || document;
    element.addEventListener('canvas-macro-step', handleMutation as EventListener);

    return () => {
      element.removeEventListener('canvas-macro-step', handleMutation as EventListener);
    };
  }, [canvasId, recordingState, addStep, onInterceptMutation]);

  return <>{children}</>;
}

/**
 * Helper: dispatch a macro step from within the canvas
 * Call this from your canvas mutation handlers when recording is active.
 */
export function dispatchMacroStep(
  canvasId: string,
  type: MacroStepType,
  data: Record<string, unknown>
) {
  const element = document.getElementById(`canvas-${canvasId}`) || document;
  element.dispatchEvent(
    new CustomEvent('canvas-macro-step', {
      detail: { type, data },
      bubbles: true,
    })
  );
}
