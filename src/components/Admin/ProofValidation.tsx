import React, { useState, useEffect } from 'react';
import { supabase, type Proof, type Campaign, type Profile } from '../../lib/supabase';
import { CheckCircle, XCircle, Eye, Calendar, AlertTriangle, User } from 'lucide-react';

type ProofWithDetails = Proof & {
  campaign: Campaign;
  broadcaster: Profile;
};

export function ProofValidation() {
  const [proofs, setProofs] = useState<ProofWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [selectedProof, setSelectedProof] = useState<ProofWithDetails | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [estimatedViews, setEstimatedViews] = useState('');

  useEffect(() => {
    loadPendingProofs();
  }, []);

  const loadPendingProofs = async () => {
    try {
      const { data: proofsData } = await supabase
        .from('proofs')
        .select(`
          *,
          campaign:campaigns(*),
          broadcaster:profiles!proofs_broadcaster_id_fkey(*)
        `)
        .eq('validation_status', 'pending')
        .order('created_at', { ascending: false });

      if (proofsData) {
        setProofs(proofsData);
      }
    } catch (error) {
      console.error('Error loading pending proofs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveProof = async (proofId: string, views: number) => {
    setProcessing(proofId);

    try {
      const proof = proofs.find(p => p.id === proofId);
      if (!proof) return;

      // Valider la preuve
      const { error: proofError } = await supabase
        .from('proofs')
        .update({
          validation_status: 'approved',
          estimated_views: views,
          validated_at: new Date().toISOString(),
        })
        .eq('id', proofId);

      if (proofError) throw proofError;

      // Marquer l'application comme terminée
      const { error: appError } = await supabase
        .from('campaign_applications')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', proof.application_id);

      if (appError) throw appError;

      // Calculer et créditer les gains
      const earnings = proof.campaign.cost_per_view * views;
      
      // Créer la transaction
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert([{
          user_id: proof.broadcaster_id,
          wallet_id: proof.broadcaster.id, // Sera corrigé par un trigger
          type: 'earning',
          amount: earnings,
          status: 'completed',
          description: `Gains pour la campagne "${proof.campaign.title}"`,
          campaign_id: proof.campaign_id,
          proof_id: proofId,
          processed_at: new Date().toISOString(),
        }]);

      if (transactionError) throw transactionError;

      // Mettre à jour le portefeuille
      const { error: walletError } = await supabase.rpc('update_wallet_balance', {
        user_id: proof.broadcaster_id,
        amount: earnings,
        operation: 'add'
      });

      if (walletError) throw walletError;

      // Envoyer une notification au diffuseur
      await supabase.rpc('send_notification', {
        target_user_id: proof.broadcaster_id,
        notification_type: 'proof_validated',
        notification_title: 'Preuve validée',
        notification_message: `Votre preuve pour "${proof.campaign.title}" a été validée. Vous avez gagné ${earnings.toFixed(2)} €`,
        notification_data: { 
          campaign_id: proof.campaign_id,
          proof_id: proofId,
          earnings: earnings
        }
      });

      // Recharger la liste
      await loadPendingProofs();
      setSelectedProof(null);
      setEstimatedViews('');
      alert('Preuve approuvée et paiement traité !');
    } catch (error: any) {
      console.error('Error approving proof:', error);
      alert('Erreur lors de l\'approbation: ' + error.message);
    } finally {
      setProcessing(null);
    }
  };

  const handleRejectProof = async (proofId: string, reason: string) => {
    if (!reason.trim()) {
      alert('Veuillez fournir une raison pour le rejet');
      return;
    }

    setProcessing(proofId);

    try {
      const proof = proofs.find(p => p.id === proofId);
      if (!proof) return;

      const { error } = await supabase
        .from('proofs')
        .update({
          validation_status: 'rejected',
          rejection_reason: reason,
          validated_at: new Date().toISOString(),
        })
        .eq('id', proofId);

      if (error) throw error;

      // Envoyer une notification au diffuseur
      await supabase.rpc('send_notification', {
        target_user_id: proof.broadcaster_id,
        notification_type: 'proof_rejected',
        notification_title: 'Preuve rejetée',
        notification_message: `Votre preuve pour "${proof.campaign.title}" a été rejetée. Raison: ${reason}`,
        notification_data: { 
          campaign_id: proof.campaign_id,
          proof_id: proofId,
          reason: reason
        }
      });

      // Recharger la liste
      await loadPendingProofs();
      setSelectedProof(null);
      setRejectionReason('');
      alert('Preuve rejetée');
    } catch (error: any) {
      console.error('Error rejecting proof:', error);
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
        <h1 className="text-2xl font-bold text-gray-900">Validation des preuves</h1>
        <p className="text-gray-600">
          {proofs.length} preuve(s) en attente de validation
        </p>
      </div>

      {proofs.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
          <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Toutes les preuves sont validées
          </h3>
          <p className="text-gray-600">
            Aucune preuve en attente de validation.
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {proofs.map((proof) => (
            <div
              key={proof.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
            >
              <div className="p-6">
                <div className="grid lg:grid-cols-2 gap-6">
                  {/* Informations */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {proof.campaign.title}
                      </h3>
                      <p className="text-gray-600">
                        {proof.campaign.description}
                      </p>
                    </div>

                    {/* Informations du diffuseur */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                        <User className="w-4 h-4 mr-2" />
                        Diffuseur
                      </h4>
                      <div className="text-sm space-y-1">
                        <p><strong>Nom:</strong> {proof.broadcaster.full_name}</p>
                        <p><strong>Téléphone:</strong> {proof.broadcaster.phone_number}</p>
                        <p><strong>Ville:</strong> {proof.broadcaster.city}</p>
                        <p><strong>Uploadé le:</strong> {new Date(proof.upload_date).toLocaleDateString('fr-FR')} à {new Date(proof.upload_date).toLocaleTimeString('fr-FR')}</p>
                      </div>
                    </div>

                    {/* Détails de la campagne */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-lg font-bold text-blue-600">
                          {proof.campaign.cost_per_view.toFixed(2)} €
                        </div>
                        <div className="text-xs text-gray-600">Par vue</div>
                      </div>
                      
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-lg font-bold text-green-600">
                          {(proof.campaign.cost_per_view * (proof.estimated_views || 100)).toFixed(2)} €
                        </div>
                        <div className="text-xs text-gray-600">Gain estimé</div>
                      </div>
                    </div>
                  </div>

                  {/* Capture d'écran */}
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Preuve de publication</h4>
                      <img
                        src={proof.screenshot_url}
                        alt="Preuve de publication"
                        className="w-full rounded-lg border border-gray-200"
                      />
                    </div>

                    {/* Validation */}
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-start">
                        <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
                        <div>
                          <h5 className="font-medium text-yellow-800 mb-2">Points à vérifier</h5>
                          <ul className="text-yellow-700 text-sm space-y-1">
                            <li>• Le Status WhatsApp est clairement visible</li>
                            <li>• Le contenu correspond à la campagne</li>
                            <li>• Le nom du diffuseur est visible</li>
                            <li>• La capture semble authentique</li>
                            <li>• Le timestamp est récent</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions de validation */}
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Approbation */}
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-gray-700">
                        Nombre de vues estimées
                      </label>
                      <input
                        type="number"
                        value={estimatedViews}
                        onChange={(e) => setEstimatedViews(e.target.value)}
                        placeholder="100"
                        min="1"
                        max="1000"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                      <button
                        onClick={() => handleApproveProof(proof.id, parseInt(estimatedViews) || 100)}
                        disabled={processing === proof.id}
                        className="w-full bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                      >
                        {processing === proof.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        ) : (
                          <CheckCircle className="w-5 h-5 mr-2" />
                        )}
                        Approuver et payer
                      </button>
                    </div>

                    {/* Rejet */}
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-gray-700">
                        Raison du rejet
                      </label>
                      <textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        rows={3}
                        placeholder="Expliquez pourquoi cette preuve est rejetée..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      />
                      <button
                        onClick={() => handleRejectProof(proof.id, rejectionReason)}
                        disabled={!rejectionReason.trim() || processing === proof.id}
                        className="w-full bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                      >
                        <XCircle className="w-5 h-5 mr-2" />
                        Rejeter
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}