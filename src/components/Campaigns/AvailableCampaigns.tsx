import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, type Campaign } from '../../lib/supabase';
import { Target, Clock, DollarSign, Users, Eye, CheckCircle, AlertCircle } from 'lucide-react';

export function AvailableCampaigns() {
  const { profile } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [appliedCampaigns, setAppliedCampaigns] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      loadAvailableCampaigns();
      loadAppliedCampaigns();
    }
  }, [profile]);

  const loadAvailableCampaigns = async () => {
    if (!profile) return;

    try {
      const { data: campaignsData } = await supabase
        .from('campaigns')
        .select('*')
        .eq('status', 'active')
        .eq('admin_approved', true)
        .order('created_at', { ascending: false });

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
        
        setCampaigns(filteredCampaigns);
      }
    } catch (error) {
      console.error('Error loading campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAppliedCampaigns = async () => {
    if (!profile) return;

    try {
      const { data: applications } = await supabase
        .from('campaign_applications')
        .select('campaign_id')
        .eq('broadcaster_id', profile.id);

      if (applications) {
        setAppliedCampaigns(new Set(applications.map(app => app.campaign_id)));
      }
    } catch (error) {
      console.error('Error loading applied campaigns:', error);
    }
  };

  const handleApplyToCampaign = async (campaignId: string) => {
    if (!profile) return;

    setApplying(campaignId);

    try {
      const { error } = await supabase
        .from('campaign_applications')
        .insert([{
          campaign_id: campaignId,
          broadcaster_id: profile.id,
          status: 'pending',
        }]);

      if (error) throw error;

      // Mettre à jour la liste des candidatures
      setAppliedCampaigns(prev => new Set([...prev, campaignId]));
      
      // Envoyer une notification à l'annonceur
      const campaign = campaigns.find(c => c.id === campaignId);
      if (campaign) {
        await supabase.rpc('send_notification', {
          target_user_id: campaign.advertiser_id,
          notification_type: 'new_application',
          notification_title: 'Nouvelle candidature',
          notification_message: `${profile.full_name} a candidaté à votre campagne "${campaign.title}"`,
          notification_data: { campaign_id: campaignId, broadcaster_id: profile.id }
        });
      }

      alert('Candidature envoyée avec succès !');
    } catch (error: any) {
      console.error('Error applying to campaign:', error);
      alert('Erreur lors de la candidature: ' + error.message);
    } finally {
      setApplying(null);
    }
  };

  const formatTargeting = (campaign: Campaign) => {
    const targeting = [];
    
    if (campaign.target_gender) {
      targeting.push(campaign.target_gender === 'male' ? 'Hommes' : 'Femmes');
    }
    
    if (campaign.target_age_min || campaign.target_age_max) {
      if (campaign.target_age_min && campaign.target_age_max) {
        targeting.push(`${campaign.target_age_min}-${campaign.target_age_max} ans`);
      } else if (campaign.target_age_min) {
        targeting.push(`${campaign.target_age_min}+ ans`);
      } else if (campaign.target_age_max) {
        targeting.push(`-${campaign.target_age_max} ans`);
      }
    }
    
    if (campaign.target_cities && campaign.target_cities.length > 0) {
      targeting.push(campaign.target_cities.join(', '));
    }
    
    return targeting.length > 0 ? targeting.join(' • ') : 'Tous publics';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Campagnes disponibles</h1>
          <p className="text-gray-600">
            {campaigns.length} campagne{campaigns.length !== 1 ? 's' : ''} correspondant à votre profil
          </p>
        </div>
      </div>

      {campaigns.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
          <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Aucune campagne disponible
          </h3>
          <p className="text-gray-600">
            Aucune campagne ne correspond à votre profil actuellement.
            Revenez plus tard pour voir les nouvelles opportunités.
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {campaigns.map((campaign) => {
            const hasApplied = appliedCampaigns.has(campaign.id);
            const isApplying = applying === campaign.id;
            
            return (
              <div
                key={campaign.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {campaign.title}
                      </h3>
                      {campaign.description && (
                        <p className="text-gray-600 mb-4">
                          {campaign.description}
                        </p>
                      )}
                    </div>
                    
                    <div className="ml-4 text-right">
                      <div className="text-2xl font-bold text-green-600">
                        {campaign.cost_per_view.toFixed(2)} €
                      </div>
                      <div className="text-sm text-gray-500">par vue</div>
                    </div>
                  </div>

                  {/* Métriques de la campagne */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <Eye className="w-5 h-5 text-gray-600 mx-auto mb-1" />
                      <div className="text-sm font-medium text-gray-900">
                        {campaign.target_views.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">Vues cibles</div>
                    </div>
                    
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <DollarSign className="w-5 h-5 text-gray-600 mx-auto mb-1" />
                      <div className="text-sm font-medium text-gray-900">
                        {campaign.budget.toFixed(2)} €
                      </div>
                      <div className="text-xs text-gray-500">Budget total</div>
                    </div>
                    
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <Users className="w-5 h-5 text-gray-600 mx-auto mb-1" />
                      <div className="text-sm font-medium text-gray-900">
                        {Math.ceil(campaign.target_views / 100)}
                      </div>
                      <div className="text-xs text-gray-500">Diffuseurs estimés</div>
                    </div>
                  </div>

                  {/* Ciblage */}
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Ciblage</h4>
                    <div className="flex flex-wrap gap-2">
                      {formatTargeting(campaign).split(' • ').map((target, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                        >
                          {target}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="flex items-center justify-between mb-6 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-2" />
                      Créée le {new Date(campaign.created_at).toLocaleDateString('fr-FR')}
                    </div>
                    {campaign.end_date && (
                      <div>
                        Expire le {new Date(campaign.end_date).toLocaleDateString('fr-FR')}
                      </div>
                    )}
                  </div>

                  {/* Action */}
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      Gain potentiel: <span className="font-semibold text-green-600">
                        {(campaign.cost_per_view * 100).toFixed(2)} €
                      </span> (pour ~100 vues)
                    </div>
                    
                    {hasApplied ? (
                      <div className="flex items-center text-green-600">
                        <CheckCircle className="w-5 h-5 mr-2" />
                        <span className="font-medium">Candidature envoyée</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleApplyToCampaign(campaign.id)}
                        disabled={isApplying}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                      >
                        {isApplying ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Candidature...</span>
                          </>
                        ) : (
                          <>
                            <span>Candidater</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}