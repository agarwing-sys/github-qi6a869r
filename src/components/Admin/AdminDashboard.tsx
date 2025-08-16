import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Users, 
  Target, 
  DollarSign, 
  CheckCircle, 
  TrendingUp, 
  AlertTriangle,
  Eye,
  Clock
} from 'lucide-react';

export function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalAdvertisers: 0,
    totalBroadcasters: 0,
    totalCampaigns: 0,
    activeCampaigns: 0,
    pendingCampaigns: 0,
    pendingProofs: 0,
    totalRevenue: 0,
    platformCommission: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAdminStats();
  }, []);

  const loadAdminStats = async () => {
    try {
      // Statistiques des utilisateurs
      const { data: profiles } = await supabase
        .from('profiles')
        .select('role');

      const totalUsers = profiles?.length || 0;
      const totalAdvertisers = profiles?.filter(p => p.role === 'advertiser').length || 0;
      const totalBroadcasters = profiles?.filter(p => p.role === 'broadcaster').length || 0;

      // Statistiques des campagnes
      const { data: campaigns } = await supabase
        .from('campaigns')
        .select('status, budget');

      const totalCampaigns = campaigns?.length || 0;
      const activeCampaigns = campaigns?.filter(c => c.status === 'active').length || 0;
      const pendingCampaigns = campaigns?.filter(c => c.status === 'pending').length || 0;

      // Statistiques des preuves
      const { data: proofs } = await supabase
        .from('proofs')
        .select('validation_status');

      const pendingProofs = proofs?.filter(p => p.validation_status === 'pending').length || 0;

      // Statistiques financières
      const { data: transactions } = await supabase
        .from('transactions')
        .select('amount, type');

      const totalRevenue = transactions
        ?.filter(t => t.type === 'payment')
        .reduce((sum, t) => sum + t.amount, 0) || 0;

      const platformCommission = totalRevenue * 0.1; // 10% de commission

      setStats({
        totalUsers,
        totalAdvertisers,
        totalBroadcasters,
        totalCampaigns,
        activeCampaigns,
        pendingCampaigns,
        pendingProofs,
        totalRevenue,
        platformCommission,
      });
    } catch (error) {
      console.error('Error loading admin stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Administration</h1>
        <p className="text-gray-600">Vue d'ensemble de la plateforme Whatspay</p>
      </div>

      {/* Alertes importantes */}
      {(stats.pendingCampaigns > 0 || stats.pendingProofs > 0) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <div className="flex items-center">
            <AlertTriangle className="w-6 h-6 text-yellow-600 mr-3" />
            <div>
              <h3 className="font-medium text-yellow-800">Actions requises</h3>
              <div className="text-yellow-700 text-sm mt-1">
                {stats.pendingCampaigns > 0 && (
                  <p>{stats.pendingCampaigns} campagne(s) en attente de validation</p>
                )}
                {stats.pendingProofs > 0 && (
                  <p>{stats.pendingProofs} preuve(s) en attente de validation</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Utilisateurs totaux</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
              <div className="text-xs text-gray-500 mt-1">
                {stats.totalAdvertisers} annonceurs • {stats.totalBroadcasters} diffuseurs
              </div>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Campagnes</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalCampaigns}</p>
              <div className="text-xs text-gray-500 mt-1">
                {stats.activeCampaigns} actives • {stats.pendingCampaigns} en attente
              </div>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Target className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Revenus plateforme</p>
              <p className="text-2xl font-bold text-gray-900">{stats.platformCommission.toFixed(2)} €</p>
              <div className="text-xs text-gray-500 mt-1">
                Commission sur {stats.totalRevenue.toFixed(2)} € de volume
              </div>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Preuves en attente</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingProofs}</p>
              <div className="text-xs text-gray-500 mt-1">
                Validation requise
              </div>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Eye className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Actions rapides */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <a
          href="/admin/campaigns"
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
              <Target className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Valider les campagnes</h3>
              <p className="text-gray-600 text-sm">
                {stats.pendingCampaigns} campagne(s) en attente
              </p>
            </div>
          </div>
        </a>

        <a
          href="/admin/proofs"
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Valider les preuves</h3>
              <p className="text-gray-600 text-sm">
                {stats.pendingProofs} preuve(s) en attente
              </p>
            </div>
          </div>
        </a>

        <a
          href="/admin/users"
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Gérer les utilisateurs</h3>
              <p className="text-gray-600 text-sm">
                {stats.totalUsers} utilisateur(s) inscrits
              </p>
            </div>
          </div>
        </a>

        <a
          href="/admin/payments"
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mr-4">
              <DollarSign className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Gestion financière</h3>
              <p className="text-gray-600 text-sm">
                {stats.totalRevenue.toFixed(2)} € de volume
              </p>
            </div>
          </div>
        </a>

        <a
          href="/admin/analytics"
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mr-4">
              <TrendingUp className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Analytics</h3>
              <p className="text-gray-600 text-sm">
                Rapports détaillés
              </p>
            </div>
          </div>
        </a>

        <a
          href="/admin/settings"
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mr-4">
              <Clock className="w-6 h-6 text-gray-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Paramètres</h3>
              <p className="text-gray-600 text-sm">
                Configuration plateforme
              </p>
            </div>
          </div>
        </a>
      </div>

      {/* Activité récente */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Activité récente</h2>
        </div>
        <div className="p-6">
          <div className="text-center py-8 text-gray-500">
            <Clock className="w-8 h-8 mx-auto mb-2" />
            <p>Flux d'activité en temps réel (à implémenter)</p>
          </div>
        </div>
      </div>
    </div>
  );
}