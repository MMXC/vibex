/**
 * UI Generation API Routes
 * 
 * Provides endpoints for AI-powered UI generation.
 * Transforms natural language descriptions into UI schemas and component trees.
 * 
 * Features:
 * - Natural language to UI schema generation
 * - Component tree structure generation
 * - Framework and UI library customization
 * - Responsive design support
 * 
 * @module routes/ui-generation
 */

import { Hono } from 'hono';
import { Env } from '@/lib/db';
import { safeError } from '@/lib/log-sanitizer';

import {
  createAIService,
  UIGenerationResult,
  AIResult,
} from '@/services/ai-service';

const uiGeneration = new Hono<{ Bindings: Env }>();

// ==================== Types ====================

interface UIGenerationRequest {
  description: string;
  projectId?: string;
  pageId?: string;
  framework?: 'react' | 'vue' | 'svelte' | 'vanilla';
  uiLibrary?: 'shadcn' | 'tailwind' | 'mui' | 'antd' | 'none';
  platforms?: ('mobile' | 'tablet' | 'desktop')[];
}

interface UIGenerationResponse {
  success: boolean;
  data?: UIGenerationResult;
  error?: string;
  provider?: string;
  model?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  latency?: number;
}

// ==================== API Routes ====================

/**
 * POST /api/ui-generation - Generate UI from description
 * 
 * Request body:
 * {
 *   "description": "A login form with email and password fields",
 *   "projectId": "optional-project-id",
 *   "pageId": "optional-page-id",
 *   "framework": "react", // optional, default: react
 *   "uiLibrary": "tailwind", // optional, default: tailwind
 *   "platforms": ["mobile", "tablet", "desktop"] // optional
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "componentStructure": { ... },
 *     "layoutSpecification": { ... },
 *     "stylingRules": [ ... ],
 *     "code": "..."
 *   },
 *   "provider": "minimax",
 *   "model": "abab6.5s-chat",
 *   "usage": { ... },
 *   "latency": 1234
 * }
 */
uiGeneration.post('/', async (c) => {
  try {
    const env = c.env as Env;
    const body = await c.req.json<UIGenerationRequest>();
    
    const { description, projectId, pageId, framework, uiLibrary, platforms } = body;
    
    if (!description || typeof description !== 'string') {
      return c.json({
        success: false,
        error: 'Description is required and must be a string',
      }, 400);
    }
    
    if (description.length < 3) {
      return c.json({
        success: false,
        error: 'Description must be at least 3 characters',
      }, 400);
    }
    
    if (description.length > 5000) {
      return c.json({
        success: false,
        error: 'Description must not exceed 5000 characters',
      }, 400);
    }
    
    // Create AI service and generate UI
    const aiService = createAIService(env);
    
    const result = await aiService.generateUI(description, {
      framework,
      uiLibrary,
      platforms,
    });
    
    if (!result.success || !result.data) {
      return c.json({
        success: false,
        error: result.error || 'UI generation failed',
      }, 500);
    }
    
    const response: UIGenerationResponse = {
      success: true,
      data: result.data,
      provider: result.provider,
      model: result.model,
      usage: result.usage,
      latency: result.latency,
    };
    
    return c.json(response);
  } catch (error) {
    safeError('UI Generation error:', error);
    
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    }, 500);
  }
});

/**
 * GET /api/ui-generation - Health check endpoint
 */
uiGeneration.get('/', (c) => {
  return c.json({
    status: 'ok',
    message: 'UI Generation API is running',
    endpoints: {
      POST: '/api/ui-generation - Generate UI from description',
      GET: '/api/ui-generation - Health check',
    },
  });
});

export default uiGeneration;
