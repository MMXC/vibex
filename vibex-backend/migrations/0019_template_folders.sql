-- S87-E5: 模板文件夹管理
-- 用户可创建个人模板文件夹，在 TemplateGallery 中以文件夹维度浏览和组织模板

CREATE TABLE IF NOT EXISTS template_folders (
  folder_id TEXT PRIMARY KEY,
  user_id   TEXT NOT NULL,
  name      TEXT NOT NULL,
  icon      TEXT DEFAULT '📁',
  sort_order INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_template_folders_user_id ON template_folders(user_id);

-- 每个模板可属于一个文件夹
ALTER TABLE templates ADD COLUMN folder_id TEXT REFERENCES template_folders(folder_id) ON DELETE SET NULL;
