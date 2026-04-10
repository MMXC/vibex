/**
/**
 * @deprecated This router uses the legacy Page Router API. 
 * All routes have been migrated to Next.js App Router (app/api/). 
 * See: docs/migration/page-router-to-app-router.md 
 * This file will be removed after E1 security fixes are complete. 
 */
 * Prototype Preview API Routes
 * 
 * Provides endpoints for generating real-time UI previews from prototype snapshots.
 * Supports streaming previews, multiple framework outputs, and design customization.
 * 
 * @module routes/prototype-preview
 */

import { Hono } from 'hono';
import { queryOne, queryDB, executeDB, generateId, Env } from '@/lib/db';
import { createUIGeneratorService, UIGeneratorService, UIGeneratorOptions, UIGenerationResult, GeneratedComponent, GeneratedPage, ComponentType } from '@/services/ui-generator';

import { safeError } from '@/lib/log-sanitizer';

/** Type guard: is this a GeneratedPage (has .component sub-field)? */
function isGeneratedPage(val: GeneratedPage | GeneratedComponent): val is GeneratedPage {
  return 'component' in val && typeof (val as GeneratedPage).component === 'object';
}

const prototypePreview = new Hono<{ Bindings: Env }>();

// ==================== Types ====================

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

interface PreviewRequest {
  /** Snapshot ID to generate preview from */
  snapshotId?: string;
  /** Direct requirement text to generate preview (alternative to snapshotId) */
  requirement?: string;
  /** Page type hint for generation */
  pageType?: 'landing' | 'auth' | 'dashboard' | 'chat' | 'form' | 'list' | 'detail' | 'settings' | 'profile' | 'checkout' | 'pricing' | 'documentation' | 'error' | 'custom';
  /** Target UI framework */
  framework?: 'react' | 'vue' | 'svelte' | 'vanilla' | 'angular';
  /** UI library to use */
  uiLibrary?: 'tailwind' | 'shadcn' | 'mui' | 'antd' | 'chakra' | 'none';
  /** Design style */
  style?: 'minimal' | 'glassmorphism' | 'bento' | 'gradient' | 'neumorphism' | 'brutalist' | 'neobrutalism' | 'corporate' | 'playful';
  /** Custom design tokens */
  customTokens?: Record<string, unknown>;
  /** Enable streaming response */
  stream?: boolean;
  /** Project ID (required if using requirement directly) */
  projectId?: string;
  /** Generate with specific component focus */
  componentFocus?: string[];
}

interface PreviewResponse {
  success: boolean;
  preview?: {
    id: string;
    snapshotId?: string;
    projectId: string;
    code: string;
    styles?: string;
    types?: string;
    framework: string;
    uiLibrary: string;
    style: string;
    tokens?: Record<string, unknown>;
    components?: Array<{
      name: string;
      code: string;
      styles?: string;
    }>;
    layout?: {
      type: string;
      maxWidth?: string;
      background?: string;
    };
    generatedAt: string;
    latency: number;
  };
  error?: string;
}

interface PreviewListResponse {
  previews: Array<{
    id: string;
    snapshotId: string;
    projectId: string;
    framework: string;
    uiLibrary: string;
    createdAt: string;
  }>;
  pagination: {
    total: number;
    page: number;
    pageSize: number;
  };
}

// ==================== In-Memory Preview Cache ====================

// Simple in-memory cache for generated previews
// In production, this would use a proper cache like Redis
const previewCache = new Map<string, {
  preview: PreviewResponse['preview'];
  generatedAt: number;
  ttl: number;
}>();

const CACHE_TTL = 3600000; // 1 hour in milliseconds

/**
 * Get cached preview
 */
function getCachedPreview(key: string): PreviewResponse['preview'] | null {
  const cached = previewCache.get(key);
  if (cached && Date.now() - cached.generatedAt < cached.ttl) {
    return cached.preview;
  }
  previewCache.delete(key);
  return null;
}

/**
 * Set cached preview
 */
