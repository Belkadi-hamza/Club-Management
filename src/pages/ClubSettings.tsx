import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ref, update } from 'firebase/database';
import { db } from '../lib/firebase';
import { Building2, Phone, Mail, Save, Camera } from 'lucide-react';

const ClubSettings: React.FC = () => {
  const { club, currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: club?.name || '',
    phone: club?.phone || '',
    email: club?.email || '',
    imageUrl: club?.imageUrl || ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const clubRef = ref(db, `clubs/${currentUser.uid}`);
      await update(clubRef, {
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        imageUrl: formData.imageUrl
      });

      setSuccess('Informations du club mises à jour avec succès !');
      
      // Refresh the page to update the context
      // Real-time updates will handle this automatically
    } catch (error: any) {
      setError(error.message || 'Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setSuccess('');
    setError('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Paramètres du Club</h1>
        <p className="text-gray-600">Gérez les informations de votre club</p>
      </div>

      {/* Club Information Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Informations du Club</h2>
          <p className="text-sm text-gray-600 mt-1">Modifiez les informations de base de votre club</p>
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

          {/* Club Logo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Logo du Club
            </label>
            <div className="flex items-center space-x-4">
              {formData.imageUrl ? (
                <img
                  src={formData.imageUrl}
                  alt="Logo du club"
                  className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                />
              ) : (
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center border-2 border-gray-200">
                  <Building2 className="w-8 h-8 text-gray-400" />
                </div>
              )}
              <div className="flex-1">
                <div className="relative">
                  <Camera className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="url"
                    value={formData.imageUrl}
                    onChange={(e) => handleInputChange('imageUrl', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="URL de l'image du logo"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Utilisez une URL d'image (ex: https://example.com/logo.jpg)
                </p>
              </div>
            </div>
          </div>

          {/* Club Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom du Club *
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nom de votre club"
                required
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Téléphone
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="06xxxxxxxx"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="contact@monclub.ma"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-4 border-t border-gray-200">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              ) : (
                <Save className="w-5 h-5 mr-2" />
              )}
              {loading ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </button>
          </div>
        </form>
      </div>

      {/* Additional Information */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <Building2 className="w-5 h-5 text-blue-600 mt-0.5" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Informations importantes
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc list-inside space-y-1">
                <li>Le nom du club apparaîtra dans tous les documents et interfaces</li>
                <li>Le téléphone sera utilisé pour les communications importantes</li>
                <li>L'email peut être différent de votre email de connexion</li>
                <li>Le logo doit être une image accessible via une URL publique</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClubSettings;