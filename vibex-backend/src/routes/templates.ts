/**
 * @deprecated This router uses the legacy Page Router API.
 * All routes have been migrated to Next.js App Router (app/api/).
 * See: docs/migration/page-router-to-app-router.md
 * This file will be removed after E1 security fixes are complete.
 */
/**
 * Templates API - Template Market & Listing
 *
 * GET /api/templates         - List public templates with filtering/pagination
 * GET /api/templates/:id     - Get template details (snapshot)
 * POST /api/templates         - Create template from project
 */

import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { z } from 'zod'
import { generateId, Env, queryDB, queryOne, executeDB } from '@/lib/db'

import { safeError } from '@/lib/log-sanitizer';
import { apiError, ERROR_CODES } from '@/lib/api-error';

const templates = new Hono<{ Bindings: Env }>()

// Enable CORS
templates.use('/*', cors())

// ==================== Types ====================

interface TemplateSummary {
  id: string
  name: string
  description: string | null
  preview: {
    domainCount: number
    nodeCount: number
    uiNodeCount: number
    thumbnail?: string
  }
  tags: string[]
  usageCount: number
  author: {
    name: string
    avatar?: string
  }
  createdAt: string
  isPublic: boolean
}

interface ProjectRow {
  id: string
  name: string
  description: string | null
  userId: string
  status: string
  version: number
  isTemplate: number
  isPublic: number
  usageCount: number
  thumbnail: string | null
  parentDraftId: string | null
  deletedAt: string | null
  createdAt: string
  updatedAt: string
  tags?: string
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

// ==================== GET /api/templates ====================
// List public templates with filtering/pagination

templates.get('/', async (c) => {
  try {
    const env = c.env
    const category = c.req.query('category')
    const tag = c.req.query('tag')
    const page = Math.max(1, parseInt(c.req.query('page') || '1'))
    const rawLimit = parseInt(c.req.query('limit') || '20')
    if (rawLimit > 50) {
      return c.json({
        success: false,
        error: 'Limit must be at most 50',
        code: 'VALIDATION_ERROR',
      }, 400)
    }
    const limit = Math.max(1, rawLimit)
    const sort = c.req.query('sort') || 'popular'
    const offset = (page - 1) * limit

    // Build query - only public templates
    let whereClause = 'deletedAt IS NULL AND isTemplate = 1 AND isPublic = 1'
    const params: unknown[] = []

    if (category) {
      whereClause += ' AND (description LIKE ? OR tags LIKE ?)'
      const like = `%${category}%`
      params.push(like, like)
    }

    if (tag) {
      whereClause += ' AND tags LIKE ?'
      params.push(`%${tag}%`)
    }

    // Sorting
    let orderClause = 'ORDER BY usageCount DESC'
    if (sort === 'newest') {
      orderClause = 'ORDER BY createdAt DESC'
    } else if (sort === 'name') {
      orderClause = 'ORDER BY name ASC'
    }

    // Count total
    const countSql = `SELECT COUNT(*) as total FROM Project WHERE ${whereClause}`
    const countRow = await queryOne<{ total: number }>(env, countSql, params)
    const total = countRow?.total || 0

    // Fetch templates
    const sql = `SELECT * FROM Project WHERE ${whereClause} ${orderClause} LIMIT ? OFFSET ?`
    const projects = await queryDB<ProjectRow>(env, sql, [...params, limit, offset])

    // Build response
    const templateList: TemplateSummary[] = projects.map((p) => {
      let tags: string[] = []
      try {
        tags = p.tags ? JSON.parse(p.tags) : []
      } catch {
        tags = p.tags ? [p.tags] : []
      }

      return {
        id: p.id,
        name: p.name,
        description: p.description,
        preview: {
          domainCount: 0,
          nodeCount: 0,
          uiNodeCount: 0,
          thumbnail: p.thumbnail || undefined,
        },
        tags,
        usageCount: p.usageCount || 0,
        author: {
          name: p.userId,
        },
        createdAt: p.createdAt,
        isPublic: Boolean(p.isPublic),
      }
    })

    return c.json({
      success: true,
      data: {
        templates: templateList,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    })
  } catch (error) {
    safeError('Error listing templates:', error)
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list templates',
    }, 500)
  }
})

