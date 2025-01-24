import { supabase } from "../config/supabase";

export const slaMonitoringService = {
  async checkAllActiveTickets() {
    const now = new Date().toISOString();

    // Get all active tickets with SLA policies that haven't been resolved
    const { data: tickets, error } = await supabase
      .from("tickets")
      .select(
        `
        id,
        status,
        sla_policy_id,
        first_response_at,
        sla_response_due_at,
        sla_resolution_due_at
      `
      )
      .in("status", ["new", "open", "pending"])
      .not("sla_policy_id", "is", null);

    if (error) throw error;

    for (const ticket of tickets) {
      // Check first response SLA for new tickets
      if (
        ticket.status === "new" &&
        ticket.sla_response_due_at &&
        !ticket.first_response_at &&
        new Date(now) > new Date(ticket.sla_response_due_at)
      ) {
        await this.logSLABreach(
          ticket.id,
          ticket.sla_policy_id,
          "response_time",
          ticket.sla_response_due_at
        );
      }

      // Check resolution SLA for all active tickets
      if (
        ticket.sla_resolution_due_at &&
        new Date(now) > new Date(ticket.sla_resolution_due_at)
      ) {
        await this.logSLABreach(
          ticket.id,
          ticket.sla_policy_id,
          "resolution_time",
          ticket.sla_resolution_due_at
        );
      }
    }
  },

  async logSLABreach(
    ticketId: string,
    policyId: string,
    breachType: "response_time" | "resolution_time",
    expectedTime: string
  ) {
    // Check if breach has already been logged
    const { data: existingBreach } = await supabase
      .from("sla_breach_logs")
      .select("id")
      .eq("ticket_id", ticketId)
      .eq("breach_type", breachType)
      .single();

    if (existingBreach) return; // Breach already logged

    const now = new Date().toISOString();

    // Log the breach
    const { error: breachError } = await supabase
      .from("sla_breach_logs")
      .insert({
        ticket_id: ticketId,
        policy_id: policyId,
        breach_type: breachType,
        expected_time: expectedTime,
        actual_time: now,
      });

    if (breachError) throw breachError;

    // Create notification for team members
    const { data: ticket } = await supabase
      .from("tickets")
      .select("team_id")
      .eq("id", ticketId)
      .single();

    if (ticket?.team_id) {
      const { data: teamMembers } = await supabase
        .from("team_members")
        .select("user_id")
        .eq("team_id", ticket.team_id);

      if (teamMembers) {
        const notifications = teamMembers.map((member) => ({
          user_id: member.user_id,
          type: "sla_breach",
          content: JSON.stringify({
            ticket_id: ticketId,
            breach_type: breachType,
            expected_time: expectedTime,
            actual_time: now,
          }),
          read: false,
        }));

        await supabase.from("notifications").insert(notifications);
      }
    }
  },

  startMonitoring(intervalMinutes = 5) {
    // Run initial check
    this.checkAllActiveTickets().catch(console.error);

    // Set up interval for regular checks
    const intervalId = setInterval(() => {
      this.checkAllActiveTickets().catch(console.error);
    }, intervalMinutes * 60 * 1000);

    return () => clearInterval(intervalId); // Return cleanup function
  },
};
