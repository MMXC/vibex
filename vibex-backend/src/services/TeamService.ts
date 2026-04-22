/**
 * TeamService — Team CRUD + permission management
 *
 * E6: Teams API
 * Implements team lifecycle management with role-based access control.
 *
 * Usage:
 *   const teamSvc = new TeamService(env);
 *   const team = await teamSvc.createTeam({ name, ownerId });
 *   await teamSvc.addMember(team.id, { userId, role: 'member' });
 *   await teamSvc.checkPermission(team.id, userId, 'admin');
 */

import type { CloudflareEnv } from '@/lib/env';
import { queryDB, queryOne, executeDB, generateId } from '@/lib/db';
import { apiError, ERROR_CODES } from '@/lib/api-error';

// ============================================
// Types
// ============================================

export type TeamRole = 'owner' | 'admin' | 'member';

export interface Team {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  role: TeamRole;
  invitedBy: string | null;
  joinedAt: string;
}

interface TeamMemberRow {
  id: string;
  teamId: string;
  userId: string;
  role: string;
  invitedBy: string | null;
  joinedAt: string;
}

interface TeamRow {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// Errors
// ============================================

export class TeamNotFoundError extends Error {
  constructor(message = 'Team not found') {
    super(message);
    this.name = 'TeamNotFoundError';
  }
}

export class MemberNotFoundError extends Error {
  constructor(message = 'Team member not found') {
    super(message);
    this.name = 'MemberNotFoundError';
  }
}

export class ForbiddenError extends Error {
  constructor(message = 'Permission denied') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export class ConflictError extends Error {
  constructor(message = 'Resource conflict') {
    super(message);
    this.name = 'ConflictError';
  }
}

// ============================================
// Service
// ============================================

export class TeamService {
  constructor(private env: CloudflareEnv) {}

  // ==================== Team CRUD ====================

