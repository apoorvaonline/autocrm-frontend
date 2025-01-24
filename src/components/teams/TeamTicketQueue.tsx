import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../shared/Table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../shared/Card";
import { Button } from "../shared/Button";
import { ticketRoutingService } from "../../services/ticketRoutingService";
import { ticketService, type Ticket } from "../../services/ticketService";
import { Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { supabase } from "../../config/supabase";

interface Props {
  teamId: string;
}

type TicketWithDetails = Ticket & {
  customer: {
    full_name: string;
    email: string;
  };
  assigned_to?: {
    full_name: string;
  };
  team?: {
    name: string;
  };
};

const statusStyles = {
  new: "bg-blue-100 text-blue-800",
  open: "bg-yellow-100 text-yellow-800",
  pending: "bg-purple-100 text-purple-800",
} as const;

const priorityStyles = {
  low: "bg-gray-100 text-gray-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-orange-100 text-orange-800",
  urgent: "bg-red-100 text-red-800",
} as const;

export function TeamTicketQueue({ teamId }: Props) {
  const [tickets, setTickets] = useState<TicketWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTickets = async () => {
      try {
        setLoading(true);
        const data = await ticketRoutingService.getTeamTicketQueue(teamId);
        setTickets(data);
      } catch (error) {
        console.error("Error loading team ticket queue:", error);
      } finally {
        setLoading(false);
      }
    };

    loadTickets();
  }, [teamId]);

  const handleAssignToMe = async (ticketId: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      await ticketService.assignTicket(ticketId, user.id);
      // Refresh tickets
      const data = await ticketRoutingService.getTeamTicketQueue(teamId);
      setTickets(data);
    } catch (error) {
      console.error("Error assigning ticket:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Ticket Queue</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Waiting Time</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets.map((ticket) => (
              <TableRow key={ticket.id}>
                <TableCell className="font-mono">{ticket.id.slice(0, 8)}</TableCell>
                <TableCell>{ticket.subject}</TableCell>
                <TableCell>{ticket.customer.full_name}</TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      statusStyles[ticket.status as keyof typeof statusStyles]
                    }`}
                  >
                    {ticket.status}
                  </span>
                </TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      priorityStyles[ticket.priority as keyof typeof priorityStyles]
                    }`}
                  >
                    {ticket.priority}
                  </span>
                </TableCell>
                <TableCell>
                  {formatDistanceToNow(new Date(ticket.created_at), {
                    addSuffix: true,
                  })}
                </TableCell>
                <TableCell>
                  {ticket.assigned_to?.full_name || "Unassigned"}
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    {!ticket.assigned_to && (
                      <Button
                        variant="secondary"
                        onClick={() => handleAssignToMe(ticket.id)}
                      >
                        Assign to Me
                      </Button>
                    )}
                    <Button variant="secondary">View</Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {tickets.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  No tickets in queue
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
} 