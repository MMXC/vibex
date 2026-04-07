-- Migration: Add Requirement and related tables for Clarification API
-- D1 SQLite (Prisma-compatible)
-- Run: wrangler d1 execute <name> --file=./migrations/002_requirement_tables.sql

-- ── Requirement ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "Requirement" (
    "id"           TEXT NOT NULL PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    "projectId"    TEXT NOT NULL,
    "rawInput"     TEXT NOT NULL DEFAULT '',
    "parsedData"   TEXT,
    "status"       TEXT NOT NULL DEFAULT 'draft',
    "priority"     TEXT NOT NULL DEFAULT 'medium',
    "createdAt"    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    DATETIME NOT NULL,
    CONSTRAINT "Requirement_projectId_fkey"
        FOREIGN KEY ("projectId") REFERENCES "Project"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "Requirement_projectId_idx" ON "Requirement"("projectId");

-- ── DomainEntity ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "DomainEntity" (
    "id"            TEXT NOT NULL PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    "requirementId" TEXT NOT NULL,
    "name"          TEXT NOT NULL,
    "type"          TEXT NOT NULL,
    "description"   TEXT,
    "properties"    TEXT,
    "createdAt"    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    DATETIME NOT NULL,
    CONSTRAINT "DomainEntity_requirementId_fkey"
        FOREIGN KEY ("requirementId") REFERENCES "Requirement"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "DomainEntity_requirementId_idx" ON "DomainEntity"("requirementId");

-- ── EntityRelation ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "EntityRelation" (
    "id"            TEXT NOT NULL PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    "fromEntityId"  TEXT NOT NULL,
    "toEntityId"    TEXT NOT NULL,
    "relationType"  TEXT NOT NULL,
    "description"   TEXT,
    "createdAt"     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EntityRelation_fromEntityId_fkey"
        FOREIGN KEY ("fromEntityId") REFERENCES "DomainEntity"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "EntityRelation_toEntityId_fkey"
        FOREIGN KEY ("toEntityId") REFERENCES "DomainEntity"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "EntityRelation_fromEntityId_idx" ON "EntityRelation"("fromEntityId");
CREATE INDEX IF NOT EXISTS "EntityRelation_toEntityId_idx" ON "EntityRelation"("toEntityId");

-- ── ClarificationQuestion ────────────────────────────────────────────────────
-- This is what clarification-questions.ts actually uses
CREATE TABLE IF NOT EXISTS "ClarificationQuestion" (
    "id"            TEXT NOT NULL PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    "requirementId" TEXT NOT NULL,
    "question"      TEXT NOT NULL,
    "answer"       TEXT,
    "status"       TEXT NOT NULL DEFAULT 'pending',
    "priority"      TEXT NOT NULL DEFAULT 'medium',
    "createdAt"    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    DATETIME NOT NULL,
    CONSTRAINT "ClarificationQuestion_requirementId_fkey"
        FOREIGN KEY ("requirementId") REFERENCES "Requirement"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "ClarificationQuestion_requirementId_idx"
    ON "ClarificationQuestion"("requirementId");
CREATE INDEX IF NOT EXISTS "ClarificationQuestion_status_idx"
    ON "ClarificationQuestion"("status");
