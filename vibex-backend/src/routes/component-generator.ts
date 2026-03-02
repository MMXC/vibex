/**
 * Component Generator API Routes
 * 
 * Provides endpoints for generating UI components using AI.
 * Supports multiple frameworks, UI libraries, and design styles.
 * 
 * Features:
 * - Single component generation
 * - Batch component generation
 * - Page generation
 * - Design token generation
 * - Component variant generation
 * - Quick generation helpers for common components
 * 
 * @module routes/component-generator
 */

import { Hono } from 'hono';
import { queryOne, queryDB, executeDB, generateId, Env } from '@/lib/db';
import {
  createUIGeneratorService,
  UIGeneratorService,
  UIGeneratorOptions,
  ComponentSpec,
  ComponentType,
  UIFramework,
  UILibrary,
  UIDesignStyle,
  PageType,
  GeneratedComponent,
  GeneratedPage,
  DesignTokens,
} from '@/services/ui-generator';

const componentGenerator = new Hono<{ Bindings: Env }>();

// ==================== Types ====================

interface ProjectRow {
  id: string;
  name: string;
  description: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

interface PageRow {
  id: string;
  name: string;
  content: string | null;
  projectId: string;
  createdAt: string;
  updatedAt: string;
}

interface GeneratedComponentRow {
  id: string;
  projectId: string;
  pageId: string | null;
  name: string;
  type: string;
  framework: string;
  uiLibrary: string;
  code: string;
  styles: string | null;
  types: string | null;
  propsInterface: string | null;
  usageExample: string | null;
  dependencies: string | null;
  config: string | null;
  createdAt: string;
  updatedAt: string;
}

interface GenerateComponentRequest {
  projectId: string;
  pageId?: string;
  spec: ComponentSpec;
  options?: Partial<UIGeneratorOptions>;
  save?: boolean;
}

interface GeneratePageRequest {
  projectId: string;
  description: string;
  pageType: PageType;
  pageName?: string;
  options?: Partial<UIGeneratorOptions>;
  save?: boolean;
}

interface GenerateBatchRequest {
  projectId: string;
  pageId?: string;
  components: Array<{
    spec: ComponentSpec;
    options?: Partial<UIGeneratorOptions>;
  }>;
  save?: boolean;
}

interface QuickGenerateRequest {
  projectId: string;
  pageId?: string;
  type: 'button' | 'input' | 'card' | 'modal';
  variant?: string;
  options?: Partial<UIGeneratorOptions>;
  save?: boolean;
}

// ==================== Helper Functions ====================

/**
 * Save generated component to database
 */
async function saveGeneratedComponent(
  env: Env,
  projectId: string,
  pageId: string | null,
  component: GeneratedComponent,
  options: Partial<UIGeneratorOptions>
): Promise<string> {
  const componentId = generateId();
  const now = new Date().toISOString();

  await executeDB(
    env,
    `INSERT INTO GeneratedComponent 
     (id, projectId, pageId, name, type, framework, uiLibrary, code, styles, types, 
      propsInterface, usageExample, dependencies, config, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      componentId,
      projectId,
      pageId,
      component.name,
      component.type,
      options.framework || 'react',
      options.uiLibrary || 'tailwind',
      component.code,
      component.styles || null,
      component.types || null,
      component.propsInterface || null,
      component.usageExample || null,
      component.dependencies ? JSON.stringify(component.dependencies) : null,
      JSON.stringify(options),
      now,
      now,
    ]
  );

  return componentId;
}

/**
 * Get UI Generator service instance
 */
function getGeneratorService(env: Env, options?: Partial<UIGeneratorOptions>): UIGeneratorService {
  return createUIGeneratorService(env, options);
}

/**
 * Validate project exists
 */
async function validateProject(env: Env, projectId: string): Promise<ProjectRow | null> {
  return queryOne<ProjectRow>(
    env,
    'SELECT * FROM Project WHERE id = ?',
    [projectId]
  );
}

// ==================== API Routes ====================

/**
 * POST /api/component-generator - Generate a single component
 * 
 * Request body:
 * - projectId: string (required) - Project ID to associate component with
 * - pageId: string (optional) - Page ID to associate component with
 * - spec: ComponentSpec (required) - Component specification
 * - options: UIGeneratorOptions (optional) - Generation options
 * - save: boolean (optional) - Whether to save to database (default: true)
 * 
 * Response:
 * - component: GeneratedComponent
 * - componentId: string (if saved)
 */
componentGenerator.post('/', async (c) => {
  try {
    const body = await c.req.json() as GenerateComponentRequest;
    const { projectId, pageId, spec, options = {}, save = true } = body;

    // Validate required fields
    if (!projectId) {
      return c.json({ error: 'Missing required field: projectId' }, 400);
    }
    if (!spec || !spec.name || !spec.type) {
      return c.json({ error: 'Missing required fields in spec: name, type' }, 400);
    }

    const env = c.env;

    // Validate project exists
    const project = await validateProject(env, projectId);
    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    // Generate component
    const generator = getGeneratorService(env, options);
    const result = await generator.generateComponent(spec, options);

    if (!result.success || !result.data) {
      return c.json({
        error: 'Failed to generate component',
        details: result.error,
      }, 500);
    }

    // Save to database if requested
    let componentId: string | undefined;
    if (save) {
      componentId = await saveGeneratedComponent(
        env,
        projectId,
        pageId || null,
        result.data as GeneratedComponent,
        options
      );
    }

    return c.json({
      success: true,
      component: result.data,
      componentId,
      metadata: {
        provider: result.provider,
        model: result.model,
        usage: result.usage,
        latency: result.latency,
      },
    }, 201);

  } catch (error) {
    console.error('Error generating component:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return c.json({
      error: 'Failed to generate component',
      details: errorMessage,
    }, 500);
  }
});

/**
 * POST /api/component-generator/batch - Generate multiple components
 * 
 * Request body:
 * - projectId: string (required)
 * - pageId: string (optional)
 * - components: Array<{ spec: ComponentSpec, options?: UIGeneratorOptions }> (required)
 * - save: boolean (optional) - Whether to save to database (default: true)
 * 
 * Response:
 * - results: Array<{ success: boolean, component?: GeneratedComponent, componentId?: string, error?: string }>
 */
componentGenerator.post('/batch', async (c) => {
  try {
    const body = await c.req.json() as GenerateBatchRequest;
    const { projectId, pageId, components, save = true } = body;

    // Validate required fields
    if (!projectId) {
      return c.json({ error: 'Missing required field: projectId' }, 400);
    }
    if (!components || !Array.isArray(components) || components.length === 0) {
      return c.json({ error: 'Missing or invalid field: components (must be a non-empty array)' }, 400);
    }

    const env = c.env;

    // Validate project exists
    const project = await validateProject(env, projectId);
    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    const generator = getGeneratorService(env);
    const results: Array<{
      success: boolean;
      component?: GeneratedComponent;
      componentId?: string;
      error?: string;
    }> = [];

    for (const item of components) {
      const { spec, options = {} } = item;

      if (!spec || !spec.name || !spec.type) {
        results.push({
          success: false,
          error: 'Missing required fields in spec: name, type',
        });
        continue;
      }

      try {
        const result = await generator.generateComponent(spec, options);

        if (!result.success || !result.data) {
          results.push({
            success: false,
            error: result.error || 'Unknown error',
          });
          continue;
        }

        let componentId: string | undefined;
        if (save) {
          componentId = await saveGeneratedComponent(
            env,
            projectId,
            pageId || null,
            result.data as GeneratedComponent,
            options
          );
        }

        results.push({
          success: true,
          component: result.data as GeneratedComponent,
          componentId,
        });

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.push({
          success: false,
          error: errorMessage,
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    return c.json({
      success: true,
      summary: {
        total: components.length,
        succeeded: successCount,
        failed: failCount,
      },
      results,
    }, 200);

  } catch (error) {
    console.error('Error in batch generation:', error);
    return c.json({ error: 'Failed to perform batch generation' }, 500);
  }
});

/**
 * POST /api/component-generator/page - Generate a complete page
 * 
 * Request body:
 * - projectId: string (required)
 * - description: string (required) - Page description
 * - pageType: PageType (required) - Type of page to generate
 * - pageName: string (optional) - Name for the page
 * - options: UIGeneratorOptions (optional)
 * - save: boolean (optional) - Whether to save to database (default: true)
 * 
 * Response:
 * - page: GeneratedPage
 * - pageId: string (if saved)
 */
componentGenerator.post('/page', async (c) => {
  try {
    const body = await c.req.json() as GeneratePageRequest;
    const { projectId, description, pageType, pageName, options = {}, save = true } = body;

    // Validate required fields
    if (!projectId) {
      return c.json({ error: 'Missing required field: projectId' }, 400);
    }
    if (!description) {
      return c.json({ error: 'Missing required field: description' }, 400);
    }
    if (!pageType) {
      return c.json({ error: 'Missing required field: pageType' }, 400);
    }

    const env = c.env;

    // Validate project exists
    const project = await validateProject(env, projectId);
    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    // Generate page
    const generator = getGeneratorService(env, options);
    const result = await generator.generatePage(description, pageType, options);

    if (!result.success || !result.data) {
      return c.json({
        error: 'Failed to generate page',
        details: result.error,
      }, 500);
    }

    const generatedPage = result.data as GeneratedPage;
    let pageId: string | undefined;

    // Save to database if requested
    if (save) {
      // Create page record
      pageId = generateId();
      const now = new Date().toISOString();

      await executeDB(
        env,
        `INSERT INTO Page (id, name, content, projectId, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          pageId,
          pageName || generatedPage.name || `${pageType}-page`,
          JSON.stringify(generatedPage),
          projectId,
          now,
          now,
        ]
      );

      // Save all components from the page
      if (generatedPage.components) {
        for (const component of generatedPage.components) {
          await saveGeneratedComponent(env, projectId, pageId, component, options);
        }
      }

      // Save main component
      if (generatedPage.component) {
        await saveGeneratedComponent(env, projectId, pageId, generatedPage.component, options);
      }
    }

    return c.json({
      success: true,
      page: generatedPage,
      pageId,
      metadata: {
        provider: result.provider,
        model: result.model,
        usage: result.usage,
        latency: result.latency,
      },
    }, 201);

  } catch (error) {
    console.error('Error generating page:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return c.json({
      error: 'Failed to generate page',
      details: errorMessage,
    }, 500);
  }
});

/**
 * POST /api/component-generator/quick - Quick generate common components
 * 
 * Request body:
 * - projectId: string (required)
 * - pageId: string (optional)
 * - type: 'button' | 'input' | 'card' | 'modal' (required)
 * - variant: string (optional) - Component variant (e.g., 'primary', 'secondary')
 * - options: UIGeneratorOptions (optional)
 * - save: boolean (optional)
 * 
 * Response:
 * - component: GeneratedComponent
 * - componentId: string (if saved)
 */
componentGenerator.post('/quick', async (c) => {
  try {
    const body = await c.req.json() as QuickGenerateRequest;
    const { projectId, pageId, type, variant, options = {}, save = true } = body;

    // Validate required fields
    if (!projectId) {
      return c.json({ error: 'Missing required field: projectId' }, 400);
    }
    if (!type) {
      return c.json({ error: 'Missing required field: type' }, 400);
    }

    const validTypes = ['button', 'input', 'card', 'modal'] as const;
    if (!validTypes.includes(type as any)) {
      return c.json({
        error: `Invalid type. Must be one of: ${validTypes.join(', ')}`,
      }, 400);
    }

    const env = c.env;

    // Validate project exists
    const project = await validateProject(env, projectId);
    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    // Generate component using quick methods
    const generator = getGeneratorService(env, options);
    let result;

    switch (type) {
      case 'button':
        result = await generator.quickButton(
          (variant as 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger') || 'primary',
          options
        );
        break;
      case 'input':
        result = await generator.quickInput(options);
        break;
      case 'card':
        result = await generator.quickCard(options);
        break;
      case 'modal':
        result = await generator.quickModal(options);
        break;
      default:
        return c.json({ error: 'Invalid component type' }, 400);
    }

    if (!result.success || !result.data) {
      return c.json({
        error: 'Failed to generate component',
        details: result.error,
      }, 500);
    }

    // Save to database if requested
    let componentId: string | undefined;
    if (save) {
      componentId = await saveGeneratedComponent(
        env,
        projectId,
        pageId || null,
        result.data as GeneratedComponent,
        options
      );
    }

    return c.json({
      success: true,
      component: result.data,
      componentId,
      metadata: {
        provider: result.provider,
        model: result.model,
        usage: result.usage,
        latency: result.latency,
      },
    }, 201);

  } catch (error) {
    console.error('Error in quick generation:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return c.json({
      error: 'Failed to generate component',
      details: errorMessage,
    }, 500);
  }
});

/**
 * POST /api/component-generator/tokens - Generate design tokens
 * 
 * Request body:
 * - description: string (optional) - Description of the design system
 * - options: UIGeneratorOptions (optional)
 * 
 * Response:
 * - tokens: DesignTokens
 */
componentGenerator.post('/tokens', async (c) => {
  try {
    const body = await c.req.json();
    const { description = 'Generate a complete design token system', options = {} } = body;

    const env = c.env;
    const generator = getGeneratorService(env, options);

    const result = await generator.generateDesignTokens(description, options);

    if (!result.success || !result.data) {
      return c.json({
        error: 'Failed to generate design tokens',
        details: result.error,
      }, 500);
    }

    return c.json({
      success: true,
      tokens: result.data,
      metadata: {
        provider: result.provider,
        model: result.model,
        usage: result.usage,
      },
    }, 200);

  } catch (error) {
    console.error('Error generating design tokens:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return c.json({
      error: 'Failed to generate design tokens',
      details: errorMessage,
    }, 500);
  }
});

/**
 * GET /api/component-generator/templates - Get available component templates
 * 
 * Returns a list of available component types and their specifications.
 */
componentGenerator.get('/templates', async (c) => {
  const templates: Record<string, { type: ComponentType; description: string; props: string[] }> = {
    button: {
      type: 'button',
      description: 'Interactive button with multiple variants and states',
      props: ['variant', 'size', 'disabled', 'loading', 'fullWidth', 'leftIcon', 'rightIcon'],
    },
    input: {
      type: 'input',
      description: 'Text input with validation states and icons',
      props: ['type', 'placeholder', 'value', 'disabled', 'error', 'helperText', 'label', 'required'],
    },
    card: {
      type: 'card',
      description: 'Container card with header, body, and footer',
      props: ['title', 'subtitle', 'variant', 'padding', 'hoverable', 'clickable'],
    },
    modal: {
      type: 'modal',
      description: 'Dialog modal with backdrop and focus trap',
      props: ['isOpen', 'onClose', 'title', 'size', 'closeOnOverlayClick', 'centered'],
    },
    select: {
      type: 'select',
      description: 'Dropdown select with search and multi-select',
      props: ['options', 'value', 'multiple', 'searchable', 'placeholder'],
    },
    table: {
      type: 'table',
      description: 'Data table with sorting and pagination',
      props: ['columns', 'data', 'sortable', 'pagination', 'selectable'],
    },
    navbar: {
      type: 'navbar',
      description: 'Navigation bar with responsive menu',
      props: ['logo', 'links', 'actions', 'sticky'],
    },
    hero: {
      type: 'hero',
      description: 'Hero section for landing pages',
      props: ['title', 'subtitle', 'background', 'cta', 'alignment'],
    },
  };

  return c.json({
    success: true,
    templates,
    frameworks: ['react', 'vue', 'svelte', 'vanilla', 'angular'] as UIFramework[],
    libraries: ['tailwind', 'shadcn', 'mui', 'antd', 'chakra', 'none'] as UILibrary[],
    styles: [
      'minimal', 'glassmorphism', 'bento', 'gradient', 'neumorphism',
      'brutalist', 'neobrutalism', 'corporate', 'playful'
    ] as UIDesignStyle[],
    pageTypes: [
      'landing', 'auth', 'dashboard', 'chat', 'form', 'list', 'detail',
      'settings', 'profile', 'checkout', 'pricing', 'documentation', 'error', 'custom'
    ] as PageType[],
  }, 200);
});

/**
 * GET /api/component-generator - List generated components for a project
 * 
 * Query params:
 * - projectId: string (required)
 * - pageId: string (optional)
 * - type: string (optional)
 * - framework: string (optional)
 * 
 * Response:
 * - components: GeneratedComponentRow[]
 */
componentGenerator.get('/', async (c) => {
  try {
    const projectId = c.req.query('projectId');
    const pageId = c.req.query('pageId');
    const type = c.req.query('type');
    const framework = c.req.query('framework');

    if (!projectId) {
      return c.json({ error: 'Missing required query parameter: projectId' }, 400);
    }

    const env = c.env;

    let sql = 'SELECT * FROM GeneratedComponent WHERE projectId = ?';
    const params: string[] = [projectId];

    if (pageId) {
      sql += ' AND pageId = ?';
      params.push(pageId);
    }
    if (type) {
      sql += ' AND type = ?';
      params.push(type);
    }
    if (framework) {
      sql += ' AND framework = ?';
      params.push(framework);
    }

    sql += ' ORDER BY createdAt DESC';

    const components = await queryDB<GeneratedComponentRow>(env, sql, params);

    return c.json({
      success: true,
      components,
      count: components.length,
    }, 200);

  } catch (error) {
    console.error('Error fetching components:', error);
    return c.json({ error: 'Failed to fetch components' }, 500);
  }
});

