/**
 * Import Route - E8 Import/Export
 * POST /api/v1/projects/import - Import DDD data from JSON or YAML
 */

import { Hono } from 'hono';
import { apiError, ERROR_CODES } from '@/lib/api-error';
import { parseJSON } from '@/lib/importers/json-importer';
import { parseYAML } from '@/lib/importers/yaml-importer';
import { safeError } from '@/lib/log-sanitizer';

const MAX_SIZE = 5 * 1024 * 1024; // 5MB

const import_ = new Hono();

import_.post('/', async (c) => {
  try {
    const contentType = c.req.header('content-type') || '';
    const body = await c.req.text();
    
    // SSRF protection: reject external URLs
    if (body.includes('http://') || body.includes('https://')) {
      return c.json(apiError('External URLs are not allowed', ERROR_CODES.BAD_REQUEST), 400);
    }
    
    // Size limit
    if (body.length > MAX_SIZE) {
      return c.json(apiError('File exceeds 5MB limit', ERROR_CODES.BAD_REQUEST), 400);
    }
    
    let data;
    if (contentType.includes('json')) {
      data = parseJSON(body);
    } else if (contentType.includes('yaml') || contentType.includes('yml')) {
      data = parseYAML(body);
    } else {
      return c.json(apiError('Unsupported content type. Use application/json or application/yaml', ERROR_CODES.BAD_REQUEST), 400);
    }
    
    return c.json({ success: true, data }, 200);
  } catch (err) {
    safeError('[import] error:', err);
    if (err instanceof SyntaxError) {
      return c.json(apiError('Invalid JSON/YAML syntax', ERROR_CODES.BAD_REQUEST), 400);
    }
    if (err instanceof Error && err.message.includes('required')) {
      return c.json(apiError(err.message, ERROR_CODES.BAD_REQUEST), 400);
    }
    return c.json(apiError('Import failed', ERROR_CODES.INTERNAL_ERROR), 500);
  }
});

export default import_;
