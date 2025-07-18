import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ref, update } from 'firebase/database';
import { db } from '../../lib/firebase';
import { X, User, Phone, Calendar, Users } from 'lucide-react';
import { Athlete, AthleteSport } from '../../types';

interface AddAthleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAthleteAdded: () => void;
}

const AddAthleteModal: React.FC<AddAthleteModalProps> = ({ isOpen, onClose, onAthleteAdded }) => {
  const { club, currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    nom: '',
    date_naissance: '',
    telephone: '',
    sexe: 'Homme' as 'Homme' | 'Femme',
    selectedSports: [] as string[]
  });

  const [sportDetails, setSportDetails] = useState<Record<string, { montant: number; date_debut: string }>>({});

  const handleSportSelection = (sportId: string, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        selectedSports: [...prev.selectedSports, sportId]
      }));
      setSportDetails(prev => ({
        ...prev,
        [sportId]: {
          montant: 0,
          date_debut: new Date().toISOString().split('T')[0]
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        selectedSports: prev.selectedSports.filter(id => id !== sportId)
      }));
      setSportDetails(prev => {
        const newDetails = { ...prev };
        delete newDetails[sportId];
        return newDetails;
      });
    }
  };

  const handleSportDetailChange = (sportId: string, field: 'montant' | 'date_debut', value: string | number) => {
    setSportDetails(prev => ({
      ...prev,
      [sportId]: {
        ...prev[sportId],
        [field]: value
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !club) return;

    setLoading(true);
    setError('');

    try {
      // Generate unique athlete ID
      const athleteId = `athlete_${Date.now()}`;
      
      // Create athlete sports object
      const athleteSports: Record<string, AthleteSport> = {};
      formData.selectedSports.forEach(sportId => {
        const sport = club.sports[sportId];
        const details = sportDetails[sportId];
        if (sport && details) {
          athleteSports[sportId] = {
            sportId,
            sportName: sport.name,
            montant: details.montant,
            date_debut: details.date_debut,
            paiements: {} // Start with empty payments - they will be auto-generated
          };
        }
      });

      // Create new athlete
      const newAthlete: Athlete = {
        id: athleteId,
        nom: formData.nom,
        date_naissance: formData.date_naissance,
        telephone: formData.telephone,
        sexe: formData.sexe,
        status: 'active',
        sports: athleteSports
      };

      // Update club document in Firestore
      const athleteRef = ref(db, `clubs/${currentUser.uid}/athletes/${athleteId}`);
      await update(ref(db, `clubs/${currentUser.uid}`), {
        [`athletes/${athleteId}`]: newAthlete
      });

      // Reset form
      setFormData({
        nom: '',
        date_naissance: '',
        telephone: '',
        sexe: 'Homme',
        selectedSports: []
      });
      setSportDetails({});
      
      onAthleteAdded();
      onClose();
    } catch (error: any) {
      setError(error.message || 'Erreur lors de l\'ajout de l\'athlète');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const availableSports = Object.values(club?.sports || {});

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Ajouter un Athlète</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Informations Personnelles</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom Complet *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={formData.nom}
                  onChange={(e) => setFormData(prev => ({ ...prev, nom: e.target.value }))}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nom et prénom de l'athlète"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date de Naissance *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="date"
                    value={formData.date_naissance}
                    onChange={(e) => setFormData(prev => ({ ...prev, date_naissance: e.target.value }))}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sexe *
                </label>
                <select
                  value={formData.sexe}
                  onChange={(e) => setFormData(prev => ({ ...prev, sexe: e.target.value as 'Homme' | 'Femme' }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="Homme">Homme</option>
                  <option value="Femme">Femme</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Téléphone *
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="tel"
                  value={formData.telephone}
                  onChange={(e) => setFormData(prev => ({ ...prev, telephone: e.target.value }))}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="06xxxxxxxx"
                  required
                />
              </div>
            </div>
          </div>

          {/* Sports Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Sports Pratiqués
            </h3>
            
            {availableSports.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>Aucun sport disponible</p>
                <p className="text-sm">Ajoutez d'abord des sports dans la section Sports</p>
              </div>
            ) : (
              <div className="space-y-4">
                {availableSports.map((sport) => (
                  <div key={sport.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center mb-3">
                      <input
                        type="checkbox"
                        id={`sport-${sport.id}`}
                        checked={formData.selectedSports.includes(sport.id)}
                        onChange={(e) => handleSportSelection(sport.id, e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor={`sport-${sport.id}`} className="ml-2 text-sm font-medium text-gray-900">
                        {sport.name}
                      </label>
                    </div>
                    
                    {formData.selectedSports.includes(sport.id) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 pl-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Montant Mensuel (DH)
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={sportDetails[sport.id]?.montant || ''}
                            onChange={(e) => handleSportDetailChange(sport.id, 'montant', parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="200"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Date de Début
                          </label>
                          <input
                            type="date"
                            value={sportDetails[sport.id]?.date_debut || ''}
                            onChange={(e) => handleSportDetailChange(sport.id, 'date_debut', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading || formData.selectedSports.length === 0}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              ) : null}
              {loading ? 'Ajout...' : 'Ajouter l\'Athlète'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddAthleteModal;