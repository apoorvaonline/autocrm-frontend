import { supabase } from "../config/supabase";

export interface TicketCategory {
  id: string;
  name: string;
  description?: string;
  parent_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  parent?: TicketCategory;
  children?: TicketCategory[];
}

export const ticketCategoriesService = {
  async getCategories(): Promise<TicketCategory[]> {
    const { data: categories, error } = await supabase
      .from("ticket_categories")
      .select(
        `
        *,
        parent:parent_id(*),
        children:ticket_categories!parent_id(*)
      `
      )
      .order("name");

    if (error) throw error;
    return categories;
  },

  async createCategory(
    category: Omit<TicketCategory, "id" | "created_at" | "updated_at">
  ): Promise<TicketCategory> {
    const { data: newCategory, error } = await supabase
      .from("ticket_categories")
      .insert([category])
      .select()
      .single();

    if (error) throw error;
    return newCategory;
  },

  async updateCategory(
    id: string,
    updates: Partial<TicketCategory>
  ): Promise<TicketCategory> {
    const { data: updatedCategory, error } = await supabase
      .from("ticket_categories")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return updatedCategory;
  },

  async deleteCategory(id: string): Promise<void> {
    const { error } = await supabase
      .from("ticket_categories")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },

  async toggleCategoryStatus(id: string, isActive: boolean): Promise<void> {
    const { error } = await supabase
      .from("ticket_categories")
      .update({ is_active: isActive })
      .eq("id", id);

    if (error) throw error;
  },

  async getCategoryHierarchy(): Promise<TicketCategory[]> {
    const { data: categories, error } = await supabase
      .from("ticket_categories")
      .select(
        `
        *,
        children:ticket_categories!parent_id(*)
      `
      )
      .is("parent_id", null)
      .order("name");

    if (error) throw error;
    return categories;
  },
};
