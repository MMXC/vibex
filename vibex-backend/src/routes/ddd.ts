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
  keyResponsibilities?: string[]
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

    // Debug: Check if MINIMAX_API_KEY is available
    const debugInfo = {
      hasApiKey: !!env.MINIMAX_API_KEY,
      apiKeyLength: env.MINIMAX_API_KEY?.length || 0,
      apiBase: env.MINIMAX_API_BASE || 'default',
      model: env.MINIMAX_MODEL || 'default',
    }
    console.log('[DEBUG] Env debug:', JSON.stringify(debugInfo))

    // Create AI service
    const aiService = createAIService(env)
    
    // Use AI service to generate bounded contexts - optimized prompt with examples
    const prompt = `You are a Domain-Driven Design expert with 15 years of experience in strategic design and bounded context identification.

Analyze the following requirement and identify bounded contexts using EventStorming and Context Mapping techniques.

**Requirement:**
${requirementText}

**Analysis Process:**
1. Identify key business capabilities and subdomains
2. Determine core domain (competitive advantage), supporting domains, and generic domains
3. Identify external systems that need integration
4. Map relationships between contexts using Context Mapping patterns

**Output Requirements:**
For each bounded context, provide:
- name: Concise name (noun phrase, e.g., "Order Management")
- description: 2-3 sentences explaining the responsibility and boundaries
- type: core | supporting | generic | external
- keyResponsibilities: Array of 3-5 key responsibilities
- relationships: Array of relationships to OTHER contexts

For each relationship, provide:
- targetContextName: Name of the related context
- type: upstream-downstream | partnership | shared-kernel | conformist | anticorruption-layer
- description: 1 sentence explaining the collaboration

**Example Output:**
{
  "boundedContexts": [
    {
      "name": "Order Management",
      "description": "Handles the complete order lifecycle from creation to fulfillment. Responsible for order validation, pricing calculation, and status management.",
      "type": "core",
      "keyResponsibilities": ["Order creation and validation", "Pricing calculation", "Order status tracking", "Fulfillment coordination"],
      "relationships": [
        {"targetContextName": "Inventory", "type": "upstream-downstream", "description": "Orders consume inventory availability from Inventory context"}
      ]
    },
    {
      "name": "Inventory",
      "description": "Manages stock levels and availability across warehouses. Provides real-time inventory data to order processing.",
      "type": "supporting",
      "keyResponsibilities": ["Stock level management", "Availability checking", "Reorder alerts"],
      "relationships": [
        {"targetContextName": "Order Management", "type": "upstream-downstream", "description": "Provides inventory availability data downstream"}
      ]
    }
  ]
}

Respond ONLY with the JSON object, no other text.`

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
              type: { type: 'string', enum: ['core', 'supporting', 'generic', 'external'] },
              keyResponsibilities: {
                type: 'array',
                items: { type: 'string' }
              },
              relationships: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    targetContextName: { type: 'string' },
                    type: { type: 'string', enum: ['upstream-downstream', 'partnership', 'shared-kernel', 'conformist', 'anticorruption-layer'] },
                    description: { type: 'string' }
                  },
                  required: ['targetContextName', 'type']
                }
              }
            },
            required: ['name', 'type', 'description']
          }
        }
      }
    )

    // Debug: Log the AI result
    console.log('[DEBUG] AI result success:', result.success)
    console.log('[DEBUG] AI result error:', result.error)
    console.log('[DEBUG] AI result data:', result.data ? JSON.stringify(result.data).substring(0, 200) : 'null')

    // Parse the AI response
    let boundedContexts: BoundedContext[] = []
    
    // Debug: Store raw AI response for troubleshooting
    const aiDebugInfo = {
      success: result.success,
      error: result.error,
      hasData: !!result.data,
      dataKeys: result.data ? Object.keys(result.data) : []
    }
    
    try {
      if (result.success && result.data && result.data.boundedContexts && Array.isArray(result.data.boundedContexts)) {
        // First pass: create contexts without relationships
        const contextMap = new Map<string, BoundedContext>()
        
        result.data.boundedContexts.forEach((item: any, index: number) => {
          const ctx: BoundedContext = {
            id: `ctx-${generateId()}-${index}`,
            name: item.name,
            description: item.description || '',
            type: item.type as BoundedContext['type'],
            keyResponsibilities: item.keyResponsibilities || [],
            relationships: []
          }
          contextMap.set(item.name, ctx)
          boundedContexts.push(ctx)
        })
        
        // Second pass: resolve relationships
        result.data.boundedContexts.forEach((item: any, index: number) => {
          if (item.relationships && Array.isArray(item.relationships)) {
            item.relationships.forEach((rel: any) => {
              const targetCtx = contextMap.get(rel.targetContextName)
              if (targetCtx) {
                const fromCtx = boundedContexts[index]
                fromCtx.relationships.push({
                  id: `rel-${generateId()}`,
                  fromContextId: fromCtx.id,
                  toContextId: targetCtx.id,
                  type: rel.type === 'upstream-downstream' ? 'upstream' : 
                        rel.type === 'partnership' ? 'symmetric' : 'downstream',
                  description: rel.description || ''
                })
              }
            })
          }
        })
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
          keyResponsibilities: ['核心业务处理'],
          relationships: []
        }
      ]
    }

    return c.json({
      success: true,
      boundedContexts,
      mermaidCode: generateMermaidCode(boundedContexts),
      // Debug info (remove in production)
      _debug: {
        env: debugInfo,
        aiResult: aiDebugInfo
      }
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

// Schema for domain-model stream request
const DomainModelStreamRequestSchema = z.object({
  requirementText: z.string().min(1),
  boundedContexts: z.array(z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    type: z.enum(['core', 'supporting', 'generic', 'external']),
  })).optional(),
  projectId: z.string().optional(),
})

