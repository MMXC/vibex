-- Migration: 0025_template_versions
-- Sprint93 E2: Template Versioning & Fork
-- Stores versioned snapshots of template changes and fork lineage

-- template_versions: stores each versioned snapshot of a template
CREATE TABLE IF NOT EXISTS template_versions (
    id TEXT PRIMARY KEY,
    template_id TEXT NOT NULL,
    version_number INTEGER NOT NULL,
    description TEXT,
    -- snapshot of template content at this version (JSON blob)
    snapshot_json TEXT,
    -- whether downstream canvases are pinned to this version
    pinned INTEGER NOT NULL DEFAULT 0,
    -- user who created this version
    created_by TEXT NOT NULL,
    created_at INTEGER NOT NULL
);

-- Fork lineage: which template this was forked from (if any)
ALTER TABLE templates ADD COLUMN forked_from_id TEXT;

-- Index for looking up versions by template (fast history load)
CREATE INDEX IF NOT EXISTS idx_template_versions_template_id
    ON template_versions(template_id, version_number DESC);

-- Index for pinned version lookup
CREATE INDEX IF NOT EXISTS idx_template_versions_pinned
    ON template_versions(template_id, pinned);

-- Index for forked templates (find all forks of a template)
CREATE INDEX IF NOT EXISTS idx_templates_forked_from
    ON templates(forked_from_id);
