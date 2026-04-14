-- Migration: Add DDS (Detailed Design Specification) Canvas Tables
-- Created: 2026-04-15
-- Description: Create tables for DDS Canvas feature - chapters, cards, and edges
-- Tables: dds_chapters, dds_cards, dds_edges

-- ============================================================
-- dds_chapters — A chapter in a DDS Canvas (requirement / context / flow)
-- ============================================================
CREATE TABLE IF NOT EXISTS "dds_chapters" (
    "id"           TEXT NOT NULL PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    "project_id"   TEXT NOT NULL,
    "type"         TEXT NOT NULL CHECK ("type" IN ('requirement', 'context', 'flow')),
    "created_at"   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "dds_chapters_project_id_idx" ON "dds_chapters"("project_id");
CREATE INDEX IF NOT EXISTS "dds_chapters_type_idx" ON "dds_chapters"("type");

-- ============================================================
-- dds_cards — A card inside a chapter (UI node: requirement/context/flow)
-- ============================================================
CREATE TABLE IF NOT EXISTS "dds_cards" (
    "id"           TEXT NOT NULL PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    "chapter_id"   TEXT NOT NULL,
    "type"         TEXT NOT NULL CHECK ("type" IN ('requirement', 'context', 'flow')),
    "title"        TEXT NOT NULL,
    "data"         TEXT NOT NULL DEFAULT '{}',
    "position_x"   REAL NOT NULL DEFAULT 0,
    "position_y"   REAL NOT NULL DEFAULT 0,
    "created_at"   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "dds_cards_chapter_id_fkey"
        FOREIGN KEY ("chapter_id") REFERENCES "dds_chapters"("id")
        ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "dds_cards_chapter_id_idx" ON "dds_cards"("chapter_id");
CREATE INDEX IF NOT EXISTS "dds_cards_type_idx" ON "dds_cards"("type");

-- ============================================================
-- dds_edges — Directed edge between two cards (upstream/downstream/association)
-- ============================================================
CREATE TABLE IF NOT EXISTS "dds_edges" (
    "id"           TEXT NOT NULL PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    "chapter_id"   TEXT NOT NULL,
    "source_id"    TEXT NOT NULL,
    "target_id"    TEXT NOT NULL,
    "type"         TEXT NOT NULL DEFAULT 'smoothstep',
    "created_at"   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "dds_edges_chapter_id_fkey"
        FOREIGN KEY ("chapter_id") REFERENCES "dds_chapters"("id")
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "dds_edges_source_id_fkey"
        FOREIGN KEY ("source_id") REFERENCES "dds_cards"("id")
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "dds_edges_target_id_fkey"
        FOREIGN KEY ("target_id") REFERENCES "dds_cards"("id")
        ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "dds_edges_chapter_id_idx" ON "dds_edges"("chapter_id");
CREATE INDEX IF NOT EXISTS "dds_edges_source_id_idx" ON "dds_edges"("source_id");
CREATE INDEX IF NOT EXISTS "dds_edges_target_id_idx" ON "dds_edges"("target_id");
