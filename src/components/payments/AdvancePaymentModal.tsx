import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ref, update } from 'firebase/database';
import { db } from '../../lib/firebase';
import { X, Calendar, CreditCard, Plus } from 'lucide-react';
import { createAdvancePayments, getCurrentMonth, addMonthsToDate, formatMonth } from '../../utils/paymentUtils';

interface AdvancePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentAdded: () => void;
}

const AdvancePaymentModal: React.FC<AdvancePaymentModalProps> = ({ isOpen, onClose, onPaymentAdded }) => {
  const { club, currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    athleteId: '',
    sportId: '',
    startMonth: getCurrentMonth(),
    numberOfMonths: 1,
    totalAmount: 0
  });

  const handleAthleteChange = (athleteId: string) => {
    setFormData(prev => ({
      ...prev,
      athleteId,
      sportId: '',
      totalAmount: 0
    }));
  };

  const handleSportChange = (sportId: string) => {
    const athlete = club?.athletes[formData.athleteId];
    const athleteSport = athlete?.sports[sportId];
    
    setFormData(prev => ({
      ...prev,
      sportId,
      totalAmount: (athleteSport?.montant || 0) * prev.numberOfMonths
    }));
  };

  const handleMonthsChange = (months: number) => {
    const athlete = club?.athletes[formData.athleteId];
    const athleteSport = athlete?.sports[formData.sportId];
    
    setFormData(prev => ({
      ...prev,
      numberOfMonths: months,
      totalAmount: (athleteSport?.montant || 0) * months
    }));
  };

  const generateMonthPreview = () => {
    const months = [];
    for (let i = 0; i < formData.numberOfMonths; i++) {
      const monthKey = addMonthsToDate(formData.startMonth, i);
      months.push({
        key: monthKey,
        label: formatMonth(monthKey)
      });
    }
    return months;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !club) return;

    // Check for duplicate payments before creating advance payments
    const athlete = club.athletes[formData.athleteId];
    const sport = athlete?.sports[formData.sportId];
    
    if (!athlete || !sport) {
      setError('Athlète ou sport non trouvé');
      return;
    }
    
    // Check each month for existing payments
    const existingPayments = sport.paiements || {};
    const duplicateMonths = [];
    
    for (let i = 0; i < formData.numberOfMonths; i++) {
      const monthKey = addMonthsToDate(formData.startMonth, i);
      const existingPayment = Object.values(existingPayments).find(
        payment => payment.mois === monthKey
      );
      
      if (existingPayment) {
        const monthLabel = formatMonth(monthKey);
        duplicateMonths.push(monthLabel);
      }
    }
    
    if (duplicateMonths.length > 0) {
      setError(`Des paiements existent déjà pour: ${duplicateMonths.join(', ')}. Veuillez ajuster la période ou supprimer les paiements existants.`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Create advance payments
      const advancePayments = createAdvancePayments(sport, formData.startMonth, formData.numberOfMonths);
      
      // Prepare updates for Firebase
      const updates: any = {};
      advancePayments.forEach(payment => {
        updates[`athletes/${formData.athleteId}/sports/${formData.sportId}/paiements/${payment.id}`] = payment;
      });

      // Update club document in Firestore
      const clubRef = ref(db, `clubs/${currentUser.uid}`);
      await update(clubRef, updates);

      // Reset form
      setFormData({
        athleteId: '',
        sportId: '',
        startMonth: getCurrentMonth(),
        numberOfMonths: 1,
        totalAmount: 0
      });
      
      onPaymentAdded();
      onClose();
    } catch (error: any) {
      setError(error.message || 'Erreur lors de l\'enregistrement des paiements anticipés');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const athletes = Object.values(club?.athletes || {});
  const selectedAthlete = formData.athleteId ? club?.athletes[formData.athleteId] : null;
  const availableSports = selectedAthlete ? Object.values(selectedAthlete.sports) : [];
  const monthPreview = generateMonthPreview();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Paiement Anticipé</h2>
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
              <select
                value={formData.athleteId}
                onChange={(e) => handleAthleteChange(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sport *
              </label>
              <select
                value={formData.sportId}
                onChange={(e) => handleSportChange(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mois de début *
              </label>
              <input
                type="month"
                value={formData.startMonth}
                onChange={(e) => setFormData(prev => ({ ...prev, startMonth: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre de mois *
              </label>
              <input
                type="number"
                min="1"
                max="12"
                value={formData.numberOfMonths}
                onChange={(e) => handleMonthsChange(parseInt(e.target.value) || 1)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          {formData.sportId && formData.numberOfMonths > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Aperçu des mois à payer:</h4>
              <div className="space-y-1">
                {monthPreview.map(month => (
                  <div key={month.key} className="flex justify-between text-sm">
                    <span className="text-blue-800">{month.label}</span>
                    <span className="text-blue-900 font-medium">
                      {club?.athletes[formData.athleteId]?.sports[formData.sportId]?.montant || 0} DH
                    </span>
                  </div>
                ))}
              </div>
              <div className="border-t border-blue-300 mt-2 pt-2">
                <div className="flex justify-between text-sm font-semibold">
                  <span className="text-blue-900">Total:</span>
                  <span className="text-blue-900">{formData.totalAmount} DH</span>
                </div>
              </div>
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
              disabled={loading || !formData.sportId}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              ) : (
                <Plus className="w-5 h-5 mr-2" />
              )}
              {loading ? 'Enregistrement...' : `Payer ${formData.numberOfMonths} mois`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdvancePaymentModal;