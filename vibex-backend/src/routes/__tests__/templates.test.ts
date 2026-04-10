/**
/**
 * @deprecated Legacy Cloudflare Workers route. Migrated to App Router (app/api/).
 * See: docs/migration/page-router-to-app-router.md
 */
 * Tests for Templates API (SPEC-09)
 */

const mockQueryOne = jest.fn()
const mockQueryDB = jest.fn()
const mockExecuteDB = jest.fn()

jest.mock('@/lib/db', () => ({
  queryOne: (...args: unknown[]) => mockQueryOne(...args),
  queryDB: (...args: unknown[]) => mockQueryDB(...args),
  executeDB: (...args: unknown[]) => mockExecuteDB(...args),
  generateId: () => 'test-id-' + Math.random().toString(36).slice(2),
}))

import { Hono } from 'hono'
import templates from '../templates'
import { Env } from '@/lib/db'

// Build a test app
const buildApp = () => {
  const app = new Hono<{ Bindings: Env }>()
  return app.route('/api/templates', templates)
}

// Helper to create a mock Env
const mockEnv = {
  DB: {
    prepare: jest.fn().mockReturnThis(),
    bind: jest.fn().mockReturnThis(),
    first: jest.fn(),
    all: jest.fn(),
    run: jest.fn(),
  },
} as unknown as Env

// Helper to create a mock project row
const mockProject = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: 'tpl-1',
  name: 'SaaS Starter',
  description: 'A SaaS starter template',
  userId: 'user-123',
  status: 'draft',
  version: 1,
  isTemplate: 1,
  isPublic: 1,
  usageCount: 42,
  thumbnail: null,
  parentDraftId: null,
  deletedAt: null,
  createdAt: '2026-03-01T00:00:00.000Z',
  updatedAt: '2026-03-01T00:00:00.000Z',
  tags: JSON.stringify(['SaaS', '后台管理']),
  ...overrides,
})

// Helper to create a mock flow data
const mockFlowData = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: 'flow-1',
  name: 'Main Flow',
  nodes: JSON.stringify([{ id: 'n1' }, { id: 'n2' }]),
  edges: JSON.stringify([]),
  projectId: 'tpl-1',
  createdAt: '2026-03-01T00:00:00.000Z',
  updatedAt: '2026-03-01T00:00:00.000Z',
  ...overrides,
})

