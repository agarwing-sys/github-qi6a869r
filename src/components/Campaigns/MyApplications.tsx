import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, type Campaign, type CampaignApplication } from '../../lib/supabase';
import { Clock, CheckCircle, XCircle, Upload, Eye, AlertTriangle } from 'lucide-react';
import { PublicationGuidelines } from './PublicationGuidelines';
import { ProofUpload } from './ProofUpload';

type ApplicationWithCampaign = CampaignApplication & {
  campaign: Campaign;
};

export function MyApplications() {
  const { profile } = useAuth();
  const [applications, setApplications] = useState<ApplicationWithCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<ApplicationWithCampaign | null>(null);
  const [showGuidelines, setShowGuidelines] = useState(false);
  const [showProofUpload, setShowProofUpload] = useState(false);

  useEffect(() => {
    if (profile) {
      loadMyApplications();
    }
  }, [profile]);

  const loadMyApplications = async () => {
    if (!profile) return;

    try {
      const { data: applicationsData } = await supabase
        .from('campaign_applications')
        .select(`
          *,
          campaign:campaigns(*)
        `)
        .eq('broadcaster_id', profile.id)
        .order('applied_at', { ascending: false });

      if (applicationsData) {
        setApplications(applicationsData);
      }
    } catch (error) {
      console.error('Error loading applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const getApplicationStatus = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          text: 'En attente',
          color: 'bg-yellow-100 text-yellow-800',
          icon: Clock,
          description: 'Votre candidature est en cours d\'examen'
        };
      case 'accepted':
        return {
          text: 'Accepté',
          color: 'bg-green-100 text-green-800',
          icon: CheckCircle,
          description: 'Vous pouvez maintenant publier cette campagne'
        };
      case 'rejected':
        return {
          text: 'Refusé',
          color: 'bg-red-100 text-red-800',
          icon: XCircle,
          description: 'Votre candidature n\'a pas été retenue'
        };
      case 'completed':
        return {
          text: 'Terminé',
          color: 'bg-blue-100 text-blue-800',
          icon: CheckCircle,
          description: 'Campagne terminée avec succès'
        };
      default:
        return {
          text: status,
          color: 'bg-gray-100 text-gray-800',
          icon: Clock,
          description: ''
        };
    }
  };

  const needsProof = (application: ApplicationWithCampaign) => {
    return application.status === 'accepted' && !application.proof_uploaded;
  };

  const isExpiringSoon = (application: ApplicationWithCampaign) => {
    if (application.status !== 'accepted' || !application.accepted_at) return false;
    
    const acceptedTime = new Date(application.accepted_at).getTime();
    const now = new Date().getTime();
    const hoursElapsed = (now - acceptedTime) / (1000 * 60 * 60);
    
    return hoursElapsed > 23; // Plus de 23h depuis l'acceptation
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (showGuidelines && selectedApplication) {
    return (
      <PublicationGuidelines
        campaign={selectedApplication.campaign}
        onBack={() => {
          setShowGuidelines(false);
          setSelectedApplication(null);
        }}
        onProceedToUpload={() => {
          setShowGuidelines(false);
          setShowProofUpload(true);
        }}
      />
    );
  }

  if (showProofUpload && selectedApplication) {
    return (
      <ProofUpload
        application={selectedApplication}
        onBack={() => {
          setShowProofUpload(false);
          setSelectedApplication(null);
        }}
        onSuccess={() => {
          setShowProofUpload(false);
          setSelectedApplication(null);
          loadMyApplications();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mes candidatures</h1>
        <p className="text-gray-600">
          Suivez l'état de vos candidatures et gérez vos publications
        </p>
      </div>

      {applications.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
          <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Aucune candidature
          </h3>
          <p className="text-gray-600 mb-6">
            Vous n'avez pas encore candidaté à des campagnes.
          </p>
          <a
            href="/available-campaigns"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Voir les campagnes disponibles
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((application) => {
            const status = getApplicationStatus(application.status);
            const StatusIcon = status.icon;
            const needsProofUpload = needsProof(application);
            const expiringSoon = isExpiringSoon(application);
            
            return (
              <div
                key={application.id}
                className={`bg-white rounded-xl shadow-sm border overflow-hidden ${
                  needsProofUpload && expiringSoon ? 'border-red-200 bg-red-50' : 'border-gray-100'
                }`}
              >
                <div className="p-6">
                  {/* Header avec alerte si nécessaire */}
                  {needsProofUpload && expiringSoon && (
                    <div className="flex items-center p-3 bg-red-100 rounded-lg mb-4">
                      <AlertTriangle className="w-5 h-5 text-red-600 mr-3" />
                      <div className="text-sm text-red-800">
                        <strong>Action requise :</strong> Vous devez uploader la preuve de publication avant expiration
                      </div>
                    </div>
                  )}

                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {application.campaign.title}
                      </h3>
                      <p className="text-gray-600 mb-3">
                        {application.campaign.description}
                      </p>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <DollarSign className="w-4 h-4 mr-1" />
                          {application.campaign.cost_per_view.toFixed(2)} € par vue
                        </div>
                        <div className="flex items-center">
                          <Eye className="w-4 h-4 mr-1" />
                          {application.campaign.target_views.toLocaleString()} vues cibles
                        </div>
                      </div>
                    </div>

                    <div className="ml-4 text-right">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${status.color}`}>
                        <StatusIcon className="w-4 h-4 mr-2" />
                        {status.text}
                      </span>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(application.applied_at).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 mb-4">
                    {status.description}
                  </p>

                  {/* Actions selon le statut */}
                  {application.status === 'accepted' && (
                    <div className="flex space-x-3">
                      <button
                        onClick={() => {
                          setSelectedApplication(application);
                          setShowGuidelines(true);
                        }}
                        className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Voir les instructions
                      </button>
                      
                      <button
                        onClick={() => {
                          setSelectedApplication(application);
                          setShowProofUpload(true);
                        }}
                        className={`flex-1 px-4 py-2 rounded-lg transition-colors flex items-center justify-center ${
                          needsProofUpload
                            ? 'bg-green-600 text-white hover:bg-green-700'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {needsProofUpload ? 'Uploader la preuve' : 'Preuve uploadée'}
                      </button>
                    </div>
                  )}

                  {application.status === 'completed' && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-green-800">
                            Campagne terminée avec succès
                          </div>
                          <div className="text-sm text-green-600">
                            Gain: {(application.campaign.cost_per_view * 100).toFixed(2)} € ajouté à votre portefeuille
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}