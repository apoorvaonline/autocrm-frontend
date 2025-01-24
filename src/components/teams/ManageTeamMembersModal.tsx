import { useState, useEffect } from 'react';
import { Team, TeamMember, teamService } from '../../services/teamService';
import { Button } from '../shared/Button';
import { Modal } from '../shared/Modal';
import { EmployeeSelect } from '../shared/EmployeeSelect';

interface TeamMemberWithUser extends TeamMember {
  user: {
    full_name: string;
    email: string;
  };
}

interface ManageTeamMembersModalProps {
  team: Team;
  onClose: () => void;
}

export function ManageTeamMembersModal({ team, onClose }: ManageTeamMembersModalProps) {
  console.log('ManageTeamMembersModal rendered for team:', team.name);
  const [members, setMembers] = useState<TeamMemberWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [newMemberRole, setNewMemberRole] = useState<'member' | 'lead'>('member');
  const [addingError, setAddingError] = useState('');

  const loadMembers = async () => {
    try {
      setLoading(true);
      const data = await teamService.getTeamMembers(team.id);
      setMembers(data as TeamMemberWithUser[]);
      setError('');
    } catch (err) {
      console.error('Error loading team members:', err);
      setError('Failed to load team members');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, [team.id]);

  const handleAddMember = async (employee: { id: string; email: string }) => {
    try {
      setAddingError('');
      await teamService.addTeamMember(team.id, employee.id, newMemberRole);
      await loadMembers();
      setIsAddingMember(false);
      setNewMemberRole('member');
    } catch (err) {
      console.error('Error adding team member:', err);
      setAddingError('Failed to add team member');
    }
  };

  const handleRemoveMember = async (userId: string) => {
    try {
      await teamService.removeTeamMember(team.id, userId);
      await loadMembers();
    } catch (err) {
      console.error('Error removing team member:', err);
      setError('Failed to remove team member');
    }
  };

  const handleRoleChange = async (userId: string, newRole: 'member' | 'lead') => {
    try {
      await teamService.updateTeamMemberRole(team.id, userId, newRole);
      await loadMembers();
    } catch (err) {
      console.error('Error updating team member role:', err);
      setError('Failed to update team member role');
    }
  };

  // Get the list of existing member IDs
  const existingMemberIds = members.map(member => member.user_id);

  return (
    <Modal title={`Manage ${team.name} Members`} onClose={onClose}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">Team Members</h3>
          <Button onClick={() => setIsAddingMember(true)}>Add Member</Button>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        {loading ? (
          <div className="text-center py-4">Loading members...</div>
        ) : (
          <div className="space-y-4">
            {members.map(member => (
              <div
                key={member.id}
                className="flex items-center justify-between bg-gray-50 p-4 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-900">{member.user.full_name}</p>
                  <p className="text-sm text-gray-500">{member.user.email}</p>
                </div>
                <div className="flex items-center space-x-4">
                  <select
                    value={member.role}
                    onChange={(e) => handleRoleChange(member.user_id, e.target.value as 'member' | 'lead')}
                    className="rounded-md border-gray-300 text-sm"
                  >
                    <option value="member">Member</option>
                    <option value="lead">Lead</option>
                  </select>
                  <Button
                    variant="danger"
                    onClick={() => handleRemoveMember(member.user_id)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}

            {members.length === 0 && !error && (
              <p className="text-center text-gray-500 py-4">No members in this team</p>
            )}
          </div>
        )}

        {isAddingMember && (
          <div className="space-y-4 border-t pt-4">
            <div>
              <label
                htmlFor="member-search"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Search Employee
              </label>
              <EmployeeSelect
                onSelect={handleAddMember}
                onBlur={() => setAddingError('')}
                placeholder="Search by name or email..."
                excludeUserIds={existingMemberIds}
              />
            </div>

            <div>
              <label
                htmlFor="member-role"
                className="block text-sm font-medium text-gray-700"
              >
                Role
              </label>
              <select
                id="member-role"
                value={newMemberRole}
                onChange={(e) => setNewMemberRole(e.target.value as 'member' | 'lead')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="member">Member</option>
                <option value="lead">Lead</option>
              </select>
            </div>

            {addingError && <p className="text-sm text-red-600">{addingError}</p>}

            <div className="flex justify-end">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsAddingMember(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
} 