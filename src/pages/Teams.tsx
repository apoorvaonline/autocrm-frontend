import { useState, useEffect } from 'react';
import { Team, teamService } from '../services/teamService';
import { Button } from '../components/shared/Button';
import { CreateTeamModal } from '../components/teams/CreateTeamModal';
import { EditTeamModal } from '../components/teams/EditTeamModal';
import { ManageTeamMembersModal } from '../components/teams/ManageTeamMembersModal';
import { TeamMetrics } from '../components/teams/TeamMetrics';
import { TeamMemberMetrics } from '../components/teams/TeamMemberMetrics';
import { TeamAssignmentRules } from '../components/teams/TeamAssignmentRules';
import { useAuth } from '../context/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/shared/Tabs';

export function Teams() {
  const { loading: authLoading, userRole } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [managingTeam, setManagingTeam] = useState<Team | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [activeTab, setActiveTab] = useState('list');

  const loadTeams = async () => {
    try {
      setLoading(true);
      const data = await teamService.getTeams();
      setTeams(data);
      setError('');
    } catch (err) {
      console.error('Error loading teams:', err);
      setError('Failed to load teams');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && (userRole === 'admin' || userRole === 'employee')) {
      loadTeams();
    }
  }, [authLoading, userRole]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && (userRole === 'admin' || userRole === 'employee')) {
        loadTeams();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [userRole]);

  const handleCreateTeam = () => {
    setIsCreateModalOpen(true);
  };

  const handleEditTeam = (team: Team) => {
    setEditingTeam(team);
  };

  const handleManageMembers = (team: Team) => {
    setManagingTeam(team);
  };

  const handleViewMetrics = (team: Team) => {
    setSelectedTeam(team);
    setActiveTab('metrics');
  };

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
          <p>Loading teams...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={loadTeams}>Try Again</Button>
      </div>
    );
  }

  if (!userRole || (userRole !== 'admin' && userRole !== 'employee')) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-4">You don't have permission to view teams</p>
      </div>
    );
  }

  const renderTeamList = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Teams</h1>
        <Button onClick={handleCreateTeam}>Create Team</Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {teams.map(team => (
          <div
            key={team.id}
            className="bg-white rounded-lg shadow-md p-6 space-y-4"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {team.name}
                </h3>
                {team.description && (
                  <p className="text-sm text-gray-500 mt-1">
                    {team.description}
                  </p>
                )}
              </div>
              <span
                className={`px-2 py-1 text-xs rounded-full ${
                  team.is_active
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {team.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>

            <div className="flex flex-wrap gap-2 justify-end">
              <Button 
                variant="secondary"
                className="whitespace-nowrap"
                onClick={() => handleManageMembers(team)}
              >
                Manage Members
              </Button>
              <Button 
                variant="secondary"
                onClick={() => handleEditTeam(team)}
              >
                Edit
              </Button>
              <Button 
                variant="secondary"
                className="whitespace-nowrap"
                onClick={() => handleViewMetrics(team)}
              >
                View Metrics
              </Button>
            </div>
          </div>
        ))}

        {teams.length === 0 && (
          <div className="col-span-full text-center py-12 bg-white rounded-lg">
            <p className="text-gray-500">No teams found</p>
            <Button
              variant="secondary"
              onClick={handleCreateTeam}
              className="mt-4"
            >
              Create your first team
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  const renderMetrics = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Team Performance</h1>
        <select
          className="border rounded-md p-2"
          value={selectedTeam?.id || ''}
          onChange={(e) => {
            const team = teams.find(t => t.id === e.target.value);
            setSelectedTeam(team || null);
          }}
        >
          <option value="">Select a team</option>
          {teams.map(team => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </select>
      </div>

      {selectedTeam ? (
        <div className="space-y-8">
          <TeamMetrics teamId={selectedTeam.id} />
          <TeamMemberMetrics teamId={selectedTeam.id} />
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg">
          <p className="text-gray-500">Select a team to view metrics</p>
        </div>
      )}
    </div>
  );

  const renderAssignmentRules = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Team Assignment Rules</h1>
        <select
          className="border rounded-md p-2"
          value={selectedTeam?.id || ''}
          onChange={(e) => {
            const team = teams.find(t => t.id === e.target.value);
            setSelectedTeam(team || null);
          }}
        >
          <option value="">Select a team</option>
          {teams.map(team => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </select>
      </div>

      {selectedTeam ? (
        <TeamAssignmentRules teamId={selectedTeam.id} />
      ) : (
        <div className="text-center py-12 bg-white rounded-lg">
          <p className="text-gray-500">Select a team to manage assignment rules</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="list">Team List</TabsTrigger>
          <TabsTrigger value="metrics">Performance Metrics</TabsTrigger>
          {userRole === 'admin' && (
            <TabsTrigger value="rules">Assignment Rules</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="list">
          {renderTeamList()}
        </TabsContent>

        <TabsContent value="metrics">
          {renderMetrics()}
        </TabsContent>

        {userRole === 'admin' && (
          <TabsContent value="rules">
            {renderAssignmentRules()}
          </TabsContent>
        )}
      </Tabs>

      {isCreateModalOpen && (
        <CreateTeamModal
          onClose={() => setIsCreateModalOpen(false)}
          onTeamCreated={() => {
            setIsCreateModalOpen(false);
            loadTeams();
          }}
        />
      )}

      {editingTeam && (
        <EditTeamModal
          team={editingTeam}
          onClose={() => setEditingTeam(null)}
          onTeamUpdated={() => {
            setEditingTeam(null);
            loadTeams();
          }}
        />
      )}

      {managingTeam && (
        <ManageTeamMembersModal
          team={managingTeam}
          onClose={() => setManagingTeam(null)}
        />
      )}
    </div>
  );
} 