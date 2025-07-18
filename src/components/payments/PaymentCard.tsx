import React from 'react';
import { CreditCard, User, Trophy, Calendar, CheckCircle, Clock, AlertCircle, Edit, Trash2, MoreVertical } from 'lucide-react';

interface PaymentCardProps {
  payment: {
    id: string;
    mois: string;
    montant: number;
    date_paiement: string;
    status: 'paid' | 'pending' | 'overdue';
    athleteName: string;
    sportName: string;
    athleteId: string;
    sportId: string;
  };
  onUpdateStatus: (paymentId: string, newStatus: 'paid' | 'pending' | 'overdue') => void;
  onEdit: (payment: any) => void;
  onDelete: (payment: any) => void;
}

const PaymentCard: React.FC<PaymentCardProps> = ({ payment, onUpdateStatus, onEdit, onDelete }) => {
  const getStatusIcon = () => {
    switch (payment.status) {
      case 'paid':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'overdue':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
    }
  };

  const getStatusColor = () => {
    switch (payment.status) {
      case 'paid':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'pending':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'overdue':
        return 'bg-red-50 text-red-700 border-red-200';
    }
  };

  const getStatusText = () => {
    switch (payment.status) {
      case 'paid':
        return 'Payé';
      case 'pending':
        return 'En attente';
      case 'overdue':
        return 'En retard';
    }
  };

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <CreditCard className="w-6 h-6 text-blue-600" />
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-semibold text-gray-900">{payment.montant} DH</h3>
            <p className="text-sm text-gray-500">{formatMonth(payment.mois)}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`px-3 py-1 rounded-full border text-sm font-medium flex items-center ${getStatusColor()}`}>
            {getStatusIcon()}
            
          </div>
          <div className="relative group">
            <button className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
              <MoreVertical className="w-4 h-4" />
            </button>
            <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 min-w-[120px]">
              <button
                onClick={() => onEdit(payment)}
                className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
              >
                <Edit className="w-4 h-4 mr-2" />
                Modifier
              </button>
              <button
                onClick={() => onDelete(payment)}
                className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Supprimer
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center text-sm text-gray-600">
          <User className="w-4 h-4 mr-2" />
          {payment.athleteName}
        </div>
        
        <div className="flex items-center text-sm text-gray-600">
          <Trophy className="w-4 h-4 mr-2" />
          {payment.sportName}
        </div>

        {payment.date_paiement && (
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="w-4 h-4 mr-2" />
            Payé le {new Date(payment.date_paiement).toLocaleDateString('fr-FR')}
          </div>
        )}
      </div>

      {payment.status !== 'paid' && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <button
            onClick={() => onUpdateStatus(payment.id, 'paid')}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
          >
            Marquer comme payé
          </button>
        </div>
      )}
    </div>
  );
};

export default PaymentCard;