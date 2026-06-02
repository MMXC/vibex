/**
 * useTemplatePreview.ts — Hook for Template Preview Loading
 * Sprint54 E5: Template Gallery 增强
 *
 * Loads canvas template data for preview rendering.
 * Handles loading state, error state, and thumbnail cache.
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { getTemplate } from '@/lib/canvas/templateStore';
import type { CanvasTemplateData } from '@/lib/canvas/templateStore';

interface UseTemplatePreviewResult {
  /** The loaded template data */
  template: CanvasTemplateData | null;
  /** Whether the template is currently loading */
  loading: boolean;
  /** Any error that occurred during loading */
  error: Error | null;
  /** Reload the template */
  reload: () => void;
}

const RECENT_STORAGE_KEY = 'vibex:recentTemplates';

/**
 * Hook to load and manage template preview data.
 * Also tracks recently viewed templates in localStorage.
 */
export function useTemplatePreview(templateId: string | null): UseTemplatePreviewResult {
  const [template, setTemplate] = useState<CanvasTemplateData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadTemplate = useCallback(async () => {
    if (!templateId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getTemplate(templateId);
      setTemplate(data);
      // Record to recent templates
      recordRecentTemplate(templateId, data?.name || templateId);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [templateId]);

  useEffect(() => {
    loadTemplate();
  }, [loadTemplate]);

  return { template, loading, error, reload: loadTemplate };
}

/**
 * Record a template as recently viewed.
 * Stores up to 5 recent templates, most recent first.
 */
function recordRecentTemplate(templateId: string, templateName: string): void {
  try {
    const raw = localStorage.getItem(RECENT_STORAGE_KEY);
    const recent: Array<{ id: string; name: string; timestamp: number }> = raw
      ? JSON.parse(raw)
      : [];

    // Remove if already exists (will be re-added at front)
    const filtered = recent.filter((r) => r.id !== templateId);

    // Add to front
    filtered.unshift({ id: templateId, name: templateName, timestamp: Date.now() });

    // Keep only 5 most recent
    const trimmed = filtered.slice(0, 5);
    localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // localStorage may not be available in SSR/test environments
  }
}

/**
 * Get the list of recently viewed templates.
 * Returns array of { id, name, timestamp } sorted by recency.
 */
export function getRecentTemplates(): Array<{ id: string; name: string; timestamp: number }> {
  try {
    const raw = localStorage.getItem(RECENT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Clear all recent template history.
 */
export function clearRecentTemplates(): void {
  try {
    localStorage.removeItem(RECENT_STORAGE_KEY);
  } catch {
    // ignore
  }
}