describe('GET /api/templates', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return paginated public templates', async () => {
    mockQueryOne.mockResolvedValueOnce({ total: 1 })
    mockQueryDB.mockResolvedValueOnce([mockProject()])

    const app = buildApp()
    const req = new Request('http://localhost/api/templates')
    const res = await app.fetch(req, mockEnv)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.templates).toHaveLength(1)
    expect(data.data.templates[0].name).toBe('SaaS Starter')
    expect(data.data.templates[0].isPublic).toBe(true)
    expect(data.data.templates[0].usageCount).toBe(42)
    expect(data.data.pagination.total).toBe(1)
  })

  it('should only return public templates (isPublic=1)', async () => {
    mockQueryOne.mockResolvedValueOnce({ total: 0 })
    mockQueryDB.mockResolvedValueOnce([])

    const app = buildApp()
    const req = new Request('http://localhost/api/templates')
    await app.fetch(req, mockEnv)

    // The first queryOne call is for COUNT; verify SQL includes isPublic=1
    const countSql = mockQueryOne.mock.calls[0][1]
    expect(countSql).toContain('isPublic = 1')
  })

  it('should filter by category (description OR tags LIKE)', async () => {
    mockQueryOne.mockResolvedValueOnce({ total: 0 })
    mockQueryDB.mockResolvedValueOnce([])

    const app = buildApp()
    const req = new Request('http://localhost/api/templates?category=SaaS')
    await app.fetch(req, mockEnv)

    // Verify the SQL includes category filter
    const countSql = mockQueryOne.mock.calls[0][1]
    expect(countSql).toContain('description LIKE ? OR tags LIKE ?')
  })

  it('should filter by tag', async () => {
    mockQueryOne.mockResolvedValueOnce({ total: 0 })
    mockQueryDB.mockResolvedValueOnce([])

    const app = buildApp()
    const req = new Request('http://localhost/api/templates?tag=SaaS')
    await app.fetch(req, mockEnv)

    const countSql = mockQueryOne.mock.calls[0][1]
    expect(countSql).toContain('tags LIKE ?')
  })

  it('should sort by popular (usageCount DESC)', async () => {
    mockQueryOne.mockResolvedValueOnce({ total: 0 })
    mockQueryDB.mockResolvedValueOnce([])

    const app = buildApp()
    const req = new Request('http://localhost/api/templates?sort=popular')
    await app.fetch(req, mockEnv)

    // Check the list SQL includes ORDER BY usageCount DESC
    const listSql = mockQueryDB.mock.calls[0][1]
    expect(listSql).toContain('ORDER BY usageCount DESC')
  })

  it('should sort by newest (createdAt DESC)', async () => {
    mockQueryOne.mockResolvedValueOnce({ total: 0 })
    mockQueryDB.mockResolvedValueOnce([])

    const app = buildApp()
    const req = new Request('http://localhost/api/templates?sort=newest')
    await app.fetch(req, mockEnv)

    const listSql = mockQueryDB.mock.calls[0][1]
    expect(listSql).toContain('ORDER BY createdAt DESC')
  })

  it('should sort by name (name ASC)', async () => {
    mockQueryOne.mockResolvedValueOnce({ total: 0 })
    mockQueryDB.mockResolvedValueOnce([])

    const app = buildApp()
    const req = new Request('http://localhost/api/templates?sort=name')
    await app.fetch(req, mockEnv)

    const listSql = mockQueryDB.mock.calls[0][1]
    expect(listSql).toContain('ORDER BY name ASC')
  })

  it('should return 400 when limit exceeds 50', async () => {
    const app = buildApp()
    const req = new Request('http://localhost/api/templates?limit=100')
    const res = await app.fetch(req, mockEnv)
    const data = await res.json()

    expect(res.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toContain('50')
    expect(data.code).toBe('VALIDATION_ERROR')
  })

  it('should default to limit 20 and page 1', async () => {
    mockQueryOne.mockResolvedValueOnce({ total: 0 })
    mockQueryDB.mockResolvedValueOnce([])

    const app = buildApp()
    const req = new Request('http://localhost/api/templates')
    const res = await app.fetch(req, mockEnv)
    const data = await res.json()

    expect(data.data.pagination.limit).toBe(20)
    expect(data.data.pagination.page).toBe(1)
  })

  it('should handle pagination correctly', async () => {
    mockQueryOne.mockResolvedValueOnce({ total: 100 })
    mockQueryDB.mockResolvedValueOnce([])

    const app = buildApp()
    const req = new Request('http://localhost/api/templates?page=3&limit=10')
    const res = await app.fetch(req, mockEnv)
    const data = await res.json()

    expect(data.data.pagination.page).toBe(3)
    expect(data.data.pagination.limit).toBe(10)
    expect(data.data.pagination.totalPages).toBe(10)
  })

  it('should return empty list gracefully when no templates', async () => {
    mockQueryOne.mockResolvedValueOnce({ total: 0 })
    mockQueryDB.mockResolvedValueOnce([])

    const app = buildApp()
    const req = new Request('http://localhost/api/templates?category=nonexistent')
    const res = await app.fetch(req, mockEnv)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.data.templates).toHaveLength(0)
    expect(data.data.pagination.total).toBe(0)
  })

  it('should parse tags from JSON', async () => {
    mockQueryOne.mockResolvedValueOnce({ total: 1 })
    mockQueryDB.mockResolvedValueOnce([mockProject({ tags: '["电商","SaaS"]' })])

    const app = buildApp()
    const req = new Request('http://localhost/api/templates')
    const res = await app.fetch(req, mockEnv)
    const data = await res.json()

    expect(data.data.templates[0].tags).toEqual(['电商', 'SaaS'])
  })

  it('should handle thumbnail from DB', async () => {
    mockQueryOne.mockResolvedValueOnce({ total: 1 })
    mockQueryDB.mockResolvedValueOnce([
      mockProject({ thumbnail: 'https://example.com/preview.png' }),
    ])

    const app = buildApp()
    const req = new Request('http://localhost/api/templates')
    const res = await app.fetch(req, mockEnv)
    const data = await res.json()

    expect(data.data.templates[0].preview.thumbnail).toBe(
      'https://example.com/preview.png'
    )
  })

  it('should return 500 on DB error', async () => {
    mockQueryOne.mockRejectedValueOnce(new Error('DB error'))

    const app = buildApp()
    const req = new Request('http://localhost/api/templates')
    const res = await app.fetch(req, mockEnv)
    const data = await res.json()

    expect(res.status).toBe(500)
    expect(data.success).toBe(false)
  })
})