function setCachedPreview(key: string, preview: PreviewResponse['preview']): void {
  previewCache.set(key, {
    preview,
    generatedAt: Date.now(),
    ttl: CACHE_TTL,
  });
  
  // Cleanup old entries when cache gets too large
  if (previewCache.size > 100) {
    const now = Date.now();
    for (const [k, v] of previewCache.entries()) {
      if (now - v.generatedAt > v.ttl) {
        previewCache.delete(k);
      }
    }
  }
}

// ==================== Helper Functions ====================

/**
 * Parse snapshot content to extract requirements description
 */
function parseSnapshotContent(content: string): {
  description: string;
  pageType?: PreviewRequest['pageType'];
  components?: string[];
} {
  try {
    const parsed = JSON.parse(content);
    
    // Handle different snapshot content formats
    if (typeof parsed === 'string') {
      return { description: parsed };
    }
    
    if (parsed.description) {
      return {
        description: parsed.description,
        pageType: parsed.pageType,
        components: parsed.components,
      };
    }
    
    if (parsed.requirements) {
      return {
        description: Array.isArray(parsed.requirements)
          ? parsed.requirements.join('\n')
          : parsed.requirements,
        pageType: parsed.pageType,
        components: parsed.components,
      };
    }
    
    if (parsed.pages && Array.isArray(parsed.pages)) {
      // Multiple pages in snapshot - combine descriptions
      const descriptions = parsed.pages.map((p: any) => p.description || p.content || '').filter(Boolean);
      return {
        description: descriptions.join('\n\n'),
        pageType: parsed.pageType,
        components: parsed.components,
      };
    }
    
    // Fallback to raw content
    return { description: content };
  } catch {
    return { description: content };
  }
}

/**
 * Build UI generator options from request
 */
function buildGeneratorOptions(request: PreviewRequest): UIGeneratorOptions {
  return {
    framework: request.framework || 'react',
    uiLibrary: request.uiLibrary || 'tailwind',
    style: request.style || 'minimal',
    pageType: request.pageType || 'custom',
    typescript: true,
    includeDocs: true,
    animations: true,
    animationStyle: 'subtle',
    accessibilityLevel: 'AA',
    designTokens: request.customTokens,
  };
}

/**
 * Generate cache key for preview request
 */
function generateCacheKey(request: PreviewRequest, projectId: string): string {
  const parts = [
    request.snapshotId || 'direct',
    projectId,
    request.framework || 'react',
    request.uiLibrary || 'tailwind',
    request.style || 'minimal',
    request.pageType || 'custom',
    request.requirement ? hashCode(request.requirement) : '',
  ];
  return parts.filter(Boolean).join(':');
}

/**
 * Simple hash function for cache key
 */
