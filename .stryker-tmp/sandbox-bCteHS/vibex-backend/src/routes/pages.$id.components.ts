// @ts-nocheck
import { Hono } from 'hono';
import { queryOne, Env } from '@/lib/db';

const pageComponents = new Hono<{ Bindings: Env }>();

// ============================================
// Types
// ============================================

interface PageRow {
  id: string;
  name: string;
  content: string | null;
  projectId: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Component node in the tree structure
 */
interface ComponentNode {
  id?: string;
  name: string;
  type?: string;
  props?: Record<string, unknown>;
  children?: ComponentNode[];
  metadata?: Record<string, unknown>;
}

/**
 * Page content structure
 */
interface PageContent {
  name?: string;
  type?: string;
  component?: ComponentNode;
  components?: ComponentNode[];
  layout?: Record<string, unknown>;
  tokens?: Record<string, unknown>;
}

/**
 * Lazy loading options
 */
interface LazyLoadOptions {
  /** Maximum depth to traverse (0 = root only) */
  depth?: number;
  /** Maximum number of nodes to return at each level */
  limit?: number;
  /** Include component code/details */
  includeDetails?: boolean;
}

// ============================================
// Helper Functions
// ============================================

/**
 * Parse page content JSON
 */
function parsePageContent(content: string | null): PageContent {
  if (!content) {
    return {};
  }

  try {
    return JSON.parse(content) as PageContent;
  } catch {
    return {};
  }
}

/**
 * Build component tree from node
 */
function buildComponentTree(
  node: ComponentNode,
  options: LazyLoadOptions,
  currentDepth: number = 0
): ComponentNode {
  const { depth = Infinity, limit, includeDetails = false } = options;

  // Stop if we've reached max depth
  if (currentDepth >= depth) {
    return {
      ...node,
      children: undefined,
    };
  }

  // Build the node
  const treeNode: ComponentNode = {
    id: node.id || generateTempId(node.name, currentDepth),
    name: node.name,
    type: node.type,
    props: includeDetails ? node.props : undefined,
    metadata: includeDetails ? node.metadata : undefined,
  };

  // Process children
  if (node.children && node.children.length > 0) {
    const children = limit ? node.children.slice(0, limit) : node.children;
    treeNode.children = children.map((child) =>
      buildComponentTree(child, options, currentDepth + 1)
    );
  }

  return treeNode;
}

/**
 * Generate a temporary ID for nodes without IDs
 */
function generateTempId(name: string, index: number): string {
  return `${name}-${index}-${Date.now()}`;
}

/**
 * Extract all components as a flat list with tree structure info
 */
function flattenComponentTree(
  node: ComponentNode,
  parentId: string | null = null,
  depth: number = 0
): Array<ComponentNode & { parentId: string | null; depth: number }> {
  const result: Array<ComponentNode & { parentId: string | null; depth: number }> = [
    {
      ...node,
      parentId,
      depth,
    },
  ];

  if (node.children) {
    const nodeId = node.id || generateTempId(node.name, depth);
    for (const child of node.children) {
      result.push(...flattenComponentTree(child, nodeId, depth + 1));
    }
  }

  return result;
}

// ============================================
// GET /api/pages/:id/components - Get component tree for a page
// ============================================

pageComponents.get('/', async (c) => {
  try {
    const pageId = c.req.param('id');
    const env = c.env;

    // Parse query parameters for lazy loading
    const depth = c.req.query('depth');
    const limit = c.req.query('limit');
    const includeDetails = c.req.query('includeDetails');
    const flat = c.req.query('flat');

    const options: LazyLoadOptions = {
      depth: depth ? parseInt(depth, 10) : Infinity,
      limit: limit ? parseInt(limit, 10) : undefined,
      includeDetails: includeDetails === 'true',
    };

    // Fetch page
    const page = await queryOne<PageRow>(
      env,
      'SELECT * FROM Page WHERE id = ?',
      [pageId]
    );

    if (!page) {
      return c.json({ error: 'Page not found' }, 404);
    }

    // Parse page content
    const content = parsePageContent(page.content);

    // Handle flat list response
    if (flat === 'true') {
      let allComponents: Array<ComponentNode & { parentId: string | null; depth: number }> = [];

      // Get components from component field
      if (content.component) {
        allComponents = flattenComponentTree(content.component);
      }

      // Also include top-level components array if present
      if (content.components && content.components.length > 0) {
        for (const comp of content.components) {
          allComponents.push(...flattenComponentTree(comp));
        }
      }

      // Apply depth filter
      if (options.depth !== Infinity) {
        allComponents = allComponents.filter((comp) => comp.depth <= options.depth!);
      }

      // Apply limit
      if (options.limit) {
        allComponents = allComponents.slice(0, options.limit);
      }

      return c.json({
        pageId: page.id,
        pageName: page.name,
        total: allComponents.length,
        components: allComponents,
      });
    }

    // Build tree response
    const tree: ComponentNode[] = [];

    // Add main component if present
    if (content.component) {
      tree.push(buildComponentTree(content.component, options, 0));
    }

    // Add top-level components array if present
    if (content.components && content.components.length > 0) {
      const components = options.limit
        ? content.components.slice(0, options.limit)
        : content.components;
      for (const comp of components) {
        tree.push(buildComponentTree(comp, options, 0));
      }
    }

    return c.json({
      pageId: page.id,
      pageName: page.name,
      total: tree.length,
      tree,
      layout: options.includeDetails ? content.layout : undefined,
      tokens: options.includeDetails ? content.tokens : undefined,
    });
  } catch (error) {
    console.error('Error fetching page components:', error);
    return c.json({ error: 'Failed to fetch page components' }, 500);
  }
});

export default pageComponents;
