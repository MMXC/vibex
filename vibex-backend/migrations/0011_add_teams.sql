-- E6: Teams API — D1 Migration
-- Creates teams and team_members tables with role-based access control

-- ============================================
-- Teams table
-- ============================================
CREATE TABLE IF NOT EXISTS Team (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  ownerId TEXT NOT NULL,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_team_owner ON Team(ownerId);

-- ============================================
-- Team Members table
-- ============================================
CREATE TABLE IF NOT EXISTS TeamMember (
  id TEXT PRIMARY KEY,
  teamId TEXT NOT NULL,
  userId TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',  -- 'owner' | 'admin' | 'member'
  invitedBy TEXT,
  joinedAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (teamId) REFERENCES Team(id) ON DELETE CASCADE,
  UNIQUE(teamId, userId)
);

CREATE INDEX IF NOT EXISTS idx_team_member_team ON TeamMember(teamId);
CREATE INDEX IF NOT EXISTS idx_team_member_user ON TeamMember(userId);

-- ============================================
-- Team Invite tokens (optional: for invite links)
-- ============================================
CREATE TABLE IF NOT EXISTS TeamInvite (
  id TEXT PRIMARY KEY,
  teamId TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  createdBy TEXT NOT NULL,
  expiresAt TEXT,
  maxUses INTEGER DEFAULT 1,
  usedCount INTEGER DEFAULT 0,
  FOREIGN KEY (teamId) REFERENCES Team(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_team_invite_token ON TeamInvite(token);