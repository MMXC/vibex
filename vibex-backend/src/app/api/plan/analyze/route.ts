/**
 * Plan Analyze API
 * POST /api/plan/analyze
 * 
 * Analyzes requirement text using AI and returns comprehensive plan result.
 * 
 * Part of: api-input-validation-layer / Epic E2 (S2.3 Plan API Prompt Injection 防护)
 * 
 * Validates incoming requirement against planAnalyzeSchema to prevent:
 * - Empty or missing requirement
 * - Requirement exceeding 50000 chars
 * - Prompt injection via suspicious keywords
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAIService } from '@/services/ai-service';
import { getLocalEnv as getCloudflareEnv } from '@/lib/env';
import { generateId } from '@/lib/db';
import { debug } from '@/lib/logger';
import { sanitize, safeError } from '@/lib/log-sanitizer';
import { planAnalyzeSchema } from '@/schemas/security';
import { parseBody } from '@/lib/high-risk-validation';


// E-P0-3: API v0 deprecation header (per architecture.md ADR-003)
const V0_DEPRECATION_HEADERS = {
  'Deprecation': 'true',
  'Sunset': 'Sat, 31 May 2026 23:59:59 GMT',
  'X-API-Deprecation-Info': 'https://docs.vibex.ai/api-v0-sunset',
};

interface Entity {
  id: string;
  name: string;
  type: 'aggregate' | 'entity' | 'valueObject' | 'service';
  description: string;
  attributes?: EntityAttribute[];
}

interface EntityAttribute {
  name: string;
  type: string;
  required: boolean;
  description?: string;
}

interface Feature {
  id: string;
  name: string;
  description: string;
  priority: 'P0' | 'P1' | 'P2';
  relatedEntities: string[];
}

interface Question {
  id: string;
  question: string;
  type: 'choice' | 'text' | 'confirm' | 'multi';
  options?: string[];
  impact: string;
}

interface SuggestedContext {
  id: string;
  name: string;
  type: 'core' | 'supporting' | 'generic';
  entities: string[];
  description: string;
}

interface PlanResult {
  id: string;
  requirement: string;
  summary: string;
  confidence: number;
  entities: Entity[];
  features: Feature[];
  questions: Question[];
  suggestedContexts: SuggestedContext[];
  metadata: {
    analyzedAt: string;
    model: string;
    tokens: number;
  };
}

export async function POST(request: NextRequest) {
  try {
    // S2.3: Validate request body against security schema
    const result = await parseBody(request, planAnalyzeSchema);

    if ('error' in result) {
      const parsed = JSON.parse(result.error.message);
      return NextResponse.json(parsed, { headers: V0_DEPRECATION_HEADERS, status: result.error.status });
    }

    const { requirement, context } = result.data;

    // Get environment variables
    const env = getCloudflareEnv();

    // Debug: Check if MINIMAX_API_KEY is available
    const debugInfo = {
      hasApiKey: !!env.MINIMAX_API_KEY,
      apiKeyLength: env.MINIMAX_API_KEY?.length || 0,
      apiBase: env.MINIMAX_API_BASE || 'default',
      model: env.MINIMAX_MODEL || 'default',
    };
    debug('[DEBUG] Plan API - Env debug:', debugInfo);

    // Create AI service
    const aiService = createAIService(env);

    // Build prompt for plan analysis
    const prompt = `You are a Domain-Driven Design (DDD) expert with 15 years of experience in requirements analysis and strategic design.

Analyze the following requirement and provide a comprehensive understanding using DDD concepts.

**Requirement:**
${requirement}

**Analysis Task:**
Please analyze the requirement and provide:

1. **Summary**: A brief 2-3 sentence summary of what the system should do

2. **Entities**: Identify core domain entities with:
   - name: Entity name (English, singular, PascalCase)
   - type: aggregate | entity | valueObject | service
   - description: What this entity represents
   - attributes: Key properties (name, type, required)

3. **Features**: Identify main functional requirements with:
   - name: Feature name
   - description: What it does
   - priority: P0 (must-have) | P1 (important) | P2 (nice-to-have)
   - relatedEntities: Which entities are involved

4. **Questions**: Identify unclear aspects that need clarification:
   - question: The question to ask
   - type: choice | text | confirm | multi
   - options: Possible answers (for choice type)
   - impact: Why this matters

5. **Suggested Contexts**: Propose bounded contexts:
   - name: Context name
   - type: core | supporting | generic
   - entities: Which entities belong here
   - description: Responsibility

6. **Confidence**: Rate your analysis confidence (0-100)

**Output Format:**
Return a JSON object with:
{
  "summary": "...",
  "entities": [...],
  "features": [...],
  "questions": [...],
  "suggestedContexts": [...],
  "confidence": 85
}

Respond ONLY with the JSON object, no other text.`;

    // Call AI for plan analysis
    const aiResult = await aiService.generateJSON<{
      summary: string;
      entities: Array<{
        name: string;
        type?: string;
        description?: string;
        attributes?: Array<{ name: string; type: string; required?: boolean; description?: string }>;
      }>;
      features: Array<{
        name: string;
        description?: string;
        priority?: string;
        relatedEntities?: string[];
      }>;
      questions: Array<{
        question: string;
        type?: string;
        options?: string[];
        impact?: string;
      }>;
      suggestedContexts: Array<{
        name: string;
        type?: string;
        entities?: string[];
        description?: string;
      }>;
      confidence?: number;
    }>(
      prompt,
      {
        summary: { type: 'string' },
        entities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: {
                type: 'string',
                enum: ['aggregate', 'entity', 'valueObject', 'service'],
              },
              description: { type: 'string' },
              attributes: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    type: { type: 'string' },
                    required: { type: 'boolean' },
                    description: { type: 'string' },
                  },
                },
              },
            },
            required: ['name', 'type', 'description'],
          },
        },
        features: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              priority: { type: 'string', enum: ['P0', 'P1', 'P2'] },
              relatedEntities: { type: 'array', items: { type: 'string' } },
            },
            required: ['name', 'description', 'priority'],
          },
        },
        questions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              question: { type: 'string' },
              type: { type: 'string', enum: ['choice', 'text', 'confirm', 'multi'] },
              options: { type: 'array', items: { type: 'string' } },
              impact: { type: 'string' },
            },
            required: ['question', 'type', 'impact'],
          },
        },
        suggestedContexts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string', enum: ['core', 'supporting', 'generic'] },
              entities: { type: 'array', items: { type: 'string' } },
              description: { type: 'string' },
            },
            required: ['name', 'type', 'description'],
          },
        },
        confidence: { type: 'number' },
      }
    );

    // Debug: Log the AI result (sanitized)
    debug('[DEBUG] Plan API - AI result success:', aiResult.success);
    debug('[DEBUG] Plan API - AI result error:', aiResult.error);
    debug(
      '[DEBUG] Plan API - AI result data:',
      aiResult.data ? JSON.stringify(sanitize(aiResult.data)).substring(0, 200) : 'null'
    );

    // Parse the AI response
    if (!aiResult?.success || !aiResult?.data) {
      return NextResponse.json({
          success: false,
          error: aiResult?.error || 'AI analysis failed',
          result: null,
          timestamp: new Date().toISOString(),
        }, { headers: V0_DEPRECATION_HEADERS, status: 500 });
    }

    const data = aiResult.data;

    // Transform AI response to PlanResult
    const planResult: PlanResult = {
      id: generateId(),
      requirement,
      summary: data.summary || '',
      confidence: data.confidence || 50,
      entities: ((data.entities || []) as any[]).map((e) => ({
        id: generateId(),
        name: e.name,
        type: (e.type || 'entity') as Entity['type'],
        description: e.description || '',
        attributes: e.attributes || [],
      })),
      features: ((data.features || []) as any[]).map((f) => ({
        id: generateId(),
        name: f.name,
        description: f.description ?? '',
        priority: (f.priority || 'P1') as Feature['priority'],
        relatedEntities: f.relatedEntities || [],
      })),
      questions: (data.questions || []).map((q) => ({
        id: generateId(),
        question: q.question,
        type: (q.type || 'text') as Question['type'],
        options: q.options || [],
        impact: q.impact || '',
      })),
      suggestedContexts: ((data.suggestedContexts || []) as any[]).map((c) => ({
        id: generateId(),
        name: c.name,
        type: (c.type || 'core') as SuggestedContext['type'],
        entities: c.entities || [],
        description: c.description || '',
      })),
      metadata: {
        analyzedAt: new Date().toISOString(),
        model: env.MINIMAX_MODEL || 'default',
        tokens: 0,
      },
    };

    return NextResponse.json({
      success: true,
      result: planResult,
      timestamp: new Date().toISOString(),
    }, { headers: V0_DEPRECATION_HEADERS });
  } catch (error) {
    safeError('[ERROR] Plan API - Analysis failed:', error);

    return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        result: null,
        timestamp: new Date().toISOString(),
      }, { headers: V0_DEPRECATION_HEADERS, status: 500 });
  }
}
