import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, type Campaign, type CampaignApplication, type Proof, type Transaction } from '../../lib/supabase';
import { Calendar, DollarSign, Eye, CheckCircle, Clock, TrendingUp } from 'lucide-react';

type HistoryItem = {
  id: string;
  campaign: Campaign;
  application: CampaignApplication;
  proof?: Proof;
  transaction?: Transaction;
  earnings: number;
  status: string;
  completedAt?: string;
};

export function BroadcasterHistory() {
  const { profile } = useAuth();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'completed' | 'pending'>('all');

  useEffect(() => {
    if (profile) {
      loadHistory();
    }
  }, [profile]);

  const loadHistory = async () => {
    if (!profile) return;

    try {
      // Charger toutes les applications avec leurs campagnes
      const { data: applicationsData } = await supabase
        .from('campaign_applications')
        .select(`
          *,
          campaign:campaigns(*),
          proofs(*)
        `)
        .eq('broadcaster_id', profile.id)
        .order('applied_at', { ascending: false });

      if (applicationsData) {
        // Charger les transactions liées
        const { data: transactionsData } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', profile.id)
          .eq('type', 'earning');

        const transactionsByCampaign = new Map();
        transactionsData?.forEach(transaction => {
          if (transaction.campaign_id) {
            transactionsByCampaign.set(transaction.campaign_id, transaction);
          }
        });

        // Construire l'historique
        const historyItems: HistoryItem[] = applicationsData.map(app => {
          const proof = app.proofs?.[0];
          const transaction = transactionsByCampaign.get(app.campaign_id);
          const earnings = transaction?.amount || 0;

          return {
            id: app.id,
            campaign: app.campaign,
            application: app,
            proof,
            transaction,
            earnings,
            status: app.status,
            completedAt: app.completed_at,
          };
        });

        setHistory(historyItems);

        // Calculer les gains totaux
        const total = historyItems
          .filter(item => item.status === 'completed')
          .reduce((sum, item) => sum + item.earnings, 0);
        setTotalEarnings(total);
      }
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredHistory = history.filter(item => {
    switch (filter) {
      case 'completed':
        return item.status === 'completed';
      case 'pending':
        return item.status !== 'completed';
      default:
        return true;
    }
  });

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return { text: 'En attente', color: 'text-yellow-600', bg: 'bg-yellow-100' };
      case 'accepted':
        return { text: 'En cours', color: 'text-blue-600', bg: 'bg-blue-100' };
      case 'completed':
        return { text: 'Terminé', color: 'text-green-600', bg: 'bg-green-100' };
      case 'rejected':
        return { text: 'Refusé', color: 'text-red-600', bg: 'bg-red-100' };
      default:
        return { text: status, color: 'text-gray-600', bg: 'bg-gray-100' };
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
      {/* Header avec statistiques */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {totalEarnings.toFixed(2)} €
            </div>
            <div className="text-sm text-gray-600">Gains totaux</div>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-6 h-6 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {history.filter(h => h.status === 'completed').length}
            </div>
            <div className="text-sm text-gray-600">Campagnes terminées</div>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {history.length}
            </div>
            <div className="text-sm text-gray-600">Total candidatures</div>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Historique des campagnes</h1>
          
          <div className="flex space-x-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Toutes
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'completed'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Terminées
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'pending'
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              En cours
            </button>
          </div>
        </div>
      </div>

      {/* Liste de l'historique */}
      <div className="space-y-4">
        {filteredHistory.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucun historique
            </h3>
            <p className="text-gray-600">
              {filter === 'all' 
                ? 'Vous n\'avez pas encore de campagnes dans votre historique.'
                : `Aucune campagne ${filter === 'completed' ? 'terminée' : 'en cours'}.`
              }
            </p>
          </div>
        ) : (
          filteredHistory.map((item) => {
            const statusInfo = getStatusInfo(item.status);
            
            return (
              <div
                key={item.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {item.campaign.title}
                    </h3>
                    <p className="text-gray-600 mb-3">
                      {item.campaign.description}
                    </p>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        Candidature: {new Date(item.application.applied_at).toLocaleDateString('fr-FR')}
                      </div>
                      {item.completedAt && (
                        <div className="flex items-center">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Terminé: {new Date(item.completedAt).toLocaleDateString('fr-FR')}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="ml-4 text-right">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusInfo.bg} ${statusInfo.color}`}>
                      {statusInfo.text}
                    </span>
                    {item.earnings > 0 && (
                      <div className="text-lg font-bold text-green-600 mt-2">
                        +{item.earnings.toFixed(2)} €
                      </div>
                    )}
                  </div>
                </div>

                {/* Détails de la campagne */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <DollarSign className="w-4 h-4 text-gray-600 mx-auto mb-1" />
                    <div className="text-sm font-medium text-gray-900">
                      {item.campaign.cost_per_view.toFixed(2)} €
                    </div>
                    <div className="text-xs text-gray-500">Par vue</div>
                  </div>
                  
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <Eye className="w-4 h-4 text-gray-600 mx-auto mb-1" />
                    <div className="text-sm font-medium text-gray-900">
                      {item.proof?.estimated_views || 0}
                    </div>
                    <div className="text-xs text-gray-500">Vues estimées</div>
                  </div>
                  
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <Clock className="w-4 h-4 text-gray-600 mx-auto mb-1" />
                    <div className="text-sm font-medium text-gray-900">
                      {item.proof?.validation_status === 'approved' ? 'Validé' : 
                       item.proof?.validation_status === 'pending' ? 'En cours' : 'N/A'}
                    </div>
                    <div className="text-xs text-gray-500">Validation</div>
                  </div>
                  
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <TrendingUp className="w-4 h-4 text-gray-600 mx-auto mb-1" />
                    <div className="text-sm font-medium text-gray-900">
                      {item.earnings > 0 ? 'Payé' : 'En attente'}
                    </div>
                    <div className="text-xs text-gray-500">Paiement</div>
                  </div>
                </div>

                {/* Statut de la preuve */}
                {item.proof && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">Preuve de publication</h4>
                        <p className="text-sm text-gray-600">
                          Uploadée le {new Date(item.proof.upload_date).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      
                      <div className="text-right">
                        {item.proof.validation_status === 'approved' && (
                          <span className="inline-flex items-center text-green-600">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Validé
                          </span>
                        )}
                        {item.proof.validation_status === 'pending' && (
                          <span className="inline-flex items-center text-yellow-600">
                            <Clock className="w-4 h-4 mr-1" />
                            En validation
                          </span>
                        )}
                        {item.proof.validation_status === 'rejected' && (
                          <span className="inline-flex items-center text-red-600">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Rejeté
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {item.proof.rejection_reason && (
                      <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-800 text-sm">
                          <strong>Raison du rejet:</strong> {item.proof.rejection_reason}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}