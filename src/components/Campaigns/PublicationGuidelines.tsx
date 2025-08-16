import React from 'react';
import { Campaign } from '../../lib/supabase';
import { ArrowLeft, ArrowRight, Smartphone, Clock, Camera, CheckCircle } from 'lucide-react';

interface PublicationGuidelinesProps {
  campaign: Campaign;
  onBack: () => void;
  onProceedToUpload: () => void;
}

export function PublicationGuidelines({ campaign, onBack, onProceedToUpload }: PublicationGuidelinesProps) {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Instructions de publication</h1>
          <p className="text-gray-600">Campagne: {campaign.title}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Instructions */}
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Comment publier cette campagne
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-600 font-bold text-sm">1</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Téléchargez le média</h3>
                    <p className="text-gray-600 text-sm">
                      Sauvegardez l'image ou la vidéo de la campagne sur votre téléphone
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-600 font-bold text-sm">2</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Ouvrez WhatsApp</h3>
                    <p className="text-gray-600 text-sm">
                      Allez dans l'onglet "Status" de votre application WhatsApp
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-600 font-bold text-sm">3</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Publiez le contenu</h3>
                    <p className="text-gray-600 text-sm">
                      Ajoutez le média et utilisez exactement le texte fourni ci-dessous
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-600 font-bold text-sm">4</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Prenez une capture d'écran</h3>
                    <p className="text-gray-600 text-sm">
                      Après publication, faites une capture d'écran de votre Status
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-green-600 font-bold text-sm">5</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Uploadez la preuve</h3>
                    <p className="text-gray-600 text-sm">
                      Revenez ici pour uploader votre capture d'écran comme preuve
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Texte à copier */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">Texte à utiliser (copiez exactement)</h3>
              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <p className="text-gray-900 font-mono text-sm">
                  {campaign.caption || `Découvrez ${campaign.title} ! 🔥`}
                </p>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(campaign.caption || `Découvrez ${campaign.title} ! 🔥`);
                  alert('Texte copié !');
                }}
                className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                📋 Copier le texte
              </button>
            </div>

            {/* Délai important */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center">
                <Clock className="w-5 h-5 text-yellow-600 mr-3" />
                <div>
                  <h3 className="font-medium text-yellow-800">Délai important</h3>
                  <p className="text-yellow-700 text-sm">
                    Vous avez 24h pour publier et uploader la preuve après acceptation de votre candidature.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Aperçu du média */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Aperçu du contenu à publier
              </h3>
              
              <div className="bg-gray-100 rounded-lg p-4">
                {campaign.media_type === 'image' ? (
                  <img
                    src={campaign.media_url}
                    alt={campaign.title}
                    className="w-full rounded-lg"
                  />
                ) : (
                  <video
                    src={campaign.media_url}
                    controls
                    className="w-full rounded-lg"
                  />
                )}
              </div>
              
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Texte à ajouter :</p>
                <p className="font-medium text-gray-900">
                  {campaign.caption || `Découvrez ${campaign.title} ! 🔥`}
                </p>
              </div>
            </div>

            {/* Exemple de Status */}
            <div className="bg-gradient-to-b from-green-500 to-green-600 rounded-2xl p-6 text-white">
              <div className="flex items-center mb-4">
                <Smartphone className="w-6 h-6 mr-3" />
                <h3 className="font-semibold">Exemple de Status WhatsApp</h3>
              </div>
              
              <div className="bg-black bg-opacity-20 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full mr-3"></div>
                  <div>
                    <div className="text-sm font-medium">Votre nom</div>
                    <div className="text-xs opacity-75">il y a quelques secondes</div>
                  </div>
                </div>
                
                <div className="bg-white bg-opacity-10 rounded-lg p-3 mb-3">
                  <div className="text-xs opacity-75 mb-2">[Votre média ici]</div>
                  <p className="text-sm">
                    {campaign.caption || `Découvrez ${campaign.title} ! 🔥`}
                  </p>
                </div>
                
                <div className="text-xs opacity-75">
                  👁️ Vu par vos contacts
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between pt-6 border-t border-gray-100">
          <button
            onClick={onBack}
            className="flex items-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </button>
          
          <button
            onClick={onProceedToUpload}
            className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            J'ai publié, uploader la preuve
            <ArrowRight className="w-4 h-4 ml-2" />
          </button>
        </div>
      </div>
    </div>
  );
}