// POST /api/ddd/domain-model/stream - SSE streaming version
ddd.post('/domain-model/stream', async (c) => {
  try {
    const env = c.env
    const body = await c.req.json()
    const { requirementText, boundedContexts } = DomainModelStreamRequestSchema.parse(body)

    // Create AI service
    const aiService = createAIService(env)
    
    // Build the stream
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()
        
        const send = (event: string, data: any) => {
          const chunk = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
          controller.enqueue(encoder.encode(chunk))
        }
        
        try {
          // Step 1: 分析上下文
          send('thinking', { step: 'analyzing', message: '正在分析限界上下文...' })
          await new Promise(r => setTimeout(r, 150))
          
          // Step 2: 构建提示词
          send('thinking', { step: 'building-prompt', message: '正在构建提示词...' })
          await new Promise(r => setTimeout(r, 150))
          
          // Step 3: 调用 AI
          send('thinking', { step: 'calling-ai', message: '正在调用 AI 生成领域模型...' })
          
          // Build context info
          const contextInfo = boundedContexts 
            ? boundedContexts.map(ctx => `- ${ctx.name}: ${ctx.description}`).join('\n')
            : '从需求中自动识别'
          
          const prompt = `You are a Domain-Driven Design expert with 15 years of experience in tactical modeling and entity design.

Analyze the following requirement and bounded contexts to generate domain models.

**Requirement:**
${requirementText}

**Bounded Contexts:**
${contextInfo}

**IMPORTANT: All output must be in Chinese (Simplified).**

**Output Requirements (in Chinese):**
{
  "domainModels": [
    {
      "name": "用户",
      "contextId": "用户管理",
      "type": "aggregate_root",
      "properties": [
        {"name": "id", "type": "string", "required": true, "description": "用户唯一标识"}
      ],
      "methods": ["register", "login"]
    }
  ]
}

Respond ONLY with the JSON object.`

          // Call AI
          const result = await aiService.generateJSON<{ domainModels: any[] }>(
            prompt,
            { systemPrompt: 'You are a DDD expert. Output only valid JSON.' }
          )
          
          if (!result.success || !result.data?.domainModels) {
            throw new Error(result.error || 'Failed to generate domain models')
          }
          
          // Step 4: 解析结果
          send('thinking', { step: 'parsing', message: '正在解析结果...' })
          await new Promise(r => setTimeout(r, 100))
          
          // Transform to domain models
          const domainModels = result.data.domainModels.map((item: any, index: number) => ({
            id: `dm-${generateId()}-${index}`,
            name: item.name || `DomainModel${index}`,
            contextId: item.contextId || 'default',
            type: item.type || 'entity',
            properties: (item.properties || []).map((prop: any) => ({
              name: prop.name,
              type: prop.type,
              required: prop.required ?? true,
              description: prop.description || ''
            })),
            methods: item.methods || []
          }))
          
          // Send done event
          send('done', { 
            domainModels,
            message: '领域模型生成完成'
          })
          
        } catch (error) {
          console.error('Stream error:', error)
          send('error', { 
            message: error instanceof Error ? error.message : 'Unknown error' 
          })
        }
        
        controller.close()
      }
    })
    
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      }
    })
  } catch (error) {
    console.error('Error setting up stream:', error)
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to setup stream'
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

// POST /api/ddd/business-flow/stream - SSE streaming version
ddd.post('/business-flow/stream', async (c) => {
  try {
    const env = c.env
    const body = await c.req.json()
    const { domainModels, requirementText } = body

    const aiService = createAIService(env)
    
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()
        
        const send = (event: string, data: any) => {
          const chunk = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
          controller.enqueue(encoder.encode(chunk))
        }
        
        try {
          send('thinking', { step: 'analyzing', message: '正在分析领域模型...' })
          await new Promise(r => setTimeout(r, 150))
          
          send('thinking', { step: 'building', message: '正在构建业务流程...' })
          await new Promise(r => setTimeout(r, 150))
          
          send('thinking', { step: 'calling-ai', message: '正在调用 AI...' })
          
          const modelInfo = domainModels 
            ? domainModels.map(m => `- ${m.name} (${m.type})`).join('\n')
            : '无领域模型'
          
          const prompt = `You are a Business Flow expert. Generate a business flow in Chinese.

Domain Models:
${modelInfo}

Output:
{
  "businessFlow": {
    "name": "业务流程",
    "states": [{"id": "s1", "name": "开始", "type": "initial", "description": "开始"}],
    "transitions": [{"id": "t1", "fromStateId": "s1", "toStateId": "s2", "event": "开始"}]
  }
}`

          const result = await aiService.generateJSON<{ businessFlow: any }>(prompt)
          
          if (!result.success || !result.data?.businessFlow) {
            throw new Error('Failed to generate business flow')
          }
          
          send('thinking', { step: 'parsing', message: '正在解析结果...' })
          await new Promise(r => setTimeout(r, 100))
          
          send('done', { 
            businessFlow: result.data.businessFlow,
            mermaidCode: generateFlowMermaidCode(result.data.businessFlow),
            message: '业务流程生成完成'
          })
          
        } catch (error) {
          console.error('Stream error:', error)
          send('error', { message: error instanceof Error ? error.message : 'Unknown error' })
        }
        
        controller.close()
      }
    })
    
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      }
    })
  } catch (error) {
    return c.json({ success: false, error: 'Failed to setup stream' }, 500)
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
  
  // Add nodes with proper label quoting
  contexts.forEach(ctx => {
    // Use double quotes for labels to handle special characters
    const nodeDef = ctx.type === 'core' 
      ? `${ctx.id}["${ctx.name}"]`
      : ctx.type === 'supporting'
        ? `${ctx.id}("${ctx.name}")`
        : ctx.type === 'generic'
          ? `${ctx.id}[["${ctx.name}"]]`
          : `${ctx.id}{"${ctx.name}"}`
    lines.push(`  ${nodeDef}`)
  })
  
  // Add relationship edges with quoted labels
  lines.push('')
  contexts.forEach(ctx => {
    ctx.relationships?.forEach(rel => {
      const targetCtx = contexts.find(c => c.id === rel.toContextId)
      if (targetCtx) {
        const edgeStyle = rel.type === 'upstream' ? '-->' : rel.type === 'symmetric' ? '<-->' : '-->'
        // Use -->|"label"| syntax for edge labels (handles special characters)
        const label = rel.description ? `|"${rel.description}"|` : ''
        lines.push(`  ${ctx.id} ${edgeStyle}${label} ${targetCtx.id}`)
      }
    })
  })
  
  // Add class definitions
  lines.push('')
  lines.push('  classDef core fill:#4ade80,stroke:#22c55e,color:#1a1a2e')
  lines.push('  classDef supporting fill:#60a5fa,stroke:#3b82f6,color:#1a1a2e')
  lines.push('  classDef generic fill:#a78bfa,stroke:#8b5cf6,color:#1a1a2e')
  lines.push('  classDef external fill:#f87171,stroke:#ef4444,color:#1a1a2e')
  lines.push('')
  const coreContexts = contexts.filter(c => c.type === 'core').map(c => c.id).join(',')
  const supportingContexts = contexts.filter(c => c.type === 'supporting').map(c => c.id).join(',')
  const genericContexts = contexts.filter(c => c.type === 'generic').map(c => c.id).join(',')
  const externalContexts = contexts.filter(c => c.type === 'external').map(c => c.id).join(',')
  
  if (coreContexts) lines.push(`  class ${coreContexts} core`)
  if (supportingContexts) lines.push(`  class ${supportingContexts} supporting`)
  if (genericContexts) lines.push(`  class ${genericContexts} generic`)
  if (externalContexts) lines.push(`  class ${externalContexts} external`)
  
  return lines.join('\n')
}

