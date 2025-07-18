import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ref, update } from 'firebase/database';
import { db } from '../../lib/firebase';
import { X, Trophy, DollarSign, Calendar } from 'lucide-react';
import { AthleteSport } from '../../types';

interface EditSportModalProps {
  isOpen: boolean;
  athleteId: string;
  athleteName: string;
  sport: AthleteSport | null;
  onClose: () => void;
  onSportUpdated: () => void;
}

const EditSportModal: React.FC<EditSportModalProps> = ({ 
  isOpen, 
  athleteId, 
  athleteName, 
  sport, 
  onClose, 
  onSportUpdated 
}) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    montant: sport?.montant || 0,
    date_debut: sport?.date_debut || new Date().toISOString().split('T')[0]
  });

  React.useEffect(() => {
    if (sport) {
      setFormData({
        montant: sport.montant,
        date_debut: sport.date_debut
      });
    }
  }, [sport]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !sport) return;

    setLoading(true);
    setError('');

    try {
      // Update sport details in database
      await update(ref(db, `clubs/${currentUser.uid}`), {
        [`athletes/${athleteId}/sports/${sport.sportId}/montant`]: formData.montant,
        [`athletes/${athleteId}/sports/${sport.sportId}/date_debut`]: formData.date_debut
      });
      
      onSportUpdated();
      onClose();
    } catch (error: any) {
      setError(error.message || 'Erreur lors de la mise à jour du sport');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !sport) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Modifier {sport.sportName} - {athleteName}
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sport
            </label>
            <div className="relative">
              <Trophy className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={sport.sportName}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
                disabled
              />
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
              {loading ? 'Mise à jour...' : 'Mettre à jour'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditSportModal;