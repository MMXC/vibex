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

// Schema for domain model generation request
const DomainModelRequestSchema = z.object({
  boundedContexts: z.array(z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    type: z.enum(['core', 'supporting', 'generic', 'external']),
  })),
  requirementText: z.string().min(1),
  projectId: z.string().optional(),
})

type DomainModelRequest = z.infer<typeof DomainModelRequestSchema>

interface DomainModel {
  id: string
  name: string
  contextId: string
  type: 'aggregate_root' | 'entity' | 'value_object'
  properties: DomainProperty[]
  methods: string[]
}

interface DomainProperty {
  name: string
  type: string
  required: boolean
  description: string
}

// POST /api/ddd/domain-model - Generate domain models from bounded contexts
ddd.post('/domain-model', async (c) => {
  try {
    const env = c.env
    const body = await c.req.json()
    const { boundedContexts, requirementText, projectId } = DomainModelRequestSchema.parse(body)

    // Create AI service
    const aiService = createAIService(env)
    
    // Build context for AI
    const contextDescriptions = boundedContexts
      .map(ctx => `- ${ctx.name}: ${ctx.description || 'No description'}`)
      .join('\n')

    // Use AI service to generate domain models
    const prompt = `You are a Domain-Driven Design expert. Based on the following bounded contexts and requirement, identify domain models (entities, aggregate roots, value objects).

Bounded Contexts:
${contextDescriptions}

Requirement:
${requirementText}

For each bounded context, identify domain models with:
- name: Entity name (e.g., User, Order, Product)
- type: aggregate_root | entity | value_object
- properties: array of { name, type, required, description }

Return your response as a JSON object like:
{
  "domainModels": [
    {
      "name": "User",
      "contextId": "ctx-1",
      "type": "aggregate_root",
      "properties": [
        {"name": "id", "type": "string", "required": true, "description": "Unique identifier"},
        {"name": "email", "type": "string", "required": true, "description": "User email"}
      ],
      "methods": ["create", "update", "delete"]
    }
  ]
}

Respond ONLY with the JSON object, no other text.`

    // Call AI for domain model generation
    const result = await aiService.generateJSON<{ domainModels: any[] }>(
      prompt,
      {
        domainModels: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              contextId: { type: 'string' },
              type: { type: 'string', enum: ['aggregate_root', 'entity', 'value_object'] },
              properties: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    type: { type: 'string' },
                    required: { type: 'boolean' },
                    description: { type: 'string' }
                  },
                  required: ['name', 'type', 'required']
                }
              },
              methods: { type: 'array', items: { type: 'string' } }
            },
            required: ['name', 'contextId', 'type', 'properties']
          }
        }
      }
    )

    // Parse the AI response
    let domainModels: DomainModel[] = []
    
    try {
      if (result.success && result.data && result.data.domainModels && Array.isArray(result.data.domainModels)) {
        domainModels = result.data.domainModels.map((item: any, index: number) => ({
          id: `dm-${generateId()}-${index}`,
          name: item.name,
          contextId: item.contextId,
          type: item.type as DomainModel['type'],
          properties: (item.properties || []).map((p: any) => ({
            name: p.name,
            type: p.type,
            required: p.required ?? false,
            description: p.description || ''
          })),
          methods: item.methods || []
        }))
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError)
    }

    // If no models generated, create defaults
    if (domainModels.length === 0) {
      domainModels = boundedContexts.map((ctx, index) => ({
        id: `dm-${generateId()}-${index}`,
        name: `${ctx.name}Model`,
        contextId: ctx.id,
        type: 'entity' as const,
        properties: [
          { name: 'id', type: 'string', required: true, description: 'Unique identifier' }
        ],
        methods: ['create', 'update', 'delete']
      }))
    }

    return c.json({
      success: true,
      domainModels,
      mermaidCode: generateDomainModelMermaidCode(domainModels, boundedContexts.map(c => ({ 
        ...c, 
        relationships: [],
        description: c.description || '' 
      }))),
    })
  } catch (error) {
    console.error('Error generating domain models:', error)
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate domain models'
    }, 500)
  }
})

// Schema for business flow generation request
const BusinessFlowRequestSchema = z.object({
  domainModels: z.array(z.object({
    id: z.string(),
    name: z.string(),
    contextId: z.string(),
    type: z.enum(['aggregate_root', 'entity', 'value_object']),
    properties: z.array(z.object({
      name: z.string(),
      type: z.string(),
      required: z.boolean(),
      description: z.string().optional(),
    })),
    methods: z.array(z.string()).optional(),
  })),
  requirementText: z.string().min(1),
  projectId: z.string().optional(),
})

type BusinessFlowRequest = z.infer<typeof BusinessFlowRequestSchema>

interface FlowState {
  id: string
  name: string
  type: 'initial' | 'intermediate' | 'final'
  description: string
}

interface FlowTransition {
  id: string
  fromStateId: string
  toStateId: string
  event: string
  condition?: string
}

interface BusinessFlow {
  id: string
  name: string
  states: FlowState[]
  transitions: FlowTransition[]
}

