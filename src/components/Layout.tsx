import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Menu, Wallet, Bell, User, LogOut, Settings } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { NotificationBell } from './Notifications/NotificationBell';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const navigation = React.useMemo(() => {
    if (!profile) return [];

    switch (profile.role) {
      case 'advertiser':
        return [
          { name: 'Tableau de bord', href: '/dashboard', icon: '📊' },
          { name: 'Mes Campagnes', href: '/campaigns', icon: '🎯' },
          { name: 'Créer Campagne', href: '/campaigns/new', icon: '➕' },
          { name: 'Mon Portefeuille', href: '/wallet', icon: '💰' },
          { name: 'Parrainage', href: '/referrals', icon: '🎁' },
          { name: 'Notifications', href: '/notifications', icon: '🔔' },
        ];
      case 'broadcaster':
        return [
          { name: 'Tableau de bord', href: '/dashboard', icon: '📊' },
          { name: 'Campagnes Disponibles', href: '/available-campaigns', icon: '🎯' },
          { name: 'Mes Applications', href: '/my-applications', icon: '📝' },
          { name: 'Mon Portefeuille', href: '/wallet', icon: '💰' },
          { name: 'Parrainage', href: '/referrals', icon: '🎁' },
          { name: 'Historique', href: '/history', icon: '📊' },
          { name: 'Notifications', href: '/notifications', icon: '🔔' },
        ];
      case 'admin':
        return [
          { name: 'Tableau de bord', href: '/dashboard', icon: '📊' },
          { name: 'Utilisateurs', href: '/admin/users', icon: '👥' },
          { name: 'Campagnes', href: '/admin/campaigns', icon: '🎯' },
          { name: 'Preuves', href: '/admin/proofs', icon: '✅' },
          { name: 'Paiements', href: '/admin/payments', icon: '💳' },
          { name: 'Analytics', href: '/admin/analytics', icon: '📈' },
          { name: 'Paramètres', href: '/admin/settings', icon: '⚙️' },
        ];
      default:
        return [];
    }
  }, [profile]);

  const isActive = (href: string) => location.pathname === href;

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation mobile */}
      <div className="lg:hidden">
        <div className="bg-white shadow-sm border-b">
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <Menu className="w-5 h-5" />
              </button>
              <h1 className="text-xl font-bold text-blue-600">Whatspay</h1>
            </div>
            <div className="flex items-center space-x-2">
              <NotificationBell />
              <Link to="/profile" className="p-2 rounded-lg hover:bg-gray-100">
                <User className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Menu mobile */}
        {mobileMenuOpen && (
          <div className="bg-white border-b shadow-sm">
            <div className="px-4 py-2">
              {navigation.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.name}</span>
                </Link>
              ))}
              <button
                onClick={handleSignOut}
                className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 w-full text-left"
              >
                <LogOut className="w-4 h-4" />
                <span>Déconnexion</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Layout desktop */}
      <div className="hidden lg:flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-sm border-r min-h-screen">
          <div className="p-6">
            <h1 className="text-2xl font-bold text-blue-600">Whatspay</h1>
            <p className="text-sm text-gray-500 mt-1">
              {profile?.role === 'advertiser' && 'Espace Annonceur'}
              {profile?.role === 'broadcaster' && 'Espace Diffuseur'}
              {profile?.role === 'admin' && 'Administration'}
            </p>
          </div>

          <nav className="px-4 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            ))}
          </nav>

          <div className="absolute bottom-4 left-4 right-4">
            <div className="mb-4">
              <NotificationBell />
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {profile?.full_name}
                  </p>
                  <p className="text-xs text-gray-500">{profile?.phone_number}</p>
                </div>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center space-x-2 text-sm text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg w-full"
            >
              <LogOut className="w-4 h-4" />
              <span>Déconnexion</span>
            </button>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1">
          <main className="p-8">{children}</main>
        </div>
      </div>

      {/* Main content mobile */}
      <div className="lg:hidden">
        <main className="p-4">{children}</main>
      </div>
    </div>
  );
}