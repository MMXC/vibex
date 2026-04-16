-- 0007_canvas_project.sql
-- CanvasProject table for storing three-tree data (DDD Canvas)
-- Supports Hono routes (Cloudflare Workers D1) and App Router (Prisma)

CREATE TABLE IF NOT EXISTS CanvasProject (
  id TEXT PRIMARY KEY,
  projectId TEXT NOT NULL,
  name TEXT NOT NULL,
  contextsJson TEXT NOT NULL DEFAULT '[]',
  flowsJson TEXT NOT NULL DEFAULT '[]',
  componentsJson TEXT NOT NULL DEFAULT '[]',
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (projectId) REFERENCES Project(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_canvas_project_projectId ON CanvasProject(projectId);
