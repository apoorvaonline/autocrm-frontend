import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../shared/Button';
import { Cog6ToothIcon, Bars3Icon } from '@heroicons/react/24/outline';
import { navigation } from './Navigation';
import { useState, useEffect } from 'react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const navigate = useNavigate();
  const { user, userRole, signOut, refreshSession } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // Refresh session when component mounts
    refreshSession();
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate('/signin');
  };

  const filteredNavigation = navigation.filter(item => 
    !item.roles || item.roles.includes(userRole || '')
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="fixed top-0 right-0 left-0 bg-[#781E28] text-white shadow-md z-30">
        <div className="lg:pl-64 h-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
            <div className="flex items-center">
              <button
                className="lg:hidden text-white hover:text-gray-200 mr-4"
                onClick={() => setSidebarOpen(true)}
              >
                <Bars3Icon className="h-6 w-6" />
              </button>
              <h1 className="text-xl font-bold text-white">AutoCRM</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-[#FFF6F1] hidden sm:block">
                {user?.user_metadata?.full_name || user?.email}
              </span>
              {(userRole === "admin" || userRole === "employee") && (
                <>
                  <div className="h-6 w-px bg-white/20" />
                  <Link to="/settings">
                    <Button 
                      variant="secondary"
                      size="sm"
                      className="bg-white hover:bg-[#FFF6F1] text-[#781E28]"
                    >
                      <Cog6ToothIcon className="h-4 w-4" />
                      <span className="hidden sm:block">Settings</span>
                    </Button>
                  </Link>
                </>
              )}
              <div className="h-6 w-px bg-white/20" />
              <Button 
                variant="secondary"
                size="sm"
                onClick={handleSignOut}
                className="bg-white hover:bg-[#FFF6F1] text-[#781E28]"
              >
                <span className="hidden sm:block">Sign Out</span>
                <span className="sm:hidden">Exit</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-800/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed top-16 left-0 bottom-0 w-64 bg-white shadow-lg transform transition-transform duration-200 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:z-20
      `}>
        <nav className="p-4 space-y-1">
          {filteredNavigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
                className="flex items-center space-x-2 px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100 hover:text-[#781E28] transition-colors"
                onClick={() => setSidebarOpen(false)}
              >
                <Icon className="h-5 w-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Main content */}
      <div className="lg:pl-64 pt-16 min-h-screen">
        <main className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
} 