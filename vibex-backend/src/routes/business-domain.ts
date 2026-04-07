import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { z } from 'zod'
import { generateId, queryDB, executeDB, queryOne, Env } from '@/lib/db'
import { createAIService } from '@/services/ai-service'
import { debug, sanitize, devLog, safeError } from '@/lib/log-sanitizer'

const businessDomain = new Hono<{ Bindings: Env }>();

// Enable CORS
businessDomain.use('/*', cors())

// ==================== Schemas ====================

const GenerateRequestSchema = z.object({
  requirement: z.string().min(1),
  projectId: z.string().optional(),
  userId: z.string().optional(),
})

// ==================== Types ====================

interface BusinessDomainRow {
  id: string
  projectId: string
  name: string
  description: string | null
  domainType: string
  features: string
  relationships: string
  createdAt: number
  updatedAt: number
}

interface BusinessDomainEntity {
  id: string
  name: string
  description: string
  type: 'core' | 'supporting' | 'generic' | 'external'
  features: Feature[]
  relationships: Relationship[]
  createdAt: number
  updatedAt: number
}

interface Feature {
  id: string
  name: string
  description: string
  isCore: boolean
}

interface Relationship {
  id: string
  targetDomainId: string
  type: 'upstream' | 'downstream' | 'symmetric' | 'conformist' | 'anticorruption'
  description: string
}

// ==================== POST /api/business-domain/generate ====================
// Streaming SSE endpoint - generates business domains with term translation

businessDomain.post('/generate', async (c) => {
  try {
    const env = c.env
    const body = await c.req.json()
    const { requirement } = GenerateRequestSchema.parse(body)

    // Create AI service
    const aiService = createAIService(env)

    // Build the SSE stream
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()

        const send = (event: string, data: unknown) => {
          const chunk = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
          controller.enqueue(encoder.encode(chunk))
        }

        try {
          // Step 1: Thinking - analyzing requirement
          send('thinking', { step: 'analyzing', message: '正在分析需求...' })
          await sleep(150)

          send('thinking', { step: 'identifying-domains', message: '正在识别业务领域...' })
          await sleep(150)

          send('thinking', { step: 'calling-ai', message: '正在调用 AI 生成业务领域...' })

          // Build the AI prompt - output in Chinese with business-friendly language
          const prompt = `You are a business analyst expert. Analyze the following requirement and identify business domains (业务领域).

**Requirement:**
${requirement}

**IMPORTANT: Output ALL text in Simplified Chinese.**

**Output Requirements (Chinese only):**
Generate a JSON object with a "domains" array. Each domain should have:
- name: 简洁的中文名称（如"订单管理"、"用户管理"、"库存管理"）
- description: 2-3句话说明职责和边界
- type: core（核心业务）| supporting（支撑业务）| generic（通用业务）| external（外部系统）
- features: 3-5个关键功能数组，每个功能有name和description
- relationships: 与其他领域的关系数组

**Example Output:**
{
  "domains": [
    {
      "name": "订单管理",
      "description": "处理从创建到履行的完整订单生命周期。负责订单验证、定价计算和状态管理。",
      "type": "core",
      "features": [
        {"name": "创建订单", "description": "用户提交订单并完成支付"},
        {"name": "订单查询", "description": "用户查看订单状态和历史"}
      ],
      "relationships": []
    }
  ]
}

Respond ONLY with the JSON object. All text must be in Simplified Chinese.`

          // Call AI service
          const result = await aiService.generateJSON<{ domains: any[] }>(
            prompt,
            {
              systemPrompt: '你是一位业务分析专家。只输出有效的JSON对象，所有文本使用简体中文。'
            }
          )

          // Handle AI errors
          if (!result.success || !result.data) {
            throw new Error(`AI 服务错误: ${result.error || '未知错误'}`)
          }

          if (!result.data.domains || !Array.isArray(result.data.domains)) {
            throw new Error('AI 响应格式错误：缺少 domains 字段')
          }

          // Step 2: Parse and stream domains
          send('thinking', { step: 'parsing', message: '正在解析结果...' })
          await sleep(100)

          const domains: BusinessDomainEntity[] = []
          const domainMap = new Map<string, string>() // name -> id mapping

          for (let index = 0; index < result.data.domains.length; index++) {
            const item = result.data.domains[index]

            const domainId = `bd-${generateId()}-${index}`
            domainMap.set(item.name, domainId)

            const domain: BusinessDomainEntity = {
              id: domainId,
              name: item.name,
              description: item.description || '',
              type: item.type || 'supporting',
              features: (item.features || []).map((f: any, fi: number) => ({
                id: `feat-${generateId()}-${index}-${fi}`,
                name: f.name,
                description: f.description || '',
                isCore: index === 0, // First domain is usually core
              })),
              relationships: [],
              createdAt: Date.now(),
              updatedAt: Date.now(),
            }

            domains.push(domain)

            // Stream each domain incrementally
            send('domain', domain)
            await sleep(200) // Delay for animation effect
          }

          // Step 3: Resolve relationships (second pass)
          send('thinking', { step: 'mapping-relationships', message: '正在映射领域关系...' })
          await sleep(100)

          result.data.domains.forEach((item: any, index: number) => {
            if (item.relationships && Array.isArray(item.relationships)) {
              item.relationships.forEach((rel: any) => {
                const targetId = domainMap.get(rel.targetDomainName)
                if (targetId) {
                  domains[index].relationships.push({
                    id: `rel-${generateId()}`,
                    targetDomainId: targetId,
                    type: mapRelationshipType(rel.type),
                    description: rel.description || '',
                  })
                }
              })
            }
          })

          // Step 4: Done
          send('done', {
            domains,
            message: `成功生成 ${domains.length} 个业务领域`,
          })

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '未知错误'
          safeError('[BusinessDomain Generate] Error:', errorMessage)
          send('error', {
            message: errorMessage,
            code: 'BUSINESS_DOMAIN_ERROR',
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
      },
    })
  } catch (error) {
    safeError('Error setting up business-domain stream:', error)
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to setup stream',
    }, 500)
  }
})

// ==================== GET /api/business-domain ====================
// Get all business domains for a project

businessDomain.get('/', async (c) => {
  try {
    const env = c.env
    const projectId = c.req.query('projectId')

    if (!projectId) {
      return c.json({ success: false, error: 'projectId is required' }, 400)
    }

    if (!env?.DB) {
      return c.json({ success: true, domains: [], message: 'D1 not available, returning empty' })
    }

    const rows = await queryDB<BusinessDomainRow>(env,
      `SELECT id, projectId, name, description, domainType, features, relationships, createdAt, updatedAt FROM BusinessDomain WHERE projectId = ? ORDER BY createdAt DESC`,
      [projectId]
    )

    const domains: BusinessDomainEntity[] = rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description || '',
      type: row.domainType as BusinessDomainEntity['type'],
      features: parseJson(row.features, []),
      relationships: parseJson(row.relationships, []),
      createdAt: typeof row.createdAt === 'number' ? row.createdAt : new Date(row.createdAt as unknown as string).getTime(),
      updatedAt: typeof row.updatedAt === 'number' ? row.updatedAt : new Date(row.updatedAt as unknown as string).getTime(),
    }))

    return c.json({ success: true, domains })
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get domains',
    }, 500)
  }
})

// ==================== POST /api/business-domain/create ====================
// Manually create a business domain

const CreateDomainSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(['core', 'supporting', 'generic', 'external']).optional(),
  projectId: z.string().optional(),
  userId: z.string().optional(),
})

