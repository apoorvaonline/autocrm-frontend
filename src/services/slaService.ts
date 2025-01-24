import { supabase } from "../config/supabase";

export interface SLAPolicy {
  id: string;
  name: string;
  description: string | null;
  priority: string;
  response_time_minutes: number;
  resolution_time_minutes: number;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface SLABreachLog {
  id: string;
  ticket_id: string;
  policy_id: string;
  breach_type: "response_time" | "resolution_time";
  expected_time: string;
  actual_time: string | null;
  created_at: string;
}

export const slaService = {
  // SLA Policy Management
  async getSLAPolicies() {
    const { data, error } = await supabase
      .from("sla_policies")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data as SLAPolicy[];
  },

  async createSLAPolicy(
    policy: Omit<SLAPolicy, "id" | "created_at" | "updated_at">
  ) {
    const { data, error } = await supabase
      .from("sla_policies")
      .insert(policy)
      .select()
      .single();

    if (error) throw error;
    return data as SLAPolicy;
  },

  async updateSLAPolicy(id: string, updates: Partial<SLAPolicy>) {
    const { data, error } = await supabase
      .from("sla_policies")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as SLAPolicy;
  },

  async deleteSLAPolicy(id: string) {
    const { error } = await supabase.from("sla_policies").delete().eq("id", id);

    if (error) throw error;
  },

  async toggleSLAPolicyStatus(id: string, isActive: boolean) {
    const { data, error } = await supabase
      .from("sla_policies")
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as SLAPolicy;
  },

  // SLA Monitoring
  async getSLABreachLogs(ticketId: string) {
    const { data, error } = await supabase
      .from("sla_breach_logs")
      .select(
        `
        *,
        policy:sla_policies(name)
      `
      )
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  },

  async calculateSLADueDates(ticketId: string, policyId: string) {
    const { data: policy, error: policyError } = await supabase
      .from("sla_policies")
      .select("*")
      .eq("id", policyId)
      .single();

    if (policyError) throw policyError;

    const now = new Date();
    const responseDue = new Date(
      now.getTime() + policy.response_time_minutes * 60000
    );
    const resolutionDue = new Date(
      now.getTime() + policy.resolution_time_minutes * 60000
    );

    const { error: updateError } = await supabase
      .from("tickets")
      .update({
        sla_policy_id: policyId,
        sla_response_due_at: responseDue.toISOString(),
        sla_resolution_due_at: resolutionDue.toISOString(),
      })
      .eq("id", ticketId);

    if (updateError) throw updateError;
  },

  async recordFirstResponse(ticketId: string) {
    const now = new Date().toISOString();
    const { data: ticket, error: ticketError } = await supabase
      .from("tickets")
      .select("sla_response_due_at")
      .eq("id", ticketId)
      .single();

    if (ticketError) throw ticketError;

    // Check for SLA breach
    if (
      ticket.sla_response_due_at &&
      new Date(now) > new Date(ticket.sla_response_due_at)
    ) {
      await supabase.from("sla_breach_logs").insert({
        ticket_id: ticketId,
        breach_type: "response_time",
        expected_time: ticket.sla_response_due_at,
        actual_time: now,
      });
    }

    const { error: updateError } = await supabase
      .from("tickets")
      .update({ first_response_at: now })
      .eq("id", ticketId);

    if (updateError) throw updateError;
  },
};
