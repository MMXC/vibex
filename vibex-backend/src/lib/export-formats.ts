/**
 * Export Formats Service
 * 
 * Provides export functionality for domain models in various formats:
 * - JSON: Structured data format for programmatic use
 * - Markdown: Human-readable documentation format
 * - Figma: Design tool compatible format
 * 
 * @module lib/export-formats
 */

// ==================== Types ====================

/**
 * Domain entity for export
 */
export interface ExportEntity {
  id: string;
  name: string;
  type: string;
  description?: string;
  properties?: EntityProperty[];
  requirementId?: string;
  position?: { x: number; y: number };
}

/**
 * Entity property definition
 */
export interface EntityProperty {
  name: string;
  type: string;
  required?: boolean;
  description?: string;
  defaultValue?: string;
}

/**
 * Entity relation for export
 */
export interface ExportRelation {
  id: string;
  sourceEntityId: string;
  targetEntityId: string;
  relationType: string;
  description?: string;
  requirementId?: string;
}

/**
 * Complete domain model for export
 */
export interface DomainModelExport {
  entities: ExportEntity[];
  relations: ExportRelation[];
  metadata: {
    projectId?: string;
    name?: string;
    exportedAt: string;
    version: string;
  };
}

/**
 * Export format types
 */
export type ExportFormat = 'json' | 'markdown' | 'figma';

/**
 * Figma-compatible node structure
 */
export interface FigmaNode {
  id: string;
  name: string;
  type: 'DOCUMENT' | 'CANVAS' | 'FRAME' | 'GROUP' | 'COMPONENT' | 'INSTANCE' | 'TEXT' | 'RECTANGLE' | 'ELLIPSE' | 'LINE' | 'VECTOR' | 'BOOLEAN_OPERATION';
  children?: FigmaNode[];
  absoluteBoundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  fills?: FigmaFill[];
  strokes?: FigmaStroke[];
  strokeWeight?: number;
  characters?: string;
  style?: FigmaTextStyle;
  constraints?: {
    horizontal: 'LEFT' | 'RIGHT' | 'CENTER' | 'SCALE' | 'LEFT_RIGHT' | 'RIGHT_LEFT' | 'CENTER_CENTER';
    vertical: 'TOP' | 'BOTTOM' | 'CENTER' | 'SCALE' | 'TOP_BOTTOM' | 'BOTTOM_TOP' | 'CENTER_CENTER';
  };
}

/**
 * Figma fill style
 */
export interface FigmaFill {
  type: 'SOLID' | 'GRADIENT_LINEAR' | 'GRADIENT_RADIAL' | 'IMAGE';
  color?: { r: number; g: number; b: number; a: number };
  opacity?: number;
}

/**
 * Figma stroke style
 */
export interface FigmaStroke {
  type: 'SOLID';
  color: { r: number; g: number; b: number; a: number };
}

/**
 * Figma text style
 */
export interface FigmaTextStyle {
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  textAlignHorizontal: 'LEFT' | 'CENTER' | 'RIGHT' | 'JUSTIFIED';
  textAlignVertical: 'TOP' | 'CENTER' | 'BOTTOM';
  fill: { r: number; g: number; b: number; a: number }[];
}

/**
 * Figma document structure
 */
export interface FigmaDocument {
  document: {
    id: string;
    name: string;
    type: 'DOCUMENT';
    children: FigmaNode[];
  };
  version: string;
  lastModified: string;
  documentId: string;
}

// ==================== JSON Export ====================

/**
 * Export domain model to JSON format
 */
export function exportToJSON(model: DomainModelExport): string {
  return JSON.stringify(model, null, 2);
}

/**
 * Parse JSON export back to domain model
 */
export function parseJSONExport(jsonString: string): DomainModelExport {
  const data = JSON.parse(jsonString);
  
  // Validate structure
  if (!data.entities || !Array.isArray(data.entities)) {
    throw new Error('Invalid JSON export: missing entities array');
  }
  if (!data.relations || !Array.isArray(data.relations)) {
    throw new Error('Invalid JSON export: missing relations array');
  }
  
  return data as DomainModelExport;
}

// ==================== Markdown Export ====================

/**
 * Export domain model to Markdown format
 */
