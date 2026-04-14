/**
 * @deprecated This router uses the legacy Page Router API. 
 * All routes have been migrated to Next.js App Router (app/api/). 
 * See: docs/migration/page-router-to-app-router.md 
 * This file will be removed after E1 security fixes are complete. 
 */
import { Hono } from 'hono';

import { cors } from 'hono/cors'
import { z } from 'zod'
import { apiError, ERROR_CODES } from '@/lib/api-error';

const confirmationProjects = new Hono()

// Enable CORS
confirmationProjects.use('/*', cors())

// Schema for confirmation project
const ConfirmationProjectSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  description: z.string().optional(),
  createdBy: z.string().optional(),
  updatedAt: z.string().optional(),
  requirementText: z.string(),
  boundedContexts: z.array(z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    type: z.enum(['core', 'supporting', 'generic', 'external']),
    relationships: z.array(z.object({
      id: z.string(),
      fromContextId: z.string(),
      toContextId: z.string(),
      type: z.enum(['upstream', 'downstream', 'symmetric']),
      description: z.string(),
    })),
  })),
  selectedContextIds: z.array(z.string()),
  contextMermaidCode: z.string().optional(),
  domainModels: z.array(z.object({
    id: z.string(),
    name: z.string(),
    contextId: z.string(),
    type: z.enum(['aggregate_root', 'entity', 'value_object']),
    properties: z.array(z.object({
      name: z.string(),
      type: z.string(),
      required: z.boolean(),
      description: z.string(),
    })),
    methods: z.array(z.string()),
  })),
  modelMermaidCode: z.string().optional(),
  businessFlow: z.object({
    id: z.string(),
    name: z.string(),
    states: z.array(z.object({
      id: z.string(),
      name: z.string(),
      type: z.enum(['initial', 'intermediate', 'final']),
      description: z.string().optional(),
    })),
    transitions: z.array(z.object({
      id: z.string(),
      fromStateId: z.string(),
      toStateId: z.string(),
      event: z.string(),
      condition: z.string().optional(),
    })),
  }).optional(),
  flowMermaidCode: z.string().optional(),
  createdProjectId: z.string().optional(),
  createdAt: z.string().optional(),
})

type ConfirmationProject = z.infer<typeof ConfirmationProjectSchema>

// In-memory storage (replace with database in production)
const projects: Map<string, ConfirmationProject> = new Map()

// List all confirmation projects
confirmationProjects.get('/', async (c) => {
  const userId = c.req.query('userId')
  
  const allProjects = Array.from(projects.values())
  
  if (userId) {
    // Filter by userId stored in the project
    const userProjects = allProjects.filter(p => p.createdBy === userId)
    return c.json({ projects: userProjects })
  }
  
  return c.json({ projects: allProjects })
})

// Get a single confirmation project
confirmationProjects.get('/:id', async (c) => {
  const id = c.req.param('id')
  const project = projects.get(id)
  
  if (!project) {
    return         c.json(apiError('Project not found', ERROR_CODES.PROJECT_NOT_FOUND), 404)
  }
  
  return c.json(project)
})

// Create a new confirmation project
confirmationProjects.post('/', async (c) => {
  const body = await c.req.json()
  
  const validatedData = ConfirmationProjectSchema.parse(body)
  
  const id = `conf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  
  const newProject: ConfirmationProject = {
    ...validatedData,
    id,
    createdAt: new Date().toISOString(),
  }
  
  projects.set(id, newProject)
  
  return c.json(newProject, 201)
})

// Update a confirmation project
confirmationProjects.put('/:id', async (c) => {
  const id = c.req.param('id')
  const existing = projects.get(id)
  
  if (!existing) {
    return         c.json(apiError('Project not found', ERROR_CODES.PROJECT_NOT_FOUND), 404)
  }
  
  const body = await c.req.json()
  const validatedData = ConfirmationProjectSchema.partial().parse(body)
  
  const updated: ConfirmationProject = {
    ...existing,
    ...validatedData,
    id,
    updatedAt: new Date().toISOString(),
  }
  
  projects.set(id, updated)
  
  return c.json(updated)
})

// Delete a confirmation project
confirmationProjects.delete('/:id', async (c) => {
  const id = c.req.param('id')
  
  if (!projects.has(id)) {
    return         c.json(apiError('Project not found', ERROR_CODES.PROJECT_NOT_FOUND), 404)
  }
  
  projects.delete(id)
  
  return c.json({ success: true })
})

// Convert confirmation project to full project
confirmationProjects.post('/:id/convert-to-project', async (c) => {
  const id = c.req.param('id')
  const confirmation = projects.get(id)
  
  if (!confirmation) {
    return         c.json(apiError('Confirmation project not found', ERROR_CODES.PROJECT_NOT_FOUND), 404)
  }
  
  // In a real implementation, this would:
  // 1. Create a new Project record
  // 2. Save bounded contexts to domain_entities table
  // 3. Save domain models to appropriate tables
  // 4. Save business flow to flows table
  
  const projectId = `proj-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  
  // Update confirmation with created project ID
  confirmation.createdProjectId = projectId
  projects.set(id, confirmation)
  
  return c.json({
    success: true,
    projectId,
    message: 'Confirmation converted to project successfully',
  })
})

export default confirmationProjects
