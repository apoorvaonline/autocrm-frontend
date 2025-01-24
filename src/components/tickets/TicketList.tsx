import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Ticket, ticketService } from '../../services/ticketService';
import { Button } from '../shared/Button';
import { theme } from '../../config/theme';
import { useAuth } from '../../context/AuthContext';

interface TicketWithRelations extends Omit<Ticket, 'assigned_to'> {
  customer?: { full_name: string; email: string };
  assigned_to?: { full_name: string } | null;
  team?: { name: string } | null;
}

export function TicketList() {
  const [tickets, setTickets] = useState<TicketWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const { isEmployee, userRole } = useAuth();

  useEffect(() => {
    loadTickets();
  }, [isEmployee, userRole]);

  const loadTickets = async () => {
    try {
      const data = isEmployee 
        ? userRole === 'admin' 
          ? await ticketService.getAllTickets()
          : await ticketService.getEmployeeTickets()
        : await ticketService.getCustomerTickets();
      setTickets(data);
    } catch (err) {
      console.error('Error loading tickets:', err);
      setError('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (ticketId: string, status: Ticket['status']) => {
    try {
      await ticketService.updateTicketStatus(ticketId, status);
      await loadTickets(); // Reload tickets after update
    } catch (err) {
      console.error('Error updating ticket status:', err);
    }
  };

  const getPriorityColor = (priority: Ticket['priority']) => {
    switch (priority) {
      case 'urgent': return 'text-red-600';
      case 'high': return 'text-orange-500';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) return <div>Loading tickets...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="space-y-4">
      <h2 className={`text-2xl font-bold text-[${theme.colors.primary.text}]`}>
        {isEmployee ? 'Active Tickets' : 'My Tickets'}
      </h2>

      <div className="grid gap-4">
        {tickets.map(ticket => (
          <div
            key={ticket.id}
            className="bg-white p-4 rounded-lg shadow-md"
          >
            <div className="flex justify-between items-start">
              <div>
                <Link 
                  to={`/tickets/${ticket.id}`}
                  className="font-semibold text-lg hover:text-[#781E28] transition-colors"
                >
                  {ticket.subject}
                </Link>
                {isEmployee && (
                  <p className="text-sm text-gray-600">
                    From: {ticket.customer?.full_name} ({ticket.customer?.email})
                  </p>
                )}
              </div>
              <div className="text-right">
                <span className={`inline-block px-2 py-1 rounded-full text-sm ${getPriorityColor(ticket.priority)}`}>
                  {ticket.priority}
                </span>
              </div>
            </div>

            <p className="mt-2 text-gray-700">{ticket.description}</p>

            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                <p>Status: {ticket.status}</p>
                {isEmployee && (
                  <>
                    <p>Assigned to: {ticket.assigned_to?.full_name || 'Unassigned'}</p>
                    <p>Team: {ticket.team?.name || 'Unassigned'}</p>
                  </>
                )}
              </div>

              <div className="flex gap-2">
                {isEmployee && (
                  <>
                    <select
                      value={ticket.status}
                      onChange={(e) => handleStatusChange(ticket.id, e.target.value as Ticket['status'])}
                      className="px-3 py-1 rounded border border-gray-300 text-sm"
                    >
                      <option value="new">New</option>
                      <option value="open">Open</option>
                      <option value="pending">Pending</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>

                    <Button variant="secondary" onClick={() => {}}>
                      Assign
                    </Button>
                  </>
                )}

                <Link to={`/tickets/${ticket.id}`}>
                  <Button variant="primary">View Details</Button>
                </Link>
              </div>
            </div>
          </div>
        ))}

        {tickets.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No {isEmployee ? 'active' : ''} tickets found
          </div>
        )}
      </div>
    </div>
  );
} 