import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  MapPin, Calendar, PawPrint, User,
  ExternalLink, Pencil, Heart, Loader2
} from 'lucide-react';
import type { Pet } from '@/types';

const STATUS_STYLES: Record<string, string> = {
  LOST:      'bg-red-100 text-red-700 border-red-200',
  FOUND:     'bg-yellow-100 text-yellow-700 border-yellow-200',
  ADOPTABLE: 'bg-green-100 text-green-700 border-green-200',
  ADOPTED:   'bg-blue-100 text-blue-700 border-blue-200',
  REUNITED:  'bg-purple-100 text-purple-700 border-purple-200',
};

export default function PetDetail() {
  const { id }           = useParams<{ id: string }>();
  const { user, isAuth } = useAuthStore();
  const navigate         = useNavigate();

  const [pet,         setPet]         = useState<Pet | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [adopting,    setAdopting]    = useState(false);
  const [hasRequested, setHasRequested] = useState(false);

  useEffect(() => {
    const fetchPet = async () => {
      try {
        const data = await apiFetch<{ pet: Pet }>(`/api/pets/${id}`);
        setPet(data.pet);
      } catch {
        toast.error('Pet not found');
        navigate('/search');
      } finally {
        setLoading(false);
      }
    };
    fetchPet();
  }, [id]);

  const handleAdoptionRequest = async () => {
    if (!isAuth) { navigate('/login'); return; }
    setAdopting(true);
    try {
      await apiFetch(`/api/adoptions/${id}`, { method: 'POST' });
      setHasRequested(true);
      toast.success('Adoption request submitted! ✅');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setAdopting(false);
    }
  };

  if (loading) return (
    <Layout>
      <div className="flex justify-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    </Layout>
  );

  if (!pet) return null;

  const isOwner = user?.id === (pet.owner as any)?.id;
  const isAdmin = user?.role === 'ADMIN';

  return (
    <Layout>
      <div className="max-w-4xl mx-auto mt-8">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2">

            {/* Image */}
            <div className="relative bg-gray-100 min-h-[320px]">
              {pet.imageUrl ? (
                <img
                  src={pet.imageUrl}
                  alt={pet.name || pet.type}
                  className="w-full h-full object-cover min-h-[320px]"
                  loading="lazy"
                />
              ) : (
                <div className="w-full min-h-[320px] flex items-center justify-center text-gray-400">
                  <PawPrint className="w-16 h-16 opacity-30" />
                </div>
              )}
              <div className="absolute top-4 left-4">
                <Badge className={`text-sm font-semibold border ${STATUS_STYLES[pet.status] ?? ''}`}>
                  {pet.status}
                </Badge>
              </div>
            </div>

            {/* Details */}
            <div className="p-7 flex flex-col justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">
                  {pet.name || pet.type}
                </h1>
                <p className="text-gray-500 text-sm mb-5">
                  {pet.type}{pet.breed ? ` • ${pet.breed}` : ''}{pet.color ? ` • ${pet.color}` : ''}
                </p>

                <div className="space-y-2.5 text-sm text-gray-700">
                  <DetailRow label="Pet ID"    value={`#${pet.id}`} />
                  {pet.gender   && <DetailRow label="Gender"   value={pet.gender} />}
                  {pet.age      !== undefined && pet.age !== null && <DetailRow label="Age" value={`${pet.age} yrs`} />}
                  {pet.wellness && <DetailRow label="Wellness" value={pet.wellness} />}
                  {pet.birthmark && <DetailRow label="Birthmark" value={pet.birthmark} />}

                  {/* Location */}
                  <div className="flex items-start gap-2 pt-1">
                    <MapPin className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
                    <span>
                      {[pet.addressLine, pet.village, pet.city, pet.state, pet.pincode]
                        .filter(Boolean).join(', ')}
                    </span>
                  </div>

                  {pet.googleMapsLink && (
                    <a
                      href={pet.googleMapsLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-indigo-600 hover:underline text-sm"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> View on Maps
                    </a>
                  )}

                  {/* Dates */}
                  {pet.incidentDate && (
                    <div className="flex items-center gap-2 text-gray-500">
                      <Calendar className="w-4 h-4 shrink-0" />
                      Lost/Found: {new Date(pet.incidentDate).toLocaleDateString('en-IN')}
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-gray-500">
                    <Calendar className="w-4 h-4 shrink-0" />
                    Reported: {new Date(pet.dateReported).toLocaleDateString('en-IN')}
                  </div>

                  {/* Reporter */}
                  {pet.owner && (
                    <div className="flex items-center gap-2 pt-1">
                      <User className="w-4 h-4 text-gray-400 shrink-0" />
                      <Link
                        to={`/users/${pet.owner.id}`}
                        className="text-indigo-600 hover:underline"
                      >
                        {isAdmin ? `Reported by: ${pet.owner.username}` : `@${pet.owner.username}`}
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 flex flex-wrap gap-3">
                {/* Adoption Request */}
                {pet.status === 'ADOPTABLE' && isAuth && !isOwner && (
                  <Button
                    onClick={handleAdoptionRequest}
                    disabled={adopting || hasRequested}
                    className="bg-green-600 hover:bg-green-700 text-white flex-1"
                  >
                    {adopting ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Requesting...</>
                    ) : hasRequested ? (
                      '✅ Request Sent'
                    ) : (
                      <><Heart className="w-4 h-4 mr-2" /> Request Adoption</>
                    )}
                  </Button>
                )}

                {pet.status === 'ADOPTABLE' && isOwner && (
                  <p className="text-sm text-gray-500 italic">You cannot adopt your own pet.</p>
                )}

                {/* Edit — owner only, not adopted */}
                {isOwner && pet.status !== 'ADOPTED' && (
                  <Link to={`/pets/${pet.id}/edit`} className="flex-1">
                    <Button variant="outline" className="w-full border-indigo-200 text-indigo-700 hover:bg-indigo-50">
                      <Pencil className="w-4 h-4 mr-2" /> Edit Pet
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex gap-2">
    <span className="text-gray-400 w-24 shrink-0">{label}:</span>
    <span className="text-gray-800 font-medium">{value}</span>
  </div>
);