// ==================== GET /api/templates/:id ====================
// Get template details (full project snapshot)

templates.get('/:id', async (c) => {
  try {
    const env = c.env
    const id = c.req.param('id')

    // Get project as template
    const project = await queryOne<ProjectRow>(env,
      'SELECT * FROM Project WHERE id = ? AND isTemplate = 1 AND isPublic = 1 AND deletedAt IS NULL',
      [id]
    )

    if (!project) {
      return c.json({
        success: false,
        error: 'Template not found',
        code: 'NOT_FOUND',
      }, 404)
    }

    // Get related data
    const [domains, flow, uiNodes] = await Promise.all([
      queryDB(env, 'SELECT * FROM BusinessDomain WHERE projectId = ?', [id]),
      queryOne<FlowDataRow>(env, 'SELECT * FROM FlowData WHERE projectId = ?', [id]),
      queryDB(env, 'SELECT * FROM UINode WHERE projectId = ?', [id]),
    ])

    let tags: string[] = []
    try {
      tags = project.tags ? JSON.parse(project.tags) : []
    } catch {
      tags = project.tags ? [project.tags] : []
    }

    const flowNodes = flow ? ((): number => {
      try { return JSON.parse(flow.nodes).length } catch { return 0 }
    })() : 0

    return c.json({
      success: true,
      data: {
        id: project.id,
        name: project.name,
        description: project.description,
        status: project.status,
        version: project.version,
        tags,
        usageCount: project.usageCount || 0,
        author: {
          name: project.userId,
        },
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        preview: {
          domainCount: domains.length,
          nodeCount: flowNodes,
          uiNodeCount: uiNodes.length,
          thumbnail: project.thumbnail || undefined,
        },
        domains,
        flow: flow ? {
          id: flow.id,
          name: flow.name,
          nodes: flow.nodes,
          edges: flow.edges,
          projectId: flow.projectId,
          createdAt: flow.createdAt,
          updatedAt: flow.updatedAt,
        } : null,
        uiNodes,
      },
    })
  } catch (error) {
    safeError('Error getting template:', error)
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get template',
    }, 500)
  }
})

// ==================== POST /api/templates ====================
// Create template from existing project

const CreateTemplateSchema = z.object({
  projectId: z.string().min(1),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isPublic: z.boolean().optional(),
})

templates.post('/', async (c) => {
  try {
    const env = c.env
    const body = await c.req.json()
    const { projectId, name, description, tags, isPublic } = CreateTemplateSchema.parse(body)

    // Get existing project
    const project = await queryOne<ProjectRow>(env,
      'SELECT * FROM Project WHERE id = ? AND deletedAt IS NULL',
      [projectId]
    )

    if (!project) {
      return c.json({
        success: false,
        error: 'Project not found',
        code: 'NOT_FOUND',
      }, 404)
    }

    // Update project as template
    const tagsJson = tags ? JSON.stringify(tags) : project.tags
    const publicFlag = isPublic ? 1 : 0
    await executeDB(env,
      `UPDATE Project SET isTemplate = 1, isPublic = ?, updatedAt = ? WHERE id = ?`,
      [publicFlag, new Date().toISOString(), projectId]
    )

    return c.json({
      success: true,
      data: {
        id: projectId,
        name: name || project.name,
        description: description || project.description,
        tags: tags || [],
        isPublic: Boolean(isPublic),
        usageCount: 0,
        createdAt: project.createdAt,
        message: 'Template created successfully',
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return         c.json(apiError('Validation error', ERROR_CODES.VALIDATION_ERROR, error.issues), 400)
    }
    safeError('Error creating template:', error)
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create template',
    }, 500)
  }
})

export default templates
