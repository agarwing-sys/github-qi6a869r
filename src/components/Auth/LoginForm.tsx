import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Phone, ArrowRight, Loader2 } from 'lucide-react';

export function LoginForm() {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { signInWithOTP, verifyOTP } = useAuth();

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Valider le format du numéro de téléphone
      const cleanPhone = phone.replace(/\s/g, '');
      if (!cleanPhone.startsWith('+')) {
        throw new Error('Le numéro doit commencer par un indicatif pays (ex: +33)');
      }
      
      await signInWithOTP(cleanPhone);
      setStep('otp');
    } catch (error: any) {
      console.error('OTP send error:', error);
      setError(error.message || 'Erreur lors de l\'envoi du code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const cleanPhone = phone.replace(/\s/g, '');
      await verifyOTP(cleanPhone, otp);
    } catch (error: any) {
      console.error('OTP verify error:', error);
      setError(error.message || 'Code invalide');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Phone className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Bienvenue sur Whatspay</h1>
          <p className="text-gray-600 mt-2">
            {step === 'phone'
              ? 'Entrez votre numéro de téléphone pour continuer'
              : 'Entrez le code reçu par SMS'
            }
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {step === 'phone' ? (
          <form onSubmit={handleSendOTP} className="space-y-6">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Numéro de téléphone
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+33 6 12 34 56 78"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || !phone}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span>Envoyer le code</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="space-y-6">
            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
                Code de vérification
              </label>
              <input
                id="otp"
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="123456"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-lg font-mono"
                maxLength={6}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <span>Vérifier</span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep('phone');
                setOtp('');
                setError('');
              }}
              className="w-full text-blue-600 hover:text-blue-700 font-medium"
            >
              Modifier le numéro
            </button>
          </form>
        )}
      </div>
    </div>
  );
}