// POST /api/ddd/business-flow - Generate business flow from domain models
ddd.post('/business-flow', async (c) => {
  try {
    const env = c.env
    const body = await c.req.json()
    const { domainModels, requirementText, projectId } = BusinessFlowRequestSchema.parse(body)

    // Create AI service
    const aiService = createAIService(env)
    
    // Build context for AI
    const modelDescriptions = domainModels
      .map(m => `- ${m.name} (${m.type}): properties=[${m.properties?.map(p => p.name).join(', ')}]`)
      .join('\n')

    // Use AI service to generate business flow
    const prompt = `You are a Domain-Driven Design expert. Based on the following domain models and requirement, create a business process flow.

Domain Models:
${modelDescriptions}

Requirement:
${requirementText}

Create a state machine flow with:
- states: array of { id, name, type (initial|intermediate|final), description }
- transitions: array of { id, fromStateId, toStateId, event, condition? }

Return your response as a JSON object like:
{
  "businessFlow": {
    "id": "flow-1",
    "name": "Main Process",
    "states": [
      {"id": "state-1", "name": "Started", "type": "initial", "description": "Process started"},
      {"id": "state-2", "name": "Processing", "type": "intermediate", "description": "Processing data"},
      {"id": "state-3", "name": "Completed", "type": "final", "description": "Process completed"}
    ],
    "transitions": [
      {"id": "trans-1", "fromStateId": "state-1", "toStateId": "state-2", "event": "Start processing"},
      {"id": "trans-2", "fromStateId": "state-2", "toStateId": "state-3", "event": "Processing complete"}
    ]
  }
}

Respond ONLY with the JSON object, no other text.`

    // Call AI for business flow generation
    const result = await aiService.generateJSON<{ businessFlow: any }>(
      prompt,
      {
        businessFlow: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            states: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  type: { type: 'string', enum: ['initial', 'intermediate', 'final'] },
                  description: { type: 'string' }
                },
                required: ['id', 'name', 'type']
              }
            },
            transitions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  fromStateId: { type: 'string' },
                  toStateId: { type: 'string' },
                  event: { type: 'string' },
                  condition: { type: 'string' }
                },
                required: ['id', 'fromStateId', 'toStateId', 'event']
              }
            }
          },
          required: ['id', 'name', 'states', 'transitions']
        }
      }
    )

    // Parse the AI response
    let businessFlow: BusinessFlow | null = null
    
    try {
      if (result.success && result.data && result.data.businessFlow) {
        const bf = result.data.businessFlow
        businessFlow = {
          id: bf.id || `flow-${generateId()}`,
          name: bf.name || '业务流程',
          states: (bf.states || []).map((s: any) => ({
            id: s.id,
            name: s.name,
            type: s.type as FlowState['type'],
            description: s.description || ''
          })),
          transitions: (bf.transitions || []).map((t: any) => ({
            id: t.id,
            fromStateId: t.fromStateId,
            toStateId: t.toStateId,
            event: t.event,
            condition: t.condition
          }))
        }
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError)
    }

    // If no flow generated, create a default one
    if (!businessFlow || businessFlow.states.length === 0) {
      businessFlow = {
        id: `flow-${generateId()}`,
        name: '业务流程',
        states: [
          { id: 'state-1', name: '开始', type: 'initial', description: '流程开始' },
          { id: 'state-2', name: '处理中', type: 'intermediate', description: '处理业务' },
          { id: 'state-3', name: '完成', type: 'final', description: '流程完成' }
        ],
        transitions: [
          { id: 'trans-1', fromStateId: 'state-1', toStateId: 'state-2', event: '开始处理' },
          { id: 'trans-2', fromStateId: 'state-2', toStateId: 'state-3', event: '处理完成' }
        ]
      }
    }

    return c.json({
      success: true,
      businessFlow,
      mermaidCode: generateFlowMermaidCode(businessFlow),
    })
  } catch (error) {
    console.error('Error generating business flow:', error)
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate business flow'
    }, 500)
  }
})

// Helper function to generate Mermaid code for domain models
function generateDomainModelMermaidCode(domainModels: DomainModel[], contexts: BoundedContext[]): string {
  const lines = ['classDiagram']
  
  domainModels.forEach(model => {
    lines.push(`  class ${model.name} {`)
    model.properties?.forEach(prop => {
      const required = prop.required ? '+' : '-'
      lines.push(`    ${required} ${prop.name}: ${prop.type}`)
    })
    lines.push(`  }`)
  })
  
  return lines.join('\n')
}

// Helper function to generate Mermaid code for business flow
function generateFlowMermaidCode(flow: BusinessFlow): string {
  const lines = ['stateDiagram-v2']
  
  // Add states
  flow.states.forEach(state => {
    if (state.type === 'initial') {
      lines.push(`  [*] --> ${state.id}`)
    }
    if (state.type === 'final') {
      lines.push(`  ${state.id} --> [*]`)
    }
  })
  
  // Add transitions
  flow.transitions.forEach(trans => {
    const condition = trans.condition ? `: ${trans.condition}` : ''
    lines.push(`  ${trans.fromStateId} --> ${trans.toStateId}: ${trans.event}${condition}`)
  })
  
  return lines.join('\n')
}

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
