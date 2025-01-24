import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/shared/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/shared/Table';
import { Button } from '../components/shared/Button';
import { Loader2, Calendar } from 'lucide-react';
import { supabase } from '../config/supabase';
import { subDays, startOfDay, endOfDay } from 'date-fns';

interface SLAMetrics {
  total_tickets: number;
  breached_tickets: number;
  avg_response_time: number;
  avg_resolution_time: number;
  breach_by_priority: Record<string, number>;
  breach_by_team: Record<string, number>;
}

interface TeamBreachData {
  team_name: string;
  total_breaches: number;
  response_breaches: number;
  resolution_breaches: number;
  compliance_rate: number;
}

// interface TicketData {
//   id: string;
//   created_at: string;
//   first_response_at: string | null;
//   status: string;
//   priority: string;
//   team_id: string;
//   teams: {
//     name: string;
//   } | null;
// }

// interface BreachData {
//   ticket_id: string;
//   breach_type: 'response_time' | 'resolution_time';
//   tickets: {
//     priority: string;
//     team_id: string;
//     teams: {
//       name: string;
//     } | null;
//   };
// }

interface SupabaseBreachData {
  ticket_id: string;
  breach_type: string;
  tickets: {
    priority: string;
    team_id: string;
    teams: {
      name: string;
    } | null;
  };
}

interface SupabaseTicketData {
  id: string;
  created_at: string;
  first_response_at: string | null;
  status: string;
  priority: string;
  team_id: string;
  teams: {
    name: string;
  } | null;
}

export const SLADashboard = () => {
  const [metrics, setMetrics] = useState<SLAMetrics | null>(null);
  const [teamData, setTeamData] = useState<TeamBreachData[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState(30); // Default to 30 days

  useEffect(() => {
    loadMetrics();
  }, [dateRange]);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      const startDate = startOfDay(subDays(new Date(), dateRange));
      const endDate = endOfDay(new Date());

      // Get total tickets and breached tickets
      const { data: breachData, error: breachError } = await supabase
        .from('sla_breach_logs')
        .select(`
          ticket_id,
          breach_type,
          tickets!inner(
            priority,
            team_id,
            teams(name)
          )
        `)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString()) as { data: SupabaseBreachData[] | null, error: any };

      if (breachError) throw breachError;

      // Get response and resolution times
      const { data: ticketData, error: ticketError } = await supabase
        .from('tickets')
        .select(`
          id,
          created_at,
          first_response_at,
          status,
          priority,
          team_id,
          teams(name)
        `)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .not('sla_policy_id', 'is', null) as { data: SupabaseTicketData[] | null, error: any };

      if (ticketError) throw ticketError;

      // Process metrics
      const totalTickets = ticketData?.length ?? 0;
      const breachedTickets = new Set(breachData?.map(b => b.ticket_id)).size;
      
      // Calculate average times
      const responseTimes = ticketData
        ?.filter(t => t.first_response_at)
        .map(t => new Date(t.first_response_at!).getTime() - new Date(t.created_at).getTime());
      
      const avgResponseTime = responseTimes?.length
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length / (1000 * 60) // Convert to minutes
        : 0;

      // Process breach data by priority and team
      const breachByPriority: Record<string, number> = {};
      const breachByTeam: Record<string, number> = {};
      const teamBreaches: Record<string, { total: number, response: number, resolution: number, tickets: number }> = {};

      breachData?.forEach((breach) => {
        const ticket = breach.tickets;
        const team = ticket.teams;

        // Count by priority
        breachByPriority[ticket.priority] = (breachByPriority[ticket.priority] || 0) + 1;

        // Count by team
        if (team) {
          breachByTeam[team.name] = (breachByTeam[team.name] || 0) + 1;

          // Detailed team metrics
          if (!teamBreaches[team.name]) {
            teamBreaches[team.name] = { total: 0, response: 0, resolution: 0, tickets: 0 };
          }
          teamBreaches[team.name].total++;
          if (breach.breach_type === 'response_time') {
            teamBreaches[team.name].response++;
          } else {
            teamBreaches[team.name].resolution++;
          }
        }
      });

      // Calculate team compliance rates
      const teamMetrics = Object.entries(teamBreaches).map(([teamName, data]) => {
        const teamTickets = ticketData?.filter(t => t.teams?.name === teamName).length ?? 0;
        return {
          team_name: teamName,
          total_breaches: data.total,
          response_breaches: data.response,
          resolution_breaches: data.resolution,
          compliance_rate: teamTickets > 0 ? ((teamTickets - data.total) / teamTickets) * 100 : 0
        };
      });

      setMetrics({
        total_tickets: totalTickets,
        breached_tickets: breachedTickets,
        avg_response_time: avgResponseTime,
        avg_resolution_time: 0, // Calculate this similarly to response time
        breach_by_priority: breachByPriority,
        breach_by_team: breachByTeam
      });

      setTeamData(teamMetrics);
    } catch (error) {
      console.error('Error loading SLA metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">SLA Performance Dashboard</h1>
        <div className="flex gap-2">
          <Button
            variant="primary"
            onClick={() => setDateRange(7)}
          >
            7 Days
          </Button>
          <Button
            variant="secondary"
            onClick={() => setDateRange(30)}
          >
            30 Days
          </Button>
          <Button
            variant="secondary"
            onClick={() => setDateRange(90)}
          >
            90 Days
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.total_tickets}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>SLA Breaches</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {metrics?.breached_tickets}
            </div>
            <div className="text-sm text-gray-500">
              {metrics && metrics.total_tickets > 0 ? 
                `${((metrics.breached_tickets / metrics.total_tickets) * 100).toFixed(1)}% breach rate` : 
                '0% breach rate'
              }
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Avg Response Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.avg_response_time.toFixed(0)} min
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Date Range</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-gray-500">
              <Calendar className="h-4 w-4 mr-2" />
              Last {dateRange} days
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Team Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Team</TableHead>
                <TableHead>Total Breaches</TableHead>
                <TableHead>Response Breaches</TableHead>
                <TableHead>Resolution Breaches</TableHead>
                <TableHead>Compliance Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teamData.map((team) => (
                <TableRow key={team.team_name}>
                  <TableCell>{team.team_name}</TableCell>
                  <TableCell>{team.total_breaches}</TableCell>
                  <TableCell>{team.response_breaches}</TableCell>
                  <TableCell>{team.resolution_breaches}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <div
                        className="h-2 rounded-full bg-green-500"
                        style={{ width: `${team.compliance_rate}%` }}
                      />
                      <span className="ml-2">{team.compliance_rate.toFixed(1)}%</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Breaches by Priority</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Priority</TableHead>
                  <TableHead>Breaches</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(metrics?.breach_by_priority ?? {}).map(([priority, count]) => (
                  <TableRow key={priority}>
                    <TableCell className="capitalize">{priority}</TableCell>
                    <TableCell>{count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}; 