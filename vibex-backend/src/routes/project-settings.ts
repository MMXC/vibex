import { Hono } from 'hono';
import { queryOne, executeDB, Env, generateId } from '@/lib/db';

const projectSettings = new Hono<{ Bindings: Env }>();

interface ProjectSettingsRow {
  id: string;
  projectId: string;
  key: string;
  value: string;
  userId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ProjectRow {
  id: string;
  name: string;
  description: string | null;
  userId: string;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// Default project settings schema
type ProjectSettingsType = {
  theme: string;
  language: string;
  autoSave: boolean;
  autoSaveInterval: number;
  showGrid: boolean;
  snapToGrid: boolean;
  gridSize: number;
  zoomLevel: number;
  showRuler: boolean;
  aiModel: string;
  aiTemperature: number;
};

const defaultProjectSettings: ProjectSettingsType = {
  theme: 'light',
  language: 'zh-CN',
  autoSave: true,
  autoSaveInterval: 30000,
  showGrid: true,
  snapToGrid: true,
  gridSize: 8,
  zoomLevel: 1,
  showRuler: false,
  aiModel: 'abab6.5s-chat',
  aiTemperature: 0.7,
};

// Default user preferences
type UserPreferencesType = {
  sidebarCollapsed: boolean;
  activePanel: string;
  recentColors: string[];
  favoriteComponents: string[];
  recentProjects: string[];
  notifications: {
    email: boolean;
    inApp: boolean;
    prototypeShares: boolean;
    comments: boolean;
  };
  editor: {
    fontSize: number;
    tabSize: number;
    wordWrap: boolean;
    minimap: boolean;
  };
};

const defaultUserPreferences: UserPreferencesType = {
  sidebarCollapsed: false,
  activePanel: 'design',
  recentColors: [],
  favoriteComponents: [],
  recentProjects: [],
  notifications: {
    email: true,
    inApp: true,
    prototypeShares: true,
    comments: true,
  },
  editor: {
    fontSize: 14,
    tabSize: 2,
    wordWrap: true,
    minimap: true,
  },
};

// GET /api/projects/:id/settings - Get project settings
projectSettings.get('/', async (c) => {
  try {
    const projectId = c.req.param('id');
    const env = c.env;

    // Get project first to verify it exists
    const project = await queryOne<ProjectRow>(
      env,
      'SELECT * FROM Project WHERE id = ?',
      [projectId]
    );

    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    // Get all settings for this project
    const settings = await queryDB<ProjectSettingsRow>(
      env,
      'SELECT * FROM ProjectSettings WHERE projectId = ?',
      [projectId]
    );

    // Merge with defaults
    const mergedSettings: ProjectSettingsType = { ...defaultProjectSettings };
    for (const setting of settings) {
      if (setting.userId === null && setting.key in defaultProjectSettings) {
        try {
          (mergedSettings as any)[setting.key] = JSON.parse(setting.value);
        } catch {
          (mergedSettings as any)[setting.key] = setting.value;
        }
      }
    }

    return c.json({ settings: mergedSettings });
  } catch (error) {
    console.error('Error fetching project settings:', error);
    return c.json({ error: 'Failed to fetch project settings' }, 500);
  }
});

// PUT /api/projects/:id/settings - Update project settings
projectSettings.put('/', async (c) => {
  try {
    const projectId = c.req.param('id');
    const body = await c.req.json();
    const env = c.env;

    // Verify project exists
    const project = await queryOne<ProjectRow>(
      env,
      'SELECT * FROM Project WHERE id = ?',
      [projectId]
    );

    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    const updates = [];
    const now = new Date().toISOString();

    // Process each setting
    for (const [key, value] of Object.entries(body)) {
      if (key in defaultProjectSettings) {
        const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
        
        // Check if setting exists
        const existingSetting = await queryOne<ProjectSettingsRow>(
          env,
          'SELECT * FROM ProjectSettings WHERE projectId = ? AND `key` = ? AND userId IS NULL',
          [projectId, key]
        );

        if (existingSetting) {
          // Update existing setting
          await executeDB(
            env,
            'UPDATE ProjectSettings SET value = ?, updatedAt = ? WHERE id = ?',
            [stringValue, now, existingSetting.id]
          );
        } else {
          // Insert new setting
          const newId = generateId();
          await executeDB(
            env,
            'INSERT INTO ProjectSettings (id, projectId, `key`, value, userId, createdAt, updatedAt) VALUES (?, ?, ?, ?, NULL, ?, ?)',
            [newId, projectId, key, stringValue, now, now]
          );
        }
        updates.push(key);
      }
    }

    // Fetch updated settings
    const settings = await queryDB<ProjectSettingsRow>(
      env,
      'SELECT * FROM ProjectSettings WHERE projectId = ?',
      [projectId]
    );

    const mergedSettings: ProjectSettingsType = { ...defaultProjectSettings };
    for (const setting of settings) {
      if (setting.userId === null && setting.key in defaultProjectSettings) {
        try {
          (mergedSettings as any)[setting.key] = JSON.parse(setting.value);
        } catch {
          (mergedSettings as any)[setting.key] = setting.value;
        }
      }
    }

    return c.json({ settings: mergedSettings, updated: updates });
  } catch (error) {
    console.error('Error updating project settings:', error);
    return c.json({ error: 'Failed to update project settings' }, 500);
  }
});

// GET /api/projects/:id/settings/preferences - Get user preferences
projectSettings.get('/preferences', async (c) => {
  try {
    const projectId = c.req.param('id');
    const userId = c.req.query('userId');
    const env = c.env;

    // Verify project exists
    const project = await queryOne<ProjectRow>(
      env,
      'SELECT * FROM Project WHERE id = ?',
      [projectId]
    );

    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    // Get user-specific preferences
    const preferences = await queryDB<ProjectSettingsRow>(
      env,
      'SELECT * FROM ProjectSettings WHERE projectId = ? AND userId = ?',
      [projectId, userId]
    );

    // Merge with defaults
    const mergedPrefs: UserPreferencesType = { ...defaultUserPreferences };
    for (const pref of preferences) {
      if (pref.key in defaultUserPreferences) {
        try {
          (mergedPrefs as any)[pref.key] = JSON.parse(pref.value);
        } catch {
          (mergedPrefs as any)[pref.key] = pref.value;
        }
      }
    }

    return c.json({ preferences: mergedPrefs });
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    return c.json({ error: 'Failed to fetch user preferences' }, 500);
  }
});

// PUT /api/projects/:id/settings/preferences - Update user preferences
projectSettings.put('/preferences', async (c) => {
  try {
    const projectId = c.req.param('id');
    const body = await c.req.json();
    const userId = body.userId;
    const env = c.env;

    if (!userId) {
      return c.json({ error: 'User ID required' }, 400);
    }

    // Verify project exists
    const project = await queryOne<ProjectRow>(
      env,
      'SELECT * FROM Project WHERE id = ?',
      [projectId]
    );

    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    const updates = [];
    const now = new Date().toISOString();

    // Process each preference
    for (const [key, value] of Object.entries(body)) {
      if (key in defaultUserPreferences) {
        const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
        
        // Check if preference exists
        const existingPref = await queryOne<ProjectSettingsRow>(
          env,
          'SELECT * FROM ProjectSettings WHERE projectId = ? AND `key` = ? AND userId = ?',
          [projectId, key, userId]
        );

        if (existingPref) {
          // Update existing preference
          await executeDB(
            env,
            'UPDATE ProjectSettings SET value = ?, updatedAt = ? WHERE id = ?',
            [stringValue, now, existingPref.id]
          );
        } else {
          // Insert new preference
          const newId = generateId();
          await executeDB(
            env,
            'INSERT INTO ProjectSettings (id, projectId, `key`, value, userId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [newId, projectId, key, stringValue, userId, now, now]
          );
        }
        updates.push(key);
      }
    }

    // Fetch updated preferences
    const preferences = await queryDB<ProjectSettingsRow>(
      env,
      'SELECT * FROM ProjectSettings WHERE projectId = ? AND userId = ?',
      [projectId, userId]
    );

    const mergedPrefs: UserPreferencesType = { ...defaultUserPreferences };
    for (const pref of preferences) {
      if (pref.key in defaultUserPreferences) {
        try {
          (mergedPrefs as any)[pref.key] = JSON.parse(pref.value);
        } catch {
          (mergedPrefs as any)[pref.key] = pref.value;
        }
      }
    }

    return c.json({ preferences: mergedPrefs, updated: updates });
  } catch (error) {
    console.error('Error updating user preferences:', error);
    return c.json({ error: 'Failed to update user preferences' }, 500);
  }
});

// DELETE /api/projects/:id/settings/:key - Delete a specific setting
projectSettings.delete('/:key', async (c) => {
  try {
    const projectId = c.req.param('id');
    const key = c.req.param('key');
    const userId = c.req.query('userId') || null;
    const env = c.env;

    // Verify project exists
    const project = await queryOne<ProjectRow>(
      env,
      'SELECT * FROM Project WHERE id = ?',
      [projectId]
    );

    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    if (userId) {
      await executeDB(
        env,
        'DELETE FROM ProjectSettings WHERE projectId = ? AND `key` = ? AND userId = ?',
        [projectId, key, userId]
      );
    } else {
      await executeDB(
        env,
        'DELETE FROM ProjectSettings WHERE projectId = ? AND `key` = ? AND userId IS NULL',
        [projectId, key]
      );
    }

    return c.json({ success: true, deleted: key });
  } catch (error) {
    console.error('Error deleting setting:', error);
    return c.json({ error: 'Failed to delete setting' }, 500);
  }
});

// POST /api/projects/:id/settings/reset - Reset settings to defaults
projectSettings.post('/reset', async (c) => {
  try {
    const projectId = c.req.param('id');
    const body = await c.req.json();
    const userId = body.userId || null;
    const type = body.type || 'all'; // 'all', 'settings', 'preferences'
    const env = c.env;

    // Verify project exists
    const project = await queryOne<ProjectRow>(
      env,
      'SELECT * FROM Project WHERE id = ?',
      [projectId]
    );

    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    if (type === 'all' || type === 'settings') {
      // Delete all project settings (non-user-specific)
      await executeDB(
        env,
        'DELETE FROM ProjectSettings WHERE projectId = ? AND userId IS NULL',
        [projectId]
      );
    }

    if (type === 'all' || type === 'preferences') {
      // Delete all user preferences for this project
      if (userId) {
        await executeDB(
          env,
          'DELETE FROM ProjectSettings WHERE projectId = ? AND userId = ?',
          [projectId, userId]
        );
      }
    }

    return c.json({ 
      success: true, 
      reset: type,
      defaults: {
        settings: defaultProjectSettings,
        preferences: defaultUserPreferences,
      }
    });
  } catch (error) {
    console.error('Error resetting settings:', error);
    return c.json({ error: 'Failed to reset settings' }, 500);
  }
});

// Helper function to query DB (since it's not exported from db.ts)
async function queryDB<T = unknown>(
  env: Env | undefined,
  sql: string,
  params: unknown[] = []
): Promise<T[]> {
  if (env?.DB) {
    const stmt = env.DB.prepare(sql).bind(...params);
    const result = await stmt.all<T>();
    return result.results;
  } else {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    try {
      const result = await prisma.$queryRawUnsafe<T[]>(sql, ...params);
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error('Prisma query error:', error);
      throw error;
    } finally {
      await prisma.$disconnect();
    }
  }
}

export default projectSettings;
