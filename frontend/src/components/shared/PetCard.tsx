import { Badge } from '@/components/ui/badge';
import type { Pet } from '@/types';
import { MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

const STATUS_STYLES: Record<string, string> = {
  LOST: 'bg-red-100 text-red-700 border-red-200',
  FOUND: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  ADOPTABLE: 'bg-green-100 text-green-700 border-green-200',
  ADOPTED: 'bg-blue-100 text-blue-700 border-blue-200',
  REUNITED: 'bg-purple-100 text-purple-700 border-purple-200',
};

export const PetCard = ({ pet }: { pet: Pet }) => (
  <Link to={`/pets/${pet.id}`} className="group block">
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden">
      {/* Image */}
      <div className="relative h-48 bg-gray-100 overflow-hidden">
        {pet.imageUrl ? (
          <img
            src={pet.imageUrl}
            alt={pet.name || pet.type}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
            🐾 No Image
          </div>
        )}
        {/* Status Badge */}
        <div className="absolute top-3 right-3">
          <Badge
            className={`text-xs font-semibold border ${STATUS_STYLES[pet.status] ?? ''}`}
          >
            {pet.status}
          </Badge>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 truncate">
          {pet.name || pet.type}
        </h3>
        <p className="text-sm text-gray-500 mt-0.5">
          {pet.breed || 'Unknown breed'} • {pet.color || 'Unknown color'}
        </p>
        <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
          <MapPin className="w-3 h-3" />
          {pet.city}, {pet.state}
        </div>
      </div>
    </div>
  </Link>
);
