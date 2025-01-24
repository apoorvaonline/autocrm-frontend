import { supabase } from "../config/supabase";

export interface Attachment {
  id: string;
  ticket_id: string;
  message_id: string | null;
  file_name: string;
  file_size: number;
  file_type: string;
  storage_path: string;
  uploaded_by: string;
  created_at: string;
}

export const attachmentService = {
  async uploadFile(
    file: File,
    ticketId: string,
    messageId?: string
  ): Promise<Attachment> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("User not authenticated");

    // Generate a unique file path
    const timestamp = new Date().getTime();
    const fileName = `${timestamp}-${file.name}`;
    const storagePath = `tickets/${ticketId}/${fileName}`;

    // Upload file to storage
    const { error: uploadError } = await supabase.storage
      .from("ticket_files")
      .upload(storagePath, file);

    if (uploadError) throw uploadError;

    // Create attachment record
    const { data: attachment, error: dbError } = await supabase
      .from("ticket_attachments")
      .insert([
        {
          ticket_id: ticketId,
          message_id: messageId || null,
          file_name: file.name,
          file_size: file.size,
          file_type: file.type,
          storage_path: storagePath,
          uploaded_by: user.id,
        },
      ])
      .select()
      .single();

    if (dbError) throw dbError;
    return attachment;
  },

  async getTicketAttachments(ticketId: string): Promise<Attachment[]> {
    const { data: attachments, error } = await supabase
      .from("ticket_attachments")
      .select("*")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return attachments;
  },

  async deleteAttachment(attachmentId: string): Promise<void> {
    const { data: attachment, error: fetchError } = await supabase
      .from("ticket_attachments")
      .select("storage_path")
      .eq("id", attachmentId)
      .single();

    if (fetchError) throw fetchError;

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from("ticket_files")
      .remove([attachment.storage_path]);

    if (storageError) throw storageError;

    // Delete from database
    const { error: dbError } = await supabase
      .from("ticket_attachments")
      .delete()
      .eq("id", attachmentId);

    if (dbError) throw dbError;
  },

  getFileUrl(storagePath: string): string {
    const { data } = supabase.storage
      .from("ticket_files")
      .getPublicUrl(storagePath);

    return data.publicUrl;
  },
};