// ==================== SSE Streaming API ====================

// SSE event helper
function sendSSE(c: any, event: string, data: any) {
  return c.text(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
}

// POST /api/ddd/bounded-context/stream - SSE streaming version
ddd.post('/bounded-context/stream', async (c) => {
  try {
    const env = c.env
    const body = await c.req.json()
    const { requirementText, projectId } = BoundedContextRequestSchema.parse(body)

    // Create AI service
    const aiService = createAIService(env)
    
    // Build the stream
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()
        
        const send = (event: string, data: any) => {
          const chunk = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
          controller.enqueue(encoder.encode(chunk))
        }
        
        try {
          // F1.1: Thinking events - 推送思考步骤
          send('thinking', { step: 'analyzing', message: '正在分析需求...' })
          await new Promise(r => setTimeout(r, 150))
          
          send('thinking', { step: 'identifying-core', message: '识别核心领域...' })
          await new Promise(r => setTimeout(r, 150))
          
          send('thinking', { step: 'calling-ai', message: '调用 AI 分析...' })
          
          // Use AI service to generate bounded contexts - 要求中文输出
          const prompt = `You are a Domain-Driven Design expert with 15 years of experience in strategic design and bounded context identification.

Analyze the following requirement and identify bounded contexts using EventStorming and Context Mapping techniques.

**Requirement:**
${requirementText}

**IMPORTANT: All output must be in Chinese (Simplified).**

**Analysis Process:**
1. Identify key business capabilities and subdomains
2. Determine core domain (competitive advantage), supporting domains, and generic domains
3. Identify external systems that need integration
4. Map relationships between contexts using Context Mapping patterns

**Output Requirements (in Chinese):**
For each bounded context, provide:
- name: 简洁的中文名称 (如"订单管理")
- description: 2-3句话说明职责和边界
- type: core | supporting | generic | external
- keyResponsibilities: 3-5个关键职责的数组
- relationships: 与其他上下文的关系数组

For each relationship, provide:
- targetContextName: 相关上下文的中文名称
- type: upstream-downstream | partnership | shared-kernel | conformist | anticorruption-layer
- description: 一句话说明协作关系

**Example Output:**
{
  "boundedContexts": [
    {
      "name": "订单管理",
      "description": "处理从创建到履行的完整订单生命周期。负责订单验证、定价计算和状态管理。",
      "type": "core",
      "keyResponsibilities": ["订单创建与验证", "定价计算", "订单状态跟踪", "履约协调"],
      "relationships": [
        {"targetContextName": "库存管理", "type": "upstream-downstream", "description": "订单消耗库存可用性"}
      ]
    }
  ]
}

Respond ONLY with the JSON object, no other text. All text content must be in Chinese.`

          // Call AI
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
                    type: { type: 'string', enum: ['core', 'supporting', 'generic', 'external'] },
                    keyResponsibilities: { type: 'array', items: { type: 'string' } },
                    relationships: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          targetContextName: { type: 'string' },
                          type: { type: 'string', enum: ['upstream-downstream', 'partnership', 'shared-kernel', 'conformist', 'anticorruption-layer'] },
                          description: { type: 'string' }
                        },
                        required: ['targetContextName', 'type']
                      }
                    }
                  },
                  required: ['name', 'type', 'description']
                }
              }
            }
          )

          // Parse response
          let boundedContexts: BoundedContext[] = []
          
          try {
            if (result.success && result.data?.boundedContexts?.length > 0) {
              const contextMap = new Map<string, BoundedContext>()
              
              // First pass: create contexts
              for (let index = 0; index < result.data.boundedContexts.length; index++) {
                const item = result.data.boundedContexts[index]
                const ctx: BoundedContext = {
                  id: `ctx-${generateId()}-${index}`,
                  name: item.name,
                  description: item.description || '',
                  type: item.type as BoundedContext['type'],
                  keyResponsibilities: item.keyResponsibilities || [],
                  relationships: []
                }
                contextMap.set(item.name, ctx)
                boundedContexts.push(ctx)
                
                // F1.2: Context incremental push
                send('context', ctx)
                // Delay for animation effect
                await new Promise(r => setTimeout(r, 150))
              }
              
              // Second pass: resolve relationships
              result.data.boundedContexts.forEach((item: any, index: number) => {
                if (item.relationships?.length > 0) {
                  item.relationships.forEach((rel: any) => {
                    const targetCtx = contextMap.get(rel.targetContextName)
                    if (targetCtx) {
                      const fromCtx = boundedContexts[index]
                      fromCtx.relationships.push({
                        id: `rel-${generateId()}`,
                        fromContextId: fromCtx.id,
                        toContextId: targetCtx.id,
                        type: rel.type === 'upstream-downstream' ? 'upstream' : 
                              rel.type === 'partnership' ? 'symmetric' : 'downstream',
                        description: rel.description || ''
                      })
                    }
                  })
                }
              })
            }
          } catch (parseError) {
            console.error('Failed to parse AI response:', parseError)
          }

          // Default fallback if no contexts
          if (boundedContexts.length === 0) {
            boundedContexts = [{
              id: `ctx-${generateId()}`,
              name: '主业务域',
              description: '从需求中提取的核心业务功能',
              type: 'core',
              keyResponsibilities: ['核心业务处理'],
              relationships: []
            }]
            send('context', boundedContexts[0])
          }

          // F1.3: Done event
          send('done', {
            boundedContexts,
            mermaidCode: generateMermaidCode(boundedContexts)
          })
          
        } catch (error) {
          // F1.4: Error event
          console.error('SSE stream error:', error)
          send('error', {
            message: error instanceof Error ? error.message : 'AI 分析失败，请重试'
          })
        }
        
        controller.close()
      }
    })

    // Return SSE stream
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Error setting up SSE stream:', error)
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to setup stream'
    }, 500)
  }
})

export default ddd
