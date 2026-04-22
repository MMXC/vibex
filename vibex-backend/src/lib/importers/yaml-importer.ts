/**
 * YAML Importer - E8 Import/Export
 * Parses and validates DDD data from YAML format.
 */
import { load } from 'js-yaml';
import type { DDDImportData } from './json-importer';

export function parseYAML(content: string): DDDImportData {
  const parsed = load(content) as Record<string, unknown>;

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Invalid YAML content');
  }

  const data: DDDImportData = {
    boundedContexts: Array.isArray(parsed.boundedContexts)
      ? parsed.boundedContexts as DDDImportData['boundedContexts']
      : [],
    flows: Array.isArray(parsed.flows)
      ? parsed.flows as DDDImportData['flows']
      : [],
    components: Array.isArray(parsed.components)
      ? parsed.components as DDDImportData['components']
      : [],
    requirementText:
      typeof parsed.requirementText === 'string'
        ? parsed.requirementText
        : undefined,
  };

  return data;
}
