import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SignIn } from './components/auth/SignIn';
import { SignUp } from './components/auth/SignUp';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { Dashboard } from './pages/Dashboard';
import { CreateTicket } from './components/tickets/CreateTicket';
import { TicketList } from './components/tickets/TicketList';
import { theme } from './config/theme';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className={`min-h-screen bg-[${theme.colors.primary.background}]`}>
          <Routes>
            {/* Public Routes */}
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />

            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Dashboard />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/tickets/new"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <CreateTicket />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/tickets"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <TicketList />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            {/* Redirect root to dashboard or signin */}
            <Route
              path="/"
              element={<Navigate to="/dashboard" replace />}
            />

            {/* Catch all route */}
            <Route
              path="*"
              element={<Navigate to="/dashboard" replace />}
            />
          </Routes>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