function hashCode(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

// ==================== API Routes ====================

/**
 * POST /api/prototype-preview - Generate preview from snapshot or requirement
 * 
 * Generate a UI preview from either:
 * - An existing prototype snapshot (by snapshotId)
 * - Direct requirement text (by requirement)
 * 
 * Supports streaming for real-time preview generation.
 */
prototypePreview.post('/', async (c) => {
  const startTime = Date.now();
  
  try {
    const body = await c.req.json() as PreviewRequest;
    const env = c.env;
    
    // Validate request
    if (!body.snapshotId && !body.requirement) {
      return c.json<PreviewResponse>({
        success: false,
        error: 'Either snapshotId or requirement must be provided',
      }, 400);
    }
    
    let description: string;
    let projectId: string;
    let snapshotId: string | undefined;
    let pageType = body.pageType;
    let componentFocus = body.componentFocus;
    
    // Get content from snapshot or use direct requirement
    if (body.snapshotId) {
      const snapshot = await queryOne<PrototypeSnapshotRow>(
        env,
        'SELECT * FROM PrototypeSnapshot WHERE id = ?',
        [body.snapshotId]
      );
      
      if (!snapshot) {
        return c.json<PreviewResponse>({
          success: false,
          error: 'Prototype snapshot not found',
        }, 404);
      }
      
      const parsed = parseSnapshotContent(snapshot.content);
      description = parsed.description;
      projectId = snapshot.projectId;
      snapshotId = snapshot.id;
      pageType = pageType || parsed.pageType;
      componentFocus = componentFocus || parsed.components;
    } else {
      if (!body.projectId) {
        return c.json<PreviewResponse>({
          success: false,
          error: 'projectId is required when using direct requirement',
        }, 400);
      }
      description = body.requirement!;
      projectId = body.projectId;
    }
    
    // Check cache
    const cacheKey = generateCacheKey(body, projectId);
    const cachedPreview = getCachedPreview(cacheKey);
    
    if (cachedPreview) {
      return c.json<PreviewResponse>({
        success: true,
        preview: {
          ...cachedPreview,
          generatedAt: new Date().toISOString(),
          latency: Date.now() - startTime,
        },
      });
    }
    
    // Generate preview using UI Generator service
    const generatorOptions = buildGeneratorOptions(body);
    const uiGenerator = createUIGeneratorService(env, generatorOptions);
    
    // Handle streaming response
    if (body.stream) {
      // Return streaming response
      const stream = new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder();
          
          try {
            // Send initial status
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ status: 'generating', message: 'Starting preview generation...' })}\n\n`));
            
            // Generate page
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ status: 'generating', message: 'Generating UI components...' })}\n\n`));
            
            const result = await uiGenerator.generatePage(description, pageType || 'custom', generatorOptions);
            
            if (!result.success || !result.data) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ status: 'error', error: result.error || 'Generation failed' })}\n\n`));
              controller.close();
              return;
            }
            
            // Send progress updates
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ status: 'generating', message: 'Processing generated code...' })}\n\n`));
            
            const generatedPage = result.data;
            const previewId = generateId();
            const pageData = 'components' in generatedPage ? generatedPage : null;
            const componentData = isGeneratedPage(generatedPage) ? generatedPage.component : null;
            
            const preview: PreviewResponse['preview'] = {
              id: previewId,
              snapshotId,
              projectId,
              code: componentData?.code || '',
              styles: componentData?.styles,
              types: componentData?.types,
              framework: generatorOptions.framework || 'react',
              uiLibrary: generatorOptions.uiLibrary || 'tailwind',
              style: generatorOptions.style || 'minimal',
              tokens: pageData?.tokens as unknown as Record<string, unknown> || {},
              components: pageData?.components?.map(c => ({
                name: c.name,
                code: c.code,
                styles: c.styles,
              })),
              layout: (pageData?.layout as { type: string; maxWidth?: string; background?: string } | undefined) || undefined,
              generatedAt: new Date().toISOString(),
              latency: Date.now() - startTime,
            };
            
            // Cache the result
            setCachedPreview(cacheKey, preview);
            
            // Send final result
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ status: 'complete', preview })}\n\n`));
            controller.close();
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ status: 'error', error: errorMessage })}\n\n`));
            controller.close();
          }
        },
      });
      
      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }
    
    // Non-streaming response
    const result = await uiGenerator.generatePage(description, pageType || 'custom', generatorOptions);
    
    if (!result.success || !result.data) {
      return c.json<PreviewResponse>({
        success: false,
        error: result.error || 'Failed to generate preview',
      }, 500);
    }
    
    const generatedPage = result.data;
    const previewId = generateId();
    const pageData2 = 'components' in generatedPage ? generatedPage : null;
    const componentData2 = isGeneratedPage(generatedPage) ? generatedPage.component : null;
    
    const preview: PreviewResponse['preview'] = {
      id: previewId,
      snapshotId,
      projectId,
      code: componentData2?.code || '',
      styles: componentData2?.styles,
      types: componentData2?.types,
      framework: generatorOptions.framework || 'react',
      uiLibrary: generatorOptions.uiLibrary || 'tailwind',
      style: generatorOptions.style || 'minimal',
      tokens: pageData2?.tokens as unknown as Record<string, unknown> || {},
      components: pageData2?.components?.map(c => ({
        name: c.name,
        code: c.code,
        styles: c.styles,
      })),
      layout: pageData2?.layout as { type: string; maxWidth?: string; background?: string } | undefined || undefined,
      generatedAt: new Date().toISOString(),
      latency: Date.now() - startTime,
    };
    
    // Cache the result
    setCachedPreview(cacheKey, preview);
    
    return c.json<PreviewResponse>({
      success: true,
      preview,
    });
  } catch (error) {
    safeError('Error generating prototype preview:', error);
    return c.json<PreviewResponse>({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate preview',
    }, 500);
  }
});

