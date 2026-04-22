/**
 * Export Route - E8 Import/Export
 * GET /api/v1/projects/export - Export DDD data to JSON or YAML
 */

import { Hono } from 'hono';
import { apiError, ERROR_CODES } from '@/lib/api-error';
import { exportJSON } from '@/lib/exporters/json-exporter';
import { exportYAML } from '@/lib/exporters/yaml-exporter';
import type { DDDImportData } from '@/lib/importers/json-importer';

const export_ = new Hono();

export_.get('/', async (c) => {
  try {
    const format = c.req.query('format') || 'json';
    const data: DDDImportData = {
      boundedContexts: [],
      flows: [],
      components: [],
    };
    
    let content: string;
    if (format === 'json') {
      content = exportJSON(data);
      return c.json({ success: true, data: JSON.parse(content) });
    } else if (format === 'yaml') {
      content = exportYAML(data);
      return c.text(content);
    } else {
      return c.json(apiError('Unsupported format. Use json or yaml', ERROR_CODES.BAD_REQUEST), 400);
    }
  } catch (err) {
    return c.json(apiError('Export failed', ERROR_CODES.INTERNAL_ERROR), 500);
  }
});

export default export_;
