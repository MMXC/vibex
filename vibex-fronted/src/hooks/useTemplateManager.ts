'use client';

/**
 * useTemplateManager — E5-Template-Library S5.1/S5.2
 *
 * Manages template export, import, and version history.
 * localStorage key: template:${templateId}:history
 * Maximum 10 snapshots per template (prunes oldest on overflow).
 */

import { useCallback } from 'react';
import type { RequirementTemplate, RequirementTemplateItem } from '@/data/templates/types';

// ============================================================================
// Types
// ============================================================================

export interface TemplateSnapshot {
  id: string;
  templateId: string;
  data: RequirementTemplate;
  timestamp: number;
  label?: string;
}

export interface TemplateData {
  id: string;
  name: string;
  description: string;
  items: RequirementTemplateItem[];
  category: string;
}

interface StoredHistory {
  snapshots: TemplateSnapshot[];
  updatedAt: number;
}

const MAX_SNAPSHOTS = 10;

function getHistoryKey(templateId: string): string {
  return `template:${templateId}:history`;
}

function genId(): string {
  return `tmpl-snap-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ============================================================================
// JSON Schema validation (lightweight)
// ============================================================================

function validateTemplateData(data: unknown): data is TemplateData {
  if (typeof data !== 'object' || data === null) return false;
  const d = data as Record<string, unknown>;
  return (
    typeof d.id === 'string' &&
    typeof d.name === 'string' &&
    typeof d.description === 'string' &&
    Array.isArray(d.items)
  );
}

// ============================================================================
// Download helper
// ============================================================================

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ============================================================================
// Hook
// ============================================================================

export interface UseTemplateManagerReturn {
  exportTemplate: (templateId: string, template: RequirementTemplate) => void;
  importTemplate: (file: File) => Promise<TemplateData>;
  getHistory: (templateId: string) => TemplateSnapshot[];
  createSnapshot: (templateId: string, template: RequirementTemplate, label?: string) => void;
  deleteSnapshot: (templateId: string, snapshotId: string) => void;
}

export function useTemplateManager(): UseTemplateManagerReturn {
  /**
   * exportTemplate — AGENTS.md §6.2: triggers Blob download
   */
  const exportTemplate = useCallback((templateId: string, template: RequirementTemplate) => {
    const payload: TemplateData = {
      id: template.id,
      name: template.name,
      description: template.description,
      items: template.items ?? [],
      category: template.category,
    };
    const json = JSON.stringify(payload, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const filename = `vibex-template-${templateId}-${new Date().toISOString().slice(0, 10)}.json`;
    downloadBlob(blob, filename);
  }, []);

  /**
   * importTemplate — AGENTS.md §6.2: validates JSON schema, throws on error
   */
  const importTemplate = useCallback(async (file: File): Promise<TemplateData> => {
    const text = await file.text();
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error('Invalid JSON format');
    }
    if (!validateTemplateData(data)) {
      throw new Error('Invalid template format: missing required fields (id, name, description, items)');
    }
    return data;
  }, []);

  /**
   * getHistory — AGENTS.md §6.2: returns snapshot list, desc by timestamp
   */
  const getHistory = useCallback((templateId: string): TemplateSnapshot[] => {
    try {
      const raw = localStorage.getItem(getHistoryKey(templateId));
      if (!raw) return [];
      const stored: StoredHistory = JSON.parse(raw);
      return stored.snapshots.sort((a, b) => b.timestamp - a.timestamp);
    } catch {
      return [];
    }
  }, []);

  /**
   * createSnapshot — AGENTS.md §6.2: >10 snapshots → delete oldest
   */
  const createSnapshot = useCallback(
    (templateId: string, template: RequirementTemplate, label?: string) => {
      const key = getHistoryKey(templateId);
      let stored: StoredHistory;
      try {
        const raw = localStorage.getItem(key);
        stored = raw ? JSON.parse(raw) : { snapshots: [], updatedAt: Date.now() };
      } catch {
        stored = { snapshots: [], updatedAt: Date.now() };
      }

      const snapshot: TemplateSnapshot = {
        id: genId(),
        templateId,
        data: template,
        timestamp: Date.now(),
        label,
      };

      const updated = [snapshot, ...stored.snapshots].slice(0, MAX_SNAPSHOTS);
      localStorage.setItem(
        key,
        JSON.stringify({ snapshots: updated, updatedAt: Date.now() })
      );
    },
    []
  );

  /**
   * deleteSnapshot — removes one snapshot from history
   */
  const deleteSnapshot = useCallback((templateId: string, snapshotId: string) => {
    const key = getHistoryKey(templateId);
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return;
      const stored: StoredHistory = JSON.parse(raw);
      const updated = stored.snapshots.filter((s) => s.id !== snapshotId);
      localStorage.setItem(
        key,
        JSON.stringify({ snapshots: updated, updatedAt: Date.now() })
      );
    } catch {
      // ignore
    }
  }, []);

  return {
    exportTemplate,
    importTemplate,
    getHistory,
    createSnapshot,
    deleteSnapshot,
  };
}
