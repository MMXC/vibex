'use client';

import React, { useRef, useState, useCallback } from 'react';
import { parseImportFile, readFileAsText, ImportedTemplates, ImportConflict } from '@/lib/canvas/templateImport';
import { RequirementTemplate } from '@/data/templates';
import styles from './TemplateImportDialog.module.css';

interface TemplateImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (templates: RequirementTemplate[], strategy: 'skip' | 'overwrite' | 'rename') => void;
  existingTemplates: RequirementTemplate[];
}

type ConflictStrategy = 'skip' | 'overwrite' | 'rename';
type ImportStep = 'select' | 'conflict' | 'result';

interface ImportState {
  step: ImportStep;
  fileName: string;
  parsed: ImportedTemplates | null;
  conflicts: ImportConflict[];
  imported: number;
  skipped: number;
  error: string | null;
  selectedStrategy: ConflictStrategy;
}

export function TemplateImportDialog({ isOpen, onClose, onImport, existingTemplates }: TemplateImportDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<ImportState>({
    step: 'select',
    fileName: '',
    parsed: null,
    conflicts: [],
    imported: 0,
    skipped: 0,
    error: null,
    selectedStrategy: 'skip',
  });

  const existingIds = new Set(existingTemplates.map(t => t.id));

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const content = await readFileAsText(file);
      const result = parseImportFile(content);

      if ('error' in result) {
        setState(s => ({ ...s, error: result.error, step: 'select' }));
        return;
      }

      const conflicts = result.templates
        .filter(t => existingIds.has(t.id))
        .map(t => ({
          templateId: t.id,
          templateName: t.name,
          existing: existingTemplates.find(e => e.id === t.id)!,
          incoming: t,
        }));

      if (conflicts.length > 0) {
        setState({
          step: 'conflict',
          fileName: file.name,
          parsed: result,
          conflicts,
          imported: result.templates.length - conflicts.length,
          skipped: 0,
          error: null,
          selectedStrategy: 'skip',
        });
      } else {
        // No conflicts — import directly
        setState({
          step: 'result',
          fileName: file.name,
          parsed: result,
          conflicts: [],
          imported: result.templates.length,
          skipped: 0,
          error: null,
          selectedStrategy: 'skip',
        });
        onImport(result.templates, 'skip');
      }
    } catch (err) {
      setState(s => ({ ...s, error: 'Failed to read file', step: 'select' }));
    }
  }, [existingIds, existingTemplates, onImport]);

  const handleConfirm = useCallback(() => {
    if (state.parsed) {
      const toImport = state.selectedStrategy === 'skip'
        ? state.parsed.templates.filter(t => !existingIds.has(t.id))
        : state.parsed.templates;
      onImport(toImport, state.selectedStrategy);
      setState(s => ({ ...s, step: 'result', imported: toImport.length }));
    }
  }, [state.parsed, state.selectedStrategy, existingIds, onImport]);

  const handleClose = useCallback(() => {
    setState({
      step: 'select', fileName: '', parsed: null, conflicts: [],
      imported: 0, skipped: 0, error: null, selectedStrategy: 'skip',
    });
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.dialog}>
        <div className={styles.header}>
          <h3 className={styles.title}>导入模板</h3>
          <button className={styles.closeBtn} onClick={handleClose}>✕</button>
        </div>

        {state.step === 'select' && (
          <div className={styles.body}>
            <p className={styles.hint}>选择 .vbtmpl 或 .json 文件导入模板</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".vbtmpl,.json"
              onChange={handleFileSelect}
              className={styles.fileInput}
            />
            {state.error && <p className={styles.error}>{state.error}</p>}
          </div>
        )}

        {state.step === 'conflict' && (
          <div className={styles.body}>
            <p className={styles.hint}>
              发现 {state.conflicts.length} 个冲突模板，选择处理策略：
            </p>
            <div className={styles.conflictList}>
              {state.conflicts.map(c => (
                <div key={c.templateId} className={styles.conflictItem}>
                  <span className={styles.conflictName}>{c.templateName}</span>
                  <span className={styles.conflictId}>{c.templateId}</span>
                </div>
              ))}
            </div>
            <div className={styles.strategyGroup}>
              <label className={styles.strategyOption}>
                <input
                  type="radio"
                  name="strategy"
                  value="skip"
                  checked={state.selectedStrategy === 'skip'}
                  onChange={() => setState(s => ({ ...s, selectedStrategy: 'skip' }))}
                />
                <span>跳过冲突模板（推荐）</span>
              </label>
              <label className={styles.strategyOption}>
                <input
                  type="radio"
                  name="strategy"
                  value="overwrite"
                  checked={state.selectedStrategy === 'overwrite'}
                  onChange={() => setState(s => ({ ...s, selectedStrategy: 'overwrite' }))}
                />
                <span>覆盖已有模板</span>
              </label>
              <label className={styles.strategyOption}>
                <input
                  type="radio"
                  name="strategy"
                  value="rename"
                  checked={state.selectedStrategy === 'rename'}
                  onChange={() => setState(s => ({ ...s, selectedStrategy: 'rename' }))}
                />
                <span>重命名（添加后缀）</span>
              </label>
            </div>
            <button className={styles.confirmBtn} onClick={handleConfirm}>
              确认导入（{state.imported} 个新模板）
            </button>
          </div>
        )}

        {state.step === 'result' && (
          <div className={styles.body}>
            <p className={styles.success}>
              ✅ 成功导入 {state.imported} 个模板
            </p>
            <button className={styles.doneBtn} onClick={handleClose}>完成</button>
          </div>
        )}
      </div>
    </div>
  );
}
