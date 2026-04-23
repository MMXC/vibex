/**
 * ImportExportCard — Drag-drop import/export UI
 * E4-U1: Import/Export 完整集成
 */

'use client';

import React, { useCallback, useState, useRef } from 'react';
import { importExportApi, validateFile, type ImportResult, type ExportResult } from '@/lib/import-export/api';
import styles from './ImportExportCard.module.css';

interface ImportExportCardProps {
  projectId: string;
  projectName: string;
}

type State = 'idle' | 'importing' | 'exporting' | 'success' | 'error';

export function ImportExportCard({ projectId, projectName }: ImportExportCardProps) {
  const [state, setState] = useState<State>('idle');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleFile = useCallback(async (file: File) => {
    setState('importing');
    setError(null);
    setSuccessMsg(null);

    try {
      const errors = validateFile(file);
      if (errors.length > 0) {
        throw new Error(errors.map((e) => e.message).join(', '));
      }

      const result: ImportResult = await importExportApi.importFile(file);
      
      if (result.success) {
        setState('success');
        setSuccessMsg(`Successfully imported ${file.name}`);
      } else {
        throw new Error(result.errors?.join(', ') || 'Import failed');
      }
    } catch (err) {
      setState('error');
      setError(err instanceof Error ? err.message : 'Import failed');
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFile(e.dataTransfer.files[0]);
      }
    },
    [handleFile]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        handleFile(e.target.files[0]);
      }
    },
    [handleFile]
  );

  const handleExport = useCallback(
    async (format: 'json' | 'yaml') => {
      setState('exporting');
      setError(null);
      setSuccessMsg(null);

      try {
        const result: ExportResult = await importExportApi.export(projectId, format);

        if (result.success && result.content) {
          // Download file
          const blob = new Blob([result.content], {
            type: format === 'json' ? 'application/json' : 'application/x-yaml',
          });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${projectName}.${format}`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);

          setState('success');
          setSuccessMsg(`Exported to ${format.toUpperCase()}: ${projectName}.${format}`);
        } else {
          throw new Error('Export failed');
        }
      } catch (err) {
        setState('error');
        setError(err instanceof Error ? err.message : 'Export failed');
      }
    },
    [projectId, projectName]
  );

  return (
    <div className={styles.card}>
      <h3 className={styles.title}>Import / Export</h3>
      <p className={styles.subtitle}>Import data from JSON/YAML or export current project</p>

      {/* Import zone */}
      <div
        className={`${styles.dropZone} ${dragActive ? styles.dropZoneActive : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label="Drop file to import"
        onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,.yaml,.yml"
          onChange={handleInputChange}
          className={styles.fileInput}
          aria-hidden="true"
        />
        <div className={styles.dropIcon}>📁</div>
        <p className={styles.dropText}>
          {state === 'importing' ? 'Importing...' : 'Drop JSON or YAML file to import'}
        </p>
        <p className={styles.dropHint}>Max file size: 5MB</p>
      </div>

      {/* Status messages */}
      {error && (
        <div className={styles.errorMsg} role="alert">
          ❌ {error}
        </div>
      )}
      {successMsg && (
        <div className={styles.successMsg} role="status">
          ✅ {successMsg}
        </div>
      )}

      {/* Export buttons */}
      <div className={styles.exportSection}>
        <p className={styles.exportLabel}>Or export current project:</p>
        <div className={styles.exportBtns}>
          <button
            className={`${styles.exportBtn} ${styles.exportBtnJson}`}
            onClick={() => handleExport('json')}
            disabled={state === 'exporting'}
            aria-label="Export as JSON"
          >
            📋 Export JSON
          </button>
          <button
            className={`${styles.exportBtn} ${styles.exportBtnYaml}`}
            onClick={() => handleExport('yaml')}
            disabled={state === 'exporting'}
            aria-label="Export as YAML"
          >
            📄 Export YAML
          </button>
        </div>
      </div>
    </div>
  );
}