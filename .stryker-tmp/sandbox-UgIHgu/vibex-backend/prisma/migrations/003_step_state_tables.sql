-- Migration: Add Simplified Flow tables
-- Created: 2026-03-23
-- Description: StepState, ChangeLog, BusinessDomain, UINode tables + Project extensions

-- Add columns to Project (SQLite doesn't support ADD COLUMN for some things, using table recreation)
-- For existing projects, these columns will be added with defaults:
--   status = 'draft', version = 1, isTemplate = false, parentDraftId = NULL

-- StepState table
CREATE TABLE IF NOT EXISTS "StepState" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL UNIQUE,
    "currentStep" INTEGER NOT NULL DEFAULT 1,
    "version" INTEGER NOT NULL DEFAULT 1,
    "step1Data" TEXT,
    "step2Data" TEXT,
    "step3Data" TEXT,
    "lastModifiedBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StepState_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "StepState_projectId_key" ON "StepState"("projectId");

-- ChangeLog table
CREATE TABLE IF NOT EXISTS "ChangeLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "source" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "before" TEXT,
    "after" TEXT,
    "userId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ChangeLog_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "ChangeLog_projectId_version_idx" ON "ChangeLog"("projectId", "version");

-- BusinessDomain table
CREATE TABLE IF NOT EXISTS "BusinessDomain" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "domainType" TEXT NOT NULL DEFAULT 'supporting',
    "features" TEXT NOT NULL DEFAULT '[]',
    "relationships" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BusinessDomain_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "BusinessDomain_projectId_idx" ON "BusinessDomain"("projectId");

-- UINode table
CREATE TABLE IF NOT EXISTS "UINode" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nodeType" TEXT NOT NULL,
    "description" TEXT,
    "linkedFlowNodeId" TEXT,
    "children" TEXT NOT NULL DEFAULT '[]',
    "annotations" TEXT NOT NULL DEFAULT '[]',
    "positionX" REAL,
    "positionY" REAL,
    "checked" INTEGER NOT NULL DEFAULT 0,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UINode_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "UINode_projectId_idx" ON "UINode"("projectId");
