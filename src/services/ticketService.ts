import { supabase } from "../config/supabase";

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
  metadata: Record<string, unknown>;
}

export interface CreateTicketDTO {
  subject: string;
  description: string;
  category?: string;
  priority: Ticket["priority"];
}

export const ticketService = {
  async createTicket(data: CreateTicketDTO) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("User not authenticated");

    const { data: ticket, error } = await supabase
      .from("tickets")
      .insert([
        {
          ...data,
          customer_id: user.id,
          source: "web",
          status: "new",
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return ticket;
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
    const { data: ticket, error } = await supabase
      .from("tickets")
      .update({ status })
      .eq("id", ticketId)
      .select()
      .single();

    if (error) throw error;
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
};
