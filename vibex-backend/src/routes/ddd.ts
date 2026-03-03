import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { z } from 'zod'
import { generateId, Env } from '@/lib/db'
import { createAIService } from '@/services/ai-service'

const ddd = new Hono<{ Bindings: Env }>();

// Enable CORS
ddd.use('/*', cors())

// Schema for bounded context generation request
const BoundedContextRequestSchema = z.object({
  requirementText: z.string().min(1),
  projectId: z.string().optional(),
})

type BoundedContextRequest = z.infer<typeof BoundedContextRequestSchema>

interface BoundedContext {
  id: string
  name: string
  description: string
  type: 'core' | 'supporting' | 'generic' | 'external'
  relationships: ContextRelationship[]
}

interface ContextRelationship {
  id: string
  fromContextId: string
  toContextId: string
  type: 'upstream' | 'downstream' | 'symmetric'
  description: string
}

// POST /api/ddd/bounded-context - Generate bounded contexts from requirement
ddd.post('/bounded-context', async (c) => {
  try {
    const env = c.env
    const body = await c.req.json()
    const { requirementText, projectId } = BoundedContextRequestSchema.parse(body)

    // Create AI service
    const aiService = createAIService(env)
    
    // Use AI service to generate bounded contexts
    const prompt = `You are a Domain-Driven Design expert. Analyze the following requirement and identify bounded contexts.

Requirement:
${requirementText}

Please identify:
1. Core domains (the main business capabilities)
2. Supporting domains (support the core domains)
3. Generic domains (utilities that could be off-the-shelf)
4. External systems (outside the system boundary)

For each bounded context, provide:
- name: A concise name for the context
- description: What this context is responsible for
- type: core | supporting | generic | external

Return your response as a JSON array like:
[
  {"name": "User Management", "description": "Handles user registration, authentication, and profile management", "type": "core"},
  {"name": "Payment", "description": "Processes payments and refunds", "type": "supporting"}
]

Respond ONLY with the JSON array, no other text.`

    // Call AI for bounded context generation
    const result = await aiService.generateJSON<{ boundedContexts: any[] }>(
      prompt,
      {
        boundedContexts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              type: { type: 'string', enum: ['core', 'supporting', 'generic', 'external'] }
            },
            required: ['name', 'type']
          }
        }
      }
    )

    // Parse the AI response
    let boundedContexts: BoundedContext[] = []
    
    try {
      if (result.success && result.data && result.data.boundedContexts && Array.isArray(result.data.boundedContexts)) {
        boundedContexts = result.data.boundedContexts.map((item: any, index: number) => ({
          id: `ctx-${generateId()}-${index}`,
          name: item.name,
          description: item.description || '',
          type: item.type as BoundedContext['type'],
          relationships: []
        }))
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError)
    }

    // If no contexts generated, create a default one
    if (boundedContexts.length === 0) {
      boundedContexts = [
        {
          id: `ctx-${generateId()}`,
          name: '主业务域',
          description: '从需求中提取的核心业务功能',
          type: 'core',
          relationships: []
        }
      ]
    }

    return c.json({
      success: true,
      boundedContexts,
      mermaidCode: generateMermaidCode(boundedContexts),
    })
  } catch (error) {
    console.error('Error generating bounded contexts:', error)
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate bounded contexts'
    }, 500)
  }
})

// Helper function to generate Mermaid code for bounded contexts
function generateMermaidCode(contexts: BoundedContext[]): string {
  const lines = ['graph TD']
  
  // Add nodes
  contexts.forEach(ctx => {
    const nodeDef = ctx.type === 'core' 
      ? `${ctx.id}[${ctx.name}]`
      : ctx.type === 'supporting'
        ? `${ctx.id}(${ctx.name})`
        : `${ctx.id}{${ctx.name}}`
    lines.push(`  ${nodeDef}`)
  })
  
  // Add class definitions
  lines.push('')
  lines.push('  classDef core fill:#4ade80,stroke:#22c55e,color:#1a1a2e')
  lines.push('  classDef supporting fill:#60a5fa,stroke:#3b82f6,color:#1a1a2e')
  lines.push('  classDef generic fill:#a78bfa,stroke:#8b5cf6,color:#1a1a2e')
  lines.push('  classDef external fill:#f87171,stroke:#ef4444,color:#1a1a2e')
  lines.push('')
  lines.push('  class ' + contexts.filter(c => c.type === 'core').map(c => c.id).join(',') + ' core')
  lines.push('  class ' + contexts.filter(c => c.type === 'supporting').map(c => c.id).join(',') + ' supporting')
  lines.push('  class ' + contexts.filter(c => c.type === 'generic').map(c => c.id).join(',') + ' generic')
  lines.push('  class ' + contexts.filter(c => c.type === 'external').map(c => c.id).join(',') + ' external')
  
  return lines.join('\n')
}

export default ddd