export function exportToMarkdown(model: DomainModelExport): string {
  const { entities, relations, metadata } = model;
  
  let md = '';
  
  // Header
  md += `# Domain Model: ${metadata.name || 'Untitled'}\n\n`;
  md += `> Exported: ${new Date(metadata.exportedAt).toLocaleString()}\n`;
  if (metadata.projectId) {
    md += `> Project ID: ${metadata.projectId}\n`;
  }
  md += `\n---\n\n`;
  
  // Overview
  md += `## Overview\n\n`;
  md += `- **Entities**: ${entities.length}\n`;
  md += `- **Relations**: ${relations.length}\n`;
  md += `\n`;
  
  // Entities section
  md += `## Entities\n\n`;
  
  if (entities.length === 0) {
    md += '_No entities defined._\n\n';
  } else {
    for (const entity of entities) {
      md += `### ${entity.name}\n\n`;
      md += `- **Type**: ${entity.type}\n`;
      if (entity.description) {
        md += `- **Description**: ${entity.description}\n`;
      }
      if (entity.requirementId) {
        md += `- **Requirement ID**: ${entity.requirementId}\n`;
      }
      
      // Properties table
      if (entity.properties && entity.properties.length > 0) {
        md += `\n**Properties:**\n\n`;
        md += `| Name | Type | Required | Description |\n`;
        md += `|------|------|----------|-------------|\n`;
        for (const prop of entity.properties) {
          const required = prop.required ? '✓' : '-';
          const desc = prop.description || '-';
          md += `| ${prop.name} | ${prop.type} | ${required} | ${desc} |\n`;
        }
        md += `\n`;
      }
      
      md += `\n`;
    }
  }
  
  // Relations section
  md += `## Relations\n\n`;
  
  if (relations.length === 0) {
    md += `_No relations defined._\n\n`;
  } else {
    md += `| From | To | Type | Description |\n`;
    md += `|------|-----|------|-------------|\n`;
    
    for (const relation of relations) {
      const fromEntity = entities.find(e => e.id === relation.sourceEntityId);
      const toEntity = entities.find(e => e.id === relation.targetEntityId);
      const fromName = fromEntity?.name || relation.sourceEntityId;
      const toName = toEntity?.name || relation.targetEntityId;
      const desc = relation.description || '-';
      
      md += `| ${fromName} | ${toName} | ${relation.relationType} | ${desc} |\n`;
    }
    md += `\n`;
  }
  
  // Legend
  md += `## Relation Types Legend\n\n`;
  md += `- **depends-on**: Source entity depends on target entity\n`;
  md += `- **related-to**: Source entity is related to target entity\n`;
  md += `- **parent-child**: Source entity is parent of target entity\n`;
  md += `- **implements**: Source entity implements target entity\n`;
  md += `- **associates**: Source entity associates with target entity\n`;
  md += `- **contains**: Source entity contains target entity\n`;
  md += `- **uses**: Source entity uses target entity\n`;
  
  return md;
}

/**
 * Parse Markdown export (basic parsing - may lose some data)
 */
export function parseMarkdownExport(markdown: string): DomainModelExport {
  const entities: ExportEntity[] = [];
  const relations: ExportRelation[] = [];
  
  // Extract entities from markdown
  const entityRegex = /###\s+(\w+)\s*\n\n[^|]*-\s*\*\*Type\*\*:\s*(\w+)/g;
  let match;
  
  while ((match = entityRegex.exec(markdown)) !== null) {
    entities.push({
      id: `entity-${entities.length + 1}`,
      name: match[1],
      type: match[2],
    });
  }
  
  // Extract relations from markdown table
  const relationRegex = /\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|/g;
  
  while ((match = relationRegex.exec(markdown)) !== null) {
    const fromName = match[1].trim();
    const toName = match[2].trim();
    const relationType = match[3].trim();
    
    const fromEntity = entities.find(e => e.name === fromName);
    const toEntity = entities.find(e => e.name === toName);
    
    if (fromEntity && toEntity) {
      relations.push({
        id: `relation-${relations.length + 1}`,
        sourceEntityId: fromEntity.id,
        targetEntityId: toEntity.id,
        relationType,
      });
    }
  }
  
  return {
    entities,
    relations,
    metadata: {
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
    },
  };
}

// ==================== Figma Export ====================

/**
 * Generate a unique Figma-compatible node ID
 */
