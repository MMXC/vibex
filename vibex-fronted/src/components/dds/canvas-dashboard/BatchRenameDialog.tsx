'use client';

/**
 * BatchRenameDialog.tsx — S64-E4 D4.3
 *
 * Advanced batch rename dialog with two modes:
 * - Sequence mode: {name}1, {name}2, ... with customizable separator
 * - Regex mode: find/replace with optional regex
 *
 * D4.4: Duplicate name auto-dedup with -{n} suffix.
 */

import { useState, useCallback, useMemo } from 'react';
import { useCanvasListStore } from '@/stores/canvasListStore';
import { useTranslations } from '@/hooks/useTranslations';
import styles from './BatchOpsToolbar.module.css';

interface BatchRenameDialogProps {
  open: boolean;
  onConfirm: (canvasIds: string[], renameFn: (name: string, idx: number) => string) => void;
  onCancel: () => void;
}

type RenameMode = 'sequence' | 'regex';

export function BatchRenameDialog({ open, onConfirm, onCancel }: BatchRenameDialogProps) {
  const t = useTranslations('batchOps')();
  const { selectedCanvasIds, canvases } = useCanvasListStore();

  const [mode, setMode] = useState<RenameMode>('sequence');
  const [prefix, setPrefix] = useState('');
  const [suffix, setSuffix] = useState('');
  const [separator, setSeparator] = useState('');
  const [startNum, setStartNum] = useState(1);
  const [findPattern, setFindPattern] = useState('');
  const [replaceWith, setReplaceWith] = useState('');
  const [isRegex, setIsRegex] = useState(false);

  const selectedCanvases = useMemo(
    () => Array.from(selectedCanvasIds).map((id) => canvases.find((c) => c.id === id)).filter(Boolean),
    [selectedCanvasIds, canvases]
  );

  const buildRenameFn = useCallback(
    (mode: RenameMode): ((name: string, idx: number) => string) => {
      if (mode === 'sequence') {
        return (name: string, idx: number) => {
          const num = startNum + idx - 1;
          const baseName = name;
          const sep = separator;
          return `${baseName}${sep}${num}`;
        };
      } else {
        return (name: string) => {
          if (!findPattern) return name;
          if (isRegex) {
            try {
              const regex = new RegExp(findPattern, 'g');
              return name.replace(regex, replaceWith);
            } catch {
              return name;
            }
          } else {
            return name.split(findPattern).join(replaceWith);
          }
        };
      }
    },
    [mode, startNum, separator, findPattern, replaceWith, isRegex]
  );

  // Live preview of rename results
  const preview = useMemo(() => {
    if (!open || selectedCanvases.length === 0) return [];
    const fn = buildRenameFn(mode);
    return selectedCanvases.map((canvas, i) => ({
      id: canvas!.id,
      oldName: canvas!.name,
      newName: fn(canvas!.name, i + 1),
    }));
  }, [open, selectedCanvases, mode, buildRenameFn]);

  const handleConfirm = () => {
    if (selectedCanvasIds.size === 0) return;
    const fn = buildRenameFn(mode);
    onConfirm(Array.from(selectedCanvasIds), fn);
  };

  if (!open) return null;

  return (
    <div className={styles['dialog-overlay']} role="dialog" aria-modal="true" aria-labelledby="batch-rename-title">
      <div className={styles['dialog']}>
        <h3 id="batch-rename-title" className={styles['dialog__title']}>
          {t('batchRenameAdvanced')}
        </h3>
        <p className={styles['dialog__body']}>{t('renameDesc', { count: selectedCanvasIds.size })}</p>

        {/* Mode tabs */}
        <div className={styles['dialog__field']}>
          <label className={styles['dialog__label']}>{t('renameMode')}</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className={`${styles['dialog__confirm']} ${mode === 'sequence' ? styles['active'] : ''}`}
              onClick={() => setMode('sequence')}
            >
              {t('sequenceMode')}
            </button>
            <button
              className={`${styles['dialog__confirm']} ${mode === 'regex' ? styles['active'] : ''}`}
              onClick={() => setMode('regex')}
            >
              {t('regexMode')}
            </button>
          </div>
        </div>

        {mode === 'sequence' && (
          <>
            <div className={styles['dialog__field']}>
              <label className={styles['dialog__label']} htmlFor="rename-prefix">
                {t('separator')}
              </label>
              <input
                id="rename-prefix"
                type="text"
                className={styles['dialog__input']}
                value={separator}
                onChange={(e) => setSeparator(e.target.value)}
                placeholder={t('separatorPlaceholder')}
              />
            </div>
            <div className={styles['dialog__field']}>
              <label className={styles['dialog__label']} htmlFor="start-num">
                {t('startNumber')}
              </label>
              <input
                id="start-num"
                type="number"
                className={styles['dialog__input']}
                value={startNum}
                min={0}
                onChange={(e) => setStartNum(parseInt(e.target.value, 10) || 1)}
              />
            </div>
          </>
        )}

        {mode === 'regex' && (
          <>
            <div className={styles['dialog__field']}>
              <label className={styles['dialog__label']} htmlFor="find-pattern">
                {t('findPattern')}
              </label>
              <input
                id="find-pattern"
                type="text"
                className={styles['dialog__input']}
                value={findPattern}
                onChange={(e) => setFindPattern(e.target.value)}
                placeholder={isRegex ? t('regexPlaceholder') : t('findPlaceholder')}
              />
            </div>
            <div className={styles['dialog__field']}>
              <label className={styles['dialog__label']} htmlFor="replace-with">
                {t('replaceWith')}
              </label>
              <input
                id="replace-with"
                type="text"
                className={styles['dialog__input']}
                value={replaceWith}
                onChange={(e) => setReplaceWith(e.target.value)}
                placeholder={t('replacePlaceholder')}
              />
            </div>
            <div className={styles['dialog__field']}>
              <label>
                <input
                  type="checkbox"
                  checked={isRegex}
                  onChange={(e) => setIsRegex(e.target.checked)}
                />
                {t('useRegex')}
              </label>
            </div>
          </>
        )}

        {/* Preview */}
        {preview.length > 0 && (
          <div className={styles['dialog__field']}>
            <label className={styles['dialog__label']}>{t('preview')}</label>
            <div style={{ maxHeight: '150px', overflowY: 'auto', fontSize: '12px', background: '#f5f5f5', borderRadius: '4px', padding: '8px' }}>
              {preview.map((p) => (
                <div key={p.id} style={{ marginBottom: '4px' }}>
                  <span style={{ color: '#999' }}>{p.oldName}</span>
                  {' → '}
                  <strong>{p.newName}</strong>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className={styles['dialog__actions']}>
          <button className={styles['dialog__cancel']} onClick={onCancel}>
            {t('cancel')}
          </button>
          <button className={styles['dialog__confirm']} onClick={handleConfirm}>
            {t('confirmRename')}
          </button>
        </div>
      </div>
    </div>
  );
}
