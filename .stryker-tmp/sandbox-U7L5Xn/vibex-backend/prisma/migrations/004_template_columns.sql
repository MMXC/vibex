-- Migration: Add Template Market Columns
-- Created: 2026-03-23
-- Description: Add isPublic, usageCount, thumbnail columns to Project table for template market

-- Add isPublic, usageCount, thumbnail to Project (SQLite table recreation)
-- SQLite doesn't support ADD COLUMN for NOT NULL columns without defaults reliably

-- Step 1: Create new table with additional columns
CREATE TABLE IF NOT EXISTS "_Project_new" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "userId" TEXT NOT NULL,
    "deletedAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "version" INTEGER NOT NULL DEFAULT 1,
    "isTemplate" INTEGER NOT NULL DEFAULT 0,
    "parentDraftId" TEXT,
    "isPublic" INTEGER NOT NULL DEFAULT 0,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "thumbnail" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Step 2: Copy data from old table
INSERT INTO "_Project_new" ("id", "name", "description", "userId", "deletedAt", "status", "version", "isTemplate", "parentDraftId", "createdAt", "updatedAt")
SELECT "id", "name", "description", "userId", "deletedAt", "status", "version", "isTemplate", "parentDraftId", "createdAt", "updatedAt"
FROM "Project";

-- Step 3: Drop old table
DROP TABLE "Project";

-- Step 4: Rename new table
ALTER TABLE "_Project_new" RENAME TO "Project";

-- Step 5: Recreate indexes
CREATE INDEX IF NOT EXISTS "Project_userId_idx" ON "Project"("userId");
CREATE INDEX IF NOT EXISTS "Project_deletedAt_idx" ON "Project"("deletedAt");
CREATE INDEX IF NOT EXISTS "Project_isTemplate_idx" ON "Project"("isTemplate");
CREATE INDEX IF NOT EXISTS "Project_status_idx" ON "Project"("status");
