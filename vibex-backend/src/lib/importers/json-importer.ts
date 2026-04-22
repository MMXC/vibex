/**
 * JSON Importer - E8 Import/Export
 * Parses and validates DDD data from JSON format.
 */

export interface BoundedContext {
  id: string
  name: string
  type: 'core' | 'supporting' | 'generic' | 'external'
  description?: string
}

export interface BusinessFlow {
  id: string
  name: string
  mermaidCode?: string
}

export interface ComponentNode {
  name: string
  flowId: string
  type: string
  props?: Record<string, unknown>
  api?: unknown
}

export interface DDDImportData {
  boundedContexts: BoundedContext[]
  flows: BusinessFlow[]
  components: ComponentNode[]
  requirementText?: string
}

export function parseJSON(content: string): DDDImportData {
  const data = JSON.parse(content);
  // Validate required fields
  if (!data.boundedContexts) throw new Error('boundedContexts is required');
  if (!Array.isArray(data.boundedContexts)) throw new Error('boundedContexts must be an array');
  return data as DDDImportData;
}
