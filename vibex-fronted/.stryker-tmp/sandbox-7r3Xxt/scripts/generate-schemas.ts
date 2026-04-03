/**
 * Schema Generation Script — E2 Contract Testing
 * Scans backend route tests to extract response structures,
 * then generates JSON Schema files for frontend mock validation.
 *
 * Usage: npx tsx scripts/generate-schemas.ts <api-name>
 *   e.g.: npx tsx scripts/generate-schemas.ts domain-model
 */
// @ts-nocheck

import { readFileSync, writeFileSync, readdirSync } from 'fs'
import { join, basename } from 'path'

interface SchemaField {
  name: string
  type: string
  required: boolean
}

function extractFieldsFromTest(testContent: string): SchemaField[] {
  const fields: SchemaField[] = []
  // Match patterns like: expect(res.data).toHaveProperty('id')
  const propMatches = testContent.matchAll(/toHaveProperty\(["']([^"']+)["']\)/g)
  for (const m of propMatches) {
    fields.push({ name: m[1], type: 'any', required: true })
  }
  // Match patterns like: expect(res.data.xxx).toBeString() / .toBeNumber() etc.
  const typeMatches = testContent.matchAll(/\.toBe(String|Number|Boolean|Array|Object|Null|Undefined)\(\)/g)
  for (const m of typeMatches) {
    // Extract the field name from the chain
    const line = m.input.substring(0, m.index! + m[0].length)
    const fieldMatch = line.match(/\.(\w+)\)\.toBe/)
    if (fieldMatch) {
      const existing = fields.find((f) => f.name === fieldMatch[1])
      if (existing) {
        existing.type = m[1].toLowerCase()
      }
    }
  }
  return fields
}

function generateSchema(apiName: string, fields: SchemaField[]) {
  const requiredFields = fields.filter((f) => f.required).map((f) => f.name)
  const properties: Record<string, { type: string }> = {}
  for (const f of fields) {
    properties[f.name] = { type: f.type }
  }
  return {
    $schema: 'http://json-schema.org/draft-07/schema#',
    title: apiName,
    type: 'object',
    required: requiredFields.length > 0 ? requiredFields : undefined,
    properties,
    additionalProperties: true,
  }
}

function scanBackendTests(apiName: string): SchemaField[] {
  const backendTestsDir = join(process.cwd(), 'vibex-backend', 'src', 'routes', '__tests__')
  const fields: SchemaField[] = []

  try {
    const files = readdirSync(backendTestsDir).filter((f) => f.endsWith('.ts'))
    for (const file of files) {
      const content = readFileSync(join(backendTestsDir, file), 'utf-8')
      fields.push(...extractFieldsFromTest(content))
    }
  } catch {
    console.warn(`No backend tests found at ${backendTestsDir}`)
  }

  // Dedupe
  const seen = new Set<string>()
  return fields.filter((f) => {
    if (seen.has(f.name)) return false
    seen.add(f.name)
    return true
  })
}

async function main() {
  const apiName = process.argv[2] || 'domain-model'
  const outputDir = join(process.cwd(), 'vibex-fronted', 'test', 'schemas')
  const outputPath = join(outputDir, `${apiName}.json`)

  console.log(`Generating schema for: ${apiName}`)
  const fields = scanBackendTests(apiName)
  console.log(`Found ${fields.length} fields`)

  const schema = generateSchema(apiName, fields)
  writeFileSync(outputPath, JSON.stringify(schema, null, 2))
  console.log(`Schema written to: ${outputPath}`)
}

main().catch(console.error)
