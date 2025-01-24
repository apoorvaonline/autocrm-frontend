import { supabase } from "../config/supabase";
import { ticketRoutingService } from "./ticketRoutingService";

export interface Ticket {
  id: string;
  customer_id: string;
  assigned_to: string | null;
  team_id: string | null;
  status: "new" | "open" | "pending" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  category: string | null;
  subject: string;
  description: string | null;
  source: "email" | "chat" | "web" | "sms";
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  sla_breach_at: string | null;
  sla_policy_id: string | null;
  first_response_at: string | null;
  sla_response_due_at: string | null;
  sla_resolution_due_at: string | null;
  metadata: Record<string, unknown>;
}

export interface TicketWithDetails
  extends Omit<Ticket, "assigned_to" | "customer_id"> {
  customer: {
    full_name: string;
    email: string;
  };
  assigned_to?: {
    full_name: string;
  } | null;
  team?: {
    name: string;
  } | null;
  messages: {
    id: string;
    sender_id: string;
    message_type: "reply" | "note" | "system";
    content: string;
    created_at: string;
    sender: {
      full_name: string;
    };
  }[];
}

export interface CreateTicketDTO {
  subject: string;
  description: string;
  category?: string;
  priority: Ticket["priority"];
}

export interface AddMessageDTO {
  content: string;
  message_type: "reply" | "note";
}

const classifyTicket = (subject: string, description: string): string => {
  const text = `${subject} ${description}`.toLowerCase();

  // Order-related keywords
  const orderKeywords = [
    "order",
    "shipping",
    "delivery",
    "tracking",
    "refund",
    "payment",
    "purchase",
    "bought",
  ];
  if (orderKeywords.some((keyword) => text.includes(keyword))) {
    return "Order";
  }

  // Product-related keywords
  const productKeywords = [
    "product",
    "item",
    "broken",
    "defective",
    "quality",
    "size",
    "color",
    "damaged",
  ];
  if (productKeywords.some((keyword) => text.includes(keyword))) {
    return "Product";
  }

  // Tech support keywords
  const techKeywords = [
    "login",
    "account",
    "website",
    "app",
    "error",
    "bug",
    "password",
    "access",
  ];
  if (techKeywords.some((keyword) => text.includes(keyword))) {
    return "TechSupport";
  }

  // Default category
  return "General";
};