businessDomain.post('/create', async (c) => {
  try {
    const env = c.env
    const body = await c.req.json()
    const { name, description, type, projectId } = CreateDomainSchema.parse(body)

    if (!projectId) {
      return c.json({ success: false, error: 'projectId is required' }, 400)
    }

    const id = `bd-${generateId()}`
    const now = Date.now()
    const domainType = type || 'supporting'
    const features = '[]'
    const relationships = '[]'

    if (env?.DB) {
      await executeDB(env,
        `INSERT INTO BusinessDomain (id, projectId, name, description, domainType, features, relationships, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, projectId, name, description || null, domainType, features, relationships, now, now]
      )
    } else {
      devLog('[BusinessDomain] D1 not available, skipping DB insert for domain:', name)
    }

    const domain: BusinessDomainEntity = {
      id,
      name,
      description: description || '',
      type: domainType as BusinessDomainEntity['type'],
      features: [],
      relationships: [],
      createdAt: now,
      updatedAt: now,
    }

    return c.json({ success: true, domain })
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create domain',
    }, 500)
  }
})

// ==================== PUT /api/business-domain ====================
// Update a business domain (edit name, features, etc.)

const UpdateDomainSchema = z.object({
  id: z.string(),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  type: z.enum(['core', 'supporting', 'generic', 'external']).optional(),
  features: z.array(z.object({
    id: z.string().optional(),
    name: z.string(),
    description: z.string().optional(),
    isCore: z.boolean().optional(),
  })).optional(),
})

businessDomain.put('/', async (c) => {
  try {
    const env = c.env
    const body = await c.req.json()
    const { id, name, description, type, features } = UpdateDomainSchema.parse(body)

    if (!id) {
      return c.json({ success: false, error: 'id is required' }, 400)
    }

    // Build dynamic update
    const sets: string[] = []
    const params: unknown[] = []

    if (name !== undefined) {
      sets.push('name = ?')
      params.push(name)
    }
    if (description !== undefined) {
      sets.push('description = ?')
      params.push(description)
    }
    if (type !== undefined) {
      sets.push('domainType = ?')
      params.push(type)
    }
    if (features !== undefined) {
      sets.push('features = ?')
      params.push(JSON.stringify(features.map((f, i) => ({
        id: f.id || `feat-${generateId()}-${i}`,
        name: f.name,
        description: f.description || '',
        isCore: f.isCore ?? false,
      }))))
    }

    if (sets.length === 0) {
      return c.json({ success: false, error: 'No fields to update' }, 400)
    }

    const now = Date.now()
    sets.push('updatedAt = ?')
    params.push(now)
    params.push(id)

    if (env?.DB) {
      await executeDB(env,
        `UPDATE BusinessDomain SET ${sets.join(', ')} WHERE id = ?`,
        params
      )
    } else {
      devLog('[BusinessDomain] D1 not available, skipping DB update for domain:', id)
    }

    const updatedDomain: Partial<BusinessDomainEntity> = { updatedAt: now }
    if (name !== undefined) updatedDomain.name = name
    if (description !== undefined) updatedDomain.description = description
    if (type !== undefined) updatedDomain.type = type
    if (features !== undefined) {
      updatedDomain.features = features.map((f, i) => ({
        id: f.id || `feat-${generateId()}-${i}`,
        name: f.name,
        description: f.description || '',
        isCore: f.isCore ?? false,
      }))
    }

    return c.json({ success: true, domain: { id, ...updatedDomain } })
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update domain',
    }, 500)
  }
})

// ==================== DELETE /api/business-domain ====================
// Delete a business domain

businessDomain.delete('/', async (c) => {
  try {
    const env = c.env
    const id = c.req.query('id')
    if (!id) {
      return c.json({ success: false, error: 'id is required' }, 400)
    }

    if (env?.DB) {
      await executeDB(env, `DELETE FROM BusinessDomain WHERE id = ?`, [id])
    } else {
      devLog('[BusinessDomain] D1 not available, skipping DB delete for domain:', id)
    }

    return c.json({ success: true, message: `Domain ${id} deleted` })
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete domain',
    }, 500)
  }
})

// ==================== Helper Functions ====================

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function parseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

function mapRelationshipType(type: string): Relationship['type'] {
  switch (type) {
    case 'upstream-downstream':
      return 'downstream'
    case 'partnership':
      return 'symmetric'
    case 'conformist':
      return 'conformist'
    case 'anticorruption-layer':
      return 'anticorruption'
    default:
      return 'symmetric'
  }
}

export default businessDomain
