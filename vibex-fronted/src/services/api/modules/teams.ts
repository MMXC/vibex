/**
 * Teams API Client — E6
 * Frontend API client for Teams CRUD and member management.
 */
import type {
  Team,
  TeamMember,
  CreateTeamInput,
  UpdateTeamInput,
  AddMemberInput,
  UpdateMemberRoleInput,
} from '../types/team';
import { SuccessResponse } from '../types/common';
import { httpClient } from '../client';

export interface TeamsApi {
  listTeams(): Promise<Team[]>;
  createTeam(input: CreateTeamInput): Promise<Team>;
  getTeam(teamId: string): Promise<Team>;
  updateTeam(teamId: string, input: UpdateTeamInput): Promise<Team>;
  deleteTeam(teamId: string): Promise<SuccessResponse>;
  listMembers(teamId: string): Promise<TeamMember[]>;
  addMember(teamId: string, input: AddMemberInput): Promise<TeamMember>;
  updateMemberRole(teamId: string, userId: string, input: UpdateMemberRoleInput): Promise<TeamMember>;
  removeMember(teamId: string, userId: string): Promise<SuccessResponse>;
  getPermissions(teamId: string): Promise<{ role: string }>;
}

class TeamsApiImpl implements TeamsApi {
  private baseUrl = '/v1/teams';

  async listTeams(): Promise<Team[]> {
    const res = await httpClient.get<{ success: boolean; teams: Team[] }>(`${this.baseUrl}`);
    return res.teams;
  }

  async createTeam(input: CreateTeamInput): Promise<Team> {
    const res = await httpClient.post<{ success: boolean; team: Team }>(
      `${this.baseUrl}`,
      input
    );
    return res.team;
  }

  async getTeam(teamId: string): Promise<Team> {
    const res = await httpClient.get<{ success: boolean; team: Team }>(
      `${this.baseUrl}/${teamId}`
    );
    return res.team;
  }

  async updateTeam(teamId: string, input: UpdateTeamInput): Promise<Team> {
    const res = await httpClient.put<{ success: boolean; team: Team }>(
      `${this.baseUrl}/${teamId}`,
      input
    );
    return res.team;
  }

  async deleteTeam(teamId: string): Promise<SuccessResponse> {
    return httpClient.delete<SuccessResponse>(`${this.baseUrl}/${teamId}`);
  }

  async listMembers(teamId: string): Promise<TeamMember[]> {
    const res = await httpClient.get<{ success: boolean; members: TeamMember[] }>(
      `${this.baseUrl}/${teamId}/members`
    );
    return res.members;
  }

  async addMember(teamId: string, input: AddMemberInput): Promise<TeamMember> {
    const res = await httpClient.post<{ success: boolean; member: TeamMember }>(
      `${this.baseUrl}/${teamId}/members`,
      input
    );
    return res.member;
  }

  async updateMemberRole(teamId: string, userId: string, input: UpdateMemberRoleInput): Promise<TeamMember> {
    const res = await httpClient.put<{ success: boolean; member: TeamMember }>(
      `${this.baseUrl}/${teamId}/members/${userId}`,
      input
    );
    return res.member;
  }

  async removeMember(teamId: string, userId: string): Promise<SuccessResponse> {
    return httpClient.delete<SuccessResponse>(
      `${this.baseUrl}/${teamId}/members/${userId}`
    );
  }

  async getPermissions(teamId: string): Promise<{ role: string }> {
    const res = await httpClient.get<{ success: boolean; role: string }>(
      `${this.baseUrl}/${teamId}/permissions`
    );
    return res;
  }
}

export const teamsApi: TeamsApi = new TeamsApiImpl();