/**
 * POST /api/prototype-preview/component - Generate a single component preview
 * 
 * Generate a preview for a single UI component based on description.
 */
prototypePreview.post('/component', async (c) => {
  const startTime = Date.now();
  
  try {
    const body = await c.req.json<{
      name?: string;
      type?: string;
      description: string;
      framework?: PreviewRequest['framework'];
      uiLibrary?: PreviewRequest['uiLibrary'];
      style?: PreviewRequest['style'];
      customTokens?: Record<string, unknown>;
      stream?: boolean;
    }>();
    
    const env = c.env;
    
    if (!body.description) {
      return c.json({
        success: false,
        error: 'Component description is required',
      }, 400);
    }
    
    const generatorOptions: UIGeneratorOptions = {
      framework: body.framework || 'react',
      uiLibrary: body.uiLibrary || 'tailwind',
      style: body.style || 'minimal',
      typescript: true,
      includeDocs: true,
      animations: true,
      designTokens: body.customTokens,
    };
    
    const uiGenerator = createUIGeneratorService(env, generatorOptions);
    
    // Generate component
    const result = await uiGenerator.generateComponent({
      name: body.name || 'CustomComponent',
      type: (body.type as ComponentType) || 'custom',
      description: body.description,
    }, generatorOptions);
    
    if (!result.success || !result.data) {
      return c.json({
        success: false,
        error: result.error || 'Failed to generate component',
      }, 500);
    }
    
    const component = result.data as GeneratedComponent;
    
    return c.json({
      success: true,
      component: {
        name: component.name,
        type: component.type,
        code: component.code,
        styles: component.styles,
        types: component.types,
        usageExample: component.usageExample,
        propsInterface: component.propsInterface,
        documentation: component.documentation,
        dependencies: component.dependencies,
        devDependencies: component.devDependencies,
      },
      framework: generatorOptions.framework,
      uiLibrary: generatorOptions.uiLibrary,
      style: generatorOptions.style,
      latency: Date.now() - startTime,
    });
  } catch (error) {
    safeError('Error generating component preview:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate component',
    }, 500);
  }
});

/**
 * POST /api/prototype-preview/quick/:type - Quick generate common components
 * 
 * Generate quick previews for common component types:
 * - button
 * - input
 * - card
 * - modal
 */
