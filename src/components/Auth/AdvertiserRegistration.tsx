import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Building2, ArrowRight, Loader2, Upload } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { beninLocations, departments, getCitiesByDepartment } from '../../data/beninLocations';

interface AdvertiserRegistrationProps {
  onBack: () => void;
}

export function AdvertiserRegistration({ onBack }: AdvertiserRegistrationProps) {
  const [formData, setFormData] = useState({
    company_name: '',
    business_sector: '',
    company_address: '',
    contact_person_name: '',
    contact_person_email: '',
    department: '',
    city: '',
    tax_id: '',
    referred_by: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [availableCities, setAvailableCities] = useState<string[]>([]);

  const { user } = useAuth();

  const businessSectors = [
    'Agriculture',
    'Alimentation & Boissons',
    'Automobile',
    'Banque & Finance',
    'BTP & Construction',
    'Commerce & Distribution',
    'Consulting',
    'Éducation & Formation',
    'Énergie',
    'Événementiel',
    'Immobilier',
    'Industrie',
    'Informatique & Tech',
    'Logistique & Transport',
    'Marketing & Communication',
    'Mode & Beauté',
    'ONG & Associations',
    'Restauration & Hôtellerie',
    'Santé & Pharmaceutique',
    'Services',
    'Sport & Loisirs',
    'Télécommunications',
    'Tourisme',
    'Autre'
  ];

  const handleDepartmentChange = (department: string) => {
    setFormData(prev => ({
      ...prev,
      department,
      city: ''
    }));
    setAvailableCities(getCitiesByDepartment(department));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError('');

    try {
      const profileData = {
        user_id: user.id,
        phone_number: user.phone || '',
        full_name: formData.contact_person_name,
        role: 'advertiser',
        region: formData.department,
        city: formData.city,
        is_active: true,
        is_verified: false,
        // Données spécifiques aux entreprises stockées en JSON
        company_info: {
          company_name: formData.company_name,
          business_sector: formData.business_sector,
          company_address: formData.company_address,
          contact_person_email: formData.contact_person_email,
          tax_id: formData.tax_id,
        },
        referred_by: formData.referred_by || null,
      };

      const { error: profileError } = await supabase
        .from('profiles')
        .insert([profileData]);

      if (profileError) {
        console.error('Profile creation error:', profileError);
        throw profileError;
      }

      // Traiter le parrainage si applicable
      if (formData.referred_by) {
        const { data: referrer } = await supabase
          .from('profiles')
          .select('id')
          .eq('referral_code', formData.referred_by)
          .single();

        if (referrer) {
          const { error: referralError } = await supabase
            .from('referrals')
            .insert([{
              referrer_id: referrer.id,
              referred_id: profileData.user_id,
              referral_code: formData.referred_by,
            }]);
          
          if (referralError) {
            console.error('Referral creation error:', referralError);
          }
        }
      }

      // Recharger la page pour mettre à jour le contexte
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error: any) {
      console.error('Error creating advertiser profile:', error);
      setError(error.message || 'Erreur lors de la création du profil');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Building2 className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Inscription Entreprise</h2>
        <p className="text-gray-600 mt-2">
          Renseignez les informations de votre entreprise
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informations de l'entreprise */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Informations de l'entreprise
          </h3>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom de l'entreprise *
              </label>
              <input
                type="text"
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Secteur d'activité *
              </label>
              <select
                value={formData.business_sector}
                onChange={(e) => setFormData({ ...formData, business_sector: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Sélectionner un secteur</option>
                {businessSectors.map((sector) => (
                  <option key={sector} value={sector}>
                    {sector}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Numéro d'identification fiscale (optionnel)
              </label>
              <input
                type="text"
                value={formData.tax_id}
                onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                placeholder="Ex: 123456789"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Adresse de l'entreprise *
              </label>
              <textarea
                value={formData.company_address}
                onChange={(e) => setFormData({ ...formData, company_address: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Département *
              </label>
              <select
                value={formData.department}
                onChange={(e) => handleDepartmentChange(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Sélectionner un département</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ville *
              </label>
              <select
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={!formData.department}
                required
              >
                <option value="">
                  {formData.department ? 'Sélectionner une ville' : 'Sélectionnez d\'abord un département'}
                </option>
                {availableCities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Personne de contact */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Personne de contact
          </h3>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom complet *
              </label>
              <input
                type="text"
                value={formData.contact_person_name}
                onChange={(e) => setFormData({ ...formData, contact_person_name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email professionnel *
              </label>
              <input
                type="email"
                value={formData.contact_person_email}
                onChange={(e) => setFormData({ ...formData, contact_person_email: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Code de parrainage (optionnel)
              </label>
              <input
                type="text"
                value={formData.referred_by}
                onChange={(e) => setFormData({ ...formData, referred_by: e.target.value.toUpperCase() })}
                placeholder="WP123456"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="flex space-x-4">
          <button
            type="button"
            onClick={onBack}
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Retour
          </button>
          <button
            type="submit"
            disabled={loading || !formData.company_name || !formData.contact_person_name || !formData.contact_person_email || !formData.business_sector || !formData.company_address || !formData.department || !formData.city}
            className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <span>Créer mon compte entreprise</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}