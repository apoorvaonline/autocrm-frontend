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
import { DatePickerWithRange } from "../shared/DatePickerWithRange";
import { subDays } from "date-fns";
import { type TeamMemberMetrics as TeamMemberMetricsType, teamMetricsService } from "../../services/teamMetricsService";
import { Loader2 } from "lucide-react";
import { DateRange } from "react-day-picker";

interface Props {
  teamId: string;
}

export function TeamMemberMetrics({ teamId }: Props) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [metrics, setMetrics] = useState<TeamMemberMetricsType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      if (!dateRange?.from || !dateRange?.to) return;

      try {
        setLoading(true);
        const data = await teamMetricsService.getTeamMemberMetrics(
          teamId,
          dateRange.from,
          dateRange.to
        );
        setMetrics(data);
      } catch (error) {
        console.error("Error fetching team member metrics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [teamId, dateRange]);

  // Group metrics by user
  const memberMetrics = metrics.reduce((acc, metric) => {
    if (!metric.user) return acc;

    const userId = metric.user_id;
    if (!acc[userId]) {
      acc[userId] = {
        user: metric.user,
        metrics: [],
      };
    }
    acc[userId].metrics.push(metric);
    return acc;
  }, {} as Record<string, { user: NonNullable<TeamMemberMetricsType["user"]>; metrics: TeamMemberMetricsType[] }>);

  // Calculate averages for each member
  const memberAverages = Object.entries(memberMetrics).map(([userId, data]) => {
    const metrics = data.metrics;
    return {
      userId,
      user: data.user,
      ticketsHandled: metrics.reduce((sum, m) => sum + m.tickets_handled, 0),
      ticketsResolved: metrics.reduce((sum, m) => sum + m.tickets_resolved, 0),
      avgResponseTime:
        metrics.reduce(
          (sum, m) => sum + (m.avg_response_time ? parseFloat(m.avg_response_time) : 0),
          0
        ) / metrics.length,
      avgResolutionTime:
        metrics.reduce(
          (sum, m) =>
            sum + (m.avg_resolution_time ? parseFloat(m.avg_resolution_time) : 0),
          0
        ) / metrics.length,
      customerRating:
        metrics.reduce((sum, m) => sum + (m.customer_rating || 0), 0) /
        metrics.length,
    };
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Team Member Performance</h2>
        <DatePickerWithRange
          date={dateRange}
          setDate={setDateRange}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Member Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead className="text-right">Tickets Handled</TableHead>
                <TableHead className="text-right">Resolution Rate</TableHead>
                <TableHead className="text-right">Avg Response (min)</TableHead>
                <TableHead className="text-right">Avg Resolution (min)</TableHead>
                <TableHead className="text-right">Customer Rating</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {memberAverages.map((member) => (
                <TableRow key={member.userId}>
                  <TableCell className="font-medium">
                    {member.user.full_name}
                  </TableCell>
                  <TableCell className="text-right">
                    {member.ticketsHandled}
                  </TableCell>
                  <TableCell className="text-right">
                    {Math.round(
                      (member.ticketsResolved / member.ticketsHandled) * 100
                    )}
                    %
                  </TableCell>
                  <TableCell className="text-right">
                    {Math.round(member.avgResponseTime)}
                  </TableCell>
                  <TableCell className="text-right">
                    {Math.round(member.avgResolutionTime)}
                  </TableCell>
                  <TableCell className="text-right">
                    {member.customerRating.toFixed(1)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
} 