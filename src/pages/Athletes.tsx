import React from 'react';
import { useState, useEffect } from 'react';
import { Users, Plus, Search, Filter, UserX, UserCheck, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ref, update, remove } from 'firebase/database';
import { db } from '../lib/firebase';
import AddAthleteModal from '../components/athletes/AddAthleteModal';
import AthleteCard from '../components/athletes/AthleteCard';
import AthleteProfile from './AthleteProfile';
import DeactivateAthleteModal from '../components/athletes/DeactivateAthleteModal';
import AddSportToAthleteModal from '../components/athletes/AddSportToAthleteModal';
import EditSportModal from '../components/athletes/EditSportModal';
import DeactivateSportModal from '../components/athletes/DeactivateSportModal';
import { Athlete } from '../types';

const Athletes: React.FC = () => {
  const { club, currentUser } = useAuth();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false);
  const [isAddSportModalOpen, setIsAddSportModalOpen] = useState(false);
  const [isEditSportModalOpen, setIsEditSportModalOpen] = useState(false);
  const [isDeactivateSportModalOpen, setIsDeactivateSportModalOpen] = useState(false);
  const [selectedAthleteForDeactivation, setSelectedAthleteForDeactivation] = useState<Athlete | null>(null);
  const [selectedAthleteForSport, setSelectedAthleteForSport] = useState<Athlete | null>(null);
  const [selectedSportId, setSelectedSportId] = useState<string>('');
  const [selectedAthleteId, setSelectedAthleteId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSport, setSelectedSport] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (club?.athletes) {
      setAthletes(Object.values(club.athletes));
    }
  }, [club]);

  const handleAthleteAdded = () => {
    // Real-time updates will handle this automatically
  };

  const handleSportAdded = () => {
    // Real-time updates will handle this automatically
  };
  const handleEditAthlete = (athlete: Athlete) => {
    setSelectedAthleteId(athlete.id);
  };

  const handleViewPayments = (athlete: Athlete) => {
    setSelectedAthleteId(athlete.id);
  };

  const handleAddSport = (athlete: Athlete) => {
    setSelectedAthleteForSport(athlete);
    setIsAddSportModalOpen(true);
  };

  const handleEditSport = (athlete: Athlete, sportId: string) => {
    setSelectedAthleteForSport(athlete);
    setSelectedSportId(sportId);
    setIsEditSportModalOpen(true);
  };

  const handleDeactivateSport = (athlete: Athlete, sportId: string) => {
    setSelectedAthleteForSport(athlete);
    setSelectedSportId(sportId);
    setIsDeactivateSportModalOpen(true);
  };
  const handleDeactivateAthlete = (athlete: Athlete) => {
    setSelectedAthleteForDeactivation(athlete);
    setIsDeactivateModalOpen(true);
  };

  const handleReactivateAthlete = async (athlete: Athlete) => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      const athleteRef = ref(db, `clubs/${currentUser.uid}/athletes/${athlete.id}`);
      await update(athleteRef, {
        status: 'active',
        date_deactivated: null,
        reason_deactivated: null
      });
    } catch (error) {
      console.error('Erreur lors de la réactivation:', error);
      alert('Erreur lors de la réactivation de l\'athlète');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAthlete = async (athlete: Athlete) => {
    if (!currentUser) return;
    
    if (!confirm(`Êtes-vous sûr de vouloir supprimer définitivement l'athlète "${athlete.nom}" ? Cette action est irréversible.`)) {
      return;
    }

    setLoading(true);
    try {
      const athleteRef = ref(db, `clubs/${currentUser.uid}/athletes/${athlete.id}`);
      await remove(athleteRef);
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression de l\'athlète');
    } finally {
      setLoading(false);
    }
  };

  const handleAthleteDeactivated = () => {
    setIsDeactivateModalOpen(false);
    setSelectedAthleteForDeactivation(null);
  };

  const handleSportDeactivated = () => {
    setIsDeactivateSportModalOpen(false);
    setSelectedAthleteForSport(null);
    setSelectedSportId('');
  };
  // If an athlete is selected, show their profile
