/**
 * @deprecated This router uses the legacy Page Router API. 
 * All routes have been migrated to Next.js App Router (app/api/). 
 * See: docs/migration/page-router-to-app-router.md 
 * This file will be removed after E1 security fixes are complete. 
 */
import { Hono } from 'hono';

import { queryDB, queryOne, executeDB, generateId, Env } from '@/lib/db';

import { safeError } from '@/lib/log-sanitizer';
import { apiError, ERROR_CODES } from '@/lib/api-error';

const componentManager = new Hono<{ Bindings: Env }>();

// ============================================
// Types
// ============================================

interface ComponentRow {
  id: string;
  name: string;
  category: string;
  description: string | null;
  props: string; // JSON string
  variants: string; // JSON string
  style: string; // JSON string
  interactions: string; // JSON string
  replaceable: number; // boolean as 0/1
  alternatives: string; // JSON string
  projectId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ComponentVariant {
  variant: string;
  props: Record<string, unknown>;
  style: Record<string, unknown>;
  interactions?: Record<string, unknown>;
  replaceable?: boolean;
  alternatives?: string[];
}

// ============================================
// Helper Functions
// ============================================

function parseJsonField<T>(jsonStr: string | null | undefined, defaultValue: T): T {
  if (!jsonStr) return defaultValue;
  try {
    return JSON.parse(jsonStr) as T;
  } catch {
    return defaultValue;
  }
}

// ============================================
// GET /api/components - List all components
// ============================================

componentManager.get('/', async (c) => {
  try {
    const projectId = c.req.query('projectId');
    const category = c.req.query('category');
    const search = c.req.query('search');
    const env = c.env;

    let sql = 'SELECT * FROM Component';
    const params: string[] = [];
    const conditions: string[] = [];

    if (projectId) {
      conditions.push('(projectId = ? OR projectId IS NULL)');
      params.push(projectId);
    }

    if (category) {
      conditions.push('category = ?');
      params.push(category);
    }

    if (search) {
      conditions.push('(name LIKE ? OR description LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    sql += ' ORDER BY category ASC, name ASC';

    const components = await queryDB<ComponentRow>(env, sql, params);

    // Parse JSON fields
    const parsedComponents = components.map((comp) => ({
      ...comp,
      props: parseJsonField(comp.props, {}),
      variants: parseJsonField(comp.variants, []),
      style: parseJsonField(comp.style, {}),
      interactions: parseJsonField(comp.interactions, {}),
      replaceable: Boolean(comp.replaceable),
      alternatives: parseJsonField(comp.alternatives, []),
    }));

    return c.json({ components: parsedComponents });
  } catch (error) {
    safeError('Error fetching components:', error);
    return         c.json(apiError('Failed to fetch components', ERROR_CODES.INTERNAL_ERROR), 500);
  }
});

// ============================================
// GET /api/components/categories - List all categories
// ============================================

componentManager.get('/categories', async (c) => {
  try {
    const env = c.env;

    const categories = await queryDB<{ category: string; count: number }>(
      env,
      'SELECT category, COUNT(*) as count FROM Component GROUP BY category ORDER BY category ASC',
      []
    );

    return c.json({ categories });
  } catch (error) {
    safeError('Error fetching categories:', error);
    return         c.json(apiError('Failed to fetch categories', ERROR_CODES.INTERNAL_ERROR), 500);
  }
});

// ============================================
// GET /api/components/:id - Get a specific component
// ============================================

componentManager.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const env = c.env;

    const component = await queryOne<ComponentRow>(
      env,
      'SELECT * FROM Component WHERE id = ?',
      [id]
    );

    if (!component) {
      return         c.json(apiError('Component not found', ERROR_CODES.NOT_FOUND), 404);
    }

    // Parse JSON fields
    const parsedComponent = {
      ...component,
      props: parseJsonField(component.props, {}),
      variants: parseJsonField(component.variants, []),
      style: parseJsonField(component.style, {}),
      interactions: parseJsonField(component.interactions, {}),
      replaceable: Boolean(component.replaceable),
      alternatives: parseJsonField(component.alternatives, []),
    };

    return c.json({ component: parsedComponent });
  } catch (error) {
    safeError('Error fetching component:', error);
    return         c.json(apiError('Failed to fetch component', ERROR_CODES.INTERNAL_ERROR), 500);
  }
});

// ============================================
// POST /api/components - Create a new component
// ============================================

