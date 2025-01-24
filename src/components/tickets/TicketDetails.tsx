import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../shared/Card';
import { Loader2 } from 'lucide-react';
import { ticketService, type TicketWithDetails } from '../../services/ticketService';
import { SLAStatusIndicator } from './SLAStatusIndicator';
import { formatDistanceToNow } from 'date-fns';
import { TicketCommunication } from './TicketCommunication';
import { Button } from '../shared/Button';

export function TicketDetails() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const [ticket, setTicket] = useState<TicketWithDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (ticketId) {
      loadTicket();
    }
  }, [ticketId]);

  const loadTicket = async () => {
    if (!ticketId) return;
    try {
      setLoading(true);
      const data = await ticketService.getTicketDetails(ticketId);
      setTicket(data);
    } catch (error) {
      console.error('Error loading ticket:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!ticket) {
    return <div>Ticket not found</div>;
  }

  return (
    <div className="space-y-6">
      {/* Ticket Details Card */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Ticket #{ticket.id.slice(0, 8)}</CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                From: {ticket.customer.full_name} ({ticket.customer.email})
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-1 text-sm rounded-full ${
                ticket.status === 'new' ? 'bg-blue-100 text-blue-800' :
                ticket.status === 'open' ? 'bg-yellow-100 text-yellow-800' :
                ticket.status === 'pending' ? 'bg-purple-100 text-purple-800' :
                ticket.status === 'resolved' ? 'bg-green-100 text-green-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {ticket.status}
              </span>
              <span className={`px-2 py-1 text-sm rounded-full ${
                ticket.priority === 'low' ? 'bg-gray-100 text-gray-800' :
                ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                ticket.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                'bg-red-100 text-red-800'
              }`}>
                {ticket.priority}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="prose max-w-none">
              {ticket.description}
            </div>
            <div className="flex justify-between items-center text-sm text-gray-500">
              <div>
                Created {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
              </div>
              <div>
                Assigned to: {ticket.assigned_to?.full_name || 'Unassigned'} 
                {ticket.team && ` (${ticket.team.name})`}
              </div>
            </div>
            <div>
              <SLAStatusIndicator 
                responseDeadline={ticket.sla_response_due_at}
                resolutionDeadline={ticket.sla_resolution_due_at}
                firstResponseAt={ticket.first_response_at}
                status={ticket.status}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Communication Section */}
      <Card>
        <CardHeader>
          <CardTitle>Communication</CardTitle>
        </CardHeader>
        <CardContent>
          <TicketCommunication 
            ticketId={ticket.id} 
            messages={ticket.messages}
            onMessageSent={loadTicket} 
          />
        </CardContent>
      </Card>

      {/* Action buttons */}
      <div className="flex gap-2">
        {ticket.status === 'closed' ? (
          <Button variant="secondary">Reopen Ticket</Button>
        ) : (
          <>
            <Button variant="primary">Resolve</Button>
            <Button variant="secondary">Close</Button>
          </>
        )}
      </div>
    </div>
  );
} 