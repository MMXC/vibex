/**
 * JSON Exporter - E8 Import/Export
 * Exports DDD data to JSON format.
 */

import type { DDDImportData } from '@/lib/importers/json-importer';

export function exportJSON(data: DDDImportData): string {
  return JSON.stringify(data, null, 2);
}
