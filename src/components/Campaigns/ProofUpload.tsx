import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, type Campaign, type CampaignApplication } from '../../lib/supabase';
import { ArrowLeft, Upload, CheckCircle, AlertCircle, Camera } from 'lucide-react';

interface ProofUploadProps {
  application: CampaignApplication & { campaign: Campaign };
  onBack: () => void;
  onSuccess: () => void;
}

export function ProofUpload({ application, onBack, onSuccess }: ProofUploadProps) {
  const { profile } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      setError('Veuillez sélectionner une image (PNG, JPG, JPEG)');
      return;
    }

    // Vérifier la taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('L\'image ne doit pas dépasser 5MB');
      return;
    }

    setSelectedFile(file);
    setError('');

    // Créer un aperçu
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile || !profile) return;

    setUploading(true);
    setError('');

    try {
      // Upload du fichier vers Supabase Storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `proof_${application.id}_${Date.now()}.${fileExt}`;
      const filePath = `proofs/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('campaign-media')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      // Obtenir l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from('campaign-media')
        .getPublicUrl(filePath);

      // Créer l'enregistrement de preuve
      const { error: proofError } = await supabase
        .from('proofs')
        .insert([{
          application_id: application.id,
          broadcaster_id: profile.id,
          campaign_id: application.campaign_id,
          screenshot_url: publicUrl,
          validation_status: 'pending',
          estimated_views: 100, // Estimation par défaut
        }]);

      if (proofError) throw proofError;

      // Mettre à jour l'application pour marquer qu'une preuve a été uploadée
      const { error: updateError } = await supabase
        .from('campaign_applications')
        .update({ proof_uploaded: true })
        .eq('id', application.id);

      if (updateError) throw updateError;

      // Envoyer une notification à l'admin pour validation
      await supabase.rpc('send_notification', {
        target_user_id: 'admin', // Sera géré par une fonction pour tous les admins
        notification_type: 'proof_submitted',
        notification_title: 'Nouvelle preuve à valider',
        notification_message: `${profile.full_name} a soumis une preuve pour la campagne "${application.campaign.title}"`,
        notification_data: { 
          campaign_id: application.campaign_id, 
          broadcaster_id: profile.id,
          application_id: application.id
        }
      });

      onSuccess();
    } catch (error: any) {
      console.error('Error uploading proof:', error);
      setError(error.message || 'Erreur lors de l\'upload');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Upload de la preuve</h1>
          <p className="text-gray-600">Campagne: {application.campaign.title}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        {/* Instructions importantes */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-blue-900 mb-2">Instructions importantes</h3>
              <ul className="text-blue-800 text-sm space-y-1">
                <li>• La capture d'écran doit montrer clairement votre Status WhatsApp</li>
                <li>• Le contenu publié doit être identique au média de la campagne</li>
                <li>• Le texte doit correspondre exactement à celui fourni</li>
                <li>• La capture doit être récente (moins de 24h)</li>
                <li>• Votre nom d'utilisateur doit être visible</li>
              </ul>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Zone d'upload */}
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Capture d'écran de votre Status WhatsApp *
            </label>
            
            {!selectedFile ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Sélectionnez votre capture d'écran
                </h3>
                <p className="text-gray-600 mb-4">
                  Formats acceptés: PNG, JPG, JPEG (max 5MB)
                </p>
                <label className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors">
                  <Upload className="w-4 h-4 mr-2" />
                  Choisir un fichier
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Aperçu */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">Aperçu de votre capture</h4>
                    <button
                      onClick={() => {
                        setSelectedFile(null);
                        setPreview(null);
                      }}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      Changer
                    </button>
                  </div>
                  
                  {preview && (
                    <img
                      src={preview}
                      alt="Aperçu de la preuve"
                      className="w-full max-w-sm mx-auto rounded-lg border border-gray-200"
                    />
                  )}
                  
                  <div className="mt-3 text-sm text-gray-600">
                    <p><strong>Fichier:</strong> {selectedFile.name}</p>
                    <p><strong>Taille:</strong> {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>

                {/* Checklist de validation */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Vérifiez avant d'envoyer</h4>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded border-gray-300 text-blue-600 mr-3" />
                      <span className="text-sm text-gray-700">Le Status est bien visible dans la capture</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded border-gray-300 text-blue-600 mr-3" />
                      <span className="text-sm text-gray-700">Le contenu correspond exactement à la campagne</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded border-gray-300 text-blue-600 mr-3" />
                      <span className="text-sm text-gray-700">Mon nom d'utilisateur est visible</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded border-gray-300 text-blue-600 mr-3" />
                      <span className="text-sm text-gray-700">La capture est récente (moins de 24h)</span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex space-x-4">
            <button
              onClick={onBack}
              className="flex-1 flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour aux instructions
            </button>
            
            <button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="flex-1 flex items-center justify-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Upload en cours...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Envoyer la preuve
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}