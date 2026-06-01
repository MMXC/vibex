/**
 * Template Import Utility
 * E4: 模板导入/导出管理 — 导入功能
 */

import { RequirementTemplate } from '@/data/templates';

export interface ImportedTemplates {
  version: string;
  exportedAt?: string;
  exportedBy?: string;
  templates: RequirementTemplate[];
}

export interface ImportResult {
  success: boolean;
  imported: number;
  skipped: number;
  conflicts: ImportConflict[];
  error?: string;
}

export interface ImportConflict {
  templateId: string;
  templateName: string;
  existing: RequirementTemplate;
  incoming: RequirementTemplate;
}

/**
 * Validate and parse imported JSON
 */
export function parseImportFile(content: string): ImportedTemplates | { error: string } {
  try {
    const data = JSON.parse(content);

    if (!data.version) {
      return { error: 'Invalid format: missing version field' };
    }

    if (!Array.isArray(data.templates)) {
      return { error: 'Invalid format: templates must be an array' };
    }

    // Basic schema validation
    for (const t of data.templates) {
      if (!t.id || !t.name || !t.category) {
        return { error: `Invalid template: missing required fields (id, name, category)` };
      }
    }

    return data as ImportedTemplates;
  } catch {
    return { error: 'Invalid JSON' };
  }
}

/**
 * Merge imported templates with existing ones
 * Returns ImportResult with conflict information
 */
export function mergeTemplates(
  existing: RequirementTemplate[],
  incoming: ImportedTemplates,
  existingIds: Set<string>
): ImportResult {
  const imported: RequirementTemplate[] = [];
  const skipped: RequirementTemplate[] = [];
  const conflicts: ImportConflict[] = [];

  for (const t of incoming.templates) {
    if (existingIds.has(t.id)) {
      const existingTemplate = existing.find(e => e.id === t.id)!;
      conflicts.push({ templateId: t.id, templateName: t.name, existing: existingTemplate, incoming: t });
      skipped.push(t);
    } else {
      imported.push(t);
    }
  }

  return {
    success: true,
    imported: imported.length,
    skipped: skipped.length,
    conflicts,
  };
}

/**
 * Read file as text (for File input)
 */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
