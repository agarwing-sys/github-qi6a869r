import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Radio, ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { beninLocations, departments, getCitiesByDepartment } from '../../data/beninLocations';

interface BroadcasterRegistrationProps {
  onBack: () => void;
}

export function BroadcasterRegistration({ onBack }: BroadcasterRegistrationProps) {
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

  const { user } = useAuth();

  const interestOptions = [
    'Mode', 'Sport', 'Technologie', 'Cuisine', 'Voyage', 'Musique',
    'Film & TV', 'Santé', 'Education', 'Business', 'Art', 'Gaming'
  ];

  const handleDepartmentChange = (department: string) => {
    setFormData(prev => ({
      ...prev,
      department,
      city: ''
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
    if (!user) return;

    setLoading(true);
    setError('');

    try {
      const profileData = {
        user_id: user.id,
        phone_number: user.phone || '',
        full_name: formData.full_name,
        role: 'broadcaster',
        region: formData.department,
        city: formData.city,
        age: formData.age ? parseInt(formData.age) : null,
        gender: formData.gender || null,
        interests: formData.interests,
        referred_by: formData.referred_by || null,
        is_active: true,
        is_verified: false,
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
      console.error('Error creating broadcaster profile:', error);
      setError(error.message || 'Erreur lors de la création du profil');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Radio className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Inscription Diffuseur</h2>
        <p className="text-gray-600 mt-2">
          Créez votre profil pour commencer à gagner de l'argent
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
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
              min="16"
              max="80"
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
                    ? 'bg-green-100 text-green-700 border border-green-200'
                    : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
                }`}
              >
                {interest}
              </button>
            ))}
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
            disabled={loading || !formData.full_name || !formData.department || !formData.city}
            className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <span>Créer mon compte diffuseur</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}