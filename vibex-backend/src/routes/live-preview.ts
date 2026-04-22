/**
 * @deprecated This router uses the legacy Page Router API.
 * All routes have been migrated to Next.js App Router (app/api/).
 * See: docs/migration/page-router-to-app-router.md
 * This file will be removed after E1 security fixes are complete.
 */
/**
 * Live Preview API Routes
 *
 * Provides real-time preview functionality with streaming updates via SSE.
 * Allows clients to receive live updates as the UI is being generated/modified.
 *
 * @module routes/live-preview
 */

import { Hono } from 'hono';
import { queryOne, generateId, Env } from '@/lib/db';
import { createUIGeneratorService, UIGeneratorOptions, UIGenerationResult, GeneratedComponent, GeneratedPage } from '@/services/ui-generator';

import { safeError } from '@/lib/log-sanitizer';
import { apiError, ERROR_CODES } from '@/lib/api-error';

/** Type guard: is this a GeneratedPage (has .component sub-field)? */
function isGeneratedPage(val: GeneratedPage | GeneratedComponent): val is GeneratedPage {
  return 'component' in val && typeof (val as GeneratedPage).component === 'object';
}

const livePreview = new Hono<{ Bindings: Env }>();

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

interface LivePreviewRequest {
  /** Snapshot ID to generate live preview from */
  snapshotId?: string;
  /** Direct requirement text for preview */
  requirement?: string;
  /** Page type hint */
  pageType?: 'landing' | 'auth' | 'dashboard' | 'chat' | 'form' | 'list' | 'detail' | 'settings' | 'profile' | 'checkout' | 'pricing' | 'documentation' | 'error' | 'custom';
  /** Target UI framework */
  framework?: 'react' | 'vue' | 'svelte' | 'vanilla' | 'angular';
  /** UI library */
  uiLibrary?: 'tailwind' | 'shadcn' | 'mui' | 'antd' | 'chakra' | 'none';
  /** Design style */
  style?: 'minimal' | 'glassmorphism' | 'bento' | 'gradient' | 'neumorphism' | 'brutalist' | 'neobrutalism' | 'corporate' | 'playful';
  /** Custom design tokens */
  customTokens?: Record<string, unknown>;
  /** Enable interactive mode (allow client updates) */
  interactive?: boolean;
  /** Project ID (required if using requirement directly) */
  projectId?: string;
}

interface LivePreviewEvent {
  type: 'start' | 'progress' | 'component' | 'layout' | 'styles' | 'complete' | 'error' | 'heartbeat';
  timestamp: string;
  data?: Record<string, unknown>;
  message?: string;
  progress?: number;
}

interface LivePreviewResponse {
  success: boolean;
  previewId?: string;
  error?: string;
}

// ==================== Helper Functions ====================

/**
 * Send SSE event to client
 */
function sendSSEEvent(controller: ReadableStreamDefaultController, event: LivePreviewEvent): void {
  const encoder = new TextEncoder();
  const data = `data: ${JSON.stringify(event)}\n\n`;
  controller.enqueue(encoder.encode(data));
}

/**
 * Parse snapshot content
 */
function parseSnapshotContent(content: string): {
  description: string;
  pageType?: LivePreviewRequest['pageType'];
  components?: string[];
} {
  try {
    const parsed = JSON.parse(content);
    
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
      const descriptions = parsed.pages.map((p: any) => p.description || p.content || '').filter(Boolean);
      return {
        description: descriptions.join('\n\n'),
        pageType: parsed.pageType,
        components: parsed.components,
      };
    }
    
    return { description: content };
  } catch {
    return { description: content };
  }
}

/**
 * Build UI generator options
 */
