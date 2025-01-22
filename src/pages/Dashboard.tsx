import { useAuth } from '../context/AuthContext';
import { theme } from '../config/theme';

export function Dashboard() {
  const { user } = useAuth();

  return (
    <div>
      <h2 className={`text-2xl font-bold mb-6 text-[${theme.colors.primary.text}]`}>
        Welcome back, {user?.user_metadata?.full_name || 'User'}!
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Placeholder cards for dashboard content */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className={`text-lg font-semibold mb-2 text-[${theme.colors.primary.main}]`}>
            Active Tickets
          </h3>
          <p className="text-gray-600">Coming soon...</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className={`text-lg font-semibold mb-2 text-[${theme.colors.primary.main}]`}>
            Recent Activity
          </h3>
          <p className="text-gray-600">Coming soon...</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className={`text-lg font-semibold mb-2 text-[${theme.colors.primary.main}]`}>
            Quick Actions
          </h3>
          <p className="text-gray-600">Coming soon...</p>
        </div>
      </div>
    </div>
  );
} 