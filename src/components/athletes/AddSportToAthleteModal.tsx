import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ref, update } from 'firebase/database';
import { db } from '../../lib/firebase';
import { X, Trophy, DollarSign, Calendar } from 'lucide-react';
import { AthleteSport } from '../../types';

interface AddSportToAthleteModalProps {
  isOpen: boolean;
  athleteId: string;
  athleteName: string;
  onClose: () => void;
  onSportAdded: () => void;
}

const AddSportToAthleteModal: React.FC<AddSportToAthleteModalProps> = ({ 
  isOpen, 
  athleteId, 
  athleteName, 
  onClose, 
  onSportAdded 
}) => {
  const { club, currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    sportId: '',
    montant: 0,
    date_debut: new Date().toISOString().split('T')[0]
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !club) return;

    setLoading(true);
    setError('');

    try {
      const sport = club.sports[formData.sportId];
      if (!sport) {
        setError('Sport non trouvé');
        return;
      }

      // Create athlete sport object
      const athleteSport: AthleteSport = {
        sportId: formData.sportId,
        sportName: sport.name,
        montant: formData.montant,
        date_debut: formData.date_debut,
        paiements: {}
      };

      // Update athlete's sports in database
      const athleteSportRef = ref(db, `clubs/${currentUser.uid}/athletes/${athleteId}/sports/${formData.sportId}`);
      await update(ref(db, `clubs/${currentUser.uid}`), {
        [`athletes/${athleteId}/sports/${formData.sportId}`]: athleteSport
      });

      // Reset form
      setFormData({
        sportId: '',
        montant: 0,
        date_debut: new Date().toISOString().split('T')[0]
      });
      
      onSportAdded();
      onClose();
    } catch (error: any) {
      setError(error.message || 'Erreur lors de l\'ajout du sport');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Get available sports (not already assigned to this athlete)
  const athlete = club?.athletes[athleteId];
  const athleteSportIds = athlete ? Object.keys(athlete.sports) : [];
  const availableSports = Object.values(club?.sports || {}).filter(
    sport => !athleteSportIds.includes(sport.id)
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Ajouter un Sport à {athleteName}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {availableSports.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p>Aucun sport disponible</p>
              <p className="text-sm">Cet athlète est déjà inscrit à tous les sports disponibles</p>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sport *
                </label>
                <div className="relative">
                  <Trophy className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <select
                    value={formData.sportId}
                    onChange={(e) => setFormData(prev => ({ ...prev, sportId: e.target.value }))}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Sélectionner un sport</option>
                    {availableSports.map(sport => (
                      <option key={sport.id} value={sport.id}>
                        {sport.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Montant Mensuel (DH) *
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="number"
                    min="0"
                    value={formData.montant}
                    onChange={(e) => setFormData(prev => ({ ...prev, montant: parseInt(e.target.value) || 0 }))}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="200"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date de Début *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="date"
                    value={formData.date_debut}
                    onChange={(e) => setFormData(prev => ({ ...prev, date_debut: e.target.value }))}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  ) : null}
                  {loading ? 'Ajout...' : 'Ajouter le Sport'}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

export default AddSportToAthleteModal;