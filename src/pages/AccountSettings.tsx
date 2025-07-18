import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { Lock, Shield, Key, AlertTriangle } from 'lucide-react';

const AccountSettings: React.FC = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    // Validation
    if (formData.newPassword !== formData.confirmPassword) {
      setError('Les nouveaux mots de passe ne correspondent pas');
      return;
    }

    if (formData.newPassword.length < 6) {
      setError('Le nouveau mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Re-authenticate user before changing password
      const credential = EmailAuthProvider.credential(
        currentUser.email!,
        formData.currentPassword
      );
      
      await reauthenticateWithCredential(currentUser, credential);
      
      // Update password
      await updatePassword(currentUser, formData.newPassword);

      setSuccess('Mot de passe mis à jour avec succès !');
      
      // Reset form
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error: any) {
      if (error.code === 'auth/wrong-password') {
        setError('Mot de passe actuel incorrect');
      } else if (error.code === 'auth/weak-password') {
        setError('Le nouveau mot de passe est trop faible');
      } else {
        setError(error.message || 'Erreur lors de la mise à jour du mot de passe');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setSuccess('');
    setError('');
  };

  const getPasswordStrength = (password: string) => {
    if (password.length === 0) return { strength: 0, label: '', color: '' };
    if (password.length < 6) return { strength: 1, label: 'Faible', color: 'text-red-600' };
    if (password.length < 8) return { strength: 2, label: 'Moyen', color: 'text-yellow-600' };
    if (password.length >= 8 && /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return { strength: 4, label: 'Très fort', color: 'text-green-600' };
    }
    return { strength: 3, label: 'Fort', color: 'text-blue-600' };
  };

  const passwordStrength = getPasswordStrength(formData.newPassword);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Paramètres du Compte</h1>
        <p className="text-gray-600">Gérez la sécurité de votre compte</p>
      </div>

      {/* Account Information */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Informations du Compte</h2>
          <p className="text-sm text-gray-600 mt-1">Informations de connexion actuelles</p>
        </div>
        
        <div className="p-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Email de connexion</p>
              <p className="text-sm text-gray-600">{currentUser?.email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Changer le Mot de Passe</h2>
          <p className="text-sm text-gray-600 mt-1">Mettez à jour votre mot de passe pour sécuriser votre compte</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg">
              {success}
            </div>
          )}
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Current Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mot de passe actuel *
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="password"
                value={formData.currentPassword}
                onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Votre mot de passe actuel"
                required
              />
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nouveau mot de passe *
            </label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="password"
                value={formData.newPassword}
                onChange={(e) => handleInputChange('newPassword', e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Votre nouveau mot de passe"
                required
              />
            </div>
            {formData.newPassword && (
              <div className="mt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Force du mot de passe:</span>
                  <span className={`text-xs font-medium ${passwordStrength.color}`}>
                    {passwordStrength.label}
                  </span>
                </div>
                <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      passwordStrength.strength === 1 ? 'bg-red-500 w-1/4' :
                      passwordStrength.strength === 2 ? 'bg-yellow-500 w-2/4' :
                      passwordStrength.strength === 3 ? 'bg-blue-500 w-3/4' :
                      passwordStrength.strength === 4 ? 'bg-green-500 w-full' : 'w-0'
                    }`}
                  ></div>
                </div>
              </div>
            )}
          </div>

          {/* Confirm New Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirmer le nouveau mot de passe *
            </label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Confirmez votre nouveau mot de passe"
                required
              />
            </div>
            {formData.confirmPassword && formData.newPassword !== formData.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">Les mots de passe ne correspondent pas</p>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-4 border-t border-gray-200">
            <button
              type="submit"
              disabled={loading || formData.newPassword !== formData.confirmPassword || formData.newPassword.length < 6}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              ) : (
                <Shield className="w-5 h-5 mr-2" />
              )}
              {loading ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
            </button>
          </div>
        </form>
      </div>

      {/* Security Tips */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              Conseils de sécurité
            </h3>
            <div className="mt-2 text-sm text-yellow-700">
              <ul className="list-disc list-inside space-y-1">
                <li>Utilisez un mot de passe d'au moins 8 caractères</li>
                <li>Combinez lettres majuscules, minuscules, chiffres et symboles</li>
                <li>Évitez d'utiliser des informations personnelles</li>
                <li>Ne partagez jamais votre mot de passe</li>
                <li>Changez votre mot de passe régulièrement</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountSettings;