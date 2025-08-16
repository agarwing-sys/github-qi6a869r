import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, type Campaign, type Wallet, type CampaignApplication } from '../../lib/supabase';
import { Radio, DollarSign, Clock, CheckCircle, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

export function BroadcasterDashboard() {
  const { profile } = useAuth();
  const [availableCampaigns, setAvailableCampaigns] = useState<Campaign[]>([]);
  const [myApplications, setMyApplications] = useState<(CampaignApplication & { campaign: Campaign })[]>([]);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [stats, setStats] = useState({
    availableCampaigns: 0,
    activeCampaigns: 0,
    completedCampaigns: 0,
    totalEarnings: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      loadDashboardData();
    }
  }, [profile]);

  const loadDashboardData = async () => {
    if (!profile) return;

    try {
      // Charger les campagnes disponibles (correspondant au profil)
      const { data: campaignsData } = await supabase
        .from('campaigns')
        .select('*')
        .eq('status', 'active')
        .eq('admin_approved', true)
        .limit(5);

      if (campaignsData) {
        // Filtrer les campagnes selon le profil du diffuseur
        const filteredCampaigns = campaignsData.filter(campaign => {
          // Vérifier le genre
          if (campaign.target_gender && profile.gender && campaign.target_gender !== profile.gender) {
            return false;
          }
          
          // Vérifier l'âge
          if (profile.age) {
            if (campaign.target_age_min && profile.age < campaign.target_age_min) return false;
            if (campaign.target_age_max && profile.age > campaign.target_age_max) return false;
          }
          
          // Vérifier la ville
          if (campaign.target_cities && campaign.target_cities.length > 0 && profile.city) {
            if (!campaign.target_cities.includes(profile.city)) return false;
          }
          
          // Vérifier la langue
          if (campaign.target_languages && campaign.target_languages.length > 0 && profile.language) {
            if (!campaign.target_languages.includes(profile.language)) return false;
          }
          
          return true;
        });
        
        setAvailableCampaigns(filteredCampaigns);
        setStats(prev => ({ ...prev, availableCampaigns: filteredCampaigns.length }));
      }

      // Charger mes applications
      const { data: applicationsData } = await supabase
        .from('campaign_applications')
        .select(`
          *,
          campaign:campaigns(*)
        `)
        .eq('broadcaster_id', profile.id)
        .order('applied_at', { ascending: false })
        .limit(5);

      if (applicationsData) {
        setMyApplications(applicationsData);
        
        const activeCampaigns = applicationsData.filter(app => app.status === 'accepted').length;
        const completedCampaigns = applicationsData.filter(app => app.status === 'completed').length;
        
        setStats(prev => ({
          ...prev,
          activeCampaigns,
          completedCampaigns,
        }));
      }

      // Charger le portefeuille
      const { data: walletData } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', profile.id)
        .single();

      if (walletData) {
        setWallet(walletData);
        setStats(prev => ({ ...prev, totalEarnings: walletData.total_earned }));
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyToCampaign = async (campaignId: string) => {
    if (!profile) return;

    try {
      // Vérifier si l'utilisateur a déjà candidaté
      const { data: existingApplication } = await supabase
        .from('campaign_applications')
        .select('id')
        .eq('campaign_id', campaignId)
        .eq('broadcaster_id', profile.id)
        .single();

      if (existingApplication) {
        alert('Vous avez déjà candidaté à cette campagne');
        return;
      }

      const { error } = await supabase
        .from('campaign_applications')
        .insert([{
          campaign_id: campaignId,
          broadcaster_id: profile.id,
          status: 'pending',
        }]);

      if (error) throw error;

      alert('Candidature envoyée avec succès !');
      // Recharger les données
      await loadDashboardData();
    } catch (error: any) {
      console.error('Error applying to campaign:', error);
      alert('Erreur lors de la candidature: ' + error.message);
    }
  };

  const getApplicationStatus = (status: string) => {
    switch (status) {
      case 'pending': return { text: 'En attente', color: 'bg-yellow-100 text-yellow-800' };
      case 'accepted': return { text: 'Accepté', color: 'bg-green-100 text-green-800' };
      case 'rejected': return { text: 'Refusé', color: 'bg-red-100 text-red-800' };
      case 'completed': return { text: 'Terminé', color: 'bg-blue-100 text-blue-800' };
      default: return { text: status, color: 'bg-gray-100 text-gray-800' };
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
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="text-gray-600">Bienvenue, {profile?.full_name}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Campagnes Disponibles</p>
              <p className="text-2xl font-bold text-gray-900">{stats.availableCampaigns}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Radio className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Campagnes Actives</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeCampaigns}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Terminées</p>
              <p className="text-2xl font-bold text-gray-900">{stats.completedCampaigns}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Gains Totaux</p>
              <p className="text-2xl font-bold text-gray-900">
                {wallet?.total_earned?.toFixed(2) || '0.00'} €
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Available Campaigns */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Campagnes disponibles</h2>
            <Link
              to="/available-campaigns"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Voir tout
            </Link>
          </div>
        </div>

        <div className="p-6">
          {availableCampaigns.length === 0 ? (
            <div className="text-center py-12">
              <Radio className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Aucune campagne disponible
              </h3>
              <p className="text-gray-600">
                Aucune campagne ne correspond à votre profil actuellement.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {availableCampaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{campaign.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {campaign.cost_per_view.toFixed(2)} € par vue • 
                        Target: {campaign.target_views} vues
                      </p>
                      {campaign.description && (
                        <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                          {campaign.description}
                        </p>
                      )}
                    </div>
                    
                    <button
                      onClick={() => handleApplyToCampaign(campaign.id)}
                      className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Candidater
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* My Applications */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Mes candidatures récentes</h2>
            <Link
              to="/my-applications"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Voir tout
            </Link>
          </div>
        </div>

        <div className="p-6">
          {myApplications.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Aucune candidature
              </h3>
              <p className="text-gray-600 mb-6">
                Candidatez à des campagnes pour commencer à gagner de l'argent.
              </p>
              <Link
                to="/available-campaigns"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5 mr-2" />
                Voir les campagnes
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {myApplications.map((application) => {
                const status = getApplicationStatus(application.status);
                return (
                  <div
                    key={application.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                  >
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">
                        {application.campaign.title}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Candidature du {new Date(application.applied_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${status.color}`}
                      >
                        {status.text}
                      </span>
                      
                      <span className="text-sm font-medium text-gray-900">
                        {application.campaign.cost_per_view.toFixed(2)} €
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
          <h3 className="text-lg font-semibold mb-2">Solde disponible</h3>
          <p className="text-2xl font-bold mb-2">{wallet?.balance?.toFixed(2) || '0.00'} €</p>
          <p className="text-green-100 mb-4">
            Retirez vos gains quand vous le souhaitez.
          </p>
          <Link
            to="/wallet"
            className="inline-flex items-center px-4 py-2 bg-white text-green-600 rounded-lg hover:bg-green-50 transition-colors"
          >
            Gérer mon portefeuille
          </Link>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <h3 className="text-lg font-semibold mb-2">Parrainez et gagnez</h3>
          <p className="text-purple-100 mb-4">
            Code: <span className="font-mono bg-purple-400 px-2 py-1 rounded">
              {profile?.referral_code}
            </span>
          </p>
          <Link
            to="/referrals"
            className="inline-flex items-center px-4 py-2 bg-white text-purple-600 rounded-lg hover:bg-purple-50 transition-colors"
          >
            Mes parrainages
          </Link>
        </div>
      </div>
    </div>
  );
}