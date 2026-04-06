import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { z } from 'zod'
import { planAnalyzeSchema, INJECTION_KEYWORDS } from '../schemas/security'  // S2.3: Prompt Injection detection
import { generateId, Env } from '@/lib/db'
import { createAIService } from '@/services/ai-service'
import { debug, sanitize, safeError } from '@/lib/log-sanitizer'

const plan = new Hono<{ Bindings: Env }>();

// Enable CORS
plan.use('/*', cors())

// Schema for plan analyze request
// S2.3: Use security schema with Prompt Injection detection (from security.ts)
const PlanAnalyzeRequestSchema = planAnalyzeSchema;
type PlanAnalyzeRequest = z.infer<typeof PlanAnalyzeRequestSchema>

// Plan result types
interface Entity {
  id: string
  name: string
  type: 'aggregate' | 'entity' | 'valueObject' | 'service'
  description: string
  attributes?: EntityAttribute[]
  relationships?: EntityRelationship[]
}

interface EntityAttribute {
  name: string
  type: string
  required: boolean
  description?: string
}

interface EntityRelationship {
  sourceEntity: string
  targetEntity: string
  type: string
  description?: string
}

interface Feature {
  id: string
  name: string
  description: string
  priority: 'P0' | 'P1' | 'P2'
  category?: string
  relatedEntities: string[]
  userStories?: string[]
}

interface Question {
  id: string
  question: string
  type: 'choice' | 'text' | 'confirm' | 'multi'
  options?: string[]
  defaultAnswer?: string
  impact: string
  affectsEntities?: string[]
}

interface SuggestedContext {
  id: string
  name: string
  type: 'core' | 'supporting' | 'generic'
  entities: string[]
  description: string
  dependencies?: string[]
}

interface PlanResult {
  id: string
  requirement: string
  summary: string
  confidence: number
  entities: Entity[]
  features: Feature[]
  questions: Question[]
  suggestedContexts: SuggestedContext[]
  metadata: {
    analyzedAt: string
    model: string
    tokens: number
  }
}

interface PlanAnalyzeResponse {
  success: boolean
  result: PlanResult
  timestamp: string
}

// POST /api/plan/analyze - Analyze requirement and return AI understanding
plan.post('/analyze', async (c) => {
  try {
    const env = c.env
    const body = await c.req.json()
    const parsed = PlanAnalyzeRequestSchema.safeParse(body)
    if (!parsed.success) {
      return c.json({ error: 'Invalid request body', details: parsed.error.flatten() }, 400)
    }
    const { requirement } = parsed.data

    // Debug: Check if MINIMAX_API_KEY is available
    const debugInfo = {
      hasApiKey: !!env.MINIMAX_API_KEY,
      apiKeyLength: env.MINIMAX_API_KEY?.length || 0,
      apiBase: env.MINIMAX_API_BASE || 'default',
      model: env.MINIMAX_MODEL || 'default',
    }
    debug('[DEBUG] Plan API - Env debug:', debugInfo)

    // Create AI service
    const aiService = createAIService(env)

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

Respond ONLY with the JSON object, no other text.`

    // Call AI for plan analysis
    const result = await aiService.generateJSON<{
      summary: string
      entities: Array<{
        name: string
        type?: string
        description?: string
        attributes?: Array<{ name: string; type: string; required?: boolean; description?: string }>
        relationships?: Array<{ sourceEntity: string; targetEntity: string; type: string; description?: string }>
      }>
      features: Array<{
        name: string
        description?: string
        priority?: string
        category?: string
        relatedEntities?: string[]
        userStories?: string[]
      }>
      questions: Array<{
        question: string
        type?: string
        options?: string[]
        impact?: string
      }>
      suggestedContexts: Array<{
        name: string
        type?: string
        entities?: string[]
        description?: string
        dependencies?: string[]
      }>
      confidence?: number
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
              type: { type: 'string', enum: ['aggregate', 'entity', 'valueObject', 'service'] },
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
    )

    // Debug: Log the AI result (sanitized)
    debug('[DEBUG] Plan API - AI result success:', result.success)
    debug('[DEBUG] Plan API - AI result error:', result.error)
    debug('[DEBUG] Plan API - AI result data:', result.data ? JSON.stringify(sanitize(result.data)).substring(0, 200) : 'null')

    // Parse the AI response
    if (!result.success || !result.data) {
      return c.json<PlanAnalyzeResponse>({
        success: false,
        result: {} as PlanResult,
        timestamp: new Date().toISOString(),
      }, 500)
    }

    const data = result.data

    // Transform AI response to PlanResult
    const planResult: PlanResult = {
      id: generateId(),
      requirement,
      summary: data.summary || '',
      confidence: data.confidence || 50,
      entities: (data.entities || []).map((e) => ({
        id: generateId(),
        name: e.name,
        type: e.type || 'entity',
        description: e.description || '',
        attributes: e.attributes || [],
        relationships: e.relationships || [],
      })),
      features: (data.features || []).map((f) => ({
        id: generateId(),
        name: f.name,
        description: f.description,
        priority: f.priority || 'P1',
        category: f.category || 'general',
        relatedEntities: f.relatedEntities || [],
        userStories: f.userStories || [],
      })),
      questions: (data.questions || []).map((q) => ({
        id: generateId(),
        question: q.question,
        type: q.type || 'text',
        options: q.options || [],
        impact: q.impact || '',
      })),
      suggestedContexts: (data.suggestedContexts || []).map((c) => ({
        id: generateId(),
        name: c.name,
        type: c.type || 'core',
        entities: c.entities || [],
        description: c.description || '',
      })),
      metadata: {
        analyzedAt: new Date().toISOString(),
        model: env.MINIMAX_MODEL || 'default',
        tokens: 0, // Would need to track from AI response
      },
    }

    return c.json<PlanAnalyzeResponse>({
      success: true,
      result: planResult,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    safeError('[ERROR] Plan API - Analysis failed:', error)
    
    return c.json<PlanAnalyzeResponse>({
      success: false,
      result: {} as PlanResult,
      timestamp: new Date().toISOString(),
    }, 500)
  }
})

export default plan
