import React, { useState, useEffect } from 'react';
import { CreditCard, Plus, DollarSign, Filter, Search, FastForward } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ref, update } from 'firebase/database';
import { db } from '../lib/firebase';
import AddPaymentModal from '../components/payments/AddPaymentModal';
import AdvancePaymentModal from '../components/payments/AdvancePaymentModal';
import EditPaymentModal from '../components/payments/EditPaymentModal';
import AutoPaymentManager from '../components/payments/AutoPaymentManager';
import PaymentCard from '../components/payments/PaymentCard';

const Payments: React.FC = () => {
  const { club, currentUser } = useAuth();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [sportFilter, setSportFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (club?.athletes) {
      const allPayments: any[] = [];
      
      Object.values(club.athletes).forEach(athlete => {
        // Only include payments from active athletes
        if (athlete.status !== 'active') return;
        
        Object.values(athlete.sports || {}).forEach(sport => {
          Object.values(sport.paiements || {}).forEach(payment => {
            allPayments.push({
              ...payment,
              athleteName: athlete.nom,
              sportName: sport.sportName,
              athleteId: athlete.id,
              sportId: sport.sportId
            });
          });
        });
      });
      
      // Sort by month (newest first)
      allPayments.sort((a, b) => b.mois.localeCompare(a.mois));
      setPayments(allPayments);
    }
  }, [club]);

  useEffect(() => {
    let filtered = payments;
    
    if (statusFilter) {
      filtered = filtered.filter(payment => payment.status === statusFilter);
    }
    
    if (sportFilter) {
      filtered = filtered.filter(payment => payment.sportId === sportFilter);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(payment => 
        payment.athleteName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.sportName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredPayments(filtered);
  }, [payments, statusFilter, sportFilter, searchTerm]);

  const handlePaymentAdded = () => {
    // Refresh will happen automatically through the auth context
    window.location.reload();
  };

  const handleUpdatePaymentStatus = async (paymentId: string, newStatus: 'paid' | 'pending' | 'overdue') => {
    if (!currentUser || !club) return;
    
    setLoading(true);
    try {
      // Find the payment in the data structure
      let athleteId = '';
      let sportId = '';
      
      Object.values(club.athletes).forEach(athlete => {
        Object.values(athlete.sports).forEach(sport => {
          if (sport.paiements[paymentId]) {
            athleteId = athlete.id;
            sportId = sport.sportId;
          }
        });
      });
      
      if (athleteId && sportId) {
        const clubRef = ref(db, `clubs/${currentUser.uid}`);
        const updateData: any = {
          [`athletes/${athleteId}/sports/${sportId}/paiements/${paymentId}/status`]: newStatus
        };
        
        if (newStatus === 'paid') {
          updateData[`athletes/${athleteId}/sports/${sportId}/paiements/${paymentId}/date_paiement`] = new Date().toISOString().split('T')[0];
        }
        
        await update(clubRef, updateData);
        
        // Update local state
        setPayments(prev => prev.map(payment => 
          payment.id === paymentId 
            ? { 
                ...payment, 
                status: newStatus,
                date_paiement: newStatus === 'paid' ? new Date().toISOString().split('T')[0] : payment.date_paiement
              }
            : payment
        ));
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      alert('Erreur lors de la mise à jour du statut');
    } finally {
      setLoading(false);
    }
  };

  const handleEditPayment = (payment: any) => {
    setSelectedPayment(payment);
    setIsEditModalOpen(true);
  };

  const handleDeletePayment = async (payment: any) => {
    if (!currentUser) return;
    
    const monthLabel = new Date(payment.mois + '-01').toLocaleDateString('fr-FR', { 
      year: 'numeric', 
      month: 'long' 
    });
    
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le paiement de ${payment.athleteName} pour ${payment.sportName} (${monthLabel}) ?`)) {
      return;
    }

    setLoading(true);
    try {
      const paymentRef = ref(db, `clubs/${currentUser.uid}/athletes/${payment.athleteId}/sports/${payment.sportId}/paiements/${payment.id}`);
      await update(ref(db, `clubs/${currentUser.uid}`), {
        [`athletes/${payment.athleteId}/sports/${payment.sportId}/paiements/${payment.id}`]: null
      });
      
      // Update local state
      setPayments(prev => prev.filter(p => p.id !== payment.id));
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression du paiement');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentUpdated = () => {
    // Refresh will happen automatically through the auth context
    window.location.reload();
  };

  const getStats = () => {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
    
    const thisMonthPayments = payments.filter(p => p.mois === currentMonth);
    const thisMonthRevenue = thisMonthPayments
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + p.montant, 0);
    
    const pendingCount = payments.filter(p => p.status === 'pending').length;
    const overdueCount = payments.filter(p => p.status === 'overdue').length;
    
    return {
      thisMonthRevenue,
      pendingCount,
      overdueCount
    };
  };

  const stats = getStats();
  
  // Get available sports for filter
  const availableSports = Object.values(club?.sports || {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Paiements</h1>
          <p className="text-gray-600">Suivez les paiements et cotisations</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:space-x-3 sm:gap-0">
          <button 
            onClick={() => setIsAdvanceModalOpen(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center text-sm sm:text-base"
          >
            <FastForward className="w-5 h-5 mr-2" />
            Paiement Anticipé
          </button>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center text-sm sm:text-base"
          >
            <Plus className="w-5 h-5 mr-2" />Paiement
          </button>
        </div>
      </div>

      {/* Auto Payment Manager */}
      <AutoPaymentManager />

      {/* Payment Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="bg-green-500 p-3 rounded-lg">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Revenus ce mois</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.thisMonthRevenue} DH</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="bg-yellow-500 p-3 rounded-lg">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Paiements en attente</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.pendingCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="bg-red-500 p-3 rounded-lg">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Paiements en retard</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.overdueCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher par athlète ou sport..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Tous les statuts</option>
              <option value="paid">Payés</option>
              <option value="pending">En attente</option>
              <option value="overdue">En retard</option>
            </select>
            <select 
              value={sportFilter}
              onChange={(e) => setSportFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Tous les sports</option>
              {availableSports.map(sport => (
                <option key={sport.id} value={sport.id}>{sport.name}</option>
              ))}
            </select>
          </div>
        </div>
        
        {(searchTerm || statusFilter || sportFilter) && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {filteredPayments.length} paiement(s) trouvé(s)
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('');
                setSportFilter('');
              }}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Effacer les filtres
            </button>
          </div>
        )}
      </div>

      {/* Payments List */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Historique des Paiements</h2>
            <span className="text-sm text-gray-500">
              {payments.length} paiement(s) au total
            </span>
          </div>
        </div>
        <div className="p-6">
          {filteredPayments.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              {payments.length === 0 ? (
                <>
                  <p className="text-gray-500">Aucun paiement enregistré</p>
                  <p className="text-sm text-gray-400 mb-4">Les paiements apparaîtront ici une fois enregistrés</p>
                  <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Enregistrer un Paiement
                  </button>
                </>
              ) : (
                <>
                  <p className="text-gray-500">Aucun paiement trouvé</p>
                  <p className="text-sm text-gray-400">Essayez de modifier vos critères de recherche</p>
                </>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPayments.map(payment => (
                <PaymentCard
                  key={payment.id}
                  payment={payment}
                  onUpdateStatus={handleUpdatePaymentStatus}
                  onEdit={handleEditPayment}
                  onDelete={handleDeletePayment}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Payment Modal */}
      <AddPaymentModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onPaymentAdded={handlePaymentAdded}
      />

      {/* Advance Payment Modal */}
      <AdvancePaymentModal
        isOpen={isAdvanceModalOpen}
        onClose={() => setIsAdvanceModalOpen(false)}
        onPaymentAdded={handlePaymentAdded}
      />

      {/* Edit Payment Modal */}
      <EditPaymentModal
        isOpen={isEditModalOpen}
        payment={selectedPayment}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedPayment(null);
        }}
        onPaymentUpdated={handlePaymentUpdated}
      />
    </div>
  );
};

export default Payments;