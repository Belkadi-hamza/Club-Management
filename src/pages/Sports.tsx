import React, { useState, useEffect } from 'react';
import { Trophy, Plus, Target } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ref, remove } from 'firebase/database';
import { db } from '../lib/firebase';
import AddSportModal from '../components/sports/AddSportModal';
import SportCard from '../components/sports/SportCard';
import { Sport } from '../types';

const Sports: React.FC = () => {
  const { club, currentUser } = useAuth();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [sports, setSports] = useState<Sport[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (club?.sports) {
      setSports(Object.values(club.sports));
    }
  }, [club]);

  const handleSportAdded = () => {
    // Real-time updates will handle this automatically
  };

  const handleDeleteSport = async (sport: Sport) => {
    if (!currentUser || !club) return;
    
    // Check if any athletes are using this sport
    const athletesUsingSport = Object.values(club.athletes).filter(athlete => 
      Object.keys(athlete.sports).includes(sport.id)
    );

    if (athletesUsingSport.length > 0) {
      alert(`Impossible de supprimer ce sport. ${athletesUsingSport.length} athlète(s) l'utilisent encore.`);
      return;
    }

    if (!confirm(`Êtes-vous sûr de vouloir supprimer le sport "${sport.name}" ?`)) {
      return;
    }

    setLoading(true);
    try {
      const sportRef = ref(db, `clubs/${currentUser.uid}/sports/${sport.id}`);
      await remove(sportRef);
      
      // Update local state
      setSports(prev => prev.filter(s => s.id !== sport.id));
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression du sport');
    } finally {
      setLoading(false);
    }
  };

  const getAthleteCountForSport = (sportId: string) => {
    if (!club?.athletes) return 0;
    return Object.values(club.athletes).filter(athlete => 
      Object.keys(athlete.sports).includes(sportId)
    ).length;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sports</h1>
          <p className="text-gray-600">Gérez les sports disponibles dans votre club</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <Plus className="w-5 h-5 mr-2" />Sport
        </button>
      </div>

      {/* Sports Grid */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Sports Disponibles</h2>
            <span className="text-sm text-gray-500">
              {sports.length} sport(s) au total
            </span>
          </div>
        </div>
        <div className="p-6">
          {sports.length === 0 ? (
            <div className="text-center py-12">
              <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Aucun sport configuré</p>
              <p className="text-sm text-gray-400 mb-4">Ajoutez les sports pratiqués dans votre club</p>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Ajouter un Sport
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sports.map(sport => (
                <SportCard
                  key={sport.id}
                  sport={sport}
                  athleteCount={getAthleteCountForSport(sport.id)}
                  onDelete={handleDeleteSport}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Sport Modal */}
      <AddSportModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSportAdded={handleSportAdded}
      />
    </div>
  );
};

export default Sports;