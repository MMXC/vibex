/**
 * MacroPlayer — S92-E1: Canvas Workflow Automation
 *
 * Executes a macro's steps against the current canvas.
 * Steps are resolved server-side (param substitution) and then
 * applied to the canvas store by the parent component.
 */
import React, { useState } from 'react';
import { useMacroStore, type CanvasMacro } from '@/stores/macroStore';

interface MacroPlayerProps {
  macro: CanvasMacro;
  targetCanvasId: string;
  onExecuted?: (stepsExecuted: number) => void;
}

export function MacroPlayer({ macro, targetCanvasId, onExecuted }: MacroPlayerProps) {
  const { replayMacro } = useMacroStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ ok: boolean; stepsExecuted?: number; error?: string } | null>(null);

  const handlePlay = async () => {
    setLoading(true);
    setError(null);
    const replayResult = await replayMacro(macro.id, targetCanvasId);
    setResult(replayResult);
    setLoading(false);
    if (replayResult.ok && replayResult.stepsExecuted !== undefined) {
      onExecuted?.(replayResult.stepsExecuted);
    } else if (replayResult.error) {
      setError(replayResult.error);
    }
  };

  if (loading) {
    return <span style={{ fontSize: 12, color: 'var(--color-text-secondary, #a1a1aa)' }}>Executing…</span>;
  }

  return (
    <div>
      <button
        onClick={handlePlay}
        style={{
          padding: '4px 10px',
          border: 'none',
          borderRadius: 5,
          background: 'var(--color-primary, #6366f1)',
          color: '#fff',
          fontSize: 12,
          fontWeight: 500,
          cursor: 'pointer',
        }}
        data-testid={`player-execute-${macro.id}`}
      >
        ▶ Play {macro.stepCount} step{macro.stepCount !== 1 ? 's' : ''}
      </button>
      {error && (
        <div style={{ fontSize: 11, color: '#ff6b6b', marginTop: 4 }}>Error: {error}</div>
      )}
      {result?.ok && (
        <div style={{ fontSize: 11, color: '#4ade80', marginTop: 4 }}>
          Executed {result.stepsExecuted} step{(result.stepsExecuted ?? 0) !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}
