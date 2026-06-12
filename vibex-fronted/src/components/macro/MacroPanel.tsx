/**
 * MacroPanel — S92-E1: Canvas Workflow Automation
 *
 * Main panel for macro recording and management.
 * Provides:
 * - Record/Stop recording button in toolbar
 * - List of saved macros (from macroStore)
 * - Save dialog after stopping recording
 * - Play/delete actions per macro card
 *
 * Usage:
 *   <MacroPanel
 *     canvasId="abc123"
 *     currentCanvasId="abc123"
 *     onClose={() => setPanelOpen(false)}
 *   />
 */
import React, { useEffect, useState } from 'react';
import { useMacroStore } from '@/stores/macroStore';
import { MacroCard } from './MacroCard';
import { MacroPlayer } from './MacroPlayer';
import styles from './macro.module.css';

interface MacroPanelProps {
  /** Canvas being recorded / played against */
  canvasId?: string;
  /** Active canvas ID (shown in UI) */
  currentCanvasId?: string;
  onClose?: () => void;
}

export function MacroPanel({ canvasId, currentCanvasId, onClose }: MacroPanelProps) {
  const {
    macros,
    loading,
    error,
    recordingState,
    currentSteps,
    fetchMacros,
    createMacro,
    startRecording,
    stopRecording,
    discardRecording,
  } = useMacroStore();

  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saveDesc, setSaveDesc] = useState('');
  const [saving, setSaving] = useState(false);

  const targetCanvasId = currentCanvasId || canvasId || '';

  // Fetch macros on mount
  useEffect(() => {
    fetchMacros();
  }, []);

  const handleRecordClick = () => {
    if (recordingState === 'idle') {
      startRecording(targetCanvasId);
    } else if (recordingState === 'recording') {
      // Stop and open save dialog
      stopRecording();
      setShowSaveDialog(true);
      setSaveName('');
      setSaveDesc('');
    }
  };

  const handleSaveMacro = async () => {
    if (!saveName.trim()) return;
    setSaving(true);
    await createMacro(saveName.trim(), saveDesc.trim());
    setSaving(false);
    setShowSaveDialog(false);
  };

  const handleDiscard = () => {
    discardRecording();
    setShowSaveDialog(false);
  };

  return (
    <div className={styles.container} data-testid="macro-panel">
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <button
          className={`${styles.recordBtn} ${
            recordingState === 'recording' ? styles.recordBtnRecording : styles.recordBtnIdle
          }`}
          onClick={handleRecordClick}
          data-testid="record-toggle"
          title={
            recordingState === 'idle'
              ? 'Start recording canvas operations'
              : 'Stop recording and save macro'
          }
        >
          {recordingState === 'recording' ? (
            <>
              <span className={styles.recordDot} />
              Stop
            </>
          ) : (
            <>
              <span
                style={{
                  display: 'inline-block',
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: '#ff6b6b',
                }}
              />
              Record
            </>
          )}
        </button>

        {recordingState === 'recording' && (
          <span className={styles.stepCount} data-testid="step-count">
            {currentSteps.length} step{currentSteps.length !== 1 ? 's' : ''}
          </span>
        )}

        <button
          className={styles.actionBtn}
          onClick={onClose}
          title="Close"
          style={{ marginLeft: 'auto' }}
        >
          ✕
        </button>
      </div>

      {/* Title */}
      <div className={styles.title}>Macros</div>

      {/* Macro List */}
      {loading ? (
        <div className={styles.loading}>Loading macros…</div>
      ) : error ? (
        <div className={styles.emptyState}>
          <span className={styles.emptyIcon}>⚠</span>
          <span className={styles.emptyText}>{error}</span>
        </div>
      ) : macros.length === 0 ? (
        <div className={styles.emptyState}>
          <span className={styles.emptyIcon}>▶</span>
          <span className={styles.emptyText}>
            No macros yet.
            <br />
            Click Record to capture your first workflow.
          </span>
        </div>
      ) : (
        <div className={styles.macroList}>
          {macros.map(macro => (
            <div key={macro.id} style={{ marginBottom: 6 }}>
              <MacroCard
                macro={macro}
                targetCanvasId={targetCanvasId}
                onPlay={() => {
                  // MacroCard handles play via MacroPlayer
                }}
              />
              {targetCanvasId && (
                <div style={{ paddingLeft: 12, marginTop: -4, marginBottom: 8 }}>
                  <MacroPlayer macro={macro} targetCanvasId={targetCanvasId} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className={styles.saveOverlay} data-testid="save-dialog">
          <div className={styles.saveDialog}>
            <div className={styles.saveTitle}>
              Save Macro — {currentSteps.length} step{currentSteps.length !== 1 ? 's' : ''}
            </div>

            <input
              className={styles.inputField}
              placeholder="Macro name *"
              value={saveName}
              onChange={e => setSaveName(e.target.value)}
              autoFocus
              data-testid="macro-name-input"
            />

            <textarea
              className={`${styles.inputField} ${styles.textarea}`}
              placeholder="Description (optional)"
              value={saveDesc}
              onChange={e => setSaveDesc(e.target.value)}
              data-testid="macro-desc-input"
            />

            <div className={styles.dialogActions}>
              <button
                className={styles.cancelBtn}
                onClick={handleDiscard}
                data-testid="discard-btn"
              >
                Discard
              </button>
              <button
                className={styles.saveBtn}
                onClick={handleSaveMacro}
                disabled={!saveName.trim() || saving}
                data-testid="save-btn"
              >
                {saving ? 'Saving…' : 'Save Macro'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
