import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../shared/Card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../shared/Tabs";
import { DatePickerWithRange } from "../shared/DatePickerWithRange";
import { subDays } from "date-fns";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { type TeamMetrics as TeamMetricsType, teamMetricsService } from "../../services/teamMetricsService";
import { Loader2 } from "lucide-react";
import { DateRange } from "react-day-picker";

interface Props {
  teamId: string;
}

export function TeamMetrics({ teamId }: Props) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [metrics, setMetrics] = useState<TeamMetricsType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      if (!dateRange?.from || !dateRange?.to) return;
      
      try {
        setLoading(true);
        const data = await teamMetricsService.getTeamMetrics(
          teamId,
          dateRange.from,
          dateRange.to
        );
        setMetrics(data);
      } catch (error) {
        console.error("Error fetching team metrics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [teamId, dateRange]);

  const calculateAverages = () => {
    if (!metrics.length) return null;

    return {
      avgResolutionTime:
        metrics.reduce(
          (sum, m) =>
            sum + (m.avg_resolution_time ? parseFloat(m.avg_resolution_time) : 0),
          0
        ) / metrics.length,
      avgResponseTime:
        metrics.reduce(
          (sum, m) =>
            sum +
            (m.avg_first_response_time
              ? parseFloat(m.avg_first_response_time)
              : 0),
          0
        ) / metrics.length,
      avgSatisfactionScore:
        metrics.reduce(
          (sum, m) => sum + (m.customer_satisfaction_score || 0),
          0
        ) / metrics.length,
      totalTickets: metrics.reduce((sum, m) => sum + m.total_tickets, 0),
      resolvedTickets: metrics.reduce((sum, m) => sum + m.resolved_tickets, 0),
    };
  };

  const averages = calculateAverages();

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
        <h2 className="text-2xl font-bold">Team Performance Metrics</h2>
        <DatePickerWithRange
          date={dateRange}
          setDate={setDateRange}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averages?.totalTickets || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolution Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {averages
                ? Math.round((averages.resolvedTickets / averages.totalTickets) * 100)
                : 0}
              %
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {averages?.avgResponseTime
                ? Math.round(averages.avgResponseTime)
                : 0}{" "}
              min
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Customer Satisfaction
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {averages?.avgSatisfactionScore
                ? averages.avgSatisfactionScore.toFixed(1)
                : "N/A"}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="col-span-4">
        <CardHeader>
          <CardTitle>Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="tickets">
            <TabsList>
              <TabsTrigger value="tickets">Tickets</TabsTrigger>
              <TabsTrigger value="response">Response Time</TabsTrigger>
              <TabsTrigger value="satisfaction">Satisfaction</TabsTrigger>
            </TabsList>
            <TabsContent value="tickets" className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={metrics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="period_start"
                    tickFormatter={(value) =>
                      new Date(value).toLocaleDateString()
                    }
                  />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(value) =>
                      new Date(value).toLocaleDateString()
                    }
                  />
                  <Line
                    type="monotone"
                    dataKey="total_tickets"
                    name="Total Tickets"
                    stroke="#8884d8"
                  />
                  <Line
                    type="monotone"
                    dataKey="resolved_tickets"
                    name="Resolved Tickets"
                    stroke="#82ca9d"
                  />
                </LineChart>
              </ResponsiveContainer>
            </TabsContent>
            <TabsContent value="response" className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={metrics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="period_start"
                    tickFormatter={(value) =>
                      new Date(value).toLocaleDateString()
                    }
                  />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(value) =>
                      new Date(value).toLocaleDateString()
                    }
                  />
                  <Line
                    type="monotone"
                    dataKey="avg_first_response_time"
                    name="Avg Response Time"
                    stroke="#8884d8"
                  />
                  <Line
                    type="monotone"
                    dataKey="avg_resolution_time"
                    name="Avg Resolution Time"
                    stroke="#82ca9d"
                  />
                </LineChart>
              </ResponsiveContainer>
            </TabsContent>
            <TabsContent value="satisfaction" className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={metrics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="period_start"
                    tickFormatter={(value) =>
                      new Date(value).toLocaleDateString()
                    }
                  />
                  <YAxis domain={[0, 5]} />
                  <Tooltip
                    labelFormatter={(value) =>
                      new Date(value).toLocaleDateString()
                    }
                  />
                  <Line
                    type="monotone"
                    dataKey="customer_satisfaction_score"
                    name="Customer Satisfaction"
                    stroke="#8884d8"
                  />
                </LineChart>
              </ResponsiveContainer>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
} 