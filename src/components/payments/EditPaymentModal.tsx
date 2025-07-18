import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ref, update } from 'firebase/database';
import { db } from '../../lib/firebase';
import { X, CreditCard, User, Trophy, Calendar } from 'lucide-react';

interface EditPaymentModalProps {
  isOpen: boolean;
  payment: any;
  onClose: () => void;
  onPaymentUpdated: () => void;
}

const EditPaymentModal: React.FC<EditPaymentModalProps> = ({ 
  isOpen, 
  payment, 
  onClose, 
  onPaymentUpdated 
}) => {
  const { club, currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    mois: '',
    montant: 0,
    date_paiement: '',
    status: 'paid' as 'paid' | 'pending' | 'overdue'
  });

  useEffect(() => {
    if (payment) {
      setFormData({
        mois: payment.mois,
        montant: payment.montant,
        date_paiement: payment.date_paiement || new Date().toISOString().split('T')[0],
        status: payment.status
      });
    }
  }, [payment]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !payment) return;

    // Check for duplicate month if month was changed
    if (formData.mois !== payment.mois) {
      const athlete = club?.athletes[payment.athleteId];
      const sport = athlete?.sports[payment.sportId];
      
      if (sport?.paiements) {
        const duplicatePayment = Object.values(sport.paiements).find(
          (p: any) => p.mois === formData.mois && p.id !== payment.id
        );
        
        if (duplicatePayment) {
          const monthLabel = new Date(formData.mois + '-01').toLocaleDateString('fr-FR', { 
            year: 'numeric', 
            month: 'long' 
          });
          setError(`Un paiement existe déjà pour ${monthLabel}`);
          return;
        }
      }
    }

    setLoading(true);
    setError('');

    try {
      // Update payment in database
      const paymentRef = ref(db, `clubs/${currentUser.uid}/athletes/${payment.athleteId}/sports/${payment.sportId}/paiements/${payment.id}`);
      await update(paymentRef, {
        mois: formData.mois,
        montant: formData.montant,
        date_paiement: formData.status === 'paid' ? formData.date_paiement : '',
        status: formData.status
      });

      onPaymentUpdated();
      onClose();
    } catch (error: any) {
      setError(error.message || 'Erreur lors de la mise à jour du paiement');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !payment) return null;

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
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Modifier le Paiement</h2>
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

          {/* Payment Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <User className="w-4 h-4 text-gray-500 mr-2" />
                <span className="text-sm font-medium text-gray-700">{payment.athleteName}</span>
              </div>
              <div className="flex items-center">
                <Trophy className="w-4 h-4 text-gray-500 mr-2" />
                <span className="text-sm font-medium text-gray-700">{payment.sportName}</span>
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
              ) : (
                <CreditCard className="w-5 h-5 mr-2" />
              )}
              {loading ? 'Mise à jour...' : 'Mettre à jour'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPaymentModal;