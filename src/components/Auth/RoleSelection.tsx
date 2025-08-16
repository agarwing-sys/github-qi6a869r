import React, { useState } from 'react';
import { Megaphone, Radio, ArrowRight, Loader2 } from 'lucide-react';
import { AdvertiserRegistration } from './AdvertiserRegistration';
import { BroadcasterRegistration } from './BroadcasterRegistration';

export function RoleSelection() {
  const [selectedRole, setSelectedRole] = useState<'advertiser' | 'broadcaster' | null>(null);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-2xl p-8">
        {selectedRole === 'advertiser' ? (
          <AdvertiserRegistration onBack={() => setSelectedRole(null)} />
        ) : selectedRole === 'broadcaster' ? (
          <BroadcasterRegistration onBack={() => setSelectedRole(null)} />
        ) : (
          <>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Choisissez votre rôle</h1>
              <p className="text-gray-600 mt-2">
                Comment souhaitez-vous utiliser Whatspay ?
              </p>
            </div>

          <div className="grid md:grid-cols-2 gap-6">
            <button
              onClick={() => setSelectedRole('advertiser')}
              className="group p-8 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all"
            >
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200">
                <Megaphone className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Annonceur (Entreprise)</h3>
              <p className="text-gray-600 text-sm">
                Votre entreprise peut créer des campagnes publicitaires et toucher votre audience cible
              </p>
              <ul className="mt-4 text-sm text-gray-500 space-y-1">
                <li>• Créer des campagnes</li>
                <li>• Ciblage précis</li>
                <li>• Analytics détaillés</li>
                <li>• Facturation entreprise</li>
              </ul>
            </button>

            <button
              onClick={() => setSelectedRole('broadcaster')}
              className="group p-8 border-2 border-gray-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all"
            >
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200">
                <Radio className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Diffuseur (Particulier)</h3>
              <p className="text-gray-600 text-sm">
                Monétisez vos Status WhatsApp en diffusant des publicités ciblées
              </p>
              <ul className="mt-4 text-sm text-gray-500 space-y-1">
                <li>• Gagner de l'argent</li>
                <li>• Campagnes adaptées</li>
                <li>• Paiements rapides</li>
                <li>• Système de parrainage</li>
              </ul>
            </button>
          </div>
          </>
        )}
      </div>
    </div>
  );
}