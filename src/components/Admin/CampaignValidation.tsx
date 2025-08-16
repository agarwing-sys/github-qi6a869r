import React, { useState, useEffect } from 'react';
import { supabase, type Campaign, type Profile } from '../../lib/supabase';
import { CheckCircle, XCircle, Eye, Calendar, DollarSign, Target, AlertTriangle } from 'lucide-react';

type CampaignWithAdvertiser = Campaign & {
  advertiser: Profile;
};

export function CampaignValidation() {
  const [campaigns, setCampaigns] = useState<CampaignWithAdvertiser[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignWithAdvertiser | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    loadPendingCampaigns();
  }, []);

  const loadPendingCampaigns = async () => {
    try {
      const { data: campaignsData } = await supabase
        .from('campaigns')
        .select(`
          *,
          advertiser:profiles!campaigns_advertiser_id_fkey(*)
        `)
        .eq('admin_approved', false)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (campaignsData) {
        setCampaigns(campaignsData);
      }
    } catch (error) {
      console.error('Error loading pending campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveCampaign = async (campaignId: string) => {
    setProcessing(campaignId);

    try {
      const { error } = await supabase
        .from('campaigns')
        .update({
          admin_approved: true,
          status: 'active',
          start_date: new Date().toISOString(),
        })
        .eq('id', campaignId);

      if (error) throw error;

      // Envoyer une notification à l'annonceur
      const campaign = campaigns.find(c => c.id === campaignId);
      if (campaign) {
        await supabase.rpc('send_notification', {
          target_user_id: campaign.advertiser_id,
          notification_type: 'campaign_validated',
          notification_title: 'Campagne approuvée',
          notification_message: `Votre campagne "${campaign.title}" a été approuvée et est maintenant active`,
          notification_data: { campaign_id: campaignId }
        });
      }

      // Recharger la liste
      await loadPendingCampaigns();
      alert('Campagne approuvée avec succès !');
    } catch (error: any) {
      console.error('Error approving campaign:', error);
      alert('Erreur lors de l\'approbation: ' + error.message);
    } finally {
      setProcessing(null);
    }
  };

  const handleRejectCampaign = async (campaignId: string, reason: string) => {
    if (!reason.trim()) {
      alert('Veuillez fournir une raison pour le rejet');
      return;
    }

    setProcessing(campaignId);

    try {
      const { error } = await supabase
        .from('campaigns')
        .update({
          status: 'cancelled',
          rejection_reason: reason,
        })
        .eq('id', campaignId);

      if (error) throw error;

      // Envoyer une notification à l'annonceur
      const campaign = campaigns.find(c => c.id === campaignId);
      if (campaign) {
        await supabase.rpc('send_notification', {
          target_user_id: campaign.advertiser_id,
          notification_type: 'campaign_rejected',
          notification_title: 'Campagne rejetée',
          notification_message: `Votre campagne "${campaign.title}" a été rejetée. Raison: ${reason}`,
          notification_data: { campaign_id: campaignId, reason }
        });
      }

      // Recharger la liste
      await loadPendingCampaigns();
      setSelectedCampaign(null);
      setRejectionReason('');
      alert('Campagne rejetée');
    } catch (error: any) {
      console.error('Error rejecting campaign:', error);
      alert('Erreur lors du rejet: ' + error.message);
    } finally {
      setProcessing(null);
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Validation des campagnes</h1>
        <p className="text-gray-600">
          {campaigns.length} campagne(s) en attente de validation
        </p>
      </div>

      {campaigns.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
          <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Toutes les campagnes sont validées
          </h3>
          <p className="text-gray-600">
            Aucune campagne en attente de validation.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {campaigns.map((campaign) => (
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
                    <p className="text-gray-600 mb-3">
                      {campaign.description}
                    </p>
                    
                    {/* Informations de l'annonceur */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <h4 className="font-medium text-gray-900 mb-2">Annonceur</h4>
                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p><strong>Nom:</strong> {campaign.advertiser.full_name}</p>
                          <p><strong>Téléphone:</strong> {campaign.advertiser.phone_number}</p>
                        </div>
                        <div>
                          <p><strong>Ville:</strong> {campaign.advertiser.city}</p>
                          <p><strong>Inscrit le:</strong> {new Date(campaign.advertiser.created_at).toLocaleDateString('fr-FR')}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="ml-4 text-right">
                    <div className="text-2xl font-bold text-blue-600">
                      {campaign.budget.toFixed(2)} €
                    </div>
                    <div className="text-sm text-gray-500">Budget total</div>
                  </div>
                </div>

                {/* Métriques de la campagne */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <DollarSign className="w-4 h-4 text-gray-600 mx-auto mb-1" />
                    <div className="text-sm font-medium text-gray-900">
                      {campaign.cost_per_view.toFixed(2)} €
                    </div>
                    <div className="text-xs text-gray-500">Par vue</div>
                  </div>
                  
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <Target className="w-4 h-4 text-gray-600 mx-auto mb-1" />
                    <div className="text-sm font-medium text-gray-900">
                      {campaign.target_views.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500">Vues cibles</div>
                  </div>
                  
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <Calendar className="w-4 h-4 text-gray-600 mx-auto mb-1" />
                    <div className="text-sm font-medium text-gray-900">
                      {new Date(campaign.created_at).toLocaleDateString('fr-FR')}
                    </div>
                    <div className="text-xs text-gray-500">Créée le</div>
                  </div>
                  
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <Eye className="w-4 h-4 text-gray-600 mx-auto mb-1" />
                    <div className="text-sm font-medium text-gray-900">
                      {campaign.media_type === 'image' ? 'Image' : 'Vidéo'}
                    </div>
                    <div className="text-xs text-gray-500">Type de média</div>
                  </div>
                </div>

                {/* Aperçu du média */}
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-3">Contenu de la campagne</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      {campaign.media_type === 'image' ? (
                        <img
                          src={campaign.media_url}
                          alt={campaign.title}
                          className="w-full rounded-lg border border-gray-200"
                        />
                      ) : (
                        <video
                          src={campaign.media_url}
                          controls
                          className="w-full rounded-lg border border-gray-200"
                        />
                      )}
                    </div>
                    
                    <div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h5 className="font-medium text-gray-900 mb-2">Texte de la campagne</h5>
                        <p className="text-gray-700">
                          {campaign.caption || 'Aucun texte spécifique'}
                        </p>
                      </div>
                      
                      {/* Ciblage */}
                      <div className="mt-4">
                        <h5 className="font-medium text-gray-900 mb-2">Ciblage</h5>
                        <div className="space-y-2 text-sm text-gray-600">
                          {campaign.target_gender && (
                            <p><strong>Genre:</strong> {campaign.target_gender === 'male' ? 'Hommes' : 'Femmes'}</p>
                          )}
                          {(campaign.target_age_min || campaign.target_age_max) && (
                            <p><strong>Âge:</strong> {campaign.target_age_min || 0}-{campaign.target_age_max || '∞'} ans</p>
                          )}
                          {campaign.target_cities && campaign.target_cities.length > 0 && (
                            <p><strong>Villes:</strong> {campaign.target_cities.join(', ')}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-4">
                  <button
                    onClick={() => handleApproveCampaign(campaign.id)}
                    disabled={processing === campaign.id}
                    className="flex-1 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                  >
                    {processing === campaign.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <CheckCircle className="w-5 h-5 mr-2" />
                    )}
                    Approuver
                  </button>
                  
                  <button
                    onClick={() => setSelectedCampaign(campaign)}
                    disabled={processing === campaign.id}
                    className="flex-1 bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                  >
                    <XCircle className="w-5 h-5 mr-2" />
                    Rejeter
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de rejet */}
      {selectedCampaign && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Rejeter la campagne
            </h3>
            <p className="text-gray-600 mb-4">
              Campagne: <strong>{selectedCampaign.title}</strong>
            </p>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Raison du rejet *
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="Expliquez pourquoi cette campagne est rejetée..."
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setSelectedCampaign(null);
                  setRejectionReason('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={() => handleRejectCampaign(selectedCampaign.id, rejectionReason)}
                disabled={!rejectionReason.trim() || processing === selectedCampaign.id}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                Confirmer le rejet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}