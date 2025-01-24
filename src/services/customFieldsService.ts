import { supabase } from "../config/supabase";

export interface CustomField {
  id: string;
  name: string;
  description?: string;
  field_type: "text" | "number" | "select" | "date" | "boolean";
  options?: string[];
  is_required: boolean;
  is_active: boolean;
  entity_type: "ticket" | "customer" | "team";
  created_at: string;
}

export const customFieldsService = {
  async getCustomFields(): Promise<CustomField[]> {
    const { data: fields, error } = await supabase
      .from("custom_fields")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return fields;
  },

  async createCustomField(
    field: Omit<CustomField, "id" | "created_at">
  ): Promise<CustomField> {
    const { data: newField, error } = await supabase
      .from("custom_fields")
      .insert([field])
      .select()
      .single();

    if (error) throw error;
    return newField;
  },

  async updateCustomField(
    id: string,
    updates: Partial<Omit<CustomField, "id" | "created_at">>
  ): Promise<CustomField> {
    const { data: updatedField, error } = await supabase
      .from("custom_fields")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return updatedField;
  },

  async deleteCustomField(id: string): Promise<void> {
    const { error } = await supabase
      .from("custom_fields")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },

  async toggleCustomFieldStatus(
    id: string,
    isActive: boolean
  ): Promise<CustomField> {
    const { data: updatedField, error } = await supabase
      .from("custom_fields")
      .update({ is_active: isActive })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return updatedField;
  },

  async getCustomFieldsByEntity(
    entityType: CustomField["entity_type"]
  ): Promise<CustomField[]> {
    const { data: fields, error } = await supabase
      .from("custom_fields")
      .select("*")
      .eq("entity_type", entityType)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return fields;
  },
};
