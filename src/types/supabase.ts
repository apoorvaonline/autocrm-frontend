export type Database = {
  public: {
    Tables: Tables;
    Enums: {
      user_role: "customer" | "employee" | "admin";
      team_member_role: "member" | "lead";
      ticket_status: "new" | "open" | "pending" | "resolved" | "closed";
      ticket_priority: "low" | "medium" | "high" | "urgent";
      ticket_source: "email" | "chat" | "web" | "sms";
      message_type: "reply" | "note" | "system";
      activity_type:
        | "status_change"
        | "assignment"
        | "comment"
        | "priority_change";
      article_status: "draft" | "published" | "archived";
      notification_type:
        | "ticket_update"
        | "mention"
        | "assignment"
        | "sla_breach";
    };
  };
};

type Tables = {
  users: {
    Row: {
      id: string;
      email: string;
      full_name: string;
      role: "customer" | "employee" | "admin";
      created_at: string;
      last_login: string | null;
      is_active: boolean;
      preferences: Record<string, unknown>;
    };
    Insert: Omit<Tables["users"]["Row"], "id" | "created_at">;
    Update: Partial<Tables["users"]["Insert"]>;
  };
  teams: {
    Row: {
      id: string;
      name: string;
      description: string | null;
      created_at: string;
      updated_at: string;
      is_active: boolean;
    };
    Insert: Omit<Tables["teams"]["Row"], "id" | "created_at" | "updated_at">;
    Update: Partial<Tables["teams"]["Insert"]>;
  };
  tickets: {
    Row: {
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
    };
    Insert: Omit<Tables["tickets"]["Row"], "id" | "created_at" | "updated_at">;
    Update: Partial<Tables["tickets"]["Insert"]>;
  };
};