  async createTeam(input: { name: string; ownerId: string; description?: string }): Promise<Team> {
    const id = generateId();
    const now = new Date().toISOString();

    await executeDB(
      this.env,
      `INSERT INTO Team (id, name, description, ownerId, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, input.name, input.description ?? null, input.ownerId, now, now]
    );

    // Auto-add owner as a member with 'owner' role
    await this.addMember(id, { userId: input.ownerId, role: 'owner', invitedBy: input.ownerId });

    const team = await this.getTeam(id);
    if (!team) throw new Error('Failed to create team');
    return team;
  }

  async getTeam(teamId: string): Promise<Team | null> {
    const row = await queryOne<TeamRow>(this.env, 'SELECT * FROM Team WHERE id = ?', [teamId]);
    if (!row) return null;
    return {
      ...row,
      description: row.description ?? null,
    };
  }

  async listTeamsByUser(userId: string): Promise<Team[]> {
    const rows = await queryDB<TeamRow>(
      this.env,
      `SELECT t.* FROM Team t
       INNER JOIN TeamMember tm ON tm.teamId = t.id
       WHERE tm.userId = ?
       ORDER BY t.updatedAt DESC`,
      [userId]
    );
    return rows.map((r) => ({ ...r, description: r.description ?? null }));
  }

  async updateTeam(
    teamId: string,
    userId: string,
    input: { name?: string; description?: string }
  ): Promise<Team> {
    await this.checkPermission(teamId, userId, 'admin');

    const updates: string[] = [];
    const params: unknown[] = [];

    if (input.name !== undefined) {
      updates.push('name = ?');
      params.push(input.name);
    }
    if (input.description !== undefined) {
      updates.push('description = ?');
      params.push(input.description);
    }

    if (updates.length === 0) {
      const team = await this.getTeam(teamId);
      if (!team) throw new TeamNotFoundError();
      return team;
    }

    updates.push("updatedAt = ?");
    params.push(new Date().toISOString());
    params.push(teamId);

    await executeDB(
      this.env,
      `UPDATE Team SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    const team = await this.getTeam(teamId);
    if (!team) throw new TeamNotFoundError();
    return team;
  }

  async deleteTeam(teamId: string, userId: string): Promise<void> {
    await this.checkPermission(teamId, userId, 'owner');
    await executeDB(this.env, 'DELETE FROM Team WHERE id = ?', [teamId]);
  }

  // ==================== Member Management ====================

  async addMember(
    teamId: string,
    input: { userId: string; role: TeamRole; invitedBy?: string }
  ): Promise<TeamMember> {
    // Check invitee has permission to add members (admin or owner)
    if (input.invitedBy) {
      await this.checkPermission(teamId, input.invitedBy, 'admin');
    }

    const team = await this.getTeam(teamId);
    if (!team) throw new TeamNotFoundError();

    // Prevent adding owner directly (owner role only via team creation)
    if (input.role === 'owner') {
      throw new ConflictError('Cannot add owner role via addMember');
    }

    const id = generateId();
    const now = new Date().toISOString();

    try {
      await executeDB(
        this.env,
        `INSERT INTO TeamMember (id, teamId, userId, role, invitedBy, joinedAt)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [id, teamId, input.userId, input.role, input.invitedBy ?? null, now]
      );
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes('UNIQUE constraint')) {
        throw new ConflictError('User is already a team member');
      }
      throw err;
    }

    const member = await this.getMember(teamId, input.userId);
    if (!member) throw new Error('Failed to add member');
    return member;
  }

  async getMember(teamId: string, userId: string): Promise<TeamMember | null> {
    const row = await queryOne<TeamMemberRow>(
      this.env,
      'SELECT * FROM TeamMember WHERE teamId = ? AND userId = ?',
      [teamId, userId]
    );
    if (!row) return null;
    return {
      ...row,
      role: row.role as TeamRole,
      invitedBy: row.invitedBy ?? null,
    };
  }

  async listMembers(teamId: string): Promise<TeamMember[]> {
    const rows = await queryDB<TeamMemberRow>(
      this.env,
      'SELECT * FROM TeamMember WHERE teamId = ? ORDER BY joinedAt ASC',
      [teamId]
    );
    return rows.map((r) => ({
      ...r,
      role: r.role as TeamRole,
      invitedBy: r.invitedBy ?? null,
    }));
  }

  async updateMemberRole(
    teamId: string,
    targetUserId: string,
    actorUserId: string,
    newRole: TeamRole
  ): Promise<TeamMember> {
    await this.checkPermission(teamId, actorUserId, 'admin');

    // Cannot change owner role
    const member = await this.getMember(teamId, targetUserId);
    if (!member) throw new MemberNotFoundError();
    if (member.role === 'owner') {
      throw new ForbiddenError('Cannot change owner role');
    }
    if (newRole === 'owner') {
      throw new ForbiddenError('Cannot assign owner role');
    }

    await executeDB(
      this.env,
      'UPDATE TeamMember SET role = ? WHERE teamId = ? AND userId = ?',
      [newRole, teamId, targetUserId]
    );

    const updated = await this.getMember(teamId, targetUserId);
    if (!updated) throw new MemberNotFoundError();
    return updated;
  }

  async removeMember(teamId: string, targetUserId: string, actorUserId: string): Promise<void> {
    await this.checkPermission(teamId, actorUserId, 'admin');

    const member = await this.getMember(teamId, targetUserId);
    if (!member) throw new MemberNotFoundError();
    if (member.role === 'owner') {
      throw new ForbiddenError('Cannot remove team owner');
    }

    await executeDB(
      this.env,
      'DELETE FROM TeamMember WHERE teamId = ? AND userId = ?',
      [teamId, targetUserId]
    );
  }

  // ==================== Permission Checks ====================

  /**
   * Check if user has at least the required role in the team.
   * Role hierarchy: owner > admin > member
   */
  async checkPermission(teamId: string, userId: string, requiredRole: TeamRole): Promise<void> {
    const member = await this.getMember(teamId, userId);
    if (!member) {
      throw new ForbiddenError('You are not a member of this team');
    }

    const roleHierarchy: Record<TeamRole, number> = {
      owner: 3,
      admin: 2,
      member: 1,
    };

    if (roleHierarchy[member.role] < roleHierarchy[requiredRole]) {
      throw new ForbiddenError(`Requires ${requiredRole} role or higher`);
    }
  }

  /**
   * Check if user is a member of the team (any role)
   */
  async isMember(teamId: string, userId: string): Promise<boolean> {
    const member = await this.getMember(teamId, userId);
    return member !== null;
  }

  /**
   * Get user's role in the team (or null if not a member)
   */
  async getUserRole(teamId: string, userId: string): Promise<TeamRole | null> {
    const member = await this.getMember(teamId, userId);
    return member?.role ?? null;
  }
}