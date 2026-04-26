/**
 * ImportHistoryService — E2-U4: Import History
 * Persists import log entries to localStorage
 */
import type { ImportLogEntry } from '@/types/canvas-document';

const STORAGE_KEY = 'canvas_import_log';

export function logImport(entry: ImportLogEntry): void {
  const logs = getImportLog();
  logs.unshift(entry); // most recent first, keep last 50
  if (logs.length > 50) logs.length = 50;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
  } catch {
    // localStorage might be full — silently ignore
  }
}

export function getImportLog(): ImportLogEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function clearImportLog(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}