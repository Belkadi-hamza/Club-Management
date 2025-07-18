import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ref, update } from 'firebase/database';
import { db } from '../../lib/firebase';
import { X, CreditCard, User, Trophy, Calendar } from 'lucide-react';
import { Payment } from '../../types';

interface AddPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentAdded: () => void;
}

const AddPaymentModal: React.FC<AddPaymentModalProps> = ({ isOpen, onClose, onPaymentAdded }) => {
  const { club, currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    athleteId: '',
    sportId: '',
    mois: '',
    montant: 0,
    date_paiement: new Date().toISOString().split('T')[0],
    status: 'paid' as 'paid' | 'pending' | 'overdue'
  });

  const handleAthleteChange = (athleteId: string) => {
    setFormData(prev => ({
      ...prev,
      athleteId,
      sportId: '', // Reset sport selection
      montant: 0
    }));
  };

  const handleSportChange = (sportId: string) => {
    const athlete = club?.athletes[formData.athleteId];
    const athleteSport = athlete?.sports[sportId];
    
    setFormData(prev => ({
      ...prev,
      sportId,
      montant: athleteSport?.montant || 0
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !club) return;

    // Enhanced duplicate payment check
    const athlete = club.athletes[formData.athleteId];
    const sport = athlete?.sports[formData.sportId];
    
    if (!athlete) {
      setError('Athlète non trouvé');
      return;
    }
    
    if (!sport) {
      setError('Sport non trouvé pour cet athlète');
      return;
    }
    
    // Check for existing payment for the same month
    const existingPayments = sport.paiements || {};
    const duplicatePayment = Object.values(existingPayments).find(
      payment => payment.mois === formData.mois
    );
    
    if (duplicatePayment) {
      const monthLabel = new Date(formData.mois + '-01').toLocaleDateString('fr-FR', { 
        year: 'numeric', 
        month: 'long' 
      });
      setError(`Un paiement existe déjà pour ${monthLabel}. Statut actuel: ${
        duplicatePayment.status === 'paid' ? 'Payé' : 
        duplicatePayment.status === 'pending' ? 'En attente' : 'En retard'
      }`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Generate unique payment ID
      const paymentId = `payment_${Date.now()}`;
      
      // Create new payment
      const newPayment: Payment = {
        id: paymentId,
        mois: formData.mois,
        montant: formData.montant,
        date_paiement: formData.status === 'paid' ? formData.date_paiement : '',
        status: formData.status
      };

      // Update athlete's sport payments in Firestore
      const paymentRef = ref(db, `clubs/${currentUser.uid}/athletes/${formData.athleteId}/sports/${formData.sportId}/paiements/${paymentId}`);
      await update(ref(db, `clubs/${currentUser.uid}`), {
        [`athletes/${formData.athleteId}/sports/${formData.sportId}/paiements/${paymentId}`]: newPayment
      });

      // Reset form
      setFormData({
        athleteId: '',
        sportId: '',
        mois: '',
        montant: 0,
        date_paiement: new Date().toISOString().split('T')[0],
        status: 'paid'
      });
      
      onPaymentAdded();
      onClose();
    } catch (error: any) {
      setError(error.message || 'Erreur lors de l\'enregistrement du paiement');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const athletes = Object.values(club?.athletes || {});
  const selectedAthlete = formData.athleteId ? club?.athletes[formData.athleteId] : null;
  const availableSports = selectedAthlete ? Object.values(selectedAthlete.sports) : [];

  // Generate month options (current month and previous 11 months)
  const generateMonthOptions = () => {
    const options = [];
    const currentDate = new Date();
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' });
      options.push({ value: monthKey, label: monthLabel });
    }
    
    return options;
  };

  const monthOptions = generateMonthOptions();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-1/2">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Enregistrer un Paiement</h2>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Athlète *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  value={formData.athleteId}
                  onChange={(e) => handleAthleteChange(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Sélectionner un athlète</option>
                  {athletes.map(athlete => (
                    <option key={athlete.id} value={athlete.id}>
                      {athlete.nom}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sport *
              </label>
              <div className="relative">
                <Trophy className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  value={formData.sportId}
                  onChange={(e) => handleSportChange(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  disabled={!formData.athleteId}
                >
                  <option value="">Sélectionner un sport</option>
                  {availableSports.map(sport => (
                    <option key={sport.sportId} value={sport.sportId}>
                      {sport.sportName} - {sport.montant} DH/mois
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mois *
              </label>
              <select
                value={formData.mois}
                onChange={(e) => setFormData(prev => ({ ...prev, mois: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Sélectionner un mois</option>
                {monthOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Montant (DH) *
              </label>
              <input
                type="number"
                min="0"
                value={formData.montant}
                onChange={(e) => setFormData(prev => ({ ...prev, montant: parseInt(e.target.value) || 0 }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="200"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Statut *
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'paid' | 'pending' | 'overdue' }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="paid">Payé</option>
                <option value="pending">En attente</option>
                <option value="overdue">En retard</option>
              </select>
            </div>

            {formData.status === 'paid' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date de Paiement *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="date"
                    value={formData.date_paiement}
                    onChange={(e) => setFormData(prev => ({ ...prev, date_paiement: e.target.value }))}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
            )}
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
              {loading ? 'Enregistrement...' : 'Enregistrer le Paiement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPaymentModal;