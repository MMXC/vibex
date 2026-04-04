/**
 * Canvas API Routes - Hono Implementation
 * POST /v1/canvas/generate-contexts
 * POST /v1/canvas/generate-flows
 * POST /v1/canvas/generate-components
 * 
 * Part of: api-input-validation-layer / Epic E3
 */

import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { generateId, Env } from '@/lib/db'
import { createAIService } from '@/services/ai-service'
import { devDebug } from '@/lib/log-sanitizer'
import { withValidation, ValidatedContext } from '@/lib/api-validation'
import {
  boundedContextSchema,
  generateContextsSchema,
  generateFlowsSchema,
  generateComponentsSchema,
} from '@/schemas/canvas'

const canvas = new Hono<{ Bindings: Env }>()

// Enable CORS
canvas.use('/*', cors())

// ============================================================
// Type Definitions
// ============================================================

interface BoundedContext {
  id: string
  name: string
  description: string
  type: string
}

interface FlowStep {
  id: string
  name: string
  actor: string
  description?: string
  order: number
}

interface BusinessFlow {
  id: string
  name: string
  contextId: string
  description?: string
  steps: FlowStep[]
  confidence: number
}

interface ComponentNode {
  flowId: string
  name: string
  type: string
  props: Record<string, unknown>
  api: {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
    path: string
    params: string[]
  }
}

// ============================================================
// Step 1: Generate Bounded Contexts
// POST /v1/canvas/generate-contexts
// ============================================================

canvas.post('/generate-contexts',
  withValidation({ body: generateContextsSchema }, async (c: ValidatedContext) => {
    try {
      const env = c.env
      const { requirementText } = c.validatedData.body as { requirementText: string; projectId?: string }

      devDebug('[canvas/generate-contexts] Starting with requirement:', requirementText.substring(0, 50))

      const aiService = createAIService(env)

      const prompt = `你是一个 DDD 专家。根据以下需求，识别限界上下文。

需求：
${requirementText}

输出 JSON 数组，每个上下文包含：
- name: 上下文名称（简洁的名词短语）
- description: 职责描述（20字以内）
- type: 类型（core/supporting/generic/external）

只返回 JSON 数组，不要其他文字。`

      const result = await aiService.generateJSON<Array<{
        name: string
        description: string
        type?: string
      }>>(prompt, undefined, {
        temperature: 0.4,
        maxTokens: 2048,
      })

      const contexts: BoundedContext[] = (result.data || []).map((ctx, idx) => ({
        id: `ctx-${generateId()}`,
        name: ctx.name || `上下文 ${idx + 1}`,
        description: ctx.description || '',
        type: (ctx.type as string) || 'core',
      }))

      const generationId = generateId()

      devDebug(`[canvas/generate-contexts] Generated ${contexts.length} contexts`)

      return c.json({
        success: true,
        contexts,
        generationId,
        confidence: result.usage
          ? Math.max(0.5, Math.min(0.9, 1 - (result.usage.completionTokens / 4096)))
          : 0.7,
      })

    } catch (err) {
      devDebug('[canvas/generate-contexts] Error:', err)
      return c.json({
        success: false,
        contexts: [],
        generationId: '',
        confidence: 0,
        error: err instanceof Error ? err.message : '生成限界上下文失败',
      }, 500)
    }
  })
)

// ============================================================
// Step 2: Generate Business Flows
// POST /v1/canvas/generate-flows
// ============================================================

canvas.post('/generate-flows',
  withValidation({ body: generateFlowsSchema }, async (c: ValidatedContext) => {
    try {
      const env = c.env
      const { contexts, sessionId } = c.validatedData.body as {
        contexts: Array<{ id: string; name: string; description: string; type: string }>
        sessionId: string
      }

      devDebug(`[canvas/generate-flows] Starting with ${contexts.length} contexts, sessionId: ${sessionId}`)

      const aiService = createAIService(env)

      const contextSummary = contexts
        .map((ctx) => `- ${ctx.name}: ${ctx.description} (类型: ${ctx.type})`)
        .join('\n')

      // Step 2a: Get flow structure (Process)
      const flowPrompt = `根据以下限界上下文，输出一组业务流程。

上下文列表：
${contextSummary}

输出 JSON 数组，每项只包含：
- name: 流程名称
- contextId: 所属上下文ID
- steps: 步骤数组，每步只含 name（步骤名）和 actor（参与者）
- 不要加 description、confidence 等元字段

示例：
[{"name":"用户下单","contextId":"xxx","steps":[{"name":"填写订单","actor":"用户"},{"name":"扣减库存","actor":"系统"}]}]`

      const flowResult = await aiService.generateJSON<Array<{
        name: string
        contextId: string
        steps: Array<{ name: string; actor: string }>
      }>>(flowPrompt, undefined, {
        temperature: 0.4,
        maxTokens: 3072,
      })

      if (!flowResult.data || !Array.isArray(flowResult.data) || flowResult.data.length === 0) {
        return c.json({
          success: false,
          flows: [],
          generationId: '',
          confidence: 0,
          error: '未能生成有效的业务流程，请重试',
        }, 200)
      }

      // Normalize flows
      const generationId = generateId()
      const flows: BusinessFlow[] = flowResult.data.map((flow, idx) => ({
        id: `flow-${generateId()}`,
        name: flow.name || `流程 ${idx + 1}`,
        contextId: flow.contextId || contexts[0]?.id || '',
        description: '',
        steps: (flow.steps || []).map((step, sIdx) => ({
          id: `step-${generateId()}`,
          name: step.name || `步骤 ${sIdx + 1}`,
          actor: step.actor || '用户',
          description: '',
          order: sIdx,
        })),
        confidence: 0.75,
      }))

      const confidence = flowResult.usage
        ? Math.max(0.5, Math.min(0.9, 1 - (flowResult.usage.completionTokens / 4096)))
        : 0.7

      devDebug(`[canvas/generate-flows] Generated ${flows.length} flows`)

      return c.json({
        success: true,
        flows,
        generationId,
        confidence,
      })

    } catch (err) {
      devDebug('[canvas/generate-flows] Error:', err)
      return c.json({
        success: false,
        flows: [],
        generationId: '',
        confidence: 0,
        error: err instanceof Error ? err.message : '生成业务流程失败',
      }, 500)
    }
  })
)

// ============================================================
// Step 3: Generate Components
// POST /v1/canvas/generate-components
// ============================================================

canvas.post('/generate-components',
  withValidation({ body: generateComponentsSchema }, async (c: ValidatedContext) => {
    try {
      const env = c.env
      const { contexts, flows, sessionId } = c.validatedData.body as {
        contexts: Array<{ id: string; name: string; description: string; type: string }>
        flows: Array<{ id?: string; name: string; contextId: string; steps: Array<{ id?: string; name: string; actor: string; description?: string; order?: number }> }>
        sessionId: string
      }

      devDebug(`[canvas/generate-components] Starting with ${flows.length} flows, sessionId: ${sessionId}`)

      const aiService = createAIService(env)

      // Build context + flow summary for prompt
      const contextMap = new Map(contexts.map(ctx => [ctx.id, ctx.name]))
      const flowSummary = flows
        .map(f => {
          const ctxName = contextMap.get(f.contextId) || '未知'
          const stepNames = f.steps.map(s => s.name).join(' → ')
          return `- ${f.name} (${ctxName}): ${stepNames}`
        })
        .join('\n')

      // Step 3: Get component schema (Format)
      const componentPrompt = `基于以下业务流程，生成组件树节点。

流程列表：
${flowSummary}

每个流程 → 多个组件。
每个组件需包含：
- name: 组件名（名词短语，如"订单卡片"、"支付按钮"）
- type: 类型（button|form|table|card|modal|input|list|navigation）
- props: 默认属性（placeholder/defaultValue/title 等）
- api: 接口 { method: GET|POST|PUT|DELETE, path: "/api/xxx", params: ["id"] }

输出 JSON 数组，不要其他文字。`

      const componentResult = await aiService.generateJSON<Array<{
        name: string
        type: string
        props: Record<string, unknown>
        api: { method: string; path: string; params: string[] }
      }>>(componentPrompt, undefined, {
        temperature: 0.3,
        maxTokens: 4096,
      })

      if (!componentResult.data || !Array.isArray(componentResult.data) || componentResult.data.length === 0) {
        return c.json({
          success: false,
          components: [],
          generationId: '',
          error: '未能生成有效的组件树，请重试',
        }, 200)
      }

      const generationId = generateId()
      const components: ComponentNode[] = componentResult.data.map((comp) => ({
        flowId: comp.flowId || flows[0]?.id || 'unknown',
        name: comp.name || '未命名组件',
        type: comp.type || 'card',
        props: comp.props || {},
        api: {
          method: (['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].includes(comp.api?.method))
            ? comp.api.method as ComponentNode['api']['method']
            : 'GET',
          path: comp.api?.path || '/api/unknown',
          params: comp.api?.params || [],
        },
      }))

      devDebug(`[canvas/generate-components] Generated ${components.length} components`)

      return c.json({
        success: true,
        components,
        generationId,
      })

    } catch (err) {
      devDebug('[canvas/generate-components] Error:', err)
      return c.json({
        success: false,
        components: [],
        generationId: '',
        error: err instanceof Error ? err.message : '生成组件树失败',
      }, 500)
    }
  })
)

export default canvas