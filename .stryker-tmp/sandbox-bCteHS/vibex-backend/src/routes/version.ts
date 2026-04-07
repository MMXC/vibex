// @ts-nocheck
import { Hono } from 'hono'
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
