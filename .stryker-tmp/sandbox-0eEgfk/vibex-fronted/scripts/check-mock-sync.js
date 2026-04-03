/**
 * Check Mock Sync — E2 Contract Testing
 *
 * Detects if JSON schemas were updated but frontend mocks were not.
 * This script should run in CI when test/schemas/*.json changes.
 *
 * Usage: node scripts/check-mock-sync.js
 */
// @ts-nocheck

import { readFileSync, readdirSync, existsSync } from 'fs'
import { join, basename } from 'path'

// Mock data registry — must stay in sync with test/contract/mock-consistency.test.ts
const MOCK_FIELDS: Record<string, string[]> = {
  'domain-model': ['id', 'name', 'description', 'type', 'createdAt', 'updatedAt'],
  'requirement': ['id', 'projectId', 'text', 'status', 'priority', 'createdAt'],
  'flow': ['id', 'name', 'projectId', 'steps', 'status', 'createdAt'],
}

interface JsonSchema {
  title: string
  required?: string[]
  properties: Record<string, unknown>
}

function checkSync(): { synced: boolean; issues: string[] } {
  const schemaDir = join(process.cwd(), 'vibex-fronted', 'test', 'schemas')
  const issues: string[] = []

  if (!existsSync(schemaDir)) {
    console.log('No schemas directory found — skipping sync check')
    return { synced: true, issues: [] }
  }

  for (const file of readdirSync(schemaDir).filter((f) => f.endsWith('.json'))) {
    const name = basename(file, '.json')
    const content = readFileSync(join(schemaDir, file), 'utf-8')
    const schema: JsonSchema = JSON.parse(content)

    const mockFields = MOCK_FIELDS[name] || []
    const schemaFields = Object.keys(schema.properties || {})

    // Check required fields
    if (schema.required) {
      for (const required of schema.required) {
        if (!mockFields.includes(required)) {
          issues.push(
            `[${name}] Schema requires field "${required}" but mock does not have it`
          )
        }
      }
    }

    // Check for extra fields in mock not in schema
    const extra = mockFields.filter((f) => !schemaFields.includes(f))
    if (extra.length > 0) {
      issues.push(`[${name}] Mock has extra fields not in schema: ${extra.join(', ')}`)
    }
  }

  return { synced: issues.length === 0, issues }
}

const { synced, issues } = checkSync()

if (!synced) {
  console.error('Mock sync issues detected:')
  for (const issue of issues) {
    console.error(`  - ${issue}`)
  }
  process.exit(1)
} else {
  console.log('Mock sync check passed')
  process.exit(0)
}
