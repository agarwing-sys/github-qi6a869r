import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Megaphone, Radio, ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { beninLocations, departments, getCitiesByDepartment } from '../../data/beninLocations';

export function RoleSelection() {
  const [selectedRole, setSelectedRole] = useState<'advertiser' | 'broadcaster' | null>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    department: '',
    city: '',
    age: '',
    gender: '',
    interests: [] as string[],
    referred_by: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [availableCities, setAvailableCities] = useState<string[]>([]);

  const { user, updateProfile } = useAuth();

  const interestOptions = [
    'Mode', 'Sport', 'Technologie', 'Cuisine', 'Voyage', 'Musique',
    'Film & TV', 'Santé', 'Education', 'Business', 'Art', 'Gaming'
  ];

  const handleDepartmentChange = (department: string) => {
    setFormData(prev => ({
      ...prev,
      department,
      city: '' // Reset city when department changes
    }));
    setAvailableCities(getCitiesByDepartment(department));
  };

  const handleInterestToggle = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole || !user) return;

    setLoading(true);
    setError('');

    try {
      // Créer le profil
      const profileData = {
        user_id: user.id,
        phone_number: user.phone || '',
        full_name: formData.full_name,
        role: selectedRole,
        region: formData.department, // Store department as region
        city: formData.city,
        age: formData.age ? parseInt(formData.age) : null,
        gender: formData.gender || null,
        interests: formData.interests,
        referred_by: formData.referred_by || null,
        is_active: true,
        is_verified: false,
      };

      console.log('Creating profile with data:', profileData);

      const { error: profileError } = await supabase
        .from('profiles')
        .insert([profileData]);

      if (profileError) {
        console.error('Profile creation error:', profileError);
        throw profileError;
      }

      // Traiter le parrainage si applicable
      if (formData.referred_by) {
        console.log('Processing referral:', formData.referred_by);
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
            // Ne pas faire échouer l'inscription pour une erreur de parrainage
          }
        } else {
          console.warn('Referral code not found:', formData.referred_by);
        }
      }

      // Recharger le profil
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error: any) {
      console.error('Error creating profile:', error);
      setError(error.message || 'Erreur lors de la création du profil');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-2xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Choisissez votre rôle</h1>
          <p className="text-gray-600 mt-2">
            Comment souhaitez-vous utiliser Whatspay ?
          </p>
        </div>

        {!selectedRole ? (
          <div className="grid md:grid-cols-2 gap-6">
            <button
              onClick={() => setSelectedRole('advertiser')}
              className="group p-8 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all"
            >
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200">
                <Megaphone className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Annonceur</h3>
              <p className="text-gray-600 text-sm">
                Créez des campagnes publicitaires et touchez votre audience via les Status WhatsApp
              </p>
              <ul className="mt-4 text-sm text-gray-500 space-y-1">
                <li>• Créer des campagnes</li>
                <li>• Ciblage précis</li>
                <li>• Analytics détaillés</li>
                <li>• Paiement sécurisé</li>
              </ul>
            </button>

            <button
              onClick={() => setSelectedRole('broadcaster')}
              className="group p-8 border-2 border-gray-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all"
            >
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200">
                <Radio className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Diffuseur</h3>
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
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg mb-6">
              <p className="text-blue-800">
                Vous avez choisi : <strong>
                  {selectedRole === 'advertiser' ? 'Annonceur' : 'Diffuseur'}
                </strong>
              </p>
              <button
                type="button"
                onClick={() => setSelectedRole(null)}
                className="text-blue-600 underline text-sm mt-2"
              >
                Changer
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom complet *
                </label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Âge
                </label>
                <input
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Genre
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Sélectionner</option>
                  <option value="male">Homme</option>
                  <option value="female">Femme</option>
                  <option value="other">Autre</option>
                </select>
              </div>

              <div>
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Centres d'intérêt
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {interestOptions.map((interest) => (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => handleInterestToggle(interest)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      formData.interests.includes(interest)
                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                        : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {interest}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !formData.full_name || !formData.department || !formData.city}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span>Créer mon compte</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}