import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LandingPage } from './components/LandingPage';
import { Layout } from './components/Layout';
import { LoginForm } from './components/Auth/LoginForm';
import { RoleSelection } from './components/Auth/RoleSelection';
import { AdvertiserDashboard } from './components/Dashboard/AdvertiserDashboard';
import { BroadcasterDashboard } from './components/Dashboard/BroadcasterDashboard';
import { AdminDashboard } from './components/Admin/AdminDashboard';
import { AvailableCampaigns } from './components/Campaigns/AvailableCampaigns';
import { MyApplications } from './components/Campaigns/MyApplications';
import { BroadcasterHistory } from './components/Campaigns/BroadcasterHistory';
import { NotificationCenter } from './components/Notifications/NotificationCenter';
import { CampaignValidation } from './components/Admin/CampaignValidation';
import { ProofValidation } from './components/Admin/ProofValidation';
import { UserManagement } from './components/Admin/UserManagement';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  if (!profile) {
    return <RoleSelection />;
  }

  return <Layout>{children}</Layout>;
}

function DashboardRouter() {
  const { profile } = useAuth();

  if (!profile) return null;

  switch (profile.role) {
    case 'advertiser':
      return <AdvertiserDashboard />;
    case 'broadcaster':
      return <BroadcasterDashboard />;
    case 'admin':
      return <AdminDashboard />;
    default:
      return (
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Erreur</h2>
          <p className="text-gray-600">Rôle utilisateur non reconnu: {profile.role}</p>
        </div>
      );
  }
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/login" element={<LoginRoute />} />
          <Route
            path="/"
            element={
              <Navigate to="/landing" replace />
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardRouter />
              </ProtectedRoute>
            }
          />
          <Route
            path="/campaigns"
            element={
              <ProtectedRoute>
                <div>Campaigns Page (Coming Soon)</div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/campaigns/new"
            element={
              <ProtectedRoute>
                <div>New Campaign Page (Coming Soon)</div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/available-campaigns"
            element={
              <ProtectedRoute>
                <AvailableCampaigns />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-applications"
            element={
              <ProtectedRoute>
                <MyApplications />
              </ProtectedRoute>
            }
          />
          <Route
            path="/history"
            element={
              <ProtectedRoute>
                <BroadcasterHistory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <NotificationCenter />
              </ProtectedRoute>
            }
          />
          <Route
            path="/wallet"
            element={
              <ProtectedRoute>
                <div>Wallet Page (Coming Soon)</div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/referrals"
            element={
              <ProtectedRoute>
                <div>Referrals Page (Coming Soon)</div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute>
                <AdminRoutes />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

function LoginRoute() {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (user && profile) {
    return <Navigate to="/dashboard" replace />;
  }

  if (user && !profile) {
    return <RoleSelection />;
  }

  return <LoginForm />;
}

function AdminRoutes() {
  const location = useLocation();
  
  switch (location.pathname) {
    case '/admin/campaigns':
      return <CampaignValidation />;
    case '/admin/proofs':
      return <ProofValidation />;
    case '/admin/users':
      return <UserManagement />;
    case '/admin/payments':
      return <div className="text-center py-12"><h2 className="text-xl font-bold">Gestion des paiements (à implémenter)</h2></div>;
    case '/admin/analytics':
      return <div className="text-center py-12"><h2 className="text-xl font-bold">Analytics avancées (à implémenter)</h2></div>;
    case '/admin/settings':
      return <div className="text-center py-12"><h2 className="text-xl font-bold">Paramètres plateforme (à implémenter)</h2></div>;
    default:
      return <AdminDashboard />;
  }
}

export default App;