if (selectedAthleteId) {
  return (
    <AthleteProfile
      athleteId={selectedAthleteId}
      onBack={() => setSelectedAthleteId(null)}
      onDeactivate={handleDeactivateAthlete}
      onReactivate={handleReactivateAthlete}
      onDelete={handleDeleteAthlete}
    />
  );
}

  const filteredAthletes = athletes.filter(athlete => {
    const matchesSearch = athlete.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         athlete.telephone.includes(searchTerm);
    
    const matchesSport = !selectedSport || 
                        Object.keys(athlete.sports || {}).includes(selectedSport);
    
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && athlete.status === 'active') ||
                         (statusFilter === 'inactive' && athlete.status === 'inactive');
    
    return matchesSearch && matchesSport && matchesStatus;
  });

  const availableSports = Object.values(club?.sports || {});
  const activeAthletes = athletes.filter(a => a.status === 'active').length;
  const inactiveAthletes = athletes.filter(a => a.status === 'inactive').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Athlètes</h1>
          <p className="text-gray-600">
            Gérez les athlètes de votre club • {activeAthletes} actifs • {inactiveAthletes} inactifs
          </p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <Plus className="w-5 h-5 mr-2" />Athlète
          
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher un athlète..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
            />
          </div>
          <div className="flex flex-col xs:flex-row gap-2 sm:gap-3 sm:items-center">
            <div className="flex items-center gap-2 whitespace-nowrap">
              <Filter className="w-5 h-5 text-gray-400" />
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm min-w-0 flex-1 xs:flex-initial"
              >
                <option value="active">Actifs seulement</option>
                <option value="inactive">Inactifs seulement</option>
                <option value="all">Tous les statuts</option>
              </select>
            </div>
            <div className="flex items-center gap-2 whitespace-nowrap">
              <Filter className="w-5 h-5 text-gray-400" />
              <select 
                value={selectedSport}
                onChange={(e) => setSelectedSport(e.target.value)}
                className="px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm min-w-0 flex-1 xs:flex-initial"
              >
                <option value="">Tous les sports</option>
                {availableSports.map(sport => (
                  <option key={sport.id} value={sport.id}>{sport.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        
        {(searchTerm || selectedSport || statusFilter !== 'active') && (
          <div className="mt-4 flex flex-col xs:flex-row xs:items-center justify-between gap-2">
            <p className="text-sm text-gray-600">
              {filteredAthletes.length} athlète(s) trouvé(s)
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedSport('');
                setStatusFilter('active');
              }}
              className="text-sm text-blue-600 hover:text-blue-700 self-start xs:self-auto"
            >
              Effacer les filtres
            </button>
          </div>
        )}
      </div>

      {/* Athletes List */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Liste des Athlètes</h2>
            <span className="text-sm text-gray-500">
              {athletes.length} athlète(s) au total
            </span>
          </div>
        </div>
        <div className="p-6">
          {filteredAthletes.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              {athletes.length === 0 ? (
                <>
                  <p className="text-gray-500">Aucun athlète enregistré</p>
                  <p className="text-sm text-gray-400 mb-4">Commencez par ajouter votre premier athlète</p>
                  <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Ajouter un Athlète
                  </button>
                </>
              ) : (
                <>
                  <p className="text-gray-500">Aucun athlète trouvé</p>
                  <p className="text-sm text-gray-400">Essayez de modifier vos critères de recherche</p>
                </>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              {filteredAthletes.map(athlete => (
                <AthleteCard
                  key={athlete.id}
                  athlete={athlete}
                  onEdit={handleEditAthlete}
                  onViewPayments={handleViewPayments}
                  onDeactivate={handleDeactivateAthlete}
                  onReactivate={handleReactivateAthlete}
                  onDelete={handleDeleteAthlete}
                  onAddSport={handleAddSport}
                  onEditSport={handleEditSport}
                  onDeactivateSport={handleDeactivateSport}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Athlete Modal */}
      <AddAthleteModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAthleteAdded={handleAthleteAdded}
      />

      {/* Add Sport to Athlete Modal */}
      <AddSportToAthleteModal
        isOpen={isAddSportModalOpen}
        athleteId={selectedAthleteForSport?.id || ''}
        athleteName={selectedAthleteForSport?.nom || ''}
        onClose={() => {
          setIsAddSportModalOpen(false);
          setSelectedAthleteForSport(null);
        }}
        onSportAdded={handleSportAdded}
      />

      {/* Edit Sport Modal */}
      <EditSportModal
        isOpen={isEditSportModalOpen}
        athleteId={selectedAthleteForSport?.id || ''}
        athleteName={selectedAthleteForSport?.nom || ''}
        sport={selectedAthleteForSport?.sports[selectedSportId] || null}
        onClose={() => {
          setIsEditSportModalOpen(false);
          setSelectedAthleteForSport(null);
          setSelectedSportId('');
        }}
        onSportUpdated={handleSportAdded}
      />

      {/* Deactivate Sport Modal */}
      <DeactivateSportModal
        isOpen={isDeactivateSportModalOpen}
        athleteId={selectedAthleteForSport?.id || ''}
        athleteName={selectedAthleteForSport?.nom || ''}
        sport={selectedAthleteForSport?.sports[selectedSportId] || null}
        onClose={() => {
          setIsDeactivateSportModalOpen(false);
          setSelectedAthleteForSport(null);
          setSelectedSportId('');
        }}
        onSportDeactivated={handleSportDeactivated}
      />
      {/* Deactivate Athlete Modal */}
      <DeactivateAthleteModal
        isOpen={isDeactivateModalOpen}
        athlete={selectedAthleteForDeactivation}
        onClose={() => {
          setIsDeactivateModalOpen(false);
          setSelectedAthleteForDeactivation(null);
        }}
        onAthleteDeactivated={handleAthleteDeactivated}
      />
    </div>
  );
};

export default Athletes;