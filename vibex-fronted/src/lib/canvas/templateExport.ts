/**
 * Template Export Utility
 * E4: 模板导入/导出管理 — 导出功能
 */

import { RequirementTemplate } from '@/data/templates';

export interface ExportedTemplates {
  version: '1.0';
  exportedAt: string;
  exportedBy: string;
  templates: RequirementTemplate[];
}

/**
 * Export all templates to a JSON Blob for download
 */
export function exportTemplatesToBlob(templates: RequirementTemplate[]): Blob {
  const payload: ExportedTemplates = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    exportedBy: 'VibeX',
    templates,
  };
  const json = JSON.stringify(payload, null, 2);
  return new Blob([json], { type: 'application/json' });
}

/**
 * Trigger browser download of templates as .vibex-template JSON file
 */
export function downloadTemplatesAsFile(templates: RequirementTemplate[], filename = 'vibex-templates.vbtmpl'): void {
  const blob = exportTemplatesToBlob(templates);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
