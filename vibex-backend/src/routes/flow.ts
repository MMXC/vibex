import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { z } from 'zod'
import { generateId, Env } from '@/lib/db'
import { createAIService } from '@/services/ai-service'

const flow = new Hono<{ Bindings: Env }>();

// Enable CORS
flow.use('/*', cors())

// ==================== Types ====================

interface FlowNode {
  id: string
  domainId: string
  name: string
  type: 'start' | 'end' | 'task' | 'decision' | 'subprocess'
  position: { x: number; y: number }
  description?: string
}

interface FlowEdge {
  id: string
  source: string
  target: string
  type: 'default' | 'success' | 'error'
  label?: string
}

interface FlowData {
  id: string
  projectId?: string
  domainIds: string[]
  nodes: FlowNode[]
  edges: FlowEdge[]
  mermaidCode?: string
  createdAt: number
  updatedAt: number
}

// ==================== Schemas ====================

const GenerateFlowRequestSchema = z.object({
  requirement: z.string().min(1),
  domainIds: z.array(z.string()).optional(),
  domainNames: z.array(z.string()).optional(),
  projectId: z.string().optional(),
  userId: z.string().optional(),
})

// ==================== POST /api/flow/generate ====================
// Streaming SSE endpoint - generates business flow from domains

flow.post('/generate', async (c) => {
  try {
    const env = c.env
    const body = await c.req.json()
    const { requirement, domainIds, domainNames } = GenerateFlowRequestSchema.parse(body)

    // Create AI service
    const aiService = createAIService(env)

    // Build domain context
    const domainContext = domainNames && domainNames.length > 0
      ? `参考以下业务领域:\n${domainNames.map((name, i) => `- ${name}`).join('\n')}`
      : '从需求中自动识别业务领域'

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
          send('thinking', { step: 'analyzing', message: '正在分析业务流程...' })
          await sleep(150)

          send('thinking', { step: 'identifying-steps', message: '正在识别流程步骤...' })
          await sleep(150)

          send('thinking', { step: 'calling-ai', message: '正在调用 AI 生成业务流程...' })

          // Build the AI prompt
          const prompt = `You are a business process expert. Based on the following requirement and domains, create a business flow diagram.

**Requirement:**
${requirement}

**Domains:**
${domainContext}

**IMPORTANT: Output ALL text in Simplified Chinese.**

**Output Requirements:**
Generate a JSON object with a "flow" object containing:
- nodes: array of flow nodes, each with:
  - name: 节点名称（如"提交订单"、"审核订单"、"支付成功"）
  - type: start（开始）| end（结束）| task（任务）| decision（判断）| subprocess（子流程）
  - domainId: 对应的领域名称
  - description: 节点描述（可选）
- edges: array of connections between nodes, each with:
  - source: 源节点名称
  - target: 目标节点名称
  - type: default（默认）| success（成功）| error（失败）
  - label: 连接线标签（可选，如"是"/"否"）

**Example Output:**
{
  "flow": {
    "nodes": [
      {"name": "开始", "type": "start", "domainId": "订单管理", "description": "用户发起订订"},
      {"name": "填写订单", "type": "task", "domainId": "订单管理", "description": "用户填写订单信息"},
      {"name": "是否有效", "type": "decision", "domainId": "订单管理", "description": "校验订单有效性"},
      {"name": "支付", "type": "task", "domainId": "支付", "description": "用户完成支付"},
      {"name": "完成", "type": "end", "domainId": "订单管理", "description": "订单创建成功"}
    ],
    "edges": [
      {"source": "开始", "target": "填写订单", "type": "default"},
      {"source": "填写订单", "target": "是否有效", "type": "default"},
      {"source": "是否有效", "target": "支付", "type": "success", "label": "是"},
      {"source": "是否有效", "target": "填写订单", "type": "error", "label": "否"},
      {"source": "支付", "target": "完成", "type": "success"}
    ]
  }
}

Respond ONLY with the JSON object. All text must be in Simplified Chinese.`

          // Call AI service
          const result = await aiService.generateJSON<{ flow: any }>(
            prompt,
            {
              systemPrompt: '你是一位业务流程专家。只输出有效的JSON对象，所有文本使用简体中文。'
            }
          )

          // Handle AI errors
          if (!result.success || !result.data) {
            throw new Error(`AI 服务错误: ${result.error || '未知错误'}`)
          }

          if (!result.data.flow) {
            throw new Error('AI 响应格式错误：缺少 flow 字段')
          }

          // Step 2: Parse and stream nodes
          send('thinking', { step: 'parsing', message: '正在解析流程节点...' })
          await sleep(100)

          const flowData = result.data.flow
          const nodeMap = new Map<string, string>() // name -> id mapping
          const nodes: FlowNode[] = []
          const edges: FlowEdge[] = []

          // Create nodes
          let yPos = 0
          for (let index = 0; index < (flowData.nodes || []).length; index++) {
            const node = flowData.nodes[index]
            const nodeId = `node-${generateId()}-${index}`
            nodeMap.set(node.name, nodeId)

            nodes.push({
              id: nodeId,
              domainId: node.domainId || '',
              name: node.name,
              type: node.type || 'task',
              position: {
                x: 250,
                y: yPos,
              },
              description: node.description,
            })

            // Stream each node incrementally
            send('node', nodes[nodes.length - 1])
            await sleep(200)
            yPos += 100
          }

          // Create edges (second pass)
          send('thinking', { step: 'mapping-edges', message: '正在连接流程...' })
          await sleep(100)

          for (let index = 0; index < (flowData.edges || []).length; index++) {
            const edge = flowData.edges[index]
            const sourceId = nodeMap.get(edge.source)
            const targetId = nodeMap.get(edge.target)

            if (sourceId && targetId) {
              edges.push({
                id: `edge-${generateId()}-${index}`,
                source: sourceId,
                target: targetId,
                type: edge.type || 'default',
                label: edge.label,
              })

              // Stream each edge incrementally
              send('edge', edges[edges.length - 1])
              await sleep(150)
            }
          }

          // Generate Mermaid code
          const mermaidCode = generateFlowMermaid(nodes, edges)

          // Step 3: Done
          send('done', {
            flow: {
              id: `flow-${generateId()}`,
              projectId: undefined,
              domainIds: domainIds || [],
              nodes,
              edges,
              mermaidCode,
              createdAt: Date.now(),
              updatedAt: Date.now(),
            },
            message: `成功生成 ${nodes.length} 个流程节点`,
          })

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '未知错误'
          console.error('[Flow Generate] Error:', errorMessage)
          send('error', {
            message: errorMessage,
            code: 'FLOW_GENERATE_ERROR',
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
    console.error('Error setting up flow stream:', error)
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to setup stream',
    }, 500)
  }
})

// ==================== GET /api/flow ====================

flow.get('/', async (c) => {
  try {
    const flowId = c.req.query('flowId') || c.req.query('id')
    const projectId = c.req.query('projectId')

    // TODO: In production, query from DB
    return c.json({
      success: true,
      flow: null,
      message: flowId ? `Flow ${flowId}` : projectId ? `Flow for project ${projectId}` : 'No ID provided',
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
  nodes: z.array(z.object({
    id: z.string().optional(),
    name: z.string(),
    type: z.enum(['start', 'end', 'task', 'decision', 'subprocess']),
    domainId: z.string().optional(),
    position: z.object({ x: z.number(), y: z.number() }).optional(),
    description: z.string().optional(),
  })).optional(),
  edges: z.array(z.object({
    id: z.string().optional(),
    source: z.string(),
    target: z.string(),
    type: z.enum(['default', 'success', 'error']).optional(),
    label: z.string().optional(),
  })).optional(),
})

flow.put('/', async (c) => {
  try {
    const body = await c.req.json()
    const { id, nodes, edges } = UpdateFlowSchema.parse(body)

    // TODO: Update in DB
    console.log('[Flow] Updated flow:', id)

    return c.json({
      success: true,
      flow: {
        id,
        nodes: nodes || [],
        edges: edges || [],
        updatedAt: Date.now(),
      },
    })
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update flow',
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
    const arrow = edge.type === 'error' ? '-->' : '-->'
    const label = edge.label ? `|${edge.label}|` : ''
    lines.push(`  ${edge.source} ${arrow}${label} ${edge.target}`)
  })

  return lines.join('\n')
}

export default flow
