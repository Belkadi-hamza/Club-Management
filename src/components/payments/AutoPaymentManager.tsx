import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ref, update } from 'firebase/database';
import { db } from '../../lib/firebase';
import { RefreshCw, Calendar, AlertCircle, CheckCircle } from 'lucide-react';
import { generateAutomaticPayments, updatePaymentStatuses } from '../../utils/paymentUtils';

const AutoPaymentManager: React.FC = () => {
  const { club, currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [stats, setStats] = useState({
    newPayments: 0,
    updatedStatuses: 0,
    totalProcessed: 0
  });

  useEffect(() => {
    // Check if auto-update is needed (run once per day)
    const lastAutoUpdate = localStorage.getItem('lastAutoPaymentUpdate');
    const today = new Date().toDateString();
    
    if (lastAutoUpdate !== today) {
      handleAutoUpdate();
    }
  }, [club]);

  const handleAutoUpdate = async () => {
    if (!currentUser || !club) return;

    setLoading(true);
    let newPaymentsCount = 0;
    let updatedStatusesCount = 0;

    try {
      const clubRef = ref(db, `clubs/${currentUser.uid}`);
      const updates: any = {};

      // Process each athlete's sports
      Object.entries(club.athletes).forEach(([athleteId, athlete]) => {
        Object.entries(athlete.sports).forEach(([sportId, sport]) => {
          // Enhanced duplicate prevention for auto-generated payments
          // Generate missing payments
          const newPayments = generateAutomaticPayments(sport);
          
          if (newPayments.length > 0) {
            newPayments.forEach(payment => {
              // Double-check that this payment doesn't already exist
              const existingPaymentPath = `athletes/${athleteId}/sports/${sportId}/paiements`;
              const existingPayments = Object.values(sport.paiements || {});
              const isDuplicate = existingPayments.some(existing => existing.mois === payment.mois);
              
              if (!isDuplicate) {
                updates[`${existingPaymentPath}/${payment.id}`] = payment;
                newPaymentsCount++;
              } else {
                console.log(`Skipping duplicate auto-payment for ${payment.mois} - ${athlete.nom} - ${sport.sportName}`);
              }
            });
          }

          // Update existing payment statuses
          const updatedPayments = updatePaymentStatuses(sport.paiements || {});
          Object.entries(updatedPayments).forEach(([paymentId, payment]) => {
            if (payment.status !== (sport.paiements || {})[paymentId]?.status) {
              updates[`athletes/${athleteId}/sports/${sportId}/paiements/${paymentId}/status`] = payment.status;
              updatedStatusesCount++;
            }
          });
        });
      });

      // Apply updates if any
      if (Object.keys(updates).length > 0) {
        await update(clubRef, updates);
      }

      setStats({
        newPayments: newPaymentsCount,
        updatedStatuses: updatedStatusesCount,
        totalProcessed: newPaymentsCount + updatedStatusesCount
      });

      setLastUpdate(new Date().toLocaleString('fr-FR'));
      localStorage.setItem('lastAutoPaymentUpdate', new Date().toDateString());

      // Refresh the page to show updated data
      if (newPaymentsCount > 0 || updatedStatusesCount > 0) {
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour automatique:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleManualUpdate = () => {
    localStorage.removeItem('lastAutoPaymentUpdate');
    handleAutoUpdate();
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Calendar className="w-6 h-6 text-blue-600 mr-3" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Gestion Automatique des Paiements</h3>
            <p className="text-sm text-gray-600">Mise à jour automatique des statuts de paiement</p>
          </div>
        </div>
        <button
          onClick={handleManualUpdate}
          disabled={loading}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Mise à jour...' : 'Actualiser'}
        </button>
      </div>

      {lastUpdate && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
              <div>
                <p className="text-sm font-medium text-green-800">Nouveaux Paiements</p>
                <p className="text-lg font-semibold text-green-900">{stats.newPayments}</p>
              </div>
            </div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
              <div>
                <p className="text-sm font-medium text-yellow-800">Statuts Mis à Jour</p>
                <p className="text-lg font-semibold text-yellow-900">{stats.updatedStatuses}</p>
              </div>
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <RefreshCw className="w-5 h-5 text-blue-600 mr-2" />
              <div>
                <p className="text-sm font-medium text-blue-800">Total Traité</p>
                <p className="text-lg font-semibold text-blue-900">{stats.totalProcessed}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Règles Automatiques</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• <strong>Mois actuel:</strong> Statut "En attente"</li>
          <li>• <strong>Mois passés:</strong> Statut "En retard" si non payé</li>
          <li>• <strong>Génération automatique:</strong> Paiements créés depuis la date d'inscription</li>
          <li>• <strong>Mise à jour quotidienne:</strong> Statuts actualisés automatiquement</li>
        </ul>
        {lastUpdate && (
          <p className="text-xs text-gray-500 mt-2">
            Dernière mise à jour: {lastUpdate}
          </p>
        )}
      </div>
    </div>
  );
};

export default AutoPaymentManager;