import { useAuth } from '../context/AuthContext';
import { theme } from '../config/theme';
import { Button } from '../components/shared/Button';
import { Link } from 'react-router-dom';

export function Dashboard() {
  const { user, userRole } = useAuth();

  const renderCustomerDashboard = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className={`text-lg font-semibold mb-2 text-[${theme.colors.primary.main}]`}>
          My Tickets
        </h3>
        <p className="text-gray-600 mb-4">View and manage your support tickets</p>
        <Link to="/tickets">
          <Button variant="tertiary">View Tickets</Button>
        </Link>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className={`text-lg font-semibold mb-2 text-[${theme.colors.primary.main}]`}>
          Create Ticket
        </h3>
        <p className="text-gray-600 mb-4">Submit a new support request</p>
        <Link to="/tickets/new">
          <Button variant="primary">New Ticket</Button>
        </Link>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className={`text-lg font-semibold mb-2 text-[${theme.colors.primary.main}]`}>
          Knowledge Base
        </h3>
        <p className="text-gray-600">Coming soon...</p>
      </div>
    </div>
  );

  const renderEmployeeDashboard = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className={`text-lg font-semibold mb-2 text-[${theme.colors.primary.main}]`}>
          Assigned Tickets
        </h3>
        <p className="text-gray-600 mb-4">View and manage tickets assigned to you</p>
        <Link to="/tickets">
          <Button variant="tertiary">View Tickets</Button>
        </Link>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className={`text-lg font-semibold mb-2 text-[${theme.colors.primary.main}]`}>
          My Teams
        </h3>
        <p className="text-gray-600 mb-4">View your team assignments and tickets</p>
        <Link to="/teams">
          <Button variant="tertiary">View Teams</Button>
        </Link>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className={`text-lg font-semibold mb-2 text-[${theme.colors.primary.main}]`}>
          Knowledge Base
        </h3>
        <p className="text-gray-600">Coming soon...</p>
      </div>
    </div>
  );

  const renderAdminDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className={`text-lg font-semibold mb-2 text-[${theme.colors.primary.main}]`}>
            Team Management
          </h3>
          <p className="text-gray-600 mb-4">Create and manage support teams</p>
          <Link to="/teams">
            <Button variant="primary">Manage Teams</Button>
          </Link>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className={`text-lg font-semibold mb-2 text-[${theme.colors.primary.main}]`}>
            All Tickets
          </h3>
          <p className="text-gray-600 mb-4">View and manage all support tickets</p>
          <Link to="/tickets">
            <Button variant="tertiary">View Tickets</Button>
          </Link>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className={`text-lg font-semibold mb-2 text-[${theme.colors.primary.main}]`}>
            SLA Dashboard
          </h3>
          <p className="text-gray-600 mb-4">Monitor SLA performance and compliance</p>
          <Link to="/sla-dashboard">
            <Button variant="tertiary">View SLA Metrics</Button>
          </Link>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className={`text-lg font-semibold mb-4 text-[${theme.colors.primary.main}]`}>
          Quick Actions
        </h3>
        <div className="flex flex-wrap gap-4">
          <Link to="/teams">
            <Button variant="primary">Create Team</Button>
          </Link>
          <Button variant="secondary">Add Employee</Button>
          <Button variant="secondary">System Settings</Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <h2 className={`text-2xl font-bold text-[${theme.colors.primary.text}]`}>
        Welcome back, {user?.user_metadata?.full_name || 'User'}!
      </h2>
      
      {userRole === 'admin' && renderAdminDashboard()}
      {userRole === 'employee' && renderEmployeeDashboard()}
      {(!userRole || userRole === 'customer') && renderCustomerDashboard()}
    </div>
  );
} 