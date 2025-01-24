import { supabase } from "../config/supabase";

export interface TeamMetrics {
  id: string;
  team_id: string;
  period_start: string;
  period_end: string;
  total_tickets: number;
  resolved_tickets: number;
  avg_resolution_time: string | null;
  avg_first_response_time: string | null;
  sla_compliance_rate: number | null;
  customer_satisfaction_score: number | null;
  created_at: string;
}

export interface TeamMemberMetrics {
  id: string;
  team_id: string;
  user_id: string;
  period_start: string;
  period_end: string;
  tickets_handled: number;
  tickets_resolved: number;
  avg_resolution_time: string | null;
  avg_response_time: string | null;
  customer_rating: number | null;
  created_at: string;
  user?: {
    full_name: string;
    email: string;
  };
}

export const teamMetricsService = {
  async getTeamMetrics(
    teamId: string,
    startDate: Date,
    endDate: Date
  ): Promise<TeamMetrics[]> {
    const { data: metrics, error } = await supabase
      .from("team_metrics")
      .select("*")
      .eq("team_id", teamId)
      .gte("period_start", startDate.toISOString())
      .lte("period_end", endDate.toISOString())
      .order("period_start");

    if (error) throw error;
    return metrics;
  },

  async getTeamMemberMetrics(
    teamId: string,
    startDate: Date,
    endDate: Date
  ): Promise<TeamMemberMetrics[]> {
    const { data: metrics, error } = await supabase
      .from("team_member_metrics")
      .select("*, user:users(full_name, email)")
      .eq("team_id", teamId)
      .gte("period_start", startDate.toISOString())
      .lte("period_end", endDate.toISOString())
      .order("period_start");

    if (error) throw error;
    return metrics;
  },

  async getTeamMemberPersonalMetrics(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<TeamMemberMetrics[]> {
    const { data: metrics, error } = await supabase
      .from("team_member_metrics")
      .select("*, user:users(full_name, email)")
      .eq("user_id", userId)
      .gte("period_start", startDate.toISOString())
      .lte("period_end", endDate.toISOString())
      .order("period_start");

    if (error) throw error;
    return metrics;
  },
};