describe('GET /api/templates/:id', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return template details with FlowData', async () => {
    mockQueryOne
      .mockResolvedValueOnce(mockProject())
      .mockResolvedValueOnce(mockFlowData())
    mockQueryDB
      .mockResolvedValueOnce([{ id: 'bd-1', name: 'Domain 1' }])
      .mockResolvedValueOnce([{ id: 'ui-1', name: 'UI Node 1' }])

    const app = buildApp()
    const req = new Request('http://localhost/api/templates/tpl-1')
    const res = await app.fetch(req, mockEnv)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.id).toBe('tpl-1')
    expect(data.data.preview.domainCount).toBe(1)
    expect(data.data.preview.nodeCount).toBe(2)
    expect(data.data.preview.uiNodeCount).toBe(1)
    expect(data.data.flow).not.toBeNull()
    expect(data.data.flow.id).toBe('flow-1')
    expect(data.data.flow.nodes).toBe(mockFlowData().nodes)
  })

  it('should return 404 for non-existent template', async () => {
    mockQueryOne.mockResolvedValueOnce(null)

    const app = buildApp()
    const req = new Request('http://localhost/api/templates/nonexistent')
    const res = await app.fetch(req, mockEnv)
    const data = await res.json()

    expect(res.status).toBe(404)
    expect(data.success).toBe(false)
    expect(data.code).toBe('NOT_FOUND')
  })

  it('should return 404 for private template (isPublic=0)', async () => {
    // When isPublic=0, queryOne returns null (template not found)
    mockQueryOne.mockResolvedValueOnce(null)

    const app = buildApp()
    const req = new Request('http://localhost/api/templates/private-tpl')
    const res = await app.fetch(req, mockEnv)
    const data = await res.json()

    expect(res.status).toBe(404)
    expect(data.code).toBe('NOT_FOUND')
  })

  it('should return flow=null when no FlowData exists', async () => {
    mockQueryOne
      .mockResolvedValueOnce(mockProject())
      .mockResolvedValueOnce(null)
    mockQueryDB
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])

    const app = buildApp()
    const req = new Request('http://localhost/api/templates/tpl-1')
    const res = await app.fetch(req, mockEnv)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.data.flow).toBeNull()
    expect(data.data.preview.nodeCount).toBe(0)
  })

  it('should parse tags from JSON', async () => {
    mockQueryOne
      .mockResolvedValueOnce(mockProject({ tags: '["电商","后台管理"]' }))
      .mockResolvedValueOnce(null)
    mockQueryDB.mockResolvedValueOnce([]).mockResolvedValueOnce([])

    const app = buildApp()
    const req = new Request('http://localhost/api/templates/tpl-1')
    const res = await app.fetch(req, mockEnv)
    const data = await res.json()

    expect(data.data.tags).toEqual(['电商', '后台管理'])
  })

  it('should return 500 on DB error', async () => {
    mockQueryOne.mockRejectedValueOnce(new Error('DB error'))

    const app = buildApp()
    const req = new Request('http://localhost/api/templates/tpl-1')
    const res = await app.fetch(req, mockEnv)
    const data = await res.json()

    expect(res.status).toBe(500)
    expect(data.success).toBe(false)
  })
})

describe('POST /api/templates', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should create template from existing project', async () => {
    mockQueryOne.mockResolvedValueOnce({
      id: 'proj-1',
      name: 'My Project',
      description: 'A project',
      userId: 'user-123',
      tags: '[]',
      deletedAt: null,
      createdAt: '2026-03-01T00:00:00.000Z',
      updatedAt: '2026-03-01T00:00:00.000Z',
      status: 'draft',
      version: 1,
      isTemplate: 0,
      isPublic: 0,
      usageCount: 0,
      thumbnail: null,
      parentDraftId: null,
    })
    mockExecuteDB.mockResolvedValueOnce({ success: true })

    const app = buildApp()
    const req = new Request('http://localhost/api/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: 'proj-1', isPublic: true }),
    })
    const res = await app.fetch(req, mockEnv)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.id).toBe('proj-1')
    expect(data.data.isPublic).toBe(true)
    expect(mockExecuteDB).toHaveBeenCalled()
  })

  it('should return 400 for invalid body', async () => {
    const app = buildApp()
    const req = new Request('http://localhost/api/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    const res = await app.fetch(req, mockEnv)
    const data = await res.json()

    expect(res.status).toBe(400)
    expect(data.code).toBe('VALIDATION_ERROR')
  })

  it('should return 404 for non-existent project', async () => {
    mockQueryOne.mockResolvedValueOnce(null)

    const app = buildApp()
    const req = new Request('http://localhost/api/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: 'nonexistent' }),
    })
    const res = await app.fetch(req, mockEnv)
    const data = await res.json()

    expect(res.status).toBe(404)
    expect(data.code).toBe('NOT_FOUND')
  })
})