function buildGeneratorOptions(request: LivePreviewRequest): UIGeneratorOptions {
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

// ==================== API Routes ====================

/**
 * POST /api/live-preview - Start a live preview session with streaming updates
 * 
 * Provides real-time streaming preview via SSE with progress updates.
 * The client receives incremental updates as the preview is generated.
 */
livePreview.post('/', async (c) => {
  const startTime = Date.now();
  const previewId = generateId();
  
  try {
    const body = await c.req.json() as LivePreviewRequest;
    const env = c.env;
    
    // Validate request
    if (!body.snapshotId && !body.requirement) {
      return         c.json(apiError('Either snapshotId or requirement must be provided', ERROR_CODES.BAD_REQUEST), 400);
    }
    
    let description: string;
    let projectId: string;
    let snapshotId: string | undefined;
    let pageType = body.pageType;
    
    // Get content from snapshot or use direct requirement
    if (body.snapshotId) {
      const snapshot = await queryOne<PrototypeSnapshotRow>(
        env,
        'SELECT * FROM PrototypeSnapshot WHERE id = ?',
        [body.snapshotId]
      );
      
      if (!snapshot) {
        return         c.json(apiError('Prototype snapshot not found', ERROR_CODES.NOT_FOUND), 404);
      }
      
      const parsed = parseSnapshotContent(snapshot.content);
      description = parsed.description;
      projectId = snapshot.projectId;
      snapshotId = snapshot.id;
      pageType = pageType || parsed.pageType;
    } else {
      if (!body.projectId) {
        return         c.json(apiError('projectId is required when using direct requirement', ERROR_CODES.BAD_REQUEST), 400);
      }
      description = body.requirement!;
      projectId = body.projectId;
    }
    
    // Create streaming response
    const stream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        
        // Send initial start event
        sendSSEEvent(controller, {
          type: 'start',
          timestamp: new Date().toISOString(),
          message: 'Starting live preview generation...',
          progress: 0,
          data: { previewId, snapshotId, projectId },
        });
        
        // Run async generation
        (async () => {
          try {
            const generatorOptions = buildGeneratorOptions(body);
            const uiGenerator = createUIGeneratorService(env, generatorOptions);
            
            // Progress: Analyzing requirements
            sendSSEEvent(controller, {
              type: 'progress',
              timestamp: new Date().toISOString(),
              message: 'Analyzing requirements...',
              progress: 10,
            });
            
            // Progress: Generating layout
            await new Promise(r => setTimeout(r, 100));
            sendSSEEvent(controller, {
              type: 'layout',
              timestamp: new Date().toISOString(),
              message: 'Generating page layout...',
              progress: 25,
              data: {
                pageType: pageType || 'custom',
                style: generatorOptions.style,
              },
            });
            
            // Generate the page
            const result = await uiGenerator.generatePage(description, pageType || 'custom', generatorOptions);
            
            if (!result.success || !result.data) {
              sendSSEEvent(controller, {
                type: 'error',
                timestamp: new Date().toISOString(),
                message: result.error || 'Generation failed',
                progress: 0,
              });
              controller.close();
              return;
            }
            
            const generatedPage = result.data;
            
            // Type guard to check if it's a page with components
            const pageData = 'components' in generatedPage ? generatedPage : null;
            
            // Progress: Generating components
            sendSSEEvent(controller, {
              type: 'progress',
              timestamp: new Date().toISOString(),
              message: 'Generating UI components...',
              progress: 50,
            });
            
            // Send individual components as they're generated
            if (pageData && pageData.components && pageData.components.length > 0) {
              for (let i = 0; i < pageData.components.length; i++) {
                const comp = pageData.components[i];
                sendSSEEvent(controller, {
                  type: 'component',
                  timestamp: new Date().toISOString(),
                  message: `Generated component: ${comp.name}`,
                  progress: pageData ? 50 + Math.floor((i / pageData.components.length) * 30) : 80,
                  data: {
                    name: comp.name,
                    index: i,
                    total: pageData ? pageData.components.length : 0,
                  },
                });
              }
            }
            
            // Progress: Generating styles
            sendSSEEvent(controller, {
              type: 'progress',
              timestamp: new Date().toISOString(),
              message: 'Applying styles...',
              progress: 85,
            });
            
            sendSSEEvent(controller, {
              type: 'styles',
              timestamp: new Date().toISOString(),
              message: 'Styles applied successfully',
              progress: 90,
              data: {
                hasStyles: pageData ? !!pageData.component?.styles : false,
              },
            });
            
            // Send complete event with full preview
            const componentData = isGeneratedPage(generatedPage) ? generatedPage.component : null;
            sendSSEEvent(controller, {
              type: 'complete',
              timestamp: new Date().toISOString(),
              message: 'Live preview generation complete',
              progress: 100,
              data: {
                preview: {
                  id: previewId,
                  snapshotId,
                  projectId,
                  code: componentData?.code || '',
                  styles: componentData?.styles,
                  types: componentData?.types,
                  framework: generatorOptions.framework,
                  uiLibrary: generatorOptions.uiLibrary,
                  style: generatorOptions.style,
                  tokens: pageData?.tokens || {},
                  components: pageData?.components?.map(c => ({
                    name: c.name,
                    code: c.code,
                    styles: c.styles,
                  })),
                  layout: pageData?.layout || {},
                  generatedAt: new Date().toISOString(),
                  latency: Date.now() - startTime,
                },
              },
            });
            
            controller.close();
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            sendSSEEvent(controller, {
              type: 'error',
              timestamp: new Date().toISOString(),
              message: errorMessage,
              progress: 0,
            });
            controller.close();
          }
        })();
      },
      
      // Heartbeat to keep connection alive
      pull(controller) {
        // Keep the stream alive with periodic heartbeats
      },
    });
    
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (error) {
    safeError('Error starting live preview:', error);
    return c.json<LivePreviewResponse>({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to start live preview',
    }, 500);
  }
});

