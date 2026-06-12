/**
 * MacroCard — S92-E1: Canvas Workflow Automation
 * Individual macro item display with play/delete actions
 */
import React, { useState } from 'react';
import { useMacroStore, type CanvasMacro } from '@/stores/macroStore';
import styles from './macro.module.css';

interface MacroCardProps {
  macro: CanvasMacro;
  /** Canvas ID to replay the macro against */
  targetCanvasId?: string;
  onPlay?: (macro: CanvasMacro) => void;
}

function formatDate(timestamp: number): string {
  const d = new Date(timestamp);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function formatStepType(type: string): string {
  const map: Record<string, string> = {
    'create-node': 'create',
    'update-node': 'update',
    'delete-node': 'delete',
    'move-node': 'move',
    'add-edge': 'edge+',
    'remove-edge': 'edge−',
  };
  return map[type] ?? type;
}

export function MacroCard({ macro, targetCanvasId, onPlay }: MacroCardProps) {
  const { deleteMacro } = useMacroStore();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    await deleteMacro(macro.id);
    setDeleting(false);
  };

  const handlePlay = () => {
    if (onPlay) {
      onPlay(macro);
    }
  };

  return (
    <div className={styles.macroCard} data-testid={`macro-card-${macro.id}`}>
      <div className={styles.macroHeader}>
        <span className={styles.macroName} title={macro.name}>
          {macro.name}
        </span>
        <span className={styles.macroMeta}>
          {macro.stepCount} step{macro.stepCount !== 1 ? 's' : ''} · {formatDate(macro.createdAt)}
        </span>
      </div>

      {/* Step type badges */}
      {macro.steps.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
          {[
            ...new Set(macro.steps.map(s => s.type)),
          ]
            .slice(0, 5)
            .map(type => (
              <span
                key={type}
                style={{
                  fontSize: '10px',
                  padding: '2px 5px',
                  borderRadius: '4px',
                  background: 'rgba(99,102,241,0.15)',
                  color: 'var(--color-primary, #6366f1)',
                }}
              >
                {formatStepType(type)}
              </span>
            ))}
          {macro.steps.length > 5 && (
            <span style={{ fontSize: '10px', color: 'var(--color-text-tertiary, #71717a)' }}>
              +{macro.steps.length - 5}
            </span>
          )}
        </div>
      )}

      <div className={styles.macroActions}>
        {targetCanvasId && (
          <button
            className={styles.playBtn}
            onClick={handlePlay}
            title={`Play on canvas ${targetCanvasId}`}
            data-testid={`play-macro-${macro.id}`}
          >
            ▶ Play
          </button>
        )}
        <button
          className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
          onClick={handleDelete}
          disabled={deleting}
          title="Delete macro"
          data-testid={`delete-macro-${macro.id}`}
        >
          {deleting ? '…' : '✕'}
        </button>
      </div>
    </div>
  );
}
