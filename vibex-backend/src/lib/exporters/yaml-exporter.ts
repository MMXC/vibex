/**
 * YAML Exporter - E8 Import/Export
 * Exports DDD data to YAML format using simple serialization.
 */

import type { DDDImportData } from '@/lib/importers/json-importer';

/**
 * Serialize a value to YAML string.
 */
function toYAML(value: unknown, indent = 0): string {
  const spaces = '  '.repeat(indent);
  
  if (value === null || value === undefined) {
    return 'null';
  }
  
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }
  
  if (typeof value === 'number') {
    return String(value);
  }
  
  if (typeof value === 'string') {
    // Use quoted string if contains special characters
    if (value.includes(':') || value.includes('#') || value.includes('\n') || value.includes("'") || value.startsWith(' ') || value.endsWith(' ')) {
      return `'${value.replace(/'/g, "''")}'`;
    }
    return value;
  }
  
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    
    const lines: string[] = [];
    for (const item of value) {
      if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
        // Object item - show key inline then body
        const obj = item as Record<string, unknown>;
        const keys = Object.keys(obj);
        if (keys.length === 1) {
          lines.push(`${spaces}- ${keys[0]}: ${toYAML(obj[keys[0]], 0)}`);
        } else {
          lines.push(`${spaces}-`);
          for (const key of keys) {
            lines.push(`${spaces}  ${key}: ${toYAML(obj[key], 0)}`);
          }
        }
      } else {
        lines.push(`${spaces}- ${toYAML(item, 0)}`);
      }
    }
    return lines.join('\n');
  }
  
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj);
    if (keys.length === 0) return '{}';
    
    const lines: string[] = [];
    for (const key of keys) {
      const val = obj[key];
      if (val === null || val === undefined) {
        lines.push(`${spaces}${key}: null`);
      } else if (typeof val === 'object') {
        lines.push(`${spaces}${key}:`);
        lines.push(toYAML(val, indent + 1));
      } else {
        lines.push(`${spaces}${key}: ${toYAML(val, 0)}`);
      }
    }
    return lines.join('\n');
  }
  
  return String(value);
}

export function exportYAML(data: DDDImportData): string {
  let output = '';
  
  if (data.requirementText) {
    output += `# Requirement\n`;
    output += `requirementText: ${toYAML(data.requirementText)}\n\n`;
  }
  
  output += `# Bounded Contexts\n`;
  output += `boundedContexts:\n`;
  if (data.boundedContexts.length === 0) {
    output += `  []\n`;
  } else {
    for (const bc of data.boundedContexts) {
      output += `  - id: ${toYAML(bc.id)}\n`;
      output += `    name: ${toYAML(bc.name)}\n`;
      output += `    type: ${toYAML(bc.type)}\n`;
      output += `    description: ${toYAML(bc.description)}\n`;
    }
  }
  
  output += `\n# Business Flows\n`;
  output += `flows:\n`;
  if (data.flows.length === 0) {
    output += `  []\n`;
  } else {
    for (const flow of data.flows) {
      output += `  - id: ${toYAML(flow.id)}\n`;
      output += `    name: ${toYAML(flow.name)}\n`;
      if (flow.mermaidCode) {
        output += `    mermaidCode: ${toYAML(flow.mermaidCode)}\n`;
      }
    }
  }
  
  output += `\n# Components\n`;
  output += `components:\n`;
  if (data.components.length === 0) {
    output += `  []\n`;
  } else {
    for (const comp of data.components) {
      output += `  - name: ${toYAML(comp.name)}\n`;
      output += `    flowId: ${toYAML(comp.flowId)}\n`;
      output += `    type: ${toYAML(comp.type)}\n`;
    }
  }
  
  return output;
}