function generateFigmaId(): string {
  return `:${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Get entity type color for Figma
 */
function getEntityTypeColor(type: string): { r: number; g: number; b: number; a: number } {
  const colorMap: Record<string, { r: number; g: number; b: number; a: number }> = {
    'user': { r: 0.2, g: 0.6, b: 1, a: 1 },
    'system': { r: 0.2, g: 0.8, b: 0.4, a: 1 },
    'data': { r: 1, g: 0.8, b: 0.2, a: 1 },
    'service': { r: 0.8, g: 0.4, b: 1, a: 1 },
    'api': { r: 1, g: 0.4, b: 0.4, a: 1 },
    'database': { r: 0.4, g: 0.8, b: 0.8, a: 1 },
    'interface': { r: 1, g: 0.6, b: 0.2, a: 1 },
  };
  
  return colorMap[type.toLowerCase()] || { r: 0.5, g: 0.5, b: 0.5, a: 1 };
}

/**
 * Export domain model to Figma-compatible format
 */
export function exportToFigma(model: DomainModelExport): FigmaDocument {
  const { entities, relations, metadata } = model;
  
  // Create entity nodes
  const entityNodes: FigmaNode[] = entities.map((entity, index) => {
    const position = entity.position || { x: (index % 4) * 300, y: Math.floor(index / 4) * 200 };
    const color = getEntityTypeColor(entity.type);
    
    const node: FigmaNode = {
      id: generateFigmaId(),
      name: entity.name,
      type: 'COMPONENT',
      absoluteBoundingBox: {
        x: position.x,
        y: position.y,
        width: 240,
        height: entity.properties ? Math.max(120, 60 + entity.properties.length * 24) : 120,
      },
      fills: [{
        type: 'SOLID',
        color,
        opacity: 0.1,
      }],
      strokes: [{
        type: 'SOLID',
        color,
      }],
      strokeWeight: 2,
      constraints: {
        horizontal: 'SCALE',
        vertical: 'SCALE',
      },
      children: [
        {
          id: generateFigmaId(),
          name: 'Type Badge',
          type: 'RECTANGLE',
          absoluteBoundingBox: {
            x: position.x,
            y: position.y,
            width: 60,
            height: 20,
          },
          fills: [{
            type: 'SOLID',
            color,
            opacity: 0.8,
          }],
        },
        {
          id: generateFigmaId(),
          name: entity.type,
          type: 'TEXT',
          characters: entity.type.toUpperCase(),
          style: {
            fontFamily: 'Inter',
            fontSize: 10,
            fontWeight: 600,
            textAlignHorizontal: 'CENTER',
            textAlignVertical: 'CENTER',
            fill: [{ r: 1, g: 1, b: 1, a: 1 }],
          },
        },
        {
          id: generateFigmaId(),
          name: 'Entity Name',
          type: 'TEXT',
          characters: entity.name,
          style: {
            fontFamily: 'Inter',
            fontSize: 16,
            fontWeight: 700,
            textAlignHorizontal: 'LEFT',
            textAlignVertical: 'TOP',
            fill: [{ r: 0.1, g: 0.1, b: 0.1, a: 1 }],
          },
        },
      ],
    };
    
    // Add description if exists
    if (entity.description) {
      (node.children as FigmaNode[]).push({
        id: generateFigmaId(),
        name: 'Description',
        type: 'TEXT',
        characters: entity.description.substring(0, 100),
        style: {
          fontFamily: 'Inter',
          fontSize: 12,
          fontWeight: 400,
          textAlignHorizontal: 'LEFT',
          textAlignVertical: 'TOP',
          fill: [{ r: 0.4, g: 0.4, b: 0.4, a: 1 }],
        },
      });
    }
    
    // Add properties
    if (entity.properties && entity.properties.length > 0) {
      let propY = position.y + 50;
      
      for (const prop of entity.properties.slice(0, 5)) {
        const requiredMark = prop.required ? ' *' : '';
        (node.children as FigmaNode[]).push({
          id: generateFigmaId(),
          name: `prop:${prop.name}`,
          type: 'TEXT',
          characters: `• ${prop.name}: ${prop.type}${requiredMark}`,
          style: {
            fontFamily: 'Inter',
            fontSize: 11,
            fontWeight: 400,
            textAlignHorizontal: 'LEFT',
            textAlignVertical: 'TOP',
            fill: [{ r: 0.3, g: 0.3, b: 0.3, a: 1 }],
          },
        });
        propY += 16;
      }
      
      if (entity.properties.length > 5) {
        (node.children as FigmaNode[]).push({
          id: generateFigmaId(),
          name: 'more',
          type: 'TEXT',
          characters: `+${entity.properties.length - 5} more properties...`,
          style: {
            fontFamily: 'Inter',
            fontSize: 10,
            fontWeight: 400,
            textAlignHorizontal: 'LEFT',
            textAlignVertical: 'TOP',
            fill: [{ r: 0.5, g: 0.5, b: 0.5, a: 1 }],
          },
        });
      }
    }
    
    return node;
  });
  
  // Create relation connectors
  const relationNodes: FigmaNode[] = relations.map((relation) => {
    const sourceEntity = entities.find(e => e.id === relation.sourceEntityId);
    const targetEntity = entities.find(e => e.id === relation.targetEntityId);
    
    if (!sourceEntity || !targetEntity) {
      return null;
    }
    
    const sourcePos = sourceEntity.position || { x: 0, y: 0 };
    const targetPos = targetEntity.position || { x: 0, y: 0 };
    
    // Create a connector line
    const connector: FigmaNode = {
      id: generateFigmaId(),
      name: `${sourceEntity.name} → ${targetEntity.name} (${relation.relationType})`,
      type: 'VECTOR',
      absoluteBoundingBox: {
        x: Math.min(sourcePos.x, targetPos.x) - 10,
        y: Math.min(sourcePos.y, targetPos.y) - 10,
        width: Math.abs(targetPos.x - sourcePos.x) + 260,
        height: Math.abs(targetPos.y - sourcePos.y) + 20,
      },
      strokes: [{
        type: 'SOLID',
        color: { r: 0.6, g: 0.6, b: 0.6, a: 1 },
      }],
      strokeWeight: 1,
    };
    
    return connector;
  }).filter((n): n is FigmaNode => n !== null);
  
  // Build the document
  const doc: FigmaDocument = {
    document: {
      id: generateFigmaId(),
      name: metadata.name || 'Domain Model',
      type: 'DOCUMENT',
      children: [
        {
          id: generateFigmaId(),
          name: 'Domain Model',
          type: 'CANVAS',
          children: [
            ...entityNodes,
            ...relationNodes,
          ],
        },
      ],
    },
    version: '1.0.0',
    lastModified: metadata.exportedAt,
    documentId: metadata.projectId || generateFigmaId(),
  };
  
  return doc;
}

/**
 * Export domain model to Figma JSON format (string)
 */
export function exportToFigmaJSON(model: DomainModelExport): string {
  const figmaDoc = exportToFigma(model);
  return JSON.stringify(figmaDoc, null, 2);
}

/**
 * Parse Figma JSON export back to domain model
 */
export function parseFigmaExport(jsonString: string): DomainModelExport {
  const figmaDoc: FigmaDocument = JSON.parse(jsonString);
  
  const entities: ExportEntity[] = [];
  const relations: ExportRelation[] = [];
  
  // Find all COMPONENT nodes (entities)
  function extractEntities(nodes: FigmaNode[]): void {
    for (const node of nodes) {
      if (node.type === 'COMPONENT' || node.type === 'INSTANCE') {
        // Try to extract type from children
        let entityType = 'unknown';
        
        for (const child of node.children || []) {
          if (child.type === 'TEXT' && child.name === 'Type Badge') {
            // This is the type text
            entityType = (child as any).characters?.toLowerCase() || 'unknown';
          }
        }
        
        // Extract name from the text children
        let name = node.name;
        for (const child of node.children || []) {
          if (child.type === 'TEXT' && child.name?.includes('Entity Name')) {
            name = (child as any).characters || node.name;
            break;
          }
        }
        
        entities.push({
          id: node.id,
          name,
          type: entityType,
          position: node.absoluteBoundingBox ? {
            x: node.absoluteBoundingBox.x,
            y: node.absoluteBoundingBox.y,
          } : undefined,
        });
      }
      
      if (node.children) {
        extractEntities(node.children);
      }
    }
  }
  
  // Find the canvas and extract entities
  for (const child of figmaDoc.document.children || []) {
    if (child.children) {
      extractEntities(child.children);
    }
  }
  
  return {
    entities,
    relations,
    metadata: {
      exportedAt: figmaDoc.lastModified,
      version: figmaDoc.version,
    },
  };
}

// ==================== Unified Export Functions ====================

/**
 * Export domain model to specified format
 */
export function exportDomainModel(
  model: DomainModelExport,
  format: ExportFormat
): string {
  switch (format) {
    case 'json':
      return exportToJSON(model);
    case 'markdown':
      return exportToMarkdown(model);
    case 'figma':
      return exportToFigmaJSON(model);
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
}

/**
 * Get content type for export format
 */
export function getExportContentType(format: ExportFormat): string {
  switch (format) {
    case 'json':
      return 'application/json';
    case 'markdown':
      return 'text/markdown';
    case 'figma':
      return 'application/json';
    default:
      return 'application/octet-stream';
  }
}

/**
 * Get file extension for export format
 */
export function getExportFileExtension(format: ExportFormat): string {
  switch (format) {
    case 'json':
      return 'json';
    case 'markdown':
      return 'md';
    case 'figma':
      return 'figma.json';
    default:
      return 'txt';
  }
}

// ==================== Default Export ====================

export default {
  exportToJSON,
  exportToMarkdown,
  exportToFigma,
  exportToFigmaJSON,
  exportDomainModel,
  parseJSONExport,
  parseMarkdownExport,
  parseFigmaExport,
  getExportContentType,
  getExportFileExtension,
};
