import { useState } from 'react';
import { CreateTicketDTO, ticketService } from '../../services/ticketService';
import { Button } from '../shared/Button';
import { Input } from '../shared/Input';
import { theme } from '../../config/theme';

interface CreateTicketFormData extends CreateTicketDTO {
  subject: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export function CreateTicket() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [formData, setFormData] = useState<CreateTicketFormData>({
    subject: '',
    description: '',
    category: '',
    priority: 'medium'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await ticketService.createTicket(formData);
      setSuccess('Ticket created successfully!');
      setFormData({
        subject: '',
        description: '',
        category: '',
        priority: 'medium'
      });
    } catch (err) {
      console.error('Error creating ticket:', err);
      setError('Failed to create ticket. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className={`text-2xl font-bold mb-6 text-[${theme.colors.primary.text}]`}>
        Create New Support Ticket
      </h2>

      {error && (
        <div className="mb-4 p-3 rounded bg-red-50 text-red-500 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 rounded bg-green-50 text-green-600 text-sm">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Subject"
          name="subject"
          value={formData.subject}
          onChange={handleChange}
          required
          fullWidth
        />

        <div className="space-y-1">
          <label className={`block text-sm font-medium text-[${theme.colors.primary.text}]`}>
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            className={`w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[${theme.colors.primary.main}]/20 focus:border-[${theme.colors.primary.main}] min-h-[150px]`}
          />
        </div>

        <Input
          label="Category"
          name="category"
          value={formData.category}
          onChange={handleChange}
          placeholder="e.g., Technical, Billing, General"
          fullWidth
        />

        <div className="space-y-1">
          <label className={`block text-sm font-medium text-[${theme.colors.primary.text}]`}>
            Priority
          </label>
          <select
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            className={`w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[${theme.colors.primary.main}]/20 focus:border-[${theme.colors.primary.main}]`}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>

        <Button type="submit" loading={loading} fullWidth>
          Create Ticket
        </Button>
      </form>
    </div>
  );
} 