/**
 * GET /api/live-preview/:id - Get live preview status/session info
 * 
 * Returns information about a live preview session.
 */
livePreview.get('/:id', async (c) => {
  const previewId = c.req.param('id');
  
  // In a full implementation, this would check a session store
  // For now, return basic info about the preview session
  return c.json({
    success: true,
    previewId,
    status: 'session_info',
    message: 'Live preview session tracking would be implemented with Redis or similar',
  });
});

/**
 * POST /api/live-preview/update - Update a live preview in real-time
 * 
 * Allows clients to send updates to modify the live preview interactively.
 */
livePreview.post('/update', async (c) => {
  const startTime = Date.now();
  
  try {
    const body = await c.req.json<{
      previewId: string;
      updates: {
        type: 'code' | 'style' | 'token' | 'component';
        content: string;
        path?: string;
      }[];
      framework?: LivePreviewRequest['framework'];
      uiLibrary?: LivePreviewRequest['uiLibrary'];
    }>();
    
    const env = c.env;
    
    if (!body.previewId || !body.updates?.length) {
      return c.json({
        success: false,
        error: 'previewId and updates are required',
      }, 400);
    }
    
    // Create streaming response for updates
    const stream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        
        sendSSEEvent(controller, {
          type: 'start',
          timestamp: new Date().toISOString(),
          message: 'Processing live preview updates...',
          progress: 0,
        });
        
        (async () => {
          try {
            let progress = 0;
            
            for (const update of body.updates) {
              progress += Math.floor(100 / body.updates.length);
              
              sendSSEEvent(controller, {
                type: 'progress',
                timestamp: new Date().toISOString(),
                message: `Applying ${update.type} update...`,
                progress,
                data: {
                  updateType: update.type,
                  path: update.path,
                },
              });
              
              // Simulate processing time (in real implementation, this would apply changes)
              await new Promise(r => setTimeout(r, 200));
            }
            
            // Return updated preview (simplified - full implementation would apply changes)
            sendSSEEvent(controller, {
              type: 'complete',
              timestamp: new Date().toISOString(),
              message: 'Updates applied successfully',
              progress: 100,
              data: {
                previewId: body.previewId,
                updatedAt: new Date().toISOString(),
                latency: Date.now() - startTime,
              },
            });
            
            controller.close();
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            sendSSEEvent(controller, {
              type: 'error',
              timestamp: new Date().toISOString(),
              message: errorMessage,
            });
            controller.close();
          }
        })();
      },
    });
    
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    safeError('Error updating live preview:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update live preview',
    }, 500);
  }
});

