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
import { ticketRoutingService, type TeamAssignmentRule } from "../../services/ticketRoutingService";
import { Loader2 } from "lucide-react";
import { AssignmentRuleModal } from "./AssignmentRuleModal";

interface Props {
  teamId: string;
}

export function TeamAssignmentRules({ teamId }: Props) {
  const [rules, setRules] = useState<TeamAssignmentRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<TeamAssignmentRule | null>(null);

  useEffect(() => {
    const loadRules = async () => {
      try {
        setLoading(true);
        const data = await ticketRoutingService.getTeamAssignmentRules(teamId);
        setRules(data);
      } catch (error) {
        console.error("Error loading assignment rules:", error);
      } finally {
        setLoading(false);
      }
    };

    loadRules();
  }, [teamId]);

  const handleToggleRule = async (rule: TeamAssignmentRule) => {
    try {
      await ticketRoutingService.updateAssignmentRule(rule.id, {
        is_active: !rule.is_active,
      });
      // Refresh rules
      const data = await ticketRoutingService.getTeamAssignmentRules(teamId);
      setRules(data);
    } catch (error) {
      console.error("Error toggling rule:", error);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm("Are you sure you want to delete this rule?")) return;

    try {
      await ticketRoutingService.deleteAssignmentRule(ruleId);
      // Refresh rules
      const data = await ticketRoutingService.getTeamAssignmentRules(teamId);
      setRules(data);
    } catch (error) {
      console.error("Error deleting rule:", error);
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
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Assignment Rules</CardTitle>
        <Button onClick={() => setIsCreateModalOpen(true)}>Add Rule</Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Conditions</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rules.map((rule) => (
              <TableRow key={rule.id}>
                <TableCell className="font-medium">{rule.name}</TableCell>
                <TableCell>{rule.description}</TableCell>
                <TableCell>{rule.priority}</TableCell>
                <TableCell>
                  <div className="space-y-1">
                    {Object.entries(rule.conditions).map(([key, value]) => (
                      <div key={key} className="text-sm">
                        <span className="font-medium">{key}:</span>{" "}
                        {Array.isArray(value) ? value.join(", ") : value}
                      </div>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      rule.is_active
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {rule.is_active ? "Active" : "Inactive"}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      variant="secondary"
                      onClick={() => handleToggleRule(rule)}
                    >
                      {rule.is_active ? "Disable" : "Enable"}
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => setEditingRule(rule)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => handleDeleteRule(rule.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {rules.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  No assignment rules configured
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>

      {isCreateModalOpen && (
        <AssignmentRuleModal
          teamId={teamId}
          onClose={() => setIsCreateModalOpen(false)}
          onSave={async (rule) => {
            if (!rule.name || !rule.priority || !rule.conditions) {
              return;
            }
            await ticketRoutingService.createAssignmentRule({
              team_id: teamId,
              name: rule.name,
              description: rule.description || "",
              is_active: true,
              priority: rule.priority,
              conditions: rule.conditions,
            });
            setIsCreateModalOpen(false);
            const data = await ticketRoutingService.getTeamAssignmentRules(teamId);
            setRules(data);
          }}
        />
      )}

      {editingRule && (
        <AssignmentRuleModal
          teamId={teamId}
          rule={editingRule}
          onClose={() => setEditingRule(null)}
          onSave={async (updates) => {
            if (!updates.name || !updates.priority || !updates.conditions) {
              return;
            }
            await ticketRoutingService.updateAssignmentRule(editingRule.id, {
              name: updates.name,
              description: updates.description || "",
              priority: updates.priority,
              conditions: updates.conditions,
            });
            setEditingRule(null);
            const data = await ticketRoutingService.getTeamAssignmentRules(teamId);
            setRules(data);
          }}
        />
      )}
    </Card>
  );
} 