import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../shared/Card';
import { Button } from '../shared/Button';
import { Loader2, Paperclip, X, Download } from 'lucide-react';
import { attachmentService, type Attachment } from '../../services/attachmentService';
import { useAuth } from '../../context/AuthContext';

interface Props {
  ticketId: string;
  messageId?: string;
  onAttachmentAdded?: () => void;
}

export function TicketAttachments({ ticketId, messageId, onAttachmentAdded }: Props) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    loadAttachments();
  }, [ticketId]);

  const loadAttachments = async () => {
    try {
      setLoading(true);
      const data = await attachmentService.getTicketAttachments(ticketId);
      if (messageId) {
        setAttachments(data.filter(a => a.message_id === messageId));
      } else {
        setAttachments(data);
      }
    } catch (err) {
      console.error('Error loading attachments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setUploading(true);
      for (const file of files) {
        await attachmentService.uploadFile(file, ticketId, messageId);
      }
      await loadAttachments();
      if (onAttachmentAdded) onAttachmentAdded();
    } catch (err) {
      console.error('Error uploading file:', err);
    } finally {
      setUploading(false);
      // Reset the input
      e.target.value = '';
    }
  };

  const handleDelete = async (attachmentId: string) => {
    try {
      await attachmentService.deleteAttachment(attachmentId);
      await loadAttachments();
    } catch (err) {
      console.error('Error deleting attachment:', err);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (loading) {
    return (
      <div className="flex justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* File Upload */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          onClick={() => document.getElementById('file-upload')?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Paperclip className="h-4 w-4 mr-2" />
          )}
          Attach Files
        </Button>
        <input
          id="file-upload"
          type="file"
          multiple
          className="hidden"
          onChange={handleFileUpload}
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
        />
      </div>

      {/* Attachments List */}
      {attachments.length > 0 && (
        <div className="grid gap-2">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center justify-between p-2 rounded-md border bg-gray-50"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Paperclip className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{attachment.file_name}</span>
                <span className="text-sm text-gray-500">
                  ({formatFileSize(attachment.file_size)})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => window.open(attachmentService.getFileUrl(attachment.storage_path), '_blank')}
                  className="p-1"
                >
                  <Download className="h-4 w-4" />
                </Button>
                {(user?.role === 'admin' || attachment.uploaded_by === user?.id) && (
                  <Button
                    variant="outline"
                    onClick={() => handleDelete(attachment.id)}
                    className="p-1"
                  >
                    <X className="h-4 w-4 text-red-500" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 