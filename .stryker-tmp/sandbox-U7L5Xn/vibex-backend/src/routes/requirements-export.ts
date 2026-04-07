/**
 * Requirements Export API Routes
 * 
 * Provides export functionality for requirements in various formats:
 * - Markdown: Full requirements document in Markdown format
 * - PDF: HTML-based PDF generation (print-friendly)
 * 
 * @module routes/requirements-export
 */
// @ts-nocheck


import { Hono } from 'hono';
import { queryDB, queryOne, Env } from '@/lib/db';

const requirementsExport = new Hono<{ Bindings: Env }>();

// ==================== Types ====================

interface ProjectRow {
  id: string;
  name: string;
  description: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

interface RequirementRow {
  id: string;
  projectId: string;
  rawInput: string;
  parsedData: string | null;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
}

interface DomainEntityRow {
  id: string;
  projectId: string;
  name: string;
  type: string;
  description: string | null;
  properties: string | null;
  requirementId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface EntityRelationRow {
  id: string;
  projectId: string;
  sourceEntityId: string;
  targetEntityId: string;
  relationType: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

// ==================== Helper Functions ====================

/**
 * Generate Markdown document from requirements data
 */
function generateMarkdown(
  project: ProjectRow,
  requirements: RequirementRow[],
  entities: DomainEntityRow[],
  relations: EntityRelationRow[]
): string {
  const lines: string[] = [];
  
  // Title
  lines.push(`# ${project.name} - Requirements Document`);
  lines.push('');
  
  // Metadata
  lines.push(`**Generated:** ${new Date().toISOString()}`);
  lines.push('');
  if (project.description) {
    lines.push(`**Description:** ${project.description}`);
    lines.push('');
  }
  lines.push('---');
  lines.push('');
  
  // Summary
  lines.push('## Summary');
  lines.push('');
  lines.push(`- **Total Requirements:** ${requirements.length}`);
  lines.push(`- **Total Entities:** ${entities.length}`);
  lines.push(`- **Total Relations:** ${relations.length}`);
  lines.push('');
  
  // Requirements by status
  const statusCounts = requirements.reduce((acc, req) => {
    acc[req.status] = (acc[req.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  lines.push('### Requirements by Status');
  lines.push('');
  for (const [status, count] of Object.entries(statusCounts)) {
    lines.push(`- **${status}:** ${count}`);
  }
  lines.push('');
  
  // Requirements by priority
  const priorityCounts = requirements.reduce((acc, req) => {
    acc[req.priority] = (acc[req.priority] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  lines.push('### Requirements by Priority');
  lines.push('');
  for (const [priority, count] of Object.entries(priorityCounts)) {
    lines.push(`- **${priority}:** ${count}`);
  }
  lines.push('');
  lines.push('---');
  lines.push('');
  
  // Requirements
  lines.push('## Requirements');
  lines.push('');
  
  requirements.forEach((req, index) => {
    lines.push(`### ${index + 1}. ${req.rawInput.substring(0, 100)}${req.rawInput.length > 100 ? '...' : ''}`);
    lines.push('');
    lines.push(`- **ID:** \`${req.id}\``);
    lines.push(`- **Status:** ${req.status}`);
    lines.push(`- **Priority:** ${req.priority}`);
    lines.push(`- **Created:** ${new Date(req.createdAt).toLocaleString()}`);
    lines.push('');
    lines.push('**Full Text:**');
    lines.push('');
    lines.push('```');
    lines.push(req.rawInput);
    lines.push('```');
    lines.push('');
    
    if (req.parsedData) {
      try {
        const parsed = JSON.parse(req.parsedData);
        lines.push('**Parsed Data:**');
        lines.push('```json');
        lines.push(JSON.stringify(parsed, null, 2));
        lines.push('```');
        lines.push('');
      } catch {
        // Ignore parse errors
      }
    }
  });
  
  // Domain Entities
  if (entities.length > 0) {
    lines.push('---');
    lines.push('');
    lines.push('## Domain Entities');
    lines.push('');
    
    // Group entities by type
    const entitiesByType = entities.reduce((acc, entity) => {
      if (!acc[entity.type]) acc[entity.type] = [];
      acc[entity.type].push(entity);
      return acc;
    }, {} as Record<string, DomainEntityRow[]>);
    
    for (const [type, typeEntities] of Object.entries(entitiesByType)) {
      lines.push(`### ${type.charAt(0).toUpperCase() + type.slice(1)}s`);
      lines.push('');
      
      typeEntities.forEach((entity) => {
        lines.push(`#### ${entity.name}`);
        lines.push('');
        if (entity.description) {
          lines.push(`**Description:** ${entity.description}`);
          lines.push('');
        }
        if (entity.properties) {
          try {
            const props = JSON.parse(entity.properties);
            lines.push('**Properties:**');
            lines.push('');
            for (const [key, value] of Object.entries(props)) {
              lines.push(`- \`${key}\`: ${JSON.stringify(value)}`);
            }
            lines.push('');
          } catch {
            // Ignore parse errors
          }
        }
      });
    }
  }
  
  // Entity Relations
  if (relations.length > 0) {
    lines.push('---');
    lines.push('');
    lines.push('## Entity Relations');
    lines.push('');
    
    relations.forEach((relation) => {
      const sourceEntity = entities.find(e => e.id === relation.sourceEntityId);
      const targetEntity = entities.find(e => e.id === relation.targetEntityId);
      
      lines.push(`### ${sourceEntity?.name || relation.sourceEntityId} → ${targetEntity?.name || relation.targetEntityId}`);
      lines.push('');
      lines.push(`- **Type:** ${relation.relationType}`);
      if (relation.description) {
        lines.push(`- **Description:** ${relation.description}`);
      }
      lines.push('');
    });
  }
  
  lines.push('---');
  lines.push('');
  lines.push('*This document was automatically generated by VibeX*');
  
  return lines.join('\n');
}

/**
 * Generate HTML document for PDF export
 */
function generateHTML(
  project: ProjectRow,
  requirements: RequirementRow[],
  entities: DomainEntityRow[],
  relations: EntityRelationRow[]
): string {
  const statusCounts = requirements.reduce((acc, req) => {
    acc[req.status] = (acc[req.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const priorityCounts = requirements.reduce((acc, req) => {
    acc[req.priority] = (acc[req.priority] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const entitiesByType = entities.reduce((acc, entity) => {
    if (!acc[entity.type]) acc[entity.type] = [];
    acc[entity.type].push(entity);
    return acc;
  }, {} as Record<string, DomainEntityRow[]>);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${project.name} - Requirements Document</title>
  <style>
    @page {
      margin: 2cm;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    h1 {
      font-size: 28px;
      margin-bottom: 10px;
      color: #1a1a1a;
    }
    h2 {
      font-size: 22px;
      margin: 30px 0 15px;
      color: #2a2a2a;
      border-bottom: 2px solid #eee;
      padding-bottom: 8px;
    }
    h3 {
      font-size: 18px;
      margin: 20px 0 10px;
      color: #3a3a3a;
    }
    h4 {
      font-size: 16px;
      margin: 15px 0 8px;
      color: #4a4a4a;
    }
    p {
      margin-bottom: 10px;
    }
    ul, ol {
      margin-left: 20px;
      margin-bottom: 15px;
    }
    li {
      margin-bottom: 5px;
    }
    code {
      background: #f5f5f5;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: 'Monaco', 'Menlo', monospace;
      font-size: 14px;
    }
    pre {
      background: #f5f5f5;
      padding: 15px;
      border-radius: 5px;
      overflow-x: auto;
      margin: 10px 0;
      font-size: 13px;
      line-height: 1.5;
    }
    .meta {
      color: #666;
      font-size: 14px;
      margin-bottom: 20px;
    }
    .divider {
      border: none;
      border-top: 1px solid #ddd;
      margin: 30px 0;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      margin: 20px 0;
    }
    .summary-card {
      background: #f9f9f9;
      padding: 15px;
      border-radius: 8px;
      text-align: center;
    }
    .summary-card .count {
      font-size: 32px;
      font-weight: bold;
      color: #2563eb;
    }
    .summary-card .label {
      font-size: 14px;
      color: #666;
    }
    .status-badge {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
    }
    .status-draft { background: #fef3c7; color: #92400e; }
    .status-active { background: #dbeafe; color: #1e40af; }
    .status-completed { background: #d1fae5; color: #065f46; }
    .status-archived { background: #e5e7eb; color: #374151; }
    
    .priority-badge {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
    }
    .priority-low { background: #d1fae5; color: #065f46; }
    .priority-medium { background: #fef3c7; color: #92400e; }
    .priority-high { background: #fee2e2; color: #991b1b; }
    .priority-critical { background: #7f1d1d; color: white; }
    
    .requirement-item {
      background: #fff;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 20px;
      page-break-inside: avoid;
    }
    .requirement-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 10px;
    }
    .requirement-title {
      font-size: 16px;
      font-weight: 600;
      color: #1a1a1a;
    }
    .requirement-meta {
      font-size: 13px;
      color: #666;
      margin-top: 10px;
    }
    .entity-card {
      background: #f9fafb;
      border-left: 4px solid #2563eb;
      padding: 15px;
      margin-bottom: 15px;
      page-break-inside: avoid;
    }
    .relation-card {
      background: #f0f9ff;
      border-left: 4px solid #06b6d4;
      padding: 15px;
      margin-bottom: 15px;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      text-align: center;
      color: #666;
      font-size: 12px;
    }
    @media print {
      body {
        padding: 0;
      }
      .requirement-item, .entity-card, .relation-card {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <h1>${project.name}</h1>
  <p class="meta">Requirements Document | Generated: ${new Date().toLocaleString()}</p>
  ${project.description ? `<p class="meta"><strong>Description:</strong> ${project.description}</p>` : ''}
  
  <hr class="divider">
  
  <h2>Summary</h2>
  <div class="summary-grid">
    <div class="summary-card">
      <div class="count">${requirements.length}</div>
      <div class="label">Requirements</div>
    </div>
    <div class="summary-card">
      <div class="count">${entities.length}</div>
      <div class="label">Entities</div>
    </div>
    <div class="summary-card">
      <div class="count">${relations.length}</div>
      <div class="label">Relations</div>
    </div>
  </div>
  
  <h3>Requirements by Status</h3>
  <ul>
    ${Object.entries(statusCounts).map(([status, count]) => `<li><span class="status-badge status-${status}">${status}</span>: ${count}</li>`).join('')}
  </ul>
  
  <h3>Requirements by Priority</h3>
  <ul>
    ${Object.entries(priorityCounts).map(([priority, count]) => `<li><span class="priority-badge priority-${priority}">${priority}</span>: ${count}</li>`).join('')}
  </ul>
  
  <hr class="divider">
  
  <h2>Requirements</h2>
  ${requirements.map((req, index) => `
    <div class="requirement-item">
      <div class="requirement-header">
        <div class="requirement-title">${index + 1}. ${req.rawInput.substring(0, 100)}${req.rawInput.length > 100 ? '...' : ''}</div>
      </div>
      <div>
        <span class="status-badge status-${req.status}">${req.status}</span>
        <span class="priority-badge priority-${req.priority}">${req.priority}</span>
      </div>
      <div class="requirement-meta">
        <strong>ID:</strong> ${req.id} | <strong>Created:</strong> ${new Date(req.createdAt).toLocaleString()}
      </div>
      <h4>Full Text</h4>
      <pre>${req.rawInput}</pre>
      ${req.parsedData ? `<h4>Parsed Data</h4><pre>${JSON.stringify(JSON.parse(req.parsedData), null, 2)}</pre>` : ''}
    </div>
  `).join('')}
  
  ${entities.length > 0 ? `
  <hr class="divider">
  
  <h2>Domain Entities</h2>
  ${Object.entries(entitiesByType).map(([type, typeEntities]) => `
    <h3>${type.charAt(0).toUpperCase() + type.slice(1)}s</h3>
    ${typeEntities.map(entity => `
      <div class="entity-card">
        <h4>${entity.name}</h4>
        ${entity.description ? `<p>${entity.description}</p>` : ''}
        ${entity.properties ? `<pre>${JSON.stringify(JSON.parse(entity.properties), null, 2)}</pre>` : ''}
      </div>
    `).join('')}
  `).join('')}
  ` : ''}
  
  ${relations.length > 0 ? `
  <hr class="divider">
  
  <h2>Entity Relations</h2>
  ${relations.map(relation => {
    const sourceEntity = entities.find(e => e.id === relation.sourceEntityId);
    const targetEntity = entities.find(e => e.id === relation.targetEntityId);
    return `
      <div class="relation-card">
        <h4>${sourceEntity?.name || relation.sourceEntityId} → ${targetEntity?.name || relation.targetEntityId}</h4>
        <p><strong>Type:</strong> ${relation.relationType}</p>
        ${relation.description ? `<p><strong>Description:</strong> ${relation.description}</p>` : ''}
      </div>
    `;
  }).join('')}
  ` : ''}
  
  <div class="footer">
    <p>This document was automatically generated by VibeX</p>
  </div>
</body>
</html>`;
}

// ==================== API Routes ====================

/**
 * GET /api/requirements-export/:projectId/export
 * Export requirements for a project
 * 
 * Query params:
 * - format: 'markdown' | 'pdf' (default: 'markdown')
 */
requirementsExport.get('/:projectId/export', async (c) => {
  try {
    const projectId = c.req.param('projectId');
    const format = c.req.query('format') || 'markdown';
    const env = c.env;

    // Fetch project
    const project = await queryOne<ProjectRow>(
      env,
      'SELECT * FROM Project WHERE id = ?',
      [projectId]
    );

    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    // Fetch requirements
    const requirements = await queryDB<RequirementRow>(
      env,
      'SELECT * FROM Requirement WHERE projectId = ? ORDER BY createdAt DESC',
      [projectId]
    );

    // Fetch domain entities
    const entities = await queryDB<DomainEntityRow>(
      env,
      'SELECT * FROM DomainEntity WHERE projectId = ?',
      [projectId]
    );

    // Fetch entity relations
    const relations = await queryDB<EntityRelationRow>(
      env,
      'SELECT * FROM EntityRelation WHERE projectId = ?',
      [projectId]
    );

    if (format === 'pdf') {
      // Return HTML that can be printed to PDF
      const html = generateHTML(project, requirements, entities, relations);
      
      return c.html(html, 200, {
        'Content-Type': 'text/html; charset=utf-8',
      });
    }

    // Default to Markdown
    const markdown = generateMarkdown(project, requirements, entities, relations);

    return c.text(markdown, 200, {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Content-Disposition': `attachment; filename="${project.name.replace(/[^a-z0-9]/gi, '_')}_requirements.md"`,
    });
  } catch (error) {
    console.error('Error exporting requirements:', error);
    return c.json({ error: 'Failed to export requirements' }, 500);
  }
});

export default requirementsExport;
