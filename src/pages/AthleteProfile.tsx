import React, { useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ref, update } from 'firebase/database';
import { db } from '../lib/firebase';
import AddSportToAthleteModal from '../components/athletes/AddSportToAthleteModal';
import EditSportModal from '../components/athletes/EditSportModal';
import DeactivateSportModal from '../components/athletes/DeactivateSportModal';
import DeactivateAthleteModal from '../components/athletes/DeactivateAthleteModal';
import { 
  User, 
  Phone, 
  Calendar, 
  Trophy, 
  CreditCard, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  ArrowLeft,
  Edit,
  Save,
  X,
  DollarSign,
  Plus,
  UserX,
  UserCheck,
  Trash2,
  FileText,
  Settings
} from 'lucide-react';
import { Athlete } from '../types';
import { generateCompletePaymentHistory } from '../utils/paymentUtils';

interface AthleteProfileProps {
  athleteId: string;
  onBack: () => void;
  onDeactivate: (athlete: Athlete) => void;
  onReactivate: (athlete: Athlete) => void;
  onDelete: (athlete: Athlete) => void;
  onAddSport: (athlete: Athlete) => void;
  onEditSport: (athlete: Athlete, sportId: string) => void;
  onDeactivateSport: (athlete: Athlete, sportId: string) => void;
}

