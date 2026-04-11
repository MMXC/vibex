/**
 * @deprecated This router uses the legacy Page Router API. 
 * All routes have been migrated to Next.js App Router (app/api/). 
 * See: docs/migration/page-router-to-app-router.md 
 * This file will be removed after E1 security fixes are complete. 
 */
import { cors } from 'hono/cors'

const app = new Hono()

// CORS middleware
app.use('/*', cors())

// Version endpoint
app.get('/', (c) => {
  const version = process.env.VERSION || process.env.npm_package_version || '1.0.0'
  const commit = process.env.COMMIT_HASH || 'unknown'
  const timestamp = new Date().toISOString()
  
  return c.json({
    version,
    commit,
    timestamp,
  })
})

export default app
