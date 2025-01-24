import { supabase } from "../config/supabase";

export interface Template {
  id: string;
  name: string;
  description?: string;
  content: string;
  category?: string;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export const templatesService = {
  async getTemplates(): Promise<Template[]> {
    const { data: templates, error } = await supabase
      .from("response_templates")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return templates;
  },

  async createTemplate(
    template: Omit<Template, "id" | "created_at" | "updated_at" | "created_by">
  ): Promise<Template> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("User not authenticated");

    const { data: newTemplate, error } = await supabase
      .from("response_templates")
      .insert([{ ...template, created_by: user.id }])
      .select()
      .single();

    if (error) throw error;
    return newTemplate;
  },

  async updateTemplate(
    id: string,
    updates: Partial<
      Omit<Template, "id" | "created_at" | "updated_at" | "created_by">
    >
  ): Promise<Template> {
    const { data: updatedTemplate, error } = await supabase
      .from("response_templates")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return updatedTemplate;
  },

  async deleteTemplate(id: string): Promise<void> {
    const { error } = await supabase
      .from("response_templates")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },

  async toggleTemplateStatus(id: string, isActive: boolean): Promise<Template> {
    const { data: updatedTemplate, error } = await supabase
      .from("response_templates")
      .update({ is_active: isActive })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return updatedTemplate;
  },

  async getTemplatesByCategory(category: string): Promise<Template[]> {
    const { data: templates, error } = await supabase
      .from("response_templates")
      .select("*")
      .eq("category", category)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return templates;
  },

  async getPopularTemplates(limit: number = 5): Promise<Template[]> {
    // TODO: Implement usage tracking and return most used templates
    const { data: templates, error } = await supabase
      .from("response_templates")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return templates;
  },
};