componentManager.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const {
      name,
      category,
      description,
      props,
      variants,
      style,
      interactions,
      replaceable,
      alternatives,
      projectId,
    } = body;

    if (!name || !category) {
      return         c.json(apiError('Missing required fields: name, category', ERROR_CODES.BAD_REQUEST), 400);
    }

    const env = c.env;
    const componentId = generateId();
    const now = new Date().toISOString();

    await executeDB(
      env,
      `INSERT INTO Component (
        id, name, category, description, props, variants, style, 
        interactions, replaceable, alternatives, projectId, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        componentId,
        name,
        category,
        description || null,
        JSON.stringify(props || {}),
        JSON.stringify(variants || []),
        JSON.stringify(style || {}),
        JSON.stringify(interactions || {}),
        replaceable ? 1 : 0,
        JSON.stringify(alternatives || []),
        projectId || null,
        now,
        now,
      ]
    );

    const component = await queryOne<ComponentRow>(
      env,
      'SELECT * FROM Component WHERE id = ?',
      [componentId]
    );

    if (!component) {
      return         c.json(apiError('Failed to create component', ERROR_CODES.INTERNAL_ERROR), 500);
    }

    const parsedComponent = {
      ...component,
      props: parseJsonField(component.props, {}),
      variants: parseJsonField(component.variants, []),
      style: parseJsonField(component.style, {}),
      interactions: parseJsonField(component.interactions, {}),
      replaceable: Boolean(component.replaceable),
      alternatives: parseJsonField(component.alternatives, []),
    };

    return c.json({ component: parsedComponent }, 201);
  } catch (error) {
    safeError('Error creating component:', error);
    return         c.json(apiError('Failed to create component', ERROR_CODES.INTERNAL_ERROR), 500);
  }
});

// ============================================
// PUT /api/components/:id - Update a component
// ============================================

componentManager.put('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const env = c.env;

    // Check if component exists
    const existing = await queryOne<ComponentRow>(
      env,
      'SELECT * FROM Component WHERE id = ?',
      [id]
    );

    if (!existing) {
      return         c.json(apiError('Component not found', ERROR_CODES.NOT_FOUND), 404);
    }

    const {
      name,
      category,
      description,
      props,
      variants,
      style,
      interactions,
      replaceable,
      alternatives,
    } = body;

    const now = new Date().toISOString();

    // Build update query dynamically
    const updates: string[] = ['updatedAt = ?'];
    const params: unknown[] = [now];

    if (name !== undefined) {
      updates.push('name = ?');
      params.push(name);
    }
    if (category !== undefined) {
      updates.push('category = ?');
      params.push(category);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }
    if (props !== undefined) {
      updates.push('props = ?');
      params.push(JSON.stringify(props));
    }
    if (variants !== undefined) {
      updates.push('variants = ?');
      params.push(JSON.stringify(variants));
    }
    if (style !== undefined) {
      updates.push('style = ?');
      params.push(JSON.stringify(style));
    }
    if (interactions !== undefined) {
      updates.push('interactions = ?');
      params.push(JSON.stringify(interactions));
    }
    if (replaceable !== undefined) {
      updates.push('replaceable = ?');
      params.push(replaceable ? 1 : 0);
    }
    if (alternatives !== undefined) {
      updates.push('alternatives = ?');
      params.push(JSON.stringify(alternatives));
    }

    params.push(id);

    await executeDB(
      env,
      `UPDATE Component SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    const component = await queryOne<ComponentRow>(
      env,
      'SELECT * FROM Component WHERE id = ?',
      [id]
    );

    const parsedComponent = {
      ...component,
      props: parseJsonField(component?.props, {}),
      variants: parseJsonField(component?.variants, []),
      style: parseJsonField(component?.style, {}),
      interactions: parseJsonField(component?.interactions, {}),
      replaceable: Boolean(component?.replaceable),
      alternatives: parseJsonField(component?.alternatives, []),
    };

    return c.json({ component: parsedComponent });
  } catch (error) {
    safeError('Error updating component:', error);
    return         c.json(apiError('Failed to update component', ERROR_CODES.INTERNAL_ERROR), 500);
  }
});

// ============================================
// DELETE /api/components/:id - Delete a component
// ============================================

componentManager.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const env = c.env;

    // Check if component exists
    const existing = await queryOne<ComponentRow>(
      env,
      'SELECT * FROM Component WHERE id = ?',
      [id]
    );

    if (!existing) {
      return         c.json(apiError('Component not found', ERROR_CODES.NOT_FOUND), 404);
    }

    await executeDB(env, 'DELETE FROM Component WHERE id = ?', [id]);

    return c.json({ success: true, message: 'Component deleted successfully' });
  } catch (error) {
    safeError('Error deleting component:', error);
    return         c.json(apiError('Failed to delete component', ERROR_CODES.INTERNAL_ERROR), 500);
  }
});

// ============================================
// POST /api/components/:id/variants - Add a variant to component
// ============================================

componentManager.post('/:id/variants', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const env = c.env;

    // Check if component exists
    const existing = await queryOne<ComponentRow>(
      env,
      'SELECT * FROM Component WHERE id = ?',
      [id]
    );

    if (!existing) {
      return         c.json(apiError('Component not found', ERROR_CODES.NOT_FOUND), 404);
    }

    const { variant, props, style, interactions, replaceable, alternatives } = body;

    if (!variant) {
      return         c.json(apiError('Missing required field: variant', ERROR_CODES.BAD_REQUEST), 400);
    }

    // Parse existing variants
    const existingVariants: ComponentVariant[] = parseJsonField(existing.variants, []);
    
    // Check if variant already exists
    const variantExists = existingVariants.some(v => v.variant === variant);
    if (variantExists) {
      return c.json({ error: `Variant "${variant}" already exists` }, 400);
    }

    // Add new variant
    const newVariant: ComponentVariant = {
      variant,
      props: props || {},
      style: style || {},
      interactions,
      replaceable,
      alternatives,
    };

    existingVariants.push(newVariant);

    const now = new Date().toISOString();
    await executeDB(
      env,
      'UPDATE Component SET variants = ?, updatedAt = ? WHERE id = ?',
      [JSON.stringify(existingVariants), now, id]
    );

    const component = await queryOne<ComponentRow>(
      env,
      'SELECT * FROM Component WHERE id = ?',
      [id]
    );

    const parsedComponent = {
      ...component,
      props: parseJsonField(component?.props, {}),
      variants: parseJsonField(component?.variants, []),
      style: parseJsonField(component?.style, {}),
      interactions: parseJsonField(component?.interactions, {}),
      replaceable: Boolean(component?.replaceable),
      alternatives: parseJsonField(component?.alternatives, []),
    };

    return c.json({ component: parsedComponent });
  } catch (error) {
    safeError('Error adding variant:', error);
    return         c.json(apiError('Failed to add variant', ERROR_CODES.INTERNAL_ERROR), 500);
  }
});

// ============================================
// PUT /api/components/:id/variants/:variantName - Update a variant
// ============================================

componentManager.put('/:id/variants/:variantName', async (c) => {
  try {
    const id = c.req.param('id');
    const variantName = c.req.param('variantName');
    const body = await c.req.json();
    const env = c.env;

    // Check if component exists
    const existing = await queryOne<ComponentRow>(
      env,
      'SELECT * FROM Component WHERE id = ?',
      [id]
    );

    if (!existing) {
      return         c.json(apiError('Component not found', ERROR_CODES.NOT_FOUND), 404);
    }

    // Parse existing variants
    const existingVariants: ComponentVariant[] = parseJsonField(existing.variants, []);
    
    // Find and update variant
    const variantIndex = existingVariants.findIndex(v => v.variant === variantName);
    if (variantIndex === -1) {
      return c.json({ error: `Variant "${variantName}" not found` }, 404);
    }

    // Merge update
    existingVariants[variantIndex] = {
      ...existingVariants[variantIndex],
      ...body,
    };

    const now = new Date().toISOString();
    await executeDB(
      env,
      'UPDATE Component SET variants = ?, updatedAt = ? WHERE id = ?',
      [JSON.stringify(existingVariants), now, id]
    );

    const component = await queryOne<ComponentRow>(
      env,
      'SELECT * FROM Component WHERE id = ?',
      [id]
    );

    const parsedComponent = {
      ...component,
      props: parseJsonField(component?.props, {}),
      variants: parseJsonField(component?.variants, []),
      style: parseJsonField(component?.style, {}),
      interactions: parseJsonField(component?.interactions, {}),
      replaceable: Boolean(component?.replaceable),
      alternatives: parseJsonField(component?.alternatives, []),
    };

    return c.json({ component: parsedComponent });
  } catch (error) {
    safeError('Error updating variant:', error);
    return         c.json(apiError('Failed to update variant', ERROR_CODES.INTERNAL_ERROR), 500);
  }
});

// ============================================
// DELETE /api/components/:id/variants/:variantName - Delete a variant
// ============================================

componentManager.delete('/:id/variants/:variantName', async (c) => {
  try {
    const id = c.req.param('id');
    const variantName = c.req.param('variantName');
    const env = c.env;

    // Check if component exists
    const existing = await queryOne<ComponentRow>(
      env,
      'SELECT * FROM Component WHERE id = ?',
      [id]
    );

    if (!existing) {
      return         c.json(apiError('Component not found', ERROR_CODES.NOT_FOUND), 404);
    }

    // Parse existing variants
    const existingVariants: ComponentVariant[] = parseJsonField(existing.variants, []);
    
    // Filter out the variant to delete
    const newVariants = existingVariants.filter(v => v.variant !== variantName);
    
    if (newVariants.length === existingVariants.length) {
      return c.json({ error: `Variant "${variantName}" not found` }, 404);
    }

    const now = new Date().toISOString();
    await executeDB(
      env,
      'UPDATE Component SET variants = ?, updatedAt = ? WHERE id = ?',
      [JSON.stringify(newVariants), now, id]
    );

    const component = await queryOne<ComponentRow>(
      env,
      'SELECT * FROM Component WHERE id = ?',
      [id]
    );

    const parsedComponent = {
      ...component,
      props: parseJsonField(component?.props, {}),
      variants: parseJsonField(component?.variants, []),
      style: parseJsonField(component?.style, {}),
      interactions: parseJsonField(component?.interactions, {}),
      replaceable: Boolean(component?.replaceable),
      alternatives: parseJsonField(component?.alternatives, []),
    };

    return c.json({ component: parsedComponent });
  } catch (error) {
    safeError('Error deleting variant:', error);
    return         c.json(apiError('Failed to delete variant', ERROR_CODES.INTERNAL_ERROR), 500);
  }
});

// ============================================
// Export
// ============================================

export default componentManager;
