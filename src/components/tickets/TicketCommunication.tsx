import { useState } from 'react';
import { Button } from '../shared/Button';
import { ticketService } from '../../services/ticketService';
import { formatDistanceToNow } from 'date-fns';
import { TicketAttachments } from './TicketAttachments';
import { useAuth } from '../../context/AuthContext';

interface Message {
  id: string;
  content: string;
  message_type: 'reply' | 'note' | 'system';
  created_at: string;
  sender: {
    full_name: string;
  };
}

interface Props {
  ticketId: string;
  onMessageSent?: () => void;
  messages: Message[];
}

export function TicketCommunication({ ticketId, onMessageSent, messages }: Props) {
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'reply' | 'note'>('reply');
  const [sending, setSending] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const { isEmployee } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    try {
      setSending(true);
      await ticketService.addMessage(ticketId, {
        content: message.trim(),
        message_type: messageType
      }, isEmployee);
      setMessage('');
      if (onMessageSent) onMessageSent();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Message History */}
      <div className="space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`p-4 rounded-lg ${
              message.message_type === 'note'
                ? 'bg-yellow-50 border border-yellow-200'
                : message.message_type === 'system'
                ? 'bg-gray-50 border border-gray-200'
                : 'bg-white border border-gray-200'
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center space-x-2">
                <span className="font-medium">
                  {message.sender?.full_name || (message.message_type === 'note' ? 'Internal Note' : 'Support Team')}
                </span>
                <span className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                </span>
              </div>
              <span className="text-xs text-gray-500 capitalize">
                {message.message_type}
              </span>
            </div>
            <div className="prose max-w-none">
              {message.content}
            </div>
            {/* Show attachments if any */}
            <TicketAttachments ticketId={ticketId} messageId={message.id} />
          </div>
        ))}

        {messages.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No messages yet
          </div>
        )}
      </div>

      {/* Message Input Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-2 mb-2">
          <Button
            type="button"
            variant={messageType === 'reply' ? 'primary' : 'secondary'}
            onClick={() => setMessageType('reply')}
          >
            Reply
          </Button>
          {isEmployee && (
            <Button
              type="button"
              variant={messageType === 'note' ? 'primary' : 'secondary'}
              onClick={() => setMessageType('note')}
            >
              Internal Note
            </Button>
          )}
        </div>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={messageType === 'note' ? 'Add an internal note...' : 'Type your reply...'}
          className="w-full min-h-[100px] p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          disabled={sending}
        />
        <div className="flex gap-2">
          <Button 
            variant="primary"
            type="submit"
            loading={sending}
          >
            {messageType === 'note' ? 'Add Note' : 'Send Reply'}
          </Button>
          {isEmployee && (
            <Button 
              variant="tertiary"
              onClick={() => setShowTemplates(true)}
            >
              Use Template
            </Button>
          )}
        </div>
      </form>
      {showTemplates && (
      <div>
        <h2>Templates</h2>
      </div>
      )}
    </div>
  );
} 