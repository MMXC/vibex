/**
 * @deprecated This router uses the legacy Page Router API. 
 * All routes have been migrated to Next.js App Router (app/api/). 
 * See: docs/migration/page-router-to-app-router.md 
 * This file will be removed after E1 security fixes are complete. 
 */
 * UI Nodes API - UI Structure Generation & Persistence
 * 
 * POST /api/ui-nodes/generate  - SSE streaming UI node generation
 * GET /api/ui-nodes            - Get UI nodes for project/flow
 * PUT /api/ui-nodes            - Update UI node
 */

import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { z } from 'zod'
import { generateId, Env, executeDB, queryDB, queryOne } from '@/lib/db'
import { createAIService } from '@/services/ai-service'

import { safeError } from '@/lib/log-sanitizer';

const uiNodes = new Hono<{ Bindings: Env }>()

// Enable CORS
uiNodes.use('/*', cors())

// ==================== Types ====================

type UINodeType = 'page' | 'form' | 'list' | 'detail' | 'header' | 'footer' | 'modal' | 'navigation' | 'card'

interface UINode {
  id: string
  name: string
  nodeType: UINodeType
  description?: string
  linkedFlowNodeId?: string
  position: { x: number; y: number }
  children: UINode[]
  annotations: UINodeAnnotation[]
  checked: boolean
  priority: 'low' | 'medium' | 'high'
  status: 'pending' | 'generated' | 'failed'
}

interface UINodeAnnotation {
  id: string
  text: string
  source: 'user_input' | 'ai_suggestion'
  timestamp: string
  applied: boolean
}

interface UINodeRow {
  id: string
  projectId: string
  flowNodeId: string | null
  name: string
  nodeType: string
  description: string | null
  position: string
  children: string
  annotations: string
  checked: number
  priority: string
  status: string
  createdAt: string
  updatedAt: string
}

// ==================== Schemas ====================

const GenerateRequestSchema = z.object({
  projectId: z.string().optional(),
  flowId: z.string().min(1),
  requirement: z.string().min(1),
  userId: z.string().min(1),
  language: z.enum(['zh', 'en']).optional(),
  flowNodes: z.array(z.object({
    id: z.string(),
    name: z.string(),
    type: z.string(),
    domainId: z.string().optional(),
    description: z.string().optional(),
  })).optional(),
})

// ==================== POST /api/ui-nodes/generate ====================
// SSE streaming UI node generation

uiNodes.post('/generate', async (c) => {
  try {
    const env = c.env
    const body = await c.req.json()
    const { projectId, flowId, requirement, userId, flowNodes } = GenerateRequestSchema.parse(body)

    const aiService = createAIService(env)

    // Build flow nodes context
    const flowNodesJson = flowNodes
      ? JSON.stringify(flowNodes.map(n => ({ name: n.name, type: n.type, domainId: n.domainId || '' })), null, 2)
      : '[]'

    const prompt = `你是一个 UI 结构规划专家。

业务流程节点:
${flowNodesJson}

用户需求:
${requirement}

请基于以上流程节点，生成 UI 节点图结构。

要求：
1. 每个流程节点对应一个或多个 UI 页面/组件
2. 页面类型: page(页面), form(表单), list(列表), detail(详情), header, footer, modal, navigation, card
3. 页面之间有层级关系 (children)
4. 每个节点包含名称、类型、描述
5. 估算组件复杂度

输出格式 (JSON):
{
  "nodes": [
    {
      "name": "登录页",
      "nodeType": "page",
      "description": "用户登录入口",
      "children": [
        { "name": "登录表单", "nodeType": "form", "description": "用户名密码输入" }
      ]
    }
  ]
}`

    // Build SSE stream
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()

        const send = (event: string, data: unknown) => {
          const chunk = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
          controller.enqueue(encoder.encode(chunk))
        }

        try {
          send('thinking', { step: 'analyzing', message: '正在分析流程节点...' })
          await sleep(200)

          send('thinking', { step: 'calling-ai', message: '正在生成 UI 结构...' })

          const result = await aiService.generateJSON<{ nodes: any[] }>(
            prompt,
            { systemPrompt: '你是一位 UI 结构规划专家。只输出有效的 JSON 对象，所有文本使用简体中文。' }
          )

          if (!result.success || !result.data?.nodes) {
            throw new Error(`AI 服务错误: ${result.error || '未知错误'}`)
          }

          const nodes: UINode[] = []

          for (let i = 0; i < result.data.nodes.length; i++) {
            const item = result.data.nodes[i]

            const nodeId = `uinode-${generateId()}-${i}`

            // Build node
            const node: UINode = {
              id: nodeId,
              name: item.name || '',
              nodeType: mapNodeType(item.nodeType),
              description: item.description,
              position: { x: 250, y: i * 120 },
              children: (item.children || []).map((child: any, ci: number) => ({
                id: `${nodeId}-child-${ci}`,
                name: child.name || '',
                nodeType: mapNodeType(child.nodeType),
                description: child.description,
                position: { x: 400, y: i * 120 + (ci + 1) * 60 },
                children: [],
                annotations: [],
                checked: false,
                priority: 'medium' as const,
                status: 'generated' as const,
              })),
              annotations: [],
              checked: false,
              priority: 'medium',
              status: 'generated',
            }

            nodes.push(node)

            // Stream each node
            send('node', node)
            await sleep(250)
          }

          // Save to DB
          if (projectId && env?.DB) {
            for (const node of nodes) {
              await saveUINode(env, projectId, flowId, node)
            }
          }

          send('done', {
            nodes,
            message: `成功生成 ${nodes.length} 个 UI 节点`,
          })

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '未知错误'
          safeError('[UINodes Generate] Error:', errorMessage)
          send('error', { message: errorMessage, code: 'UI_NODES_ERROR' })
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
    safeError('Error setting up ui-nodes stream:', error)
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to setup stream',
    }, 500)
  }
})

// ==================== GET /api/ui-nodes ====================
// Get UI nodes for project or flow

uiNodes.get('/', async (c) => {
  try {
    const env = c.env
    const projectId = c.req.query('projectId')
    const flowId = c.req.query('flowId')

    if (!projectId && !flowId) {
      return c.json({
        success: false,
        error: 'projectId or flowId is required',
        code: 'VALIDATION_ERROR',
      }, 400)
    }

    let sql = 'SELECT * FROM UINode WHERE 1=1'
    const params: string[] = []

    if (projectId) {
      sql += ' AND projectId = ?'
      params.push(projectId)
    }
    if (flowId) {
      sql += ' AND flowNodeId = ?'
      params.push(flowId)
    }

    sql += ' ORDER BY createdAt ASC'

    const rows = await queryDB<UINodeRow>(env, sql, params)

    const nodes = rows.map(rowToUINode)

    return c.json({
      success: true,
      data: {
        nodes,
        count: nodes.length,
      },
    })
  } catch (error) {
    safeError('Error getting ui-nodes:', error)
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get ui-nodes',
    }, 500)
  }
})

// ==================== PUT /api/ui-nodes ====================
// Update UI node

const UpdateUINodeSchema = z.object({
  id: z.string().min(1),
  name: z.string().optional(),
  description: z.string().optional(),
  checked: z.boolean().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  annotations: z.array(z.object({
    id: z.string().optional(),
    text: z.string(),
    source: z.enum(['user_input', 'ai_suggestion']),
    timestamp: z.string(),
    applied: z.boolean(),
  })).optional(),
})

uiNodes.put('/', async (c) => {
  try {
    const env = c.env
    const body = await c.req.json()
    const { id, name, description, checked, priority, annotations } = UpdateUINodeSchema.parse(body)

    // Build update
    const updates: string[] = []
    const params: unknown[] = []

    if (name !== undefined) { updates.push('name = ?'); params.push(name) }
    if (description !== undefined) { updates.push('description = ?'); params.push(description) }
    if (checked !== undefined) { updates.push('checked = ?'); params.push(checked ? 1 : 0) }
    if (priority !== undefined) { updates.push('priority = ?'); params.push(priority) }
    if (annotations !== undefined) { updates.push('annotations = ?'); params.push(JSON.stringify(annotations)) }

    updates.push('updatedAt = ?')
    params.push(new Date().toISOString())
    params.push(id)

    await executeDB(env,
      `UPDATE UINode SET ${updates.join(', ')} WHERE id = ?`,
      params
    )

    return c.json({
      success: true,
      data: { id, name, description, checked, priority, annotations },
    })
  } catch (error) {
    safeError('Error updating ui-node:', error)
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update ui-node',
    }, 500)
  }
})

// ==================== Helper Functions ====================

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function mapNodeType(type: string): UINodeType {
  const validTypes: UINodeType[] = ['page', 'form', 'list', 'detail', 'header', 'footer', 'modal', 'navigation', 'card']
  return validTypes.includes(type as UINodeType) ? type as UINodeType : 'page'
}

function rowToUINode(row: UINodeRow): UINode {
  let children: UINode[] = []
  let annotations: UINodeAnnotation[] = []
  let position = { x: 250, y: 0 }

  try { children = JSON.parse(row.children || '[]') } catch { /* ignore */ }
  try { annotations = JSON.parse(row.annotations || '[]') } catch { /* ignore */ }
  try { position = JSON.parse(row.position || '{"x":250,"y":0}') } catch { /* ignore */ }

  return {
    id: row.id,
    name: row.name,
    nodeType: row.nodeType as UINodeType,
    description: row.description || undefined,
    linkedFlowNodeId: row.flowNodeId || undefined,
    position,
    children,
    annotations,
    checked: row.checked === 1,
    priority: row.priority as UINode['priority'],
    status: row.status as UINode['status'],
  }
}

async function saveUINode(env: Env, projectId: string, flowId: string, node: UINode): Promise<void> {
  await executeDB(env,
    `INSERT INTO UINode (id, projectId, flowNodeId, name, nodeType, description, position, children, annotations, checked, priority, status, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      node.id,
      projectId,
      node.linkedFlowNodeId || null,
      node.name,
      node.nodeType,
      node.description || null,
      JSON.stringify(node.position),
      JSON.stringify(node.children),
      JSON.stringify(node.annotations),
      node.checked ? 1 : 0,
      node.priority,
      node.status,
      new Date().toISOString(),
      new Date().toISOString(),
    ]
  )
}

export default uiNodes