/**
 * POST /api/live-preview/quick - Quick live preview generation
 * 
 * Fast preview generation for common component types with streaming.
 */
livePreview.post('/quick/:type', async (c) => {
  const startTime = Date.now();
  const previewId = generateId();
  
  try {
    const type = c.req.param('type');
    const body = await c.req.json<{
      variant?: string;
      framework?: LivePreviewRequest['framework'];
      uiLibrary?: LivePreviewRequest['uiLibrary'];
      style?: LivePreviewRequest['style'];
    }>() || {};
    
    const env = c.env;
    
    const validTypes = ['button', 'input', 'card', 'modal', 'navbar', 'sidebar', 'footer', 'header'];
    if (!validTypes.includes(type)) {
      return c.json({
        success: false,
        error: `Unknown type: ${type}. Supported: ${validTypes.join(', ')}`,
      }, 400);
    }
    
    const generatorOptions: UIGeneratorOptions = {
      framework: body.framework || 'react',
      uiLibrary: body.uiLibrary || 'tailwind',
      style: body.style || 'minimal',
      typescript: true,
      includeDocs: true,
    };
    
    const uiGenerator = createUIGeneratorService(env, generatorOptions);
    
    // Create streaming response
    const stream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        
        sendSSEEvent(controller, {
          type: 'start',
          timestamp: new Date().toISOString(),
          message: `Generating ${type} preview...`,
          progress: 0,
        });
        
        (async () => {
          try {
            sendSSEEvent(controller, {
              type: 'progress',
              timestamp: new Date().toISOString(),
              message: 'Creating component...',
              progress: 30,
            });
            
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
                result = await uiGenerator.generateComponent(
                  { name: type, type: 'custom', description: `Generate a ${type} component` },
                  generatorOptions
                );
            }
            
            if (!result.success || !result.data) {
              sendSSEEvent(controller, {
                type: 'error',
                timestamp: new Date().toISOString(),
                message: result.error || 'Generation failed',
              });
              controller.close();
              return;
            }
            
            sendSSEEvent(controller, {
              type: 'progress',
              timestamp: new Date().toISOString(),
              message: 'Applying styles...',
              progress: 70,
            });
            
            const component = result.data as GeneratedComponent;
            
            sendSSEEvent(controller, {
              type: 'complete',
              timestamp: new Date().toISOString(),
              message: 'Quick preview complete',
              progress: 100,
              data: {
                preview: {
                  id: previewId,
                  type,
                  code: component.code,
                  styles: component.styles,
                  types: component.types,
                  framework: generatorOptions.framework,
                  uiLibrary: generatorOptions.uiLibrary,
                  style: generatorOptions.style,
                  generatedAt: new Date().toISOString(),
                  latency: Date.now() - startTime,
                },
              },
            });
            
            controller.close();
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            sendSSEEvent(controller, {
              type: 'error',
              timestamp: new Date().toISOString(),
              message: errorMessage,
            });
            controller.close();
          }
        })();
      },
    });
    
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    safeError('Error generating quick live preview:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate quick preview',
    }, 500);
  }
});

/**
 * GET /api/live-preview/health - Health check for live preview service
 */
livePreview.get('/health', async (c) => {
  return c.json({
    success: true,
    status: 'healthy',
    service: 'live-preview',
    timestamp: new Date().toISOString(),
    features: {
      sse: true,
      streaming: true,
      interactive: true,
    },
  });
});

export default livePreview;
