import { supabase } from "../config/supabase";

export interface TeamAssignmentRule {
  id: string;
  team_id: string;
  name: string;
  description?: string;
  is_active: boolean;
  priority: number;
  conditions: {
    category?: string[];
    priority?: string[];
    source?: string[];
    customer_type?: string[];
    [key: string]: any;
  };
  created_at: string;
  updated_at: string;
}

export interface TicketAssignment {
  id: string;
  ticket_id: string;
  assigned_from?: string;
  assigned_to?: string;
  previous_team_id?: string;
  new_team_id?: string;
  assigned_by: string;
  reason?: string;
  created_at: string;
}

interface TeamMember {
  user_id: string;
  team_id: string;
  role: string;
}

async function getActiveTeamMembers(teamId: string): Promise<TeamMember[]> {
  const { data: members, error } = await supabase
    .from("team_members")
    .select("user_id, team_id, role")
    .eq("team_id", teamId)
    .eq("role", "member"); // Try using eq instead of neq

  if (error) {
    console.error("Error fetching team members:", error);
    throw error;
  }
  return members || [];
}

async function getLastAssignedMember(teamId: string): Promise<string | null> {
  const { data: assignments, error } = await supabase
    .from("ticket_assignments")
    .select("assigned_to")
    .eq("new_team_id", teamId)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) throw error;
  return assignments?.[0]?.assigned_to || null;
}

async function assignTicketToNextTeamMember(
  ticketId: string,
  teamId: string
): Promise<void> {
  const members = await getActiveTeamMembers(teamId);

  if (!members.length) {
    return;
  }

  const lastAssignedMember = await getLastAssignedMember(teamId);

  // Find the next member in rotation
  let nextMemberIndex = 0;
  if (lastAssignedMember) {
    const currentIndex = members.findIndex(
      (m) => m.user_id === lastAssignedMember
    );
    nextMemberIndex = (currentIndex + 1) % members.length;
  }

  const nextMember = members[nextMemberIndex];

  // Get the authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("User not authenticated");

  // Record the assignment
  const { error: assignmentError } = await supabase.rpc(
    "assign_ticket_to_team",
    {
      _ticket_id: ticketId,
      _team_id: teamId,
      _assigned_by: user.id,
      _assigned_to: nextMember.user_id,
      _reason: "Automatically assigned via round-robin",
    }
  );

  if (assignmentError) {
    console.error("Error recording assignment:", assignmentError);
    throw assignmentError;
  }
}

export const ticketRoutingService = {
  async getTeamAssignmentRules(teamId: string): Promise<TeamAssignmentRule[]> {
    const { data: rules, error } = await supabase
      .from("team_assignment_rules")
      .select("*")
      .eq("team_id", teamId)
      .order("priority", { ascending: false });

    if (error) throw error;
    return rules;
  },

  async createAssignmentRule(
    rule: Omit<TeamAssignmentRule, "id" | "created_at" | "updated_at">
  ): Promise<TeamAssignmentRule> {
    const { data: newRule, error } = await supabase
      .from("team_assignment_rules")
      .insert([rule])
      .select()
      .single();

    if (error) throw error;
    return newRule;
  },

  async updateAssignmentRule(
    ruleId: string,
    updates: Partial<TeamAssignmentRule>
  ): Promise<TeamAssignmentRule> {
    const { data: updatedRule, error } = await supabase
      .from("team_assignment_rules")
      .update(updates)
      .eq("id", ruleId)
      .select()
      .single();

    if (error) throw error;
    return updatedRule;
  },

  async deleteAssignmentRule(ruleId: string): Promise<void> {
    const { error } = await supabase
      .from("team_assignment_rules")
      .delete()
      .eq("id", ruleId);

    if (error) throw error;
  },

  async assignTicketToTeam(
    ticketId: string,
    teamId: string,
    reason?: string
  ): Promise<void> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("User not authenticated");

    // First assign to team without a member
    const { error } = await supabase.rpc("assign_ticket_to_team", {
      _ticket_id: ticketId,
      _team_id: teamId,
      _assigned_by: user.id,
      _reason: reason || "Initial team assignment",
      _assigned_to: null,
    });

    if (error) throw error;

    // Then assign to a team member
    await assignTicketToNextTeamMember(ticketId, teamId);
  },

  async getTicketAssignmentHistory(
    ticketId: string
  ): Promise<TicketAssignment[]> {
    const { data: history, error } = await supabase
      .from("ticket_assignments")
      .select(
        `
        *,
        assigned_from:users!assigned_from(full_name),
        assigned_to:users!assigned_to(full_name),
        previous_team:teams!previous_team_id(name),
        new_team:teams!new_team_id(name),
        assigned_by:users!assigned_by(full_name)
      `
      )
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return history;
  },

  async getTeamTicketQueue(teamId: string): Promise<any[]> {
    const { data: tickets, error } = await supabase
      .from("tickets")
      .select(
        `
        *,
        customer:users!customer_id(full_name, email),
        assigned_to:users!assigned_to(full_name),
        team:teams(name)
      `
      )
      .eq("team_id", teamId)
      .in("status", ["new", "open", "pending"])
      .order("created_at", { ascending: true });

    if (error) throw error;
    return tickets;
  },
};
