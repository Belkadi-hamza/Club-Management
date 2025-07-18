import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ref, update, remove } from 'firebase/database';
import { db } from '../../lib/firebase';
import { X, Trophy, AlertTriangle } from 'lucide-react';
import { AthleteSport } from '../../types';

interface DeactivateSportModalProps {
  isOpen: boolean;
  athleteId: string;
  athleteName: string;
  sport: AthleteSport | null;
  onClose: () => void;
  onSportDeactivated: () => void;
}

const DeactivateSportModal: React.FC<DeactivateSportModalProps> = ({ 
  isOpen, 
  athleteId, 
  athleteName, 
  sport, 
  onClose, 
  onSportDeactivated 
}) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reason, setReason] = useState('');

  const deactivationReasons = [
    'Fin d\'abonnement',
    'Déménagement',
    'Suspension temporaire',
    'Changement de sport',
    'Problème de santé',
    'Raisons financières',
    'Autre'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !sport) return;

    setLoading(true);
    setError('');

    try {
      // Remove the sport from athlete's sports
      const sportRef = ref(db, `clubs/${currentUser.uid}/athletes/${athleteId}/sports/${sport.sportId}`);
      await remove(sportRef);

      setReason('');
      onSportDeactivated();
    } catch (error: any) {
      setError(error.message || 'Erreur lors de la désactivation du sport');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !sport) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <Trophy className="w-6 h-6 text-orange-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">Désactiver le Sport</h2>
          </div>
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

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-yellow-800">
                  Désactivation du sport
                </h3>
                <p className="text-sm text-yellow-700 mt-1">
                  Vous êtes sur le point de désactiver <strong>{sport.sportName}</strong> pour <strong>{athleteName}</strong>. 
                  Cette action supprimera définitivement ce sport et tous ses paiements associés.
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Raison de la désactivation *
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Sélectionner une raison</option>
              {deactivationReasons.map(reasonOption => (
                <option key={reasonOption} value={reasonOption}>
                  {reasonOption}
                </option>
              ))}
            </select>
          </div>

          {reason === 'Autre' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Préciser la raison
              </label>
              <textarea
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Précisez la raison..."
                rows={3}
                required
              />
            </div>
          )}

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
              className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              ) : (
                <Trophy className="w-5 h-5 mr-2" />
              )}
              {loading ? 'Désactivation...' : 'Désactiver le Sport'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DeactivateSportModal;