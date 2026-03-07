import { Layout } from '@/components/layout/Layout';
import { PetCard } from '@/components/shared/PetCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiFetch } from '@/lib/api';
import type { Pet, PetStatus } from '@/types';
import { Loader2, Search, SlidersHorizontal } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

const STATUSES: { label: string; value: PetStatus | 'ALL' }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Lost', value: 'LOST' },
  { label: 'Found', value: 'FOUND' },
  { label: 'Adoptable', value: 'ADOPTABLE' },
  { label: 'Adopted', value: 'ADOPTED' },
  { label: 'Reunited', value: 'REUNITED' },
];

interface SearchResponse {
  grouped: Record<PetStatus, Pet[]>;
  total: number;
  filters: Record<string, string>;
}

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [filters, setFilters] = useState({
    type: searchParams.get('type') ?? '',
    breed: searchParams.get('breed') ?? '',
    color: searchParams.get('color') ?? '',
    location: searchParams.get('location') ?? '',
  });

  const [activeStatus, setActiveStatus] = useState<PetStatus | 'ALL'>('ALL');
  const [allPets, setAllPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // Run search on mount if params exist
  useEffect(() => {
    const hasParams = Object.values(filters).some((v) => v.trim());
    if (hasParams) runSearch();
    else fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<{ pets: Pet[] }>('/api/pets');
      setAllPets(data.pets);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to load pets');
    } finally {
      setLoading(false);
      setSearched(true);
    }
  };

  const runSearch = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v.trim()) params.set(k, v.trim());
    });
    setSearchParams(params);

    try {
      const data = await apiFetch<SearchResponse>(`/api/pets/search?${params}`);
      const flat = Object.values(data.grouped).flat();
      setAllPets(flat);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
      setSearched(true);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runSearch();
  };

  const visiblePets =
    activeStatus === 'ALL'
      ? allPets
      : allPets.filter((p) => p.status === activeStatus);

  const countByStatus = (status: PetStatus | 'ALL') =>
    status === 'ALL'
      ? allPets.length
      : allPets.filter((p) => p.status === status).length;

  const queryText = Object.values(filters).filter(Boolean).join(' ');

  return (
    <Layout>
      {/* Header */}
      <div className="mt-8 text-center">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          {queryText ? `Results for "${queryText}"` : 'Browse Pets'}
        </h1>
        <p className="text-gray-500 mt-2 text-sm">
          Refine your search or explore all categories below
        </p>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSubmit} className="mt-8 mb-10 max-w-4xl mx-auto">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
          <div className="flex flex-wrap gap-3 mb-4">
            <Input
              placeholder="Type (e.g. Dog, Cat)"
              value={filters.type}
              onChange={(e) =>
                setFilters((f) => ({ ...f, type: e.target.value }))
              }
              className="flex-1 min-w-[140px]"
            />
            <Input
              placeholder="Breed"
              value={filters.breed}
              onChange={(e) =>
                setFilters((f) => ({ ...f, breed: e.target.value }))
              }
              className="flex-1 min-w-[140px]"
            />
            <Input
              placeholder="Color"
              value={filters.color}
              onChange={(e) =>
                setFilters((f) => ({ ...f, color: e.target.value }))
              }
              className="flex-1 min-w-[120px]"
            />
            <Input
              placeholder="City, State"
              value={filters.location}
              onChange={(e) =>
                setFilters((f) => ({ ...f, location: e.target.value }))
              }
              className="flex-1 min-w-[140px]"
            />
          </div>
          <div className="flex justify-between items-center">
            <button
              type="button"
              onClick={() => {
                setFilters({ type: '', breed: '', color: '', location: '' });
                setSearchParams({});
                fetchAll();
              }}
              className="text-sm text-gray-400 hover:text-gray-600 transition flex items-center gap-1"
            >
              <SlidersHorizontal className="w-4 h-4" /> Clear filters
            </button>
            <Button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-8"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Search className="w-4 h-4 mr-2" />
              )}
              Search
            </Button>
          </div>
        </div>
      </form>

      {/* Status Filter Pills */}
      <div className="flex flex-wrap gap-2 mb-8 justify-center">
        {STATUSES.map((s) => (
          <button
            key={s.value}
            onClick={() => setActiveStatus(s.value)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition flex items-center gap-2
              ${
                activeStatus === s.value
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-indigo-300 hover:text-indigo-600'
              }`}
          >
            {s.label}
            <span
              className={`text-xs px-1.5 py-0.5 rounded-full font-semibold
              ${activeStatus === s.value ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}
            >
              {countByStatus(s.value)}
            </span>
          </button>
        ))}
      </div>

      {/* Results Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
      ) : visiblePets.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {visiblePets.map((pet) => (
            <PetCard key={pet.id} pet={pet} />
          ))}
        </div>
      ) : searched ? (
        <div className="text-center py-20 text-gray-500">
          <p className="text-5xl mb-4">🐾</p>
          <p className="text-lg font-medium">No pets found</p>
          <p className="text-sm mt-1">Try adjusting your filters</p>
        </div>
      ) : null}
    </Layout>
  );
}
