/**
 * @deprecated This router uses the legacy Page Router API. 
 * All routes have been migrated to Next.js App Router (app/api/). 
 * See: docs/migration/page-router-to-app-router.md 
 * This file will be removed after E1 security fixes are complete. 
 */
import { Hono } from 'hono';

import { cors } from 'hono/cors'
import { z } from 'zod'
import { generateId, Env, queryDB, queryOne, executeDB } from '@/lib/db'
import { createAIService } from '@/services/ai-service'

import { safeError } from '@/lib/log-sanitizer';

const flow = new Hono<{ Bindings: Env }>();

// Enable CORS
flow.use('/*', cors())

// ==================== Types (aligned with SPEC-02) ====================

interface FlowNode {
  id: string
  name: string
  type: 'start' | 'end' | 'process' | 'decision' | 'subprocess'
  domainId?: string
  position: { x: number; y: number }
  description?: string
  checked: boolean
  editable: boolean
}

interface FlowEdge {
  id: string
  source: string
  target: string
  label?: string
  animated: boolean
  checked: boolean
}

interface FlowData {
  id: string
  name?: string
  nodes: FlowNode[]
  edges: FlowEdge[]
  projectId: string
  createdAt: number
  updatedAt: number
}

// ==================== Schemas ====================

const GenerateFlowRequestSchema = z.object({
  requirement: z.string().min(1),
  domainIds: z.array(z.string()).min(1, 'domainIds required'),
  projectId: z.string().optional(),
  userId: z.string().min(1, 'userId required'),
  language: z.enum(['zh', 'en']).optional().default('zh'),
  flowType: z.enum(['core_only', 'core_with_supporting', 'full']).optional().default('core_only'),
})

// ==================== POST /api/flow/generate ====================
// Streaming SSE endpoint - generates business flow from domains (SPEC-02)

flow.post('/generate', async (c) => {
  try {
    const env = c.env
    const body = await c.req.json()
    const parseResult = GenerateFlowRequestSchema.safeParse(body)

    if (!parseResult.success) {
      return c.json({
        success: false,
        error: parseResult.error.issues[0].message,
        code: 'VALIDATION_ERROR',
      }, 400)
    }

    const { requirement, domainIds, projectId, userId, flowType } = parseResult.data

    // Create AI service
    const aiService = createAIService(env)

    // Fetch domain names from DB for context
    let domainContext = '从需求中自动识别业务领域'
    let domainNames: string[] = []
    let domainIdSet = new Set(domainIds)

    if (env?.DB && domainIds.length > 0) {
      try {
        const placeholders = domainIds.map(() => '?').join(',')
        const rows = await queryDB<{ id: string; name: string; domainType: string }>(
          env,
          `SELECT id, name, domainType FROM BusinessDomain WHERE id IN (${placeholders})`,
          domainIds
        )
        if (rows.length > 0) {
          domainNames = rows.map(r => r.name)
          domainContext = `参考以下业务领域:\n${rows.map(r => `- ${r.name}（${r.domainType}）`).join('\n')}`
        }
      } catch (err) {
        safeError('[Flow Generate] Failed to fetch domains for context:', err)
      }
    }

    const startTime = Date.now()

    // Build the SSE stream
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()

        const send = (event: string, data: unknown) => {
          const chunk = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
          controller.enqueue(encoder.encode(chunk))
        }

        try {
          // Step 1: Start event with domain count
          send('start', {
            type: 'start',
            domainCount: domainNames.length,
            requirement,
            timestamp: new Date().toISOString(),
          })
          await sleep(150)

          send('thinking', {
            type: 'thinking',
            content: domainNames.length > 0
              ? `根据已分析的核心域：${domainNames.join('、')}，构建业务流程...`
              : '正在分析业务流程...',
          })
          await sleep(150)

          send('thinking', {
            type: 'thinking',
            content: '正在调用 AI 生成业务流程...',
          })

          // Build the AI prompt - aligned with SPEC-02
          const prompt = `你是一个业务流程建模专家。

业务领域（已分析）:
${domainContext}

用户原始需求:
${requirement}

请基于以上业务领域，生成业务流程图。

要求：
1. 每个领域生成对应的流程节点
2. 节点类型: start（开始）, end（结束）, process（处理）, decision（判断）, subprocess（子流程）
3. 用边连接节点，表示流程走向
4. 在边上标注条件或结果
5. 节点名称使用业务语言（如"处理订单"而非"OrderService.process"）

输出格式（JSON）:
{
  "nodes": [
    { "name": "节点名称", "type": "start|process|decision|end", "description": "节点描述" }
  ],
  "edges": [
    { "source": "源节点名称", "target": "目标节点名称", "label": "条件/结果" }
  ]
}

请直接输出 JSON。所有文本使用简体中文。`

          // Call AI service
          const result = await aiService.generateJSON<{ nodes: any[]; edges: any[] }>(
            prompt,
            {
              systemPrompt: '你是一位业务流程专家。只输出有效的JSON对象，所有文本使用简体中文。'
            }
          )

          // Handle AI errors
          if (!result.success || !result.data) {
            throw new Error(`AI 服务错误: ${result.error || '未知错误'}`)
          }

          if (!result.data.nodes || !Array.isArray(result.data.nodes)) {
            throw new Error('AI 响应格式错误：缺少 nodes 字段')
          }

          // Step 2: Parse and stream nodes
          send('thinking', {
            type: 'thinking',
            content: '正在解析流程节点...',
          })
          await sleep(100)

          const flowData = result.data
          const nodeMap = new Map<string, string>() // name -> id mapping
          const nodes: FlowNode[] = []
          const edges: FlowEdge[] = []

          // Create nodes
          let yPos = 0
          const nodeCount = flowData.nodes?.length || 0
          for (let index = 0; index < nodeCount; index++) {
            const node = flowData.nodes[index]
            const nodeId = `node-${generateId()}-${index}`
            nodeMap.set(node.name, nodeId)

            // Map 'task' to 'process' for SPEC-02 compatibility
            const nodeType = node.type === 'task' ? 'process' : (node.type || 'process')

            nodes.push({
              id: nodeId,
              name: node.name,
              type: nodeType as FlowNode['type'],
              domainId: node.domainId || '',
              position: {
                x: 250,
                y: yPos,
              },
              description: node.description,
              checked: false,
              editable: true,
            })

            // Stream each node incrementally
            send('node', { type: 'node', node: nodes[nodes.length - 1], domainId: node.domainId || '' })
            await sleep(200)
            yPos += 100
          }

          // Create edges (second pass)
          send('thinking', {
            type: 'thinking',
            content: '正在连接流程...',
          })
          await sleep(100)

          const edgeCount = flowData.edges?.length || 0
          for (let index = 0; index < edgeCount; index++) {
            const edge = flowData.edges[index]
            const sourceId = nodeMap.get(edge.source)
            const targetId = nodeMap.get(edge.target)

            if (sourceId && targetId) {
              edges.push({
                id: `edge-${generateId()}-${index}`,
                source: sourceId,
                target: targetId,
                label: edge.label || '',
                animated: false,
                checked: false,
              })

              // Stream each edge incrementally
              send('edge', {
                type: 'edge',
                edge: edges[edges.length - 1],
              })
              await sleep(150)
            }
          }

          // Generate Mermaid code
          const mermaidCode = generateFlowMermaid(nodes, edges)

          // Step 3: Save flow to DB
          const flowId = `flow-${generateId()}`
          const flowProjectId = projectId || 'default'
          const now = Date.now()
          const generationTime = Date.now() - startTime

          if (env?.DB) {
            try {
              await executeDB(
                env,
                `INSERT INTO FlowData (id, name, nodes, edges, projectId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [flowId, '业务流程图', JSON.stringify(nodes), JSON.stringify(edges), flowProjectId, now, now]
              )
            } catch (dbErr) {
              safeError('[Flow Generate] Failed to save flow to DB:', dbErr)
            }
          }

          // Step 4: Done
          send('done', {
            type: 'done',
            flow: {
              id: flowId,
              name: '业务流程图',
              projectId: flowProjectId,
              nodes,
              edges,
              mermaidCode,
              createdAt: now,
              updatedAt: now,
            },
            generationTime,
            savedAt: new Date(now).toISOString(),
          })

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '未知错误'
          safeError('[Flow Generate] Error:', errorMessage)
          send('error', {
            type: 'error',
            error: errorMessage,
            code: 'GENERATION_ERROR',
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
    safeError('Error setting up flow stream:', error)
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to setup stream',
    }, 500)
  }
})

// ==================== GET /api/flow ====================

flow.get('/', async (c) => {
  try {
    const env = c.env
    const flowId = c.req.query('flowId') || c.req.query('id')
    const projectId = c.req.query('projectId')

    if (!env?.DB) {
      return c.json({
        success: false,
        error: 'Database not available',
      }, 503)
    }

    if (!flowId && !projectId) {
      return c.json({
        success: false,
        error: 'flowId or projectId is required',
      }, 400)
    }

    interface FlowDataRow {
      id: string
      name: string | null
      nodes: string
      edges: string
      projectId: string
      createdAt: string
      updatedAt: string
    }

    let row: FlowDataRow | null = null

    if (flowId) {
      row = await queryOne<FlowDataRow>(env, 'SELECT * FROM FlowData WHERE id = ?', [flowId])
    } else if (projectId) {
      row = await queryOne<FlowDataRow>(
        env,
        'SELECT * FROM FlowData WHERE projectId = ? ORDER BY updatedAt DESC LIMIT 1',
        [projectId]
      )
    }

    if (!row) {
      return c.json({
        success: true,
        flow: null,
        message: flowId ? `Flow ${flowId} not found` : `No flow found for project ${projectId}`,
      })
    }

    let nodes: FlowNode[] = []
    let edges: FlowEdge[] = []

    try {
      nodes = JSON.parse(row.nodes)
    } catch {
      nodes = []
    }

    try {
      edges = JSON.parse(row.edges)
    } catch {
      edges = []
    }

    return c.json({
      success: true,
      flow: {
        id: row.id,
        name: row.name,
        projectId: row.projectId,
        nodes,
        edges,
        createdAt: new Date(row.createdAt).getTime(),
        updatedAt: new Date(row.updatedAt).getTime(),
      },
    })
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get flow',
    }, 500)
  }
})

// ==================== PUT /api/flow ====================

const UpdateFlowSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  nodes: z.array(z.object({
    id: z.string().optional(),
    name: z.string(),
    type: z.enum(['start', 'end', 'process', 'decision', 'subprocess']),
    domainId: z.string().optional(),
    position: z.object({ x: z.number(), y: z.number() }).optional(),
    description: z.string().optional(),
    checked: z.boolean().optional(),
    editable: z.boolean().optional(),
  })).optional(),
  edges: z.array(z.object({
    id: z.string().optional(),
    source: z.string(),
    target: z.string(),
    label: z.string().optional(),
    animated: z.boolean().optional(),
    checked: z.boolean().optional(),
  })).optional(),
})

flow.put('/', async (c) => {
  try {
    const env = c.env
    const body = await c.req.json()
    const { id, name, nodes, edges } = UpdateFlowSchema.parse(body)

    if (!env?.DB) {
      return c.json({
        success: false,
        error: 'Database not available',
      }, 503)
    }

    // Check if flow exists
    const existing = await queryOne<{ id: string }>(env, 'SELECT id FROM FlowData WHERE id = ?', [id])

    const now = new Date().toISOString()
    const nodesJson = JSON.stringify(nodes || [])
    const edgesJson = JSON.stringify(edges || [])

    if (existing) {
      // Update existing flow
      const sets = ['nodes = ?', 'edges = ?', 'updatedAt = ?']
      const params: unknown[] = [nodesJson, edgesJson, now]

      if (name !== undefined) {
        sets.unshift('name = ?')
        params.unshift(name)
      }

      params.push(id)
      await executeDB(
        env,
        `UPDATE FlowData SET ${sets.join(', ')} WHERE id = ?`,
        params
      )
    } else {
      // Insert new flow (requires projectId from request body)
      const projectId = (body as { projectId?: string }).projectId || 'default'
      await executeDB(
        env,
        `INSERT INTO FlowData (id, name, nodes, edges, projectId, updatedAt) VALUES (?, ?, ?, ?, ?, ?)`,
        [id, name || '业务流程图', nodesJson, edgesJson, projectId, now]
      )
    }

    return c.json({
      success: true,
      flow: {
        id,
        name,
        projectId: (body as { projectId?: string }).projectId,
        nodes: nodes || [],
        edges: edges || [],
        updatedAt: new Date(now).getTime(),
      },
    })
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update flow',
    }, 500)
  }
})

// ==================== DELETE /api/flow ====================

flow.delete('/', async (c) => {
  try {
    const env = c.env
    const flowId = c.req.query('id') || c.req.query('flowId')

    if (!flowId) {
      return c.json({
        success: false,
        error: 'flowId is required',
      }, 400)
    }

    if (!env?.DB) {
      return c.json({
        success: false,
        error: 'Database not available',
      }, 503)
    }

    const existing = await queryOne<{ id: string }>(env, 'SELECT id FROM FlowData WHERE id = ?', [flowId])

    if (!existing) {
      return c.json({
        success: false,
        error: `Flow ${flowId} not found`,
        code: 'NOT_FOUND',
      }, 404)
    }

    await executeDB(env, 'DELETE FROM FlowData WHERE id = ?', [flowId])

    return c.json({
      success: true,
      message: `Flow ${flowId} deleted`,
    })
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete flow',
    }, 500)
  }
})

// ==================== Helper Functions ====================

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function generateFlowMermaid(nodes: FlowNode[], edges: FlowEdge[]): string {
  const lines = ['flowchart TD']

  // Add nodes
  nodes.forEach(node => {
    const shape = node.type === 'start' || node.type === 'end'
      ? `("${node.name}")`
      : node.type === 'decision'
        ? `{${node.name}}`
        : `"${node.name}"`
    lines.push(`  ${node.id}${shape}`)
  })

  // Add edges
  edges.forEach(edge => {
    const arrow = edge.animated ? '-.->' : '-->'
    const label = edge.label ? `|${edge.label}|` : ''
    lines.push(`  ${edge.source} ${arrow}${label} ${edge.target}`)
  })

  return lines.join('\n')
}

export default flow
