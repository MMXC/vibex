/**
 * import-export API client — Frontend API layer
 * E4-U1: Import/Export 完整集成
 */

import { getAuthToken } from '@/lib/auth-token';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.vibex.top';

export type ExportFormat = 'json' | 'yaml';

export interface ImportResult {
  success: boolean;
  data: {
    boundedContexts?: unknown[];
    flows?: unknown[];
    components?: unknown[];
  };
  errors?: string[];
}

export interface ExportResult {
  success: boolean;
  data?: unknown;
  content?: string;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export interface ValidationError {
  field: string;
  message: string;
}

export class FileSizeError extends Error {
  constructor(size: number, maxSize = MAX_FILE_SIZE) {
    super(`File size ${(size / 1024 / 1024).toFixed(2)}MB exceeds ${(maxSize / 1024 / 1024).toFixed(0)}MB limit`);
    this.name = 'FileSizeError';
  }
}

export class ImportExportError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'ImportExportError';
  }
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const token = getAuthToken();
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new ImportExportError(error.error || `HTTP ${res.status}`, error.code);
  }

  return res.json() as Promise<T>;
}

/**
 * Validate file before upload
 */
export function validateFile(file: File): ValidationError[] {
  const errors: ValidationError[] = [];

  if (file.size > MAX_FILE_SIZE) {
    errors.push({
      field: 'file',
      message: `File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds 5MB limit`,
    });
  }

  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext && !['json', 'yaml', 'yml'].includes(ext)) {
    errors.push({
      field: 'file',
      message: 'Only JSON and YAML files are supported',
    });
  }

  return errors;
}

/**
 * Read file content as text
 */
export async function readFileContent(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new ImportExportError('Failed to read file'));
    reader.readAsText(file);
  });
}

export const importExportApi = {
  /**
   * Export project data to JSON or YAML
   */
  export: async (projectId: string, format: ExportFormat = 'json') => {
    return request<ExportResult>(
      `${API_BASE}/v1/projects/export?projectId=${projectId}&format=${format}`
    );
  },

  /**
   * Import project data from JSON or YAML file
   */
  import: async (content: string, format: 'json' | 'yaml') => {
    const contentType = format === 'json' ? 'application/json' : 'application/yaml';
    
    return request<ImportResult>(`${API_BASE}/v1/projects/import`, {
      method: 'POST',
      headers: { 'Content-Type': contentType },
      body: content,
    });
  },

  /**
   * Import file with validation
   */
  importFile: async (file: File) => {
    // Validate
    const errors = validateFile(file);
    if (errors.length > 0) {
      throw new ImportExportError(errors.map((e) => e.message).join(', '));
    }

    // Read content
    const content = await readFileContent(file);

    // Detect format
    const ext = file.name.split('.').pop()?.toLowerCase();
    const format = ext === 'json' ? 'json' : 'yaml';

    // Import
    return importExportApi.import(content, format);
  },

  /**
   * Round-trip test: export → reimport → compare
   */
  async roundTripTest(projectId: string): Promise<{
    originalExport: ExportResult;
    reimported: ImportResult;
    matches: boolean;
  }> {
    // Export to JSON
    const originalExport = await importExportApi.export(projectId, 'json');
    if (!originalExport.data) {
      throw new ImportExportError('Export returned no data');
    }

    // Reimport the exported content
    const jsonContent = JSON.stringify(originalExport.data, null, 2);
    const reimported = await importExportApi.import(jsonContent, 'json');

    // Compare structure (simplified hash check)
    const originalHash = JSON.stringify(originalExport.data);
    const reimportedHash = JSON.stringify(reimported.data);
    const matches = originalHash === reimportedHash;

    return { originalExport, reimported, matches };
  },
};