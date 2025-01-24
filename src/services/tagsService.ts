import { supabase } from "../config/supabase";

export interface Tag {
  id: string;
  name: string;
  description?: string;
  color: string;
  created_at: string;
}

export interface TicketTag {
  ticket_id: string;
  tag_id: string;
  created_by: string;
  created_at: string;
  tag?: Tag;
}

export const tagsService = {
  async getTags(): Promise<Tag[]> {
    const { data: tags, error } = await supabase
      .from("tags")
      .select("*")
      .order("name");

    if (error) throw error;
    return tags;
  },

  async createTag(tag: Omit<Tag, "id" | "created_at">): Promise<Tag> {
    const { data: newTag, error } = await supabase
      .from("tags")
      .insert([tag])
      .select()
      .single();

    if (error) throw error;
    return newTag;
  },

  async updateTag(id: string, updates: Partial<Tag>): Promise<Tag> {
    const { data: updatedTag, error } = await supabase
      .from("tags")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return updatedTag;
  },

  async deleteTag(id: string): Promise<void> {
    const { error } = await supabase.from("tags").delete().eq("id", id);

    if (error) throw error;
  },

  async getTicketTags(ticketId: string): Promise<TicketTag[]> {
    const { data: ticketTags, error } = await supabase
      .from("ticket_tags")
      .select(
        `
        *,
        tag:tags(*)
      `
      )
      .eq("ticket_id", ticketId);

    if (error) throw error;
    return ticketTags;
  },

  async addTagToTicket(ticketId: string, tagId: string): Promise<void> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("User not authenticated");

    const { error } = await supabase.from("ticket_tags").insert([
      {
        ticket_id: ticketId,
        tag_id: tagId,
        created_by: user.id,
      },
    ]);

    if (error) throw error;
  },

  async removeTagFromTicket(ticketId: string, tagId: string): Promise<void> {
    const { error } = await supabase
      .from("ticket_tags")
      .delete()
      .eq("ticket_id", ticketId)
      .eq("tag_id", tagId);

    if (error) throw error;
  },

  async getPopularTags(
    limit: number = 10
  ): Promise<{ tag: Tag; count: number }[]> {
    const { data, error } = await supabase.rpc("get_popular_tags", {
      limit_count: limit,
    });

    if (error) throw error;
    return data;
  },
};
