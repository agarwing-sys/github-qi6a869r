import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { SupabaseOptimized } from '../../lib/supabaseOptimized';
import { useSupabaseQuery, useSupabaseMutation } from '../../hooks/useSupabaseQuery';
import { useDebounce } from '../../hooks/useDebounce';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll';
import { Target, Clock, DollarSign, Users, Eye, CheckCircle, AlertCircle } from 'lucide-react';
import { LoadingSpinner, LoadingCard } from '../UI/LoadingSpinner';
import { ErrorBoundary } from '../UI/ErrorBoundary';

export function AvailableCampaigns() {
  const { profile } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [allCampaigns, setAllCampaigns] = useState<any[]>([]);
  const [appliedCampaigns, setAppliedCampaigns] = useState<Set<string>>(new Set());
  
  const debouncedSearch = useDebounce(searchTerm, 300);

  // Requête pour les campagnes avec pagination
  const { data: campaignsData, loading: campaignsLoading, refetch } = useSupabaseQuery(
    `available_campaigns_${profile?.id}_${page}_${debouncedSearch}`,
    async () => {
      if (!profile) return { data: [], count: 0, hasNextPage: false };
      
      const result = await SupabaseOptimized.getCampaigns(undefined, {
        page,
        limit: 10,
        status: 'active',
        adminApproved: true,
        search: debouncedSearch
      });
      
      // Filtrer selon le profil du diffuseur
      const filteredData = result.data.filter(campaign => {
        if (campaign.target_gender && profile.gender && campaign.target_gender !== profile.gender) {
          return false;
        }
        if (profile.age) {
          if (campaign.target_age_min && profile.age < campaign.target_age_min) return false;
          if (campaign.target_age_max && profile.age > campaign.target_age_max) return false;
        }
        if (campaign.target_cities && campaign.target_cities.length > 0 && profile.city) {
          if (!campaign.target_cities.includes(profile.city)) return false;
        }
        return true;
      });
      
      return { ...result, data: filteredData };
    },
    { enabled: !!profile }
  );

  // Requête pour les candidatures
  const { data: applicationsData } = useSupabaseQuery(
    `applications_${profile?.id}`,
    async () => {
      if (!profile) return [];
      const result = await SupabaseOptimized.getCampaignApplications(profile.id);
      return result.data;
    },
    { enabled: !!profile }
  );

  // Mutation pour candidater
  const { mutate: applyToCampaign, loading: applying } = useSupabaseMutation(
    async (campaignId: string) => {
      if (!profile) throw new Error('Profile not found');
      
      return await supabase
        .from('campaign_applications')
        .insert([{
          campaign_id: campaignId,
          broadcaster_id: profile.id,
          status: 'pending',
        }]);
    },
    {
      onSuccess: () => {
        refetch();
      },
      invalidateQueries: [`applications_${profile?.id}`]
    }
  );

  // Scroll infini
  const { loadingRef, isFetching } = useInfiniteScroll(
    campaignsData?.hasNextPage || false,
    async () => {
      setPage(prev => prev + 1);
    }
  );

  // Mettre à jour les campagnes appliquées
  useEffect(() => {
    if (applicationsData) {
      setAppliedCampaigns(new Set(applicationsData.map(app => app.campaign_id)));
    }
  }, [applicationsData]);

  // Gérer les nouvelles données de campagnes
  useEffect(() => {
    if (campaignsData) {
      if (page === 1) {
        setAllCampaigns(campaignsData.data);
      } else {
        setAllCampaigns(prev => [...prev, ...campaignsData.data]);
      }
    }
  }, [campaignsData, page]);

  // Reset page quand la recherche change
  useEffect(() => {
    setPage(1);
    setAllCampaigns([]);
  }, [debouncedSearch]);

  const handleApplyToCampaign = async (campaignId: string) => {
    if (appliedCampaigns.has(campaignId)) {
      alert('Vous avez déjà candidaté à cette campagne');
      return;
    }

    try {
      await applyToCampaign(campaignId);
      setAppliedCampaigns(prev => new Set([...prev, campaignId]));
      alert('Candidature envoyée avec succès !');
    } catch (error: any) {
      console.error('Error applying to campaign:', error);
      alert('Erreur lors de la candidature: ' + error.message);
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

  if (campaignsLoading && allCampaigns.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 bg-gray-200 rounded w-64 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
          </div>
        </div>
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <LoadingCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Campagnes disponibles</h1>
            <p className="text-gray-600">
              {allCampaigns.length} campagne{allCampaigns.length !== 1 ? 's' : ''} correspondant à votre profil
            </p>
          </div>
        </div>

        {/* Barre de recherche */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher des campagnes..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {allCampaigns.length === 0 && !campaignsLoading ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
            <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucune campagne disponible
            </h3>
            <p className="text-gray-600">
              {searchTerm 
                ? 'Aucune campagne ne correspond à votre recherche.'
                : 'Aucune campagne ne correspond à votre profil actuellement.'
              }
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {allCampaigns.map((campaign) => {
              const hasApplied = appliedCampaigns.has(campaign.id);
              
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
                          disabled={applying}
                          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                        >
                          {applying ? (
                            <>
                              <LoadingSpinner size="sm" />
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
            
            {/* Indicateur de chargement pour le scroll infini */}
            {campaignsData?.hasNextPage && (
              <div ref={loadingRef} className="flex justify-center py-8">
                {isFetching ? (
                  <div className="flex items-center space-x-2">
                    <LoadingSpinner />
                    <span className="text-gray-600">Chargement...</span>
                  </div>
                        ) : (
                  <div className="text-gray-400">Faites défiler pour voir plus</div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}