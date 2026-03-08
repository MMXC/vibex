/**
 * Prototype Export API Routes
 * 
 * Provides export functionality for prototypes in various formats:
 * - JSON: Full prototype data export
 * - HTML: Standalone HTML file
 * - Downloadable package
 * 
 * @module routes/prototype-export
 */

import { Hono } from 'hono';
import { queryDB, queryOne, Env } from '@/lib/db';

const prototypeExport = new Hono<{ Bindings: Env }>();

// ==================== Types ====================

interface ProjectRow {
  id: string;
  name: string;
  description: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

interface PrototypeSnapshotRow {
  id: string;
  projectId: string;
  version: number;
  name: string | null;
  description: string | null;
  content: string;
  createdAt: string;
  updatedAt: string;
}

interface PrototypeVersionRow {
  id: string;
  projectId: string;
  branchId: string | null;
  version: number;
  name: string | null;
  description: string | null;
  content: string;
  snapshotId: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

interface PageRow {
  id: string;
  projectId: string;
  name: string;
  path: string;
  content: string | null;
  createdAt: string;
  updatedAt: string;
}

interface RequirementRow {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  status: string;
  priority: string | null;
  createdAt: string;
  updatedAt: string;
}

interface DomainEntityRow {
  id: string;
  projectId: string;
  name: string;
  description: string | null;
  properties: string | null;
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

interface ComponentRow {
  id: string;
  projectId: string;
  name: string;
  description: string | null;
  code: string;
  framework: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ExportOptions {
  format: 'json' | 'html' | 'zip';
  includeVersions?: boolean;
  includePages?: boolean;
  includeRequirements?: boolean;
  includeEntities?: boolean;
  includeRelations?: boolean;
  includeComponents?: boolean;
}

interface ExportedPrototype {
  project: ProjectRow | null;
  snapshots: PrototypeSnapshotRow[];
  versions: PrototypeVersionRow[];
  pages: PageRow[];
  requirements: RequirementRow[];
  entities: DomainEntityRow[];
  relations: EntityRelationRow[];
  components: ComponentRow[];
  exportedAt: string;
  version: string;
}

// ==================== Helper Functions ====================

/**
 * Fetch all prototype data for export
 */
async function fetchPrototypeData(
  env: Env | undefined,
  projectId: string,
  options: ExportOptions
): Promise<ExportedPrototype> {
  const data: ExportedPrototype = {
    project: null,
    snapshots: [],
    versions: [],
    pages: [],
    requirements: [],
    entities: [],
    relations: [],
    components: [],
    exportedAt: new Date().toISOString(),
    version: '1.0.0',
  };

  // Fetch project
  if (options.includeVersions || options.includePages || options.includeRequirements) {
    data.project = await queryOne<ProjectRow>(
      env,
      'SELECT * FROM Project WHERE id = ?',
      [projectId]
    );
  }

  // Fetch snapshots (always include latest)
  data.snapshots = await queryDB<PrototypeSnapshotRow>(
    env,
    'SELECT * FROM PrototypeSnapshot WHERE projectId = ? ORDER BY createdAt DESC',
    [projectId]
  );

  // Fetch versions if requested
  if (options.includeVersions) {
    data.versions = await queryDB<PrototypeVersionRow>(
      env,
      'SELECT * FROM PrototypeVersion WHERE projectId = ? ORDER BY version DESC',
      [projectId]
    );
  }

  // Fetch pages if requested
  if (options.includePages) {
    data.pages = await queryDB<PageRow>(
      env,
      'SELECT * FROM Page WHERE projectId = ? ORDER BY createdAt DESC',
      [projectId]
    );
  }

  // Fetch requirements if requested
  if (options.includeRequirements) {
    data.requirements = await queryDB<RequirementRow>(
      env,
      'SELECT * FROM Requirement WHERE projectId = ? ORDER BY createdAt DESC',
      [projectId]
    );
  }

  // Fetch domain entities if requested
  if (options.includeEntities) {
    data.entities = await queryDB<DomainEntityRow>(
      env,
      'SELECT * FROM DomainEntity WHERE projectId = ? ORDER BY createdAt DESC',
      [projectId]
    );
  }

  // Fetch entity relations if requested
  if (options.includeRelations) {
    data.relations = await queryDB<EntityRelationRow>(
      env,
      'SELECT * FROM EntityRelation WHERE projectId = ? ORDER BY createdAt DESC',
      [projectId]
    );
  }

  // Fetch components if requested
  if (options.includeComponents) {
    data.components = await queryDB<ComponentRow>(
      env,
      'SELECT * FROM Component WHERE projectId = ? ORDER BY createdAt DESC',
      [projectId]
    );
  }

  return data;
}

/**
 * Generate HTML export from prototype data
 */
function generateHTMLExport(data: ExportedPrototype): string {
  const projectName = data.project?.name || 'Untitled Project';
  const latestSnapshot = data.snapshots[0];
  
  let contentHtml = '';
  
  if (latestSnapshot?.content) {
    try {
      const parsed = JSON.parse(latestSnapshot.content);
      if (typeof parsed === 'string') {
        contentHtml = parsed;
      } else if (parsed.html) {
        contentHtml = parsed.html;
      } else if (parsed.code) {
        contentHtml = `<pre><code>${escapeHtml(parsed.code)}</code></pre>`;
      } else {
        contentHtml = `<div>${escapeHtml(JSON.stringify(parsed, null, 2))}</div>`;
      }
    } catch {
      contentHtml = `<pre>${escapeHtml(latestSnapshot.content)}</pre>`;
    }
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(projectName)} - Prototype Export</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      background: #f5f5f5;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 2rem;
      text-align: center;
    }
    .header h1 { margin-bottom: 0.5rem; }
    .header .meta { opacity: 0.9; font-size: 0.9rem; }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
    }
    .section {
      background: white;
      border-radius: 8px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .section h2 {
      color: #667eea;
      margin-bottom: 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 2px solid #f0f0f0;
    }
    pre {
      background: #f8f9fa;
      padding: 1rem;
      border-radius: 4px;
      overflow-x: auto;
      font-size: 0.9rem;
    }
    code { font-family: 'Monaco', 'Menlo', monospace; }
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }
    .stat-card {
      background: white;
      padding: 1rem;
      border-radius: 8px;
      text-align: center;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .stat-card .number {
      font-size: 2rem;
      font-weight: bold;
      color: #667eea;
    }
    .stat-card .label { color: #666; font-size: 0.9rem; }
    .content-preview {
      min-height: 300px;
      padding: 1rem;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
    }
    .footer {
      text-align: center;
      padding: 2rem;
      color: #666;
      font-size: 0.9rem;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${escapeHtml(projectName)}</h1>
    <div class="meta">
      Exported: ${data.exportedAt} | Version: ${data.version}
    </div>
  </div>
  
  <div class="container">
    <div class="stats">
      <div class="stat-card">
        <div class="number">${data.snapshots.length}</div>
        <div class="label">Snapshots</div>
      </div>
      <div class="stat-card">
        <div class="number">${data.versions.length}</div>
        <div class="label">Versions</div>
      </div>
      <div class="stat-card">
        <div class="number">${data.pages.length}</div>
        <div class="label">Pages</div>
      </div>
      <div class="stat-card">
        <div class="number">${data.requirements.length}</div>
        <div class="label">Requirements</div>
      </div>
      <div class="stat-card">
        <div class="number">${data.entities.length}</div>
        <div class="label">Entities</div>
      </div>
      <div class="stat-card">
        <div class="number">${data.components.length}</div>
        <div class="label">Components</div>
      </div>
    </div>

    ${data.project?.description ? `
    <div class="section">
      <h2>Project Description</h2>
      <p>${escapeHtml(data.project.description)}</p>
    </div>
    ` : ''}

    <div class="section">
      <h2>Prototype Content</h2>
      <div class="content-preview">
        ${contentHtml || '<p>No content available</p>'}
      </div>
    </div>

    ${data.requirements.length > 0 ? `
    <div class="section">
      <h2>Requirements (${data.requirements.length})</h2>
      <pre><code>${escapeHtml(JSON.stringify(data.requirements, null, 2))}</code></pre>
    </div>
    ` : ''}

    ${data.entities.length > 0 ? `
    <div class="section">
      <h2>Domain Entities (${data.entities.length})</h2>
      <pre><code>${escapeHtml(JSON.stringify(data.entities, null, 2))}</code></pre>
    </div>
    ` : ''}

    ${data.components.length > 0 ? `
    <div class="section">
      <h2>Components (${data.components.length})</h2>
      <pre><code>${escapeHtml(JSON.stringify(data.components, null, 2))}</code></pre>
    </div>
    ` : ''}
  </div>

  <div class="footer">
    Generated by VibeX Prototype Export
  </div>
</body>
</html>`;

  return html;
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}

// ==================== API Routes ====================

/**
 * POST /api/prototype-export
 * Export prototype in specified format
 */
prototypeExport.post('/', async (c) => {
  try {
    const body = await c.req.json<{
      projectId: string;
      format?: 'json' | 'html' | 'zip';
      includeVersions?: boolean;
      includePages?: boolean;
      includeRequirements?: boolean;
      includeEntities?: boolean;
      includeRelations?: boolean;
      includeComponents?: boolean;
    }>();

    const {
      projectId,
      format = 'json',
      includeVersions = true,
      includePages = true,
      includeRequirements = true,
      includeEntities = false,
      includeRelations = false,
      includeComponents = true,
    } = body;

    if (!projectId) {
      return c.json({ error: 'Missing required field: projectId' }, 400);
    }

    const env = c.env;

    // Verify project exists
    const project = await queryOne<ProjectRow>(
      env,
      'SELECT * FROM Project WHERE id = ?',
      [projectId]
    );

    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    const options: ExportOptions = {
      format,
      includeVersions,
      includePages,
      includeRequirements,
      includeEntities,
      includeRelations,
      includeComponents,
    };

    // Fetch prototype data
    const prototypeData = await fetchPrototypeData(env, projectId, options);

    // Generate export based on format
    if (format === 'html') {
      const html = generateHTMLExport(prototypeData);
      
      return c.json({
        success: true,
        format: 'html',
        filename: `${project.name || 'prototype'}-export.html`,
        content: html,
      });
    }

    if (format === 'zip') {
      // For ZIP format, we'd need to create a proper ZIP file
      // For now, return JSON with metadata about what would be in the ZIP
      return c.json({
        success: true,
        format: 'zip',
        message: 'ZIP export is not yet implemented, returning JSON instead',
        data: prototypeData,
      });
    }

    // Default: JSON format
    return c.json({
      success: true,
      format: 'json',
      filename: `${project.name || 'prototype'}-export.json`,
      data: prototypeData,
    });
  } catch (error) {
    console.error('Error exporting prototype:', error);
    return c.json({ error: 'Failed to export prototype' }, 500);
  }
});

/**
 * GET /api/prototype-export/:projectId
 * Get export options and metadata for a project
 */
prototypeExport.get('/:projectId', async (c) => {
  try {
    const projectId = c.req.param('projectId');
    const env = c.env;

    if (!projectId) {
      return c.json({ error: 'Missing projectId parameter' }, 400);
    }

    // Fetch project info and counts
    const project = await queryOne<ProjectRow>(
      env,
      'SELECT * FROM Project WHERE id = ?',
      [projectId]
    );

    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    // Get counts for export options
    const [snapshots, versions, pages, requirements, entities, relations, components] = await Promise.all([
      queryDB<{ count: number }>(env, 'SELECT COUNT(*) as count FROM PrototypeSnapshot WHERE projectId = ?', [projectId]),
      queryDB<{ count: number }>(env, 'SELECT COUNT(*) as count FROM PrototypeVersion WHERE projectId = ?', [projectId]),
      queryDB<{ count: number }>(env, 'SELECT COUNT(*) as count FROM Page WHERE projectId = ?', [projectId]),
      queryDB<{ count: number }>(env, 'SELECT COUNT(*) as count FROM Requirement WHERE projectId = ?', [projectId]),
      queryDB<{ count: number }>(env, 'SELECT COUNT(*) as count FROM DomainEntity WHERE projectId = ?', [projectId]),
      queryDB<{ count: number }>(env, 'SELECT COUNT(*) as count FROM EntityRelation WHERE projectId = ?', [projectId]),
      queryDB<{ count: number }>(env, 'SELECT COUNT(*) as count FROM Component WHERE projectId = ?', [projectId]),
    ]);

    return c.json({
      project: {
        id: project.id,
        name: project.name,
        description: project.description,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      },
      exportOptions: {
        formats: ['json', 'html'],
        defaults: {
          includeVersions: true,
          includePages: true,
          includeRequirements: true,
          includeEntities: false,
          includeRelations: false,
          includeComponents: true,
        },
      },
      availableData: {
        snapshots: snapshots[0]?.count || 0,
        versions: versions[0]?.count || 0,
        pages: pages[0]?.count || 0,
        requirements: requirements[0]?.count || 0,
        entities: entities[0]?.count || 0,
        relations: relations[0]?.count || 0,
        components: components[0]?.count || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching export metadata:', error);
    return c.json({ error: 'Failed to fetch export metadata' }, 500);
  }
});

export default prototypeExport;
