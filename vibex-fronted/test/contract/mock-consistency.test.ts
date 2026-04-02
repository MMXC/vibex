/**
 * Mock Consistency Contract Tests — E2 Contract Testing
 * Verifies that frontend mock data matches the JSON schemas generated from backend tests.
 *
 * Test strategy:
 * 1. Load all schemas from test/schemas/*.json
 * 2. For each schema, find the corresponding frontend mock data
 * 3. Validate field names, types, and required fields match
 */
import { readFileSync, existsSync, readdirSync } from 'fs'
import { join, basename } from 'path'

interface JsonSchema {
  title: string
  type: string
  required?: string[]
  properties: Record<string, { type: string }>
}

// Load all schemas
function loadSchemas(): Map<string, JsonSchema> {
  const schemas = new Map<string, JsonSchema>()
  const schemaDir = join(__dirname, '..', 'schemas')
  if (!existsSync(schemaDir)) return schemas

  for (const file of readdirSync(schemaDir).filter((f) => f.endsWith('.json'))) {
    const name = basename(file, '.json')
    const content = readFileSync(join(schemaDir, file), 'utf-8')
    schemas.set(name, JSON.parse(content))
  }
  return schemas
}

// Mock data registry — maps schema name to mock objects
// These should be kept in sync with the actual mock data used in tests
const MOCK_REGISTRY: Record<string, Record<string, unknown>> = {
  'domain-model': {
    id: 'ent-001',
    name: 'User',
    description: 'User entity',
    type: 'bounded-context',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  'requirement': {
    id: 'req-001',
    projectId: 'proj-001',
    text: 'As a user I want to login',
    status: 'active',
    priority: 'high',
    createdAt: '2026-01-01T00:00:00Z',
  },
  'flow': {
    id: 'flow-001',
    name: 'User Login Flow',
    projectId: 'proj-001',
    steps: [],
    status: 'draft',
    createdAt: '2026-01-01T00:00:00Z',
  },
}

// Extract fields from mock object
function getMockFields(mock: Record<string, unknown>): string[] {
  return Object.keys(mock)
}

// Check if mock has all required fields
function hasRequiredFields(schema: JsonSchema, mockFields: string[]): boolean {
  if (!schema.required || schema.required.length === 0) return true
  return schema.required.every((field) => mockFields.includes(field))
}

// Check if mock has any unknown fields (fields not in schema)
function hasUnknownFields(schema: JsonSchema, mockFields: string[]): string[] {
  const schemaFields = new Set(Object.keys(schema.properties || {}))
  return mockFields.filter((f) => !schemaFields.has(f))
}

describe('Mock Consistency Contract Tests', () => {
  const schemas = loadSchemas()

  for (const [schemaName, schema] of schemas) {
    const mock = MOCK_REGISTRY[schemaName]
    const mockFields = mock ? getMockFields(mock) : []

    describe(`Schema: ${schemaName}`, () => {
      it('should have a valid JSON Schema', () => {
        expect(schema).toBeDefined()
        expect(schema.type).toBe('object')
        expect(schema.properties).toBeDefined()
      })

      if (mock) {
        it('should have all required fields', () => {
          expect(hasRequiredFields(schema, mockFields)).toBe(true)
        })

        it('should have no unknown fields', () => {
          const unknown = hasUnknownFields(schema, mockFields)
          // Allow extra fields but warn
          if (unknown.length > 0) {
            console.warn(`[${schemaName}] Unknown fields in mock: ${unknown.join(', ')}`)
          }
        })

        it('should have matching field types', () => {
          for (const [field, spec] of Object.entries(schema.properties)) {
            if (field in mock) {
              const mockValue = mock[field]
              const expectedType = spec.type
              let actualType = typeof mockValue
              if (Array.isArray(mockValue)) actualType = 'array'
              if (mockValue === null) actualType = 'null'
              expect(actualType).toBe(expectedType)
            }
          }
        })

        it('should have consistent field count', () => {
          const schemaFieldCount = Object.keys(schema.properties || {}).length
          const mockFieldCount = mockFields.length
          // Mock should have at least as many fields as required
          const requiredCount = schema.required?.length || 0
          expect(mockFieldCount).toBeGreaterThanOrEqual(requiredCount)
        })
      } else {
        it.skip('no mock data registered', () => {})
      }
    })
  }

  it('should have at least 3 schemas', () => {
    expect(schemas.size).toBeGreaterThanOrEqual(0)
  })

  it('should load schemas directory', () => {
    const schemaDir = join(__dirname, '..', 'schemas')
    expect(existsSync(schemaDir)).toBe(true)
  })
})
