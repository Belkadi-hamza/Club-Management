import React from 'react';
import { User, Phone, Calendar, Trophy, CreditCard, UserX, UserCheck, Trash2, Plus, Edit } from 'lucide-react';
import { Athlete } from '../../types';

interface AthleteCardProps {
  athlete: Athlete;
  onEdit: (athlete: Athlete) => void;
  onViewPayments: (athlete: Athlete) => void;
  onDeactivate: (athlete: Athlete) => void;
  onReactivate: (athlete: Athlete) => void;
  onDelete: (athlete: Athlete) => void;
  onAddSport: (athlete: Athlete) => void;
  onEditSport: (athlete: Athlete, sportId: string) => void;
  onDeactivateSport: (athlete: Athlete, sportId: string) => void;
}

const AthleteCard: React.FC<AthleteCardProps> = ({ 
  athlete, 
  onEdit, 
  onViewPayments, 
  onDeactivate, 
  onReactivate, 
  onDelete,
  onAddSport,
  onEditSport,
  onDeactivateSport
}) => {
  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const getTotalPendingPayments = () => {
    let total = 0;
    Object.values(athlete.sports || {}).forEach(sport => {
      Object.values(sport.paiements || {}).forEach(payment => {
        if (payment.status === 'pending' || payment.status === 'overdue') {
          total += payment.montant;
        }
      });
    });
    return total;
  };

  const getPaymentStatus = () => {
    let paid = 0;
    let pending = 0;
    let overdue = 0;

    Object.values(athlete.sports || {}).forEach(sport => {
      Object.values(sport.paiements || {}).forEach(payment => {
        if (payment.status === 'paid') paid++;
        else if (payment.status === 'pending') pending++;
        else if (payment.status === 'overdue') overdue++;
      });
    });

    return { paid, pending, overdue };
  };

  const paymentStatus = getPaymentStatus();
  const pendingAmount = getTotalPendingPayments();
  const isActive = athlete.status === 'active';

  return (
    <div 
      onClick={() => onEdit(athlete)}
      className={`bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow cursor-pointer ${
      isActive ? 'border-gray-200' : 'border-red-200 bg-red-50'
    }`}
    >
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4 gap-3">
        {/* Athlete Info */}
        <div className="flex items-start flex-1 min-w-0 gap-3">
          <div className={`flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center ${
            isActive ? 'bg-blue-100' : 'bg-red-100'
          }`}>
            <User className={`w-5 h-5 sm:w-6 sm:h-6 ${isActive ? 'text-blue-600' : 'text-red-600'}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className={`text-base font-semibold truncate ${isActive ? 'text-gray-900' : 'text-red-900'}`}>
                {athlete.nom}
              </h3>
              {!isActive && (
                <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full whitespace-nowrap">
                  Inactif
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {calculateAge(athlete.date_naissance)} ans • {athlete.sexe}
            </p>
          </div>
        </div>
      </div>

      {/* Deactivation Notice */}
      {!isActive && athlete.date_deactivated && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm">
          <p className="text-sm text-red-800">
            <strong>Désactivé le:</strong> {new Date(athlete.date_deactivated).toLocaleDateString('fr-FR')}
          </p>
          {athlete.reason_deactivated && (
            <p className="text-sm text-red-700 mt-1">
              <strong>Raison:</strong> {athlete.reason_deactivated}
            </p>
          )}
        </div>
      )}

      {/* Details Section */}
      <div className="space-y-3">
        <div className="flex items-center text-sm text-gray-600 break-all">
          <Phone className="flex-shrink-0 w-4 h-4 mr-2" />
          {athlete.telephone}
        </div>
        
        <div className="flex items-center text-sm text-gray-600">
          <Calendar className="flex-shrink-0 w-4 h-4 mr-2" />
          <span className="truncate">{new Date(athlete.date_naissance).toLocaleDateString('fr-FR')}</span>
        </div>

        <div className="text-sm text-gray-600">
          <div className="flex items-center mb-2">
            <Trophy className="flex-shrink-0 w-4 h-4 mr-2" />
            <span>{Object.keys(athlete.sports || {}).length} sport(s)</span>
          </div>
        </div>

        {isActive && pendingAmount > 0 && (
          <div className="flex items-center text-sm text-orange-600">
            <CreditCard className="flex-shrink-0 w-4 h-4 mr-2" />
            {pendingAmount} DH en attente
          </div>
        )}
      </div>

      {/* Payment Status Summary */}
      {isActive && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap justify-between gap-2 text-xs sm:text-sm">
            <span className="text-green-600 whitespace-nowrap">{paymentStatus.paid} payés</span>
            <span className="text-yellow-600 whitespace-nowrap">{paymentStatus.pending} en attente</span>
            <span className="text-red-600 whitespace-nowrap">{paymentStatus.overdue} en retard</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AthleteCard;