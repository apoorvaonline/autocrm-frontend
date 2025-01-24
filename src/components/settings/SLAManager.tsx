import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../shared/Card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../shared/Table";
import { Button } from "../shared/Button";
import { Loader2 } from "lucide-react";
import { slaService, type SLAPolicy } from "../../services/slaService";
import { useAuth } from "../../hooks/useAuth";

interface SLAModalProps {
  policy?: SLAPolicy;
  onClose: () => void;
  onSave: (policy: Omit<SLAPolicy, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
}

const SLAModal = ({ policy, onClose, onSave }: SLAModalProps) => {
  const [name, setName] = useState(policy?.name ?? '');
  const [description, setDescription] = useState(policy?.description ?? '');
  const [priority, setPriority] = useState(policy?.priority ?? 'low');
  const [responseTime, setResponseTime] = useState(policy?.response_time_minutes?.toString() ?? '60');
  const [resolutionTime, setResolutionTime] = useState(policy?.resolution_time_minutes?.toString() ?? '480');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      await onSave({
        name,
        description,
        priority,
        response_time_minutes: parseInt(responseTime),
        resolution_time_minutes: parseInt(resolutionTime),
        is_active: true,
        created_by: user.id
      });
      onClose();
    } catch (error) {
      console.error('Error saving SLA policy:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">
          {policy ? 'Edit SLA Policy' : 'Create SLA Policy'}
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={description ?? ''}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-2 border rounded"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full p-2 border rounded"
                required
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Response Time (minutes)</label>
              <input
                type="number"
                value={responseTime}
                onChange={(e) => setResponseTime(e.target.value)}
                className="w-full p-2 border rounded"
                min="1"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Resolution Time (minutes)</label>
              <input
                type="number"
                value={resolutionTime}
                onChange={(e) => setResolutionTime(e.target.value)}
                className="w-full p-2 border rounded"
                min="1"
                required
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <Button
              variant="tertiary"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              loading={loading}
            >
              {policy ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const SLAManager = () => {
  const [policies, setPolicies] = useState<SLAPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<SLAPolicy | undefined>();
  const { user, userRole } = useAuth();

  useEffect(() => {
    loadPolicies();
  }, []);

  const loadPolicies = async () => {
    try {
      const data = await slaService.getSLAPolicies();
      setPolicies(data);
    } catch (error) {
      console.error('Error loading SLA policies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePolicy = async (policy: Omit<SLAPolicy, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      await slaService.createSLAPolicy(policy);
      await loadPolicies();
    } catch (error) {
      console.error('Error creating SLA policy:', error);
    }
  };

  const handleUpdatePolicy = async (policy: Omit<SLAPolicy, 'id' | 'created_at' | 'updated_at'>) => {
    if (!editingPolicy) return;
    try {
      await slaService.updateSLAPolicy(editingPolicy.id, policy);
      await loadPolicies();
    } catch (error) {
      console.error('Error updating SLA policy:', error);
    }
  };

  const handleDeletePolicy = async (id: string) => {
    if (!confirm('Are you sure you want to delete this SLA policy?')) return;
    try {
      await slaService.deleteSLAPolicy(id);
      await loadPolicies();
    } catch (error) {
      console.error('Error deleting SLA policy:', error);
    }
  };

  const handleToggleStatus = async (id: string, isActive: boolean) => {
    try {
      await slaService.toggleSLAPolicyStatus(id, !isActive);
      await loadPolicies();
    } catch (error) {
      console.error('Error toggling SLA policy status:', error);
    }
  };

  const openCreateModal = () => {
    setEditingPolicy(undefined);
    setShowModal(true);
  };

  const openEditModal = (policy: SLAPolicy) => {
    setEditingPolicy(policy);
    setShowModal(true);
  };

  if (!user) return null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>SLA Policies</CardTitle>
        {userRole === "admin" && (
          <Button
            variant="primary"
            onClick={() => setShowModal(true)}
          >
            Add Policy
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center p-4">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Response Time</TableHead>
                <TableHead>Resolution Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {policies.map((policy) => (
                <TableRow key={policy.id}>
                  <TableCell>{policy.name}</TableCell>
                  <TableCell className="capitalize">{policy.priority}</TableCell>
                  <TableCell>{policy.response_time_minutes} minutes</TableCell>
                  <TableCell>{policy.resolution_time_minutes} minutes</TableCell>
                  <TableCell>
                    <Button
                      variant={policy.is_active ? "outline" : "secondary"}
                      onClick={() => handleToggleStatus(policy.id, policy.is_active)}
                    >
                      {policy.is_active ? 'Active' : 'Inactive'}
                    </Button>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="tertiary"
                        onClick={() => setEditingPolicy(policy)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="tertiary"
                        onClick={() => handleToggleStatus(policy.id, policy.is_active)}
                      >
                        {policy.is_active ? 'Disable' : 'Enable'}
                      </Button>
                      <Button
                        variant="danger"
                        onClick={() => handleDeletePolicy(policy.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {showModal && (
        <SLAModal
          policy={editingPolicy}
          onClose={() => setShowModal(false)}
          onSave={editingPolicy ? handleUpdatePolicy : handleCreatePolicy}
        />
      )}
    </Card>
  );
} 