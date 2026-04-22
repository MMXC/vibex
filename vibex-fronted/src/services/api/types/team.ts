// Teams API Types — E6
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

export interface CreateTeamInput {
  name: string;
  description?: string;
}

export interface UpdateTeamInput {
  name?: string;
  description?: string;
}

export interface AddMemberInput {
  userId: string;
  role: 'admin' | 'member';
}

export interface UpdateMemberRoleInput {
  role: 'admin' | 'member';
}