prototypePreview.post('/quick/:type', async (c) => {
  const startTime = Date.now();
  
  try {
    const type = c.req.param('type');
    const body = await c.req.json<{
      variant?: string;
      framework?: PreviewRequest['framework'];
      uiLibrary?: PreviewRequest['uiLibrary'];
      style?: PreviewRequest['style'];
    }>() || {};
    
    const env = c.env;
    
    const generatorOptions: UIGeneratorOptions = {
      framework: body.framework || 'react',
      uiLibrary: body.uiLibrary || 'tailwind',
      style: body.style || 'minimal',
      typescript: true,
      includeDocs: true,
    };
    
    const uiGenerator = createUIGeneratorService(env, generatorOptions);
    
    let result: UIGenerationResult;
    
    switch (type) {
      case 'button':
        result = await uiGenerator.quickButton((body.variant as 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger') || 'primary', generatorOptions);
        break;
      case 'input':
        result = await uiGenerator.quickInput(generatorOptions);
        break;
      case 'card':
        result = await uiGenerator.quickCard(generatorOptions);
        break;
      case 'modal':
        result = await uiGenerator.quickModal(generatorOptions);
        break;
      default:
        return c.json({
          success: false,
          error: `Unknown quick component type: ${type}. Supported: button, input, card, modal`,
        }, 400);
    }
    
    if (!result.success || !result.data) {
      return c.json({
        success: false,
        error: result.error || 'Failed to generate component',
      }, 500);
    }
    
    return c.json({
      success: true,
      component: result.data,
      type,
      framework: generatorOptions.framework,
      uiLibrary: generatorOptions.uiLibrary,
      latency: Date.now() - startTime,
    });
  } catch (error) {
    safeError('Error generating quick component:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate component',
    }, 500);
  }
});

/**
 * POST /api/prototype-preview/styles - Generate styles only
 * 
 * Generate CSS/styling for a component or page description.
 */
prototypePreview.post('/styles', async (c) => {
  const startTime = Date.now();
  
  try {
    const body = await c.req.json<{
      description: string;
      framework?: PreviewRequest['framework'];
      uiLibrary?: PreviewRequest['uiLibrary'];
      style?: PreviewRequest['style'];
      animationStyle?: 'subtle' | 'moderate' | 'expressive';
    }>();
    
    const env = c.env;
    
    if (!body.description) {
      return c.json({
        success: false,
        error: 'Style description is required',
      }, 400);
    }
    
    const generatorOptions: UIGeneratorOptions = {
      framework: body.framework || 'react',
      uiLibrary: body.uiLibrary || 'tailwind',
      style: body.style || 'minimal',
      animationStyle: body.animationStyle || 'subtle',
    };
    
    const uiGenerator = createUIGeneratorService(env, generatorOptions);
    
    const result = await uiGenerator.generateStyles(body.description, generatorOptions);
    
    if (!result.success || !result.data) {
      return c.json({
        success: false,
        error: result.error || 'Failed to generate styles',
      }, 500);
    }
    
    return c.json({
      success: true,
      styles: (result.data as GeneratedComponent).code,
      tokens: (result.data as GeneratedComponent).styles,
      framework: generatorOptions.framework,
      latency: Date.now() - startTime,
    });
  } catch (error) {
    safeError('Error generating styles:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate styles',
    }, 500);
  }
});

/**
 * POST /api/prototype-preview/tokens - Generate design tokens
 * 
 * Generate design tokens (colors, spacing, typography, etc.) based on description.
 */
prototypePreview.post('/tokens', async (c) => {
  const startTime = Date.now();
  
  try {
    const body = await c.req.json<{
      description: string;
      baseColors?: {
        primary?: string;
        secondary?: string;
        accent?: string;
      };
    }>();
    
    const env = c.env;
    
    if (!body.description) {
      return c.json({
        success: false,
        error: 'Token description is required',
      }, 400);
    }
    
    const uiGenerator = createUIGeneratorService(env);
    
    const result = await uiGenerator.generateDesignTokens(body.description);
    
    if (!result.success || !result.data) {
      return c.json({
        success: false,
        error: result.error || 'Failed to generate design tokens',
      }, 500);
    }
    
    return c.json({
      success: true,
      tokens: result.data,
      latency: Date.now() - startTime,
    });
  } catch (error) {
    safeError('Error generating design tokens:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate design tokens',
    }, 500);
  }
});

/**
 * GET /api/prototype-preview/snapshot/:id - Get preview from snapshot
 * 
 * Generate a preview from an existing snapshot with default options.
 */
