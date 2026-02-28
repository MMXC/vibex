import { Hono } from 'hono';
import { queryOne, executeDB, Env } from '@/lib/db';

const agentId = new Hono<{ Bindings: Env }>();

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

// GET /api/agents/:id - Get agent by ID
agentId.get('/', async (c) => {
  try {
    const id = c.req.param('id');
    const env = c.env;

    const agent = await queryOne<AgentRow>(
      env,
      'SELECT * FROM Agent WHERE id = ?',
      [id]
    );

    if (!agent) {
      return c.json({ error: 'Agent not found' }, 404);
    }

    return c.json({ agent });
  } catch (error) {
    console.error('Error fetching agent:', error);
    return c.json({ error: 'Failed to fetch agent' }, 500);
  }
});

// PUT /api/agents/:id - Update agent
agentId.put('/', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const { name, prompt, model, temperature } = body;
    const env = c.env;

    const now = new Date().toISOString();
    const updates: string[] = [];
    const values: (string | number)[] = [];

    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }
    if (prompt !== undefined) {
      updates.push('prompt = ?');
      values.push(prompt);
    }
    if (model !== undefined) {
      updates.push('model = ?');
      values.push(model);
    }
    if (temperature !== undefined) {
      updates.push('temperature = ?');
      values.push(temperature);
    }

    if (updates.length > 0) {
      updates.push('updatedAt = ?');
      values.push(now);
      values.push(id);

      await executeDB(
        env,
        `UPDATE Agent SET ${updates.join(', ')} WHERE id = ?`,
        values
      );
    }

    const agent = await queryOne<AgentRow>(
      env,
      'SELECT * FROM Agent WHERE id = ?',
      [id]
    );

    return c.json({ agent });
  } catch (error) {
    console.error('Error updating agent:', error);
    return c.json({ error: 'Failed to update agent' }, 500);
  }
});

// DELETE /api/agents/:id - Delete agent
agentId.delete('/', async (c) => {
  try {
    const id = c.req.param('id');
    const env = c.env;

    await executeDB(env, 'DELETE FROM Agent WHERE id = ?', [id]);

    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting agent:', error);
    return c.json({ error: 'Failed to delete agent' }, 500);
  }
});

export default agentId;