export const ticketService = {
  async createTicket(data: CreateTicketDTO) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("User not authenticated");

    const category = classifyTicket(data.subject, data.description);

    const { data: ticket, error } = await supabase
      .from("tickets")
      .insert([
        {
          ...data,
          customer_id: user.id,
          source: "web",
          status: "new",
          category,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    // If SLA policy is set, calculate due dates
    if (ticket.sla_policy_id) {
      await this.calculateSLADueDates(ticket.id, ticket.sla_policy_id);
    }

    // Fetch all active team assignment rules
    const { data: rules, error: rulesError } = await supabase
      .from("team_assignment_rules")
      .select("*")
      .eq("is_active", true)
      .order("priority", { ascending: false });

    if (rulesError) throw rulesError;

    // Find the first matching rule
    const matchingRule = rules.find((rule) => {
      const conditions = rule.conditions || {};

      // Check category condition
      if (conditions.category && !conditions.category.includes(category)) {
        return false;
      }

      // Check priority condition
      if (conditions.priority && !conditions.priority.includes(data.priority)) {
        return false;
      }

      // Check source condition
      if (conditions.source && !conditions.source.includes("web")) {
        return false;
      }

      return true;
    });

    // If a matching rule is found, assign the ticket to the team
    if (matchingRule) {
      await ticketRoutingService.assignTicketToTeam(
        ticket.id,
        matchingRule.team_id,
        `Automatically assigned based on rule: ${matchingRule.name}`
      );
    } else {
      console.error("No matching rule found for ticket assignment");
    }

    return ticket;
  },

  async updateTicket(id: string, updates: Partial<Ticket>) {
    const { data: oldTicket } = await supabase
      .from("tickets")
      .select("status, first_response_at")
      .eq("id", id)
      .single();

    const { data, error } = await supabase
      .from("tickets")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    // Record first response if status changed from 'new' and no first response recorded
    if (
      oldTicket?.status === "new" &&
      updates.status !== "new" &&
      !oldTicket.first_response_at
    ) {
      await this.recordFirstResponse(id);
    }

    // If SLA policy is being set or changed, recalculate due dates
    if (updates.sla_policy_id) {
      await this.calculateSLADueDates(id, updates.sla_policy_id);
    }

    return data as Ticket;
  },

  async getCustomerTickets() {
    const { data: tickets, error } = await supabase
      .from("tickets")
      .select(
        `
        *,
        assigned_to:users!assigned_to(full_name),
        team:teams(name)
      `
      )
      .order("created_at", { ascending: false });

    if (error) throw error;
    return tickets;
  },

  async getEmployeeTickets() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("User not authenticated");

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
      .or(`assigned_to.eq.${user.id}`) // Tickets directly assigned to the employee
      .or("status.neq.closed,status.neq.resolved")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return tickets;
  },

  async getAllTickets() {
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
      .or("status.neq.closed,status.neq.resolved")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return tickets;
  },

  async updateTicketStatus(ticketId: string, status: Ticket["status"]) {
    const { data: oldTicket } = await supabase
      .from("tickets")
      .select("status, first_response_at")
      .eq("id", ticketId)
      .single();

    const { data: ticket, error } = await supabase
      .from("tickets")
      .update({ status })
      .eq("id", ticketId)
      .select()
      .single();

    if (error) throw error;

    // Record first response if status changed from 'new' and no first response recorded
    if (
      oldTicket?.status === "new" &&
      status !== "new" &&
      !oldTicket.first_response_at
    ) {
      await this.recordFirstResponse(ticketId);
    }

    return ticket;
  },

  async assignTicket(ticketId: string, assignedTo: string | null) {
    const { data: ticket, error } = await supabase
      .from("tickets")
      .update({ assigned_to: assignedTo })
      .eq("id", ticketId)
      .select()
      .single();

    if (error) throw error;
    return ticket;
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

  async checkResolutionSLA(ticketId: string) {
    const now = new Date().toISOString();
    const { data: ticket, error: ticketError } = await supabase
      .from("tickets")
      .select("sla_resolution_due_at")
      .eq("id", ticketId)
      .single();

    if (ticketError) throw ticketError;

    // Check for SLA breach
    if (
      ticket.sla_resolution_due_at &&
      new Date(now) > new Date(ticket.sla_resolution_due_at)
    ) {
      await supabase.from("sla_breach_logs").insert({
        ticket_id: ticketId,
        breach_type: "resolution_time",
        expected_time: ticket.sla_resolution_due_at,
        actual_time: now,
      });
    }
  },

  async getTicketDetails(ticketId: string): Promise<TicketWithDetails> {
    const { data: ticket, error } = await supabase
      .from("tickets")
      .select(
        `
        *,
        customer:users!customer_id(full_name, email),
        assigned_to:users!assigned_to(full_name),
        team:teams(name),
        messages:ticket_messages(
          id,
          sender_id,
          message_type,
          content,
          created_at,
          sender:users!sender_id(full_name)
        )
      `
      )
      .eq("id", ticketId)
      .single();

    if (error) throw error;
    return ticket;
  },

  async addMessage(ticketId: string, data: AddMessageDTO) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("User not authenticated");

    const { error } = await supabase.from("ticket_messages").insert([
      {
        ticket_id: ticketId,
        sender_id: user.id,
        content: data.content,
        message_type: data.message_type,
      },
    ]);

    if (error) throw error;

    // If this is the first response and ticket is in 'new' status, update it
    const { data: ticket } = await supabase
      .from("tickets")
      .select("status, first_response_at")
      .eq("id", ticketId)
      .single();

    if (
      ticket?.status === "new" &&
      !ticket.first_response_at &&
      data.message_type === "reply"
    ) {
      await this.updateTicketStatus(ticketId, "open");
    }
  },
};
