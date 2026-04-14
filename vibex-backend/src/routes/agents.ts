/**
 * @deprecated This router uses the legacy Page Router API. 
 * All routes have been migrated to Next.js App Router (app/api/). 
 * See: docs/migration/page-router-to-app-router.md 
 * This file will be removed after E1 security fixes are complete. 
 */
import { Hono } from 'hono';

import { queryDB, queryOne, executeDB, generateId, Env } from '@/lib/db';

import { safeError } from '@/lib/log-sanitizer';
import { apiError, ERROR_CODES } from '@/lib/api-error';

const agents = new Hono<{ Bindings: Env }>();

interface AgentRow {
  id: string;
  name: string;
  prompt: string;
  model: string;
  temperature: number;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

// GET /api/agents - List agents by user
agents.get('/', async (c) => {
  try {
    const userId = c.req.query('userId');
    const env = c.env;

    let sql = 'SELECT * FROM Agent';
    const params: string[] = [];

    if (userId) {
      sql += ' WHERE userId = ?';
      params.push(userId);
    }
    sql += ' ORDER BY createdAt DESC';

    const agentsList = await queryDB<AgentRow>(env, sql, params);

    return c.json({ agents: agentsList });
  } catch (error) {
    safeError('Error fetching agents:', error);
    return         c.json(apiError('Failed to fetch agents', ERROR_CODES.INTERNAL_ERROR), 500);
  }
});

// POST /api/agents - Create a new agent
agents.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const { name, prompt, model, temperature, userId } = body;

    if (!name || !prompt || !userId) {
      return         c.json(apiError('Missing required fields: name, prompt, userId', ERROR_CODES.BAD_REQUEST), 400);
    }

    const env = c.env;
    const agentId = generateId();
    const now = new Date().toISOString();

    await executeDB(
      env,
      'INSERT INTO Agent (id, name, prompt, model, temperature, userId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [agentId, name, prompt, model || 'abab6.5s-chat', temperature || 0.7, userId, now, now]
    );

    const agent = await queryOne<AgentRow>(
      env,
      'SELECT * FROM Agent WHERE id = ?',
      [agentId]
    );

    return c.json({ agent }, 201);
  } catch (error) {
    safeError('Error creating agent:', error);
    return         c.json(apiError('Failed to create agent', ERROR_CODES.INTERNAL_ERROR), 500);
  }
});

export default agents;