/**
 * GET /api/component-generator/:id - Get a generated component by ID
 */
componentGenerator.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const env = c.env;

    const component = await queryOne<GeneratedComponentRow>(
      env,
      'SELECT * FROM GeneratedComponent WHERE id = ?',
      [id]
    );

    if (!component) {
      return c.json({ error: 'Component not found' }, 404);
    }

    // Parse JSON fields
    const result = {
      ...component,
      dependencies: component.dependencies ? JSON.parse(component.dependencies) : null,
      config: component.config ? JSON.parse(component.config) : null,
    };

    return c.json({
      success: true,
      component: result,
    }, 200);

  } catch (error) {
    console.error('Error fetching component:', error);
    return c.json({ error: 'Failed to fetch component' }, 500);
  }
});

/**
 * DELETE /api/component-generator/:id - Delete a generated component
 */
componentGenerator.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const env = c.env;

    // Check if component exists
    const component = await queryOne<GeneratedComponentRow>(
      env,
      'SELECT id FROM GeneratedComponent WHERE id = ?',
      [id]
    );

    if (!component) {
      return c.json({ error: 'Component not found' }, 404);
    }

    // Delete component
    await executeDB(env, 'DELETE FROM GeneratedComponent WHERE id = ?', [id]);

    return c.json({
      success: true,
      message: 'Component deleted successfully',
      componentId: id,
    }, 200);

  } catch (error) {
    console.error('Error deleting component:', error);
    return c.json({ error: 'Failed to delete component' }, 500);
  }
});

/**
 * POST /api/component-generator/preview - Preview a component without saving
 * 
 * Request body:
 * - spec: ComponentSpec (required)
 * - options: UIGeneratorOptions (optional)
 * 
 * Response:
 * - component: GeneratedComponent
 */
componentGenerator.post('/preview', async (c) => {
  try {
    const body = await c.req.json();
    const { spec, options = {} } = body;

    if (!spec || !spec.name || !spec.type) {
      return c.json({ error: 'Missing required fields in spec: name, type' }, 400);
    }

    const env = c.env;
    const generator = getGeneratorService(env, options);

    const result = await generator.generateComponent(spec, options);

    if (!result.success || !result.data) {
      return c.json({
        error: 'Failed to generate component preview',
        details: result.error,
      }, 500);
    }

    return c.json({
      success: true,
      component: result.data,
      metadata: {
        provider: result.provider,
        model: result.model,
        usage: result.usage,
        latency: result.latency,
      },
    }, 200);

  } catch (error) {
    console.error('Error generating preview:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return c.json({
      error: 'Failed to generate preview',
      details: errorMessage,
    }, 500);
  }
});

export default componentGenerator;