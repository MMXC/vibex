/**
 * Diagnosis API Routes
 * 
 * Endpoints:
 * - POST /api/diagnosis/analyze - Analyze requirement quality
 * - POST /api/diagnosis/optimize - One-click optimize
 * 
 * @module routes/diagnosis
 */

import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { safeError } from '@/lib/log-sanitizer';

import {
  requirementDiagnoser,
  requirementOptimizer,
  AnalyzeRequest,
  AnalyzeResponse,
  OptimizeRequest,
  OptimizeResponse,
} from '../services/diagnosis'

const diagnosis = new Hono()

// Apply CORS
diagnosis.use('/*', cors())

/**
 * POST /api/diagnosis/analyze
 * Analyze requirement quality
 */
diagnosis.post('/analyze', async (c) => {
  try {
    const body = await c.req.json() as AnalyzeRequest
    
    if (!body.requirementText || body.requirementText.trim().length === 0) {
      const response: AnalyzeResponse = {
        success: false,
        error: 'requirementText is required',
        cached: false,
      }
      return c.json(response, 400)
    }

    const enableCache = body.options?.enableCache ?? true
    
    const result = await requirementDiagnoser.diagnose(
      body.requirementText,
      enableCache
    )

    const response: AnalyzeResponse = {
      success: true,
      result,
      cached: false, // TODO: Add actual cache detection
    }

    return c.json(response)
  } catch (error) {
    safeError('Diagnosis error:', error)
    
    const response: AnalyzeResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      cached: false,
    }
    
    return c.json(response, 500)
  }
})

/**
 * POST /api/diagnosis/optimize
 * One-click optimize requirement
 */
diagnosis.post('/optimize', async (c) => {
  try {
    const body = await c.req.json() as OptimizeRequest
    
    if (!body.requirementText || body.requirementText.trim().length === 0) {
      const response: OptimizeResponse = {
        success: false,
        error: 'requirementText is required',
      }
      return c.json(response, 400)
    }

    if (!body.diagnosis) {
      const response: OptimizeResponse = {
        success: false,
        error: 'diagnosis is required',
      }
      return c.json(response, 400)
    }

    const optimizedText = await requirementOptimizer.optimize(
      body.requirementText,
      body.diagnosis
    )

    const diff = requirementOptimizer.generateDiff(
      body.requirementText,
      optimizedText
    )

    const response: OptimizeResponse = {
      success: true,
      optimizedText,
      diff,
    }

    return c.json(response)
  } catch (error) {
    safeError('Optimization error:', error)
    
    const response: OptimizeResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
    
    return c.json(response, 500)
  }
})

/**
 * GET /api/diagnosis/health
 * Health check
 */
diagnosis.get('/health', (c) => {
  return c.json({ status: 'ok', service: 'diagnosis' })
})

export default diagnosis