prototypePreview.get('/snapshot/:id', async (c) => {
  const startTime = Date.now();
  
  try {
    const snapshotId = c.req.param('id');
    const env = c.env;
    
    // Get snapshot
    const snapshot = await queryOne<PrototypeSnapshotRow>(
      env,
      'SELECT * FROM PrototypeSnapshot WHERE id = ?',
      [snapshotId]
    );
    
    if (!snapshot) {
      return c.json<PreviewResponse>({
        success: false,
        error: 'Prototype snapshot not found',
      }, 404);
    }
    
    // Parse content
    const parsed = parseSnapshotContent(snapshot.content);
    
    // Check cache with default options
    const cacheKey = `${snapshotId}:${snapshot.projectId}:react:tailwind:minimal`;
    const cachedPreview = getCachedPreview(cacheKey);
    
    if (cachedPreview) {
      return c.json<PreviewResponse>({
        success: true,
        preview: {
          ...cachedPreview,
          generatedAt: new Date().toISOString(),
          latency: Date.now() - startTime,
        },
      });
    }
    
    // Generate preview
    const generatorOptions: UIGeneratorOptions = {
      framework: 'react',
      uiLibrary: 'tailwind',
      style: 'minimal',
      pageType: parsed.pageType || 'custom',
      typescript: true,
    };
    
    const uiGenerator = createUIGeneratorService(env, generatorOptions);
    const result = await uiGenerator.generatePage(parsed.description, parsed.pageType || 'custom');
    
    if (!result.success || !result.data) {
      return c.json<PreviewResponse>({
        success: false,
        error: result.error || 'Failed to generate preview',
      }, 500);
    }
    
    const generatedPage = result.data;
    const previewId = generateId();
    const pageData3 = 'components' in generatedPage ? generatedPage : null;
    const componentData3 = isGeneratedPage(generatedPage) ? generatedPage.component : null;
    
    const preview: PreviewResponse['preview'] = {
      id: previewId,
      snapshotId: snapshot.id,
      projectId: snapshot.projectId,
      code: componentData3?.code || '',
      styles: componentData3?.styles,
      types: componentData3?.types,
      framework: 'react',
      uiLibrary: 'tailwind',
      style: 'minimal',
      tokens: pageData3?.tokens as unknown as Record<string, unknown> || {},
      components: pageData3?.components?.map(c => ({
        name: c.name,
        code: c.code,
        styles: c.styles,
      })),
      layout: pageData3?.layout as { type: string; maxWidth?: string; background?: string } | undefined || undefined,
      generatedAt: new Date().toISOString(),
      latency: Date.now() - startTime,
    };
    
    // Cache result
    setCachedPreview(cacheKey, preview);
    
    return c.json<PreviewResponse>({
      success: true,
      preview,
    });
  } catch (error) {
    safeError('Error generating preview from snapshot:', error);
    return c.json<PreviewResponse>({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate preview',
    }, 500);
  }
});

/**
 * POST /api/prototype-preview/variants - Generate component variants
 * 
 * Generate multiple variants of a component (e.g., different button styles).
 */
prototypePreview.post('/variants', async (c) => {
  const startTime = Date.now();
  
  try {
    const body = await c.req.json<{
      componentName: string;
      baseCode: string;
      variants: string[];
      framework?: PreviewRequest['framework'];
      uiLibrary?: PreviewRequest['uiLibrary'];
    }>();
    
    const env = c.env;
    
    if (!body.componentName || !body.baseCode || !body.variants?.length) {
      return c.json({
        success: false,
        error: 'componentName, baseCode, and variants are required',
      }, 400);
    }
    
    const generatorOptions: UIGeneratorOptions = {
      framework: body.framework || 'react',
      uiLibrary: body.uiLibrary || 'tailwind',
    };
    
    const uiGenerator = createUIGeneratorService(env, generatorOptions);
    
    const results = await uiGenerator.generateVariants(
      body.componentName,
      body.baseCode,
      body.variants,
      generatorOptions
    );
    
    const variants = results.map((r, i) => ({
      name: body.variants[i],
      success: r.success,
      component: r.success ? r.data : null,
      error: r.success ? null : r.error,
    }));
    
    return c.json({
      success: true,
      variants,
      latency: Date.now() - startTime,
    });
  } catch (error) {
    safeError('Error generating variants:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate variants',
    }, 500);
  }
});

/**
 * DELETE /api/prototype-preview/cache - Clear preview cache
 * 
 * Clear all cached previews (admin operation).
 */
prototypePreview.delete('/cache', async (c) => {
  const size = previewCache.size;
  previewCache.clear();
  
  return c.json({
    success: true,
    message: `Cleared ${size} cached previews`,
  });
});

/**
 * GET /api/prototype-preview/cache/stats - Get cache statistics
 * 
 * Get statistics about the preview cache.
 */
prototypePreview.get('/cache/stats', async (c) => {
  const now = Date.now();
  let validEntries = 0;
  let expiredEntries = 0;
  
  for (const [, v] of previewCache.entries()) {
    if (now - v.generatedAt < v.ttl) {
      validEntries++;
    } else {
      expiredEntries++;
    }
  }
  
  return c.json({
    totalEntries: previewCache.size,
    validEntries,
    expiredEntries,
    ttlMs: CACHE_TTL,
  });
});

export default prototypePreview;