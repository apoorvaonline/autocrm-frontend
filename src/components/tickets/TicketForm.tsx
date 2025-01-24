import { useState, useEffect } from 'react';
import { Button } from '../shared/Button';
import { Card } from '../shared/Card';
import { Loader2 } from 'lucide-react';
import { ticketService } from '../../services/ticketService';
import { slaService, type SLAPolicy } from '../../services/slaService';
import { useAuth } from '../../hooks/useAuth';

// ... existing imports and interfaces ...

export const TicketForm = ({ ticket, onSubmit, onCancel }: TicketFormProps) => {
  // ... existing state ...
  const [slaPolicies, setSLAPolicies] = useState<SLAPolicy[]>([]);
  const [selectedSLAPolicy, setSelectedSLAPolicy] = useState(ticket?.sla_policy_id ?? '');
  const [loadingPolicies, setLoadingPolicies] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user?.role !== 'customer') {
      loadSLAPolicies();
    }
  }, [user]);

  const loadSLAPolicies = async () => {
    setLoadingPolicies(true);
    try {
      const policies = await slaService.getSLAPolicies();
      setSLAPolicies(policies.filter(p => p.is_active));
    } catch (error) {
      console.error('Error loading SLA policies:', error);
    } finally {
      setLoadingPolicies(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const ticketData = {
        subject,
        description,
        status,
        priority,
        category_id: selectedCategory,
        team_id: selectedTeam,
        assigned_to: selectedAssignee,
        sla_policy_id: selectedSLAPolicy || null
      };

      await onSubmit(ticketData);
    } catch (error) {
      console.error('Error submitting ticket:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-4 p-4">
        {/* ... existing form fields ... */}

        {user?.role !== 'customer' && (
          <div>
            <label className="block text-sm font-medium mb-1">SLA Policy</label>
            <select
              value={selectedSLAPolicy}
              onChange={(e) => setSelectedSLAPolicy(e.target.value)}
              className="w-full p-2 border rounded"
              disabled={loadingPolicies}
            >
              <option value="">No SLA Policy</option>
              {slaPolicies.map((policy) => (
                <option key={policy.id} value={policy.id}>
                  {policy.name} ({policy.priority})
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel} type="button">
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {ticket ? 'Update' : 'Create'} Ticket
          </Button>
        </div>
      </form>
    </Card>
  );
}; 