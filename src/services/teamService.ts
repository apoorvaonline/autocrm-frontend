import { supabase } from "../config/supabase";

export interface Team {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateTeamDTO {
  name: string;
  description?: string;
  is_active: boolean;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: "member" | "lead";
  created_at: string;
  updated_at: string;
}

export const teamService = {
  supabase,

  async createTeam(data: CreateTeamDTO): Promise<Team> {
    const { data: team, error } = await supabase
      .from("teams")
      .insert([data])
      .select()
      .single();

    if (error) throw error;
    return team;
  },

  async getTeams(): Promise<Team[]> {
    const { data: teams, error } = await supabase
      .from("teams")
      .select("*")
      .order("name");

    if (error) throw error;
    return teams;
  },

  async updateTeam(id: string, data: Partial<CreateTeamDTO>): Promise<Team> {
    const { data: team, error } = await supabase
      .from("teams")
      .update(data)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return team;
  },

  async deleteTeam(id: string): Promise<void> {
    const { error } = await supabase.from("teams").delete().eq("id", id);

    if (error) throw error;
  },

  async getTeamMembers(teamId: string): Promise<TeamMember[]> {
    const { data: members, error } = await supabase
      .from("team_members")
      .select("*, user:users(full_name, email)")
      .eq("team_id", teamId);

    if (error) throw error;
    return members;
  },

  async addTeamMember(
    teamId: string,
    userId: string,
    role: TeamMember["role"]
  ): Promise<TeamMember> {
    const { data: member, error } = await supabase
      .from("team_members")
      .insert([{ team_id: teamId, user_id: userId, role }])
      .select()
      .single();

    if (error) throw error;
    return member;
  },

  async updateTeamMemberRole(
    teamId: string,
    userId: string,
    role: TeamMember["role"]
  ): Promise<TeamMember> {
    const { data: member, error } = await supabase
      .from("team_members")
      .update({ role, updated_at: new Date().toISOString() })
      .eq("team_id", teamId)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) throw error;
    return member;
  },

  async removeTeamMember(teamId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from("team_members")
      .delete()
      .eq("team_id", teamId)
      .eq("user_id", userId);

    if (error) throw error;
  },
};