const AthleteProfile: React.FC<AthleteProfileProps> = ({ 
  athleteId, 
  onBack, 
  onDeactivate, 
  onReactivate, 
  onDelete,
  onAddSport,
  onEditSport,
  onDeactivateSport
}) => {
  const { club, currentUser } = useAuth();
  
  const athlete = club?.athletes[athleteId];
  const isActive = athlete?.status === 'active';
  
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState(athlete?.notes || '');
  
  // Modal states
  const [isAddSportModalOpen, setIsAddSportModalOpen] = useState(false);
  const [isEditSportModalOpen, setIsEditSportModalOpen] = useState(false);
  const [isDeactivateSportModalOpen, setIsDeactivateSportModalOpen] = useState(false);
  const [isDeactivateAthleteModalOpen, setIsDeactivateAthleteModalOpen] = useState(false);
  const [selectedSportId, setSelectedSportId] = useState<string>('');

  const [editData, setEditData] = useState({
    nom: athlete?.nom || '',
    telephone: athlete?.telephone || '',
    date_naissance: athlete?.date_naissance || '',
    sexe: athlete?.sexe || 'Homme' as 'Homme' | 'Femme'
  });

  if (!athlete) {
    return (
      <div className="text-center py-12">
        <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">Athlète non trouvé</p>
        <button
          onClick={onBack}
          className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
        >
          Retour à la liste
        </button>
      </div>
    );
  }

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

  const getPaymentStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'overdue':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'pending':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'overdue':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getPaymentStatusText = (status: string) => {
    switch (status) {
      case 'paid':
        return 'Payé';
      case 'pending':
        return 'En attente';
      case 'overdue':
        return 'En retard';
      default:
        return 'Non défini';
    }
  };

  const athleteStats = useMemo(() => {
    let totalPaid = 0;
    let totalPending = 0;
    let totalOverdue = 0;
    let totalExpected = 0;

    Object.values(athlete.sports || {}).forEach(sport => {
      const history = generateCompletePaymentHistory(sport);
      history.forEach(month => {
        totalExpected += month.expectedAmount;
        if (month.payment) {
          if (month.payment.status === 'paid') totalPaid += month.payment.montant;
          else if (month.payment.status === 'pending') totalPending += month.payment.montant;
          else if (month.payment.status === 'overdue') totalOverdue += month.payment.montant;
        } else {
          const monthDate = new Date(month.month + '-01');
          if (monthDate < new Date()) {
            totalOverdue += month.expectedAmount;
          }
        }
      });
    });

    return { totalPaid, totalPending, totalOverdue, totalExpected };
  }, [athlete]);

  const handleSaveEdit = async () => {
    if (!club) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const athleteRef = ref(db, `clubs/${currentUser.uid}/athletes/${athleteId}`);
      await update(athleteRef, {
        nom: editData.nom,
        telephone: editData.telephone,
        date_naissance: editData.date_naissance,
        sexe: editData.sexe
      });

      setSuccess('Informations mises à jour avec succès !');
      setEditMode(false);
      
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error: any) {
      setError(error.message || 'Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!currentUser) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const athleteRef = ref(db, `clubs/${currentUser.uid}/athletes/${athleteId}`);
      await update(athleteRef, {
        notes: notes
      });

      setSuccess('Notes sauvegardées avec succès !');
      setShowNotes(false);
      
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (error: any) {
      setError(error.message || 'Erreur lors de la sauvegarde des notes');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSport = () => {
    setIsAddSportModalOpen(true);
  };

  const handleEditSport = (sportId: string) => {
    setSelectedSportId(sportId);
    setIsEditSportModalOpen(true);
  };

  const handleDeactivateSport = (sportId: string) => {
    setSelectedSportId(sportId);
    setIsDeactivateSportModalOpen(true);
  };

  const handleDeactivateAthlete = () => {
    setIsDeactivateAthleteModalOpen(true);
  };

  const handleSportAdded = () => {
    // Refresh will happen automatically through real-time updates
    setIsAddSportModalOpen(false);
  };

  const handleSportUpdated = () => {
    setIsEditSportModalOpen(false);
    setSelectedSportId('');
  };

  const handleSportDeactivated = () => {
    setIsDeactivateSportModalOpen(false);
    setSelectedSportId('');
  };

  const handleAthleteDeactivated = () => {
    setIsDeactivateAthleteModalOpen(false);
    // Navigate back to athletes list after deactivation
    onBack();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Retour"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Profil de l'Athlète</h1>
            <p className="text-sm text-gray-600">Informations complètes et historique des paiements</p>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 justify-end items-center">
          {/* Notes Button */}
          <button
            onClick={() => setShowNotes(true)}
            className="flex items-center px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
            title="Notes"
          >
            <FileText className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">Notes</span>
          </button>
          
          {/* Add Sport Button */}
          {isActive && (
            <button
              onClick={handleAddSport}
              className="flex items-center px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
              title="Ajouter un sport"
            >
              <Plus className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Ajouter Sport</span>
            </button>
          )}
          
          {/* Deactivate/Reactivate Button */}
          {isActive ? (
            <button
              onClick={handleDeactivateAthlete}
              className="flex items-center px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm"
              title="Désactiver"
            >
              <UserX className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Désactiver</span>
            </button>
          ) : (
            <button
              onClick={() => onReactivate(athlete)}
              className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
              title="Réactiver"
            >
              <UserCheck className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Réactiver</span>
            </button>
          )}
          
          {/* Delete Button */}
          <button
            onClick={() => onDelete(athlete)}
            className="flex items-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
            title="Supprimer"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">Supprimer</span>
          </button>
          
          {/* Edit Button */}
          <button
            onClick={() => setEditMode(!editMode)}
            className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            title={editMode ? 'Annuler' : 'Modifier'}
          >
            <Edit className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">{editMode ? 'Annuler' : 'Modifier'}</span>
          </button>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Personal Information */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Informations Personnelles</h2>
            {editMode && (
              <button
                onClick={handleSaveEdit}
                disabled={loading}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 text-sm font-medium"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {loading ? 'Sauvegarde...' : 'Sauvegarder'}
              </button>
            )}
          </div>
        </div>
        
        <div className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600" />
            </div>
            <div className="flex-1 w-full">
              {editMode ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom Complet</label>
                    <input
                      type="text"
                      value={editData.nom}
                      onChange={(e) => setEditData(prev => ({ ...prev, nom: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                      <input
                        type="tel"
                        value={editData.telephone}
                        onChange={(e) => setEditData(prev => ({ ...prev, telephone: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Sexe</label>
                      <select
                        value={editData.sexe}
                        onChange={(e) => setEditData(prev => ({ ...prev, sexe: e.target.value as 'Homme' | 'Femme' }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="Homme">Homme</option>
                        <option value="Femme">Femme</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date de Naissance</label>
                    <input
                      type="date"
                      value={editData.date_naissance}
                      onChange={(e) => setEditData(prev => ({ ...prev, date_naissance: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{athlete.nom}</h3>
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center text-gray-600">
                      <Phone className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span className="truncate">{athlete.telephone}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <User className="w-4 h-4 mr-2 flex-shrink-0" />
                      {athlete.sexe}
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
                      {new Date(athlete.date_naissance).toLocaleDateString('fr-FR')} ({calculateAge(athlete.date_naissance)} ans)
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Trophy className="w-4 h-4 mr-2 flex-shrink-0" />
                      {Object.keys(athlete.sports || {}).length} sport(s)
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Payment Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="bg-green-500 p-2 sm:p-3 rounded-lg">
              <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="ml-3">
              <p className="text-xs sm:text-sm font-medium text-gray-600">Total Payé</p>
              <p className="text-lg sm:text-2xl font-semibold text-gray-900">{athleteStats.totalPaid} DH</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="bg-yellow-500 p-2 sm:p-3 rounded-lg">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="ml-3">
              <p className="text-xs sm:text-sm font-medium text-gray-600">En Attente</p>
              <p className="text-lg sm:text-2xl font-semibold text-gray-900">{athleteStats.totalPending} DH</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="bg-red-500 p-2 sm:p-3 rounded-lg">
              <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="ml-3">
              <p className="text-xs sm:text-sm font-medium text-gray-600">En Retard</p>
              <p className="text-lg sm:text-2xl font-semibold text-gray-900">{athleteStats.totalOverdue} DH</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="bg-blue-500 p-2 sm:p-3 rounded-lg">
              <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="ml-3">
              <p className="text-xs sm:text-sm font-medium text-gray-600">Total Attendu</p>
              <p className="text-lg sm:text-2xl font-semibold text-gray-900">{athleteStats.totalExpected} DH</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sports and Payment History */}
      <div className="space-y-4 sm:space-y-6">
        {Object.values(athlete.sports || {}).map((sport) => {
          const paymentHistory = generateCompletePaymentHistory(sport);
          
          return (
            <div key={sport.sportId} className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-4 sm:p-6 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900">{sport.sportName}</h3>
                      <p className="text-xs sm:text-sm text-gray-600">
                        {sport.montant} DH/mois • Depuis le {new Date(sport.date_debut).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex items-center space-x-1">
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleEditSport(sport.sportId)}
                          className="flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs sm:text-sm hover:bg-blue-700 transition-colors font-medium"
                          title="Modifier le sport"
                        >
                          <Settings className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                          Éditer
                        </button>
                        <button
                          onClick={() => handleDeactivateSport(sport.sportId)}
                          className="flex items-center px-3 py-1.5 bg-orange-600 text-white rounded-lg text-xs sm:text-sm hover:bg-orange-700 transition-colors font-medium"
                          title="Désactiver le sport"
                        >
                          <UserX className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                          Désactiver
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-4 sm:p-6">
                <h4 className="text-sm sm:text-md font-medium text-gray-900 mb-3 sm:mb-4">Historique des Paiements</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {paymentHistory.map((monthData) => (
                    <div key={monthData.month} className="border border-gray-200 rounded-lg p-3 sm:p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs sm:text-sm font-medium text-gray-900">
                          {monthData.monthLabel}
                        </span>
                        {monthData.status !== 'not_generated' ? (
                          <div className={`px-2 py-1 rounded-full border text-xs font-medium flex items-center ${getPaymentStatusColor(monthData.status)}`}>
                            {getPaymentStatusIcon(monthData.status)}
                            <span className="ml-1">{getPaymentStatusText(monthData.status)}</span>
                            {monthData.isAutoGenerated && (
                              <span className="ml-1 text-xs opacity-75">(Auto)</span>
                            )}
                          </div>
                        ) : (
                          <div className="px-2 py-1 rounded-full border text-xs font-medium flex items-center bg-gray-50 text-gray-700 border-gray-200">
                            <X className="w-3 h-3 mr-1" />
                            Futur
                          </div>
                        )}
                      </div>
                      
                      <div className="text-xs sm:text-sm text-gray-600 space-y-1">
                        <p>Montant: {monthData.expectedAmount} DH</p>
                        {monthData.payment?.date_paiement && (
                          <p>Payé le: {new Date(monthData.payment.date_paiement).toLocaleDateString('fr-FR')}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Notes Modal */}
      {showNotes && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center">
                <FileText className="w-6 h-6 text-blue-600 mr-3" />
                <h2 className="text-xl font-semibold text-gray-900">Notes - {athlete.nom}</h2>
              </div>
              <button
                onClick={() => setShowNotes(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes personnelles
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Ajoutez des notes sur cet athlète..."
                  rows={6}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Ces notes sont privées et ne sont visibles que par vous.
                </p>
              </div>

              <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowNotes(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSaveNotes}
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Save className="w-5 h-5 mr-2" />
                  )}
                  {loading ? 'Sauvegarde...' : 'Sauvegarder'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Sport Modal */}
      <AddSportToAthleteModal
        isOpen={isAddSportModalOpen}
        athleteId={athleteId}
        athleteName={athlete?.nom || ''}
        onClose={() => setIsAddSportModalOpen(false)}
        onSportAdded={handleSportAdded}
      />

      {/* Edit Sport Modal */}
      <EditSportModal
        isOpen={isEditSportModalOpen}
        athleteId={athleteId}
        athleteName={athlete?.nom || ''}
        sport={selectedSportId ? athlete?.sports[selectedSportId] || null : null}
        onClose={() => {
          setIsEditSportModalOpen(false);
          setSelectedSportId('');
        }}
        onSportUpdated={handleSportUpdated}
      />

      {/* Deactivate Sport Modal */}
      <DeactivateSportModal
        isOpen={isDeactivateSportModalOpen}
        athleteId={athleteId}
        athleteName={athlete?.nom || ''}
        sport={selectedSportId ? athlete?.sports[selectedSportId] || null : null}
        onClose={() => {
          setIsDeactivateSportModalOpen(false);
          setSelectedSportId('');
        }}
        onSportDeactivated={handleSportDeactivated}
      />

      {/* Deactivate Athlete Modal */}
      <DeactivateAthleteModal
        isOpen={isDeactivateAthleteModalOpen}
        athlete={athlete}
        onClose={() => setIsDeactivateAthleteModalOpen(false)}
        onAthleteDeactivated={handleAthleteDeactivated}
      />
    </div>
  );
};

export default AthleteProfile;