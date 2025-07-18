import React from 'react';
import { Trophy, Users, Trash2 } from 'lucide-react';
import { Sport } from '../../types';

interface SportCardProps {
  sport: Sport;
  athleteCount: number;
  onDelete: (sport: Sport) => void;
}

const SportCard: React.FC<SportCardProps> = ({ sport, athleteCount, onDelete }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <Trophy className="w-6 h-6 text-green-600" />
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-semibold text-gray-900">{sport.name}</h3>
            <p className="text-sm text-gray-500">Sport disponible</p>
          </div>
        </div>
        <button
          onClick={() => onDelete(sport)}
          className="text-red-600 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors"
          title="Supprimer le sport"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-3">
        <div className="flex items-center text-sm text-gray-600">
          <Users className="w-4 h-4 mr-2" />
          {athleteCount} athlète(s) inscrit(s)
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="text-sm text-gray-500">
          ID: {sport.id}
        </div>
      </div>
    </div>
  );
};

export default SportCard;