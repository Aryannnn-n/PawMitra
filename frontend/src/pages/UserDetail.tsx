import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiFetch } from '@/lib/api';
import { Layout } from '@/components/layout/Layout';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { User, Phone, MapPin, Calendar, Loader2 } from 'lucide-react';
import type { Pet, AdoptionRequest } from '@/types';

interface PublicUser {
  id: number; name: string; username: string;
  email: string; phone?: string; age?: number;
  gender?: string; location?: string; createdAt: string;
  pets: Pet[];
  adoptionRequests: AdoptionRequest[];
}

const ADOPTION_BADGE: Record<string, string> = {
  PENDING:  'bg-yellow-100 text-yellow-700',
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
};

export default function UserDetail() {
  const { id }        = useParams<{ id: string }>();
  const [profile, setProfile] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<{ user: PublicUser }>(`/api/users/${id}`)
      .then(d => setProfile(d.user))
      .catch(() => toast.error('User not found'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <Layout>
      <div className="flex justify-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    </Layout>
  );

  if (!profile) return null;

  return (
    <Layout>
      <div className="max-w-3xl mx-auto mt-8 mb-16 space-y-8">

        {/* Header */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
          <div className="flex items-center gap-5 border-b pb-6 mb-6">
            <img
              src={`https://api.dicebear.com/7.x/initials/svg?seed=${profile.username}`}
              className="w-16 h-16 rounded-full border-2 border-indigo-200"
              alt={profile.username}
            />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{profile.username}</h2>
              <p className="text-sm text-gray-400 flex items-center gap-1 mt-0.5">
                <Calendar className="w-3.5 h-3.5" />
                Member since {new Date(profile.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
            <InfoItem icon={<User className="w-4 h-4" />}     label="Email"    value={profile.email} />
            {profile.phone    && <InfoItem icon={<Phone className="w-4 h-4" />}    label="Phone"    value={profile.phone} />}
            {profile.age      && <InfoItem icon={<User className="w-4 h-4" />}     label="Age"      value={String(profile.age)} />}
            {profile.gender   && <InfoItem icon={<User className="w-4 h-4" />}     label="Gender"   value={profile.gender} />}
            {profile.location && <InfoItem icon={<MapPin className="w-4 h-4" />}   label="Location" value={profile.location} />}
          </div>
        </div>

        {/* Pets */}
        {profile.pets?.length > 0 && (
          <section>
            <h3 className="text-lg font-bold text-gray-900 mb-3">
              🐾 Pets Reported by {profile.username}
            </h3>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y">
              {profile.pets.map(pet => (
                <Link key={pet.id} to={`/pets/${pet.id}`}
                  className="flex items-center justify-between px-5 py-3 hover:bg-indigo-50 transition group">
                  <span className="text-indigo-600 group-hover:underline font-medium">
                    {pet.name || pet.type}
                  </span>
                  <Badge className="text-xs bg-gray-100 text-gray-600 border-gray-200">{pet.status}</Badge>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Adoption Requests */}
        {profile.adoptionRequests?.length > 0 && (
          <section>
            <h3 className="text-lg font-bold text-gray-900 mb-3">
              📩 Adoption Requests by {profile.username}
            </h3>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y">
              {profile.adoptionRequests.map(r => (
                <Link key={r.id} to={`/pets/${r.pet.id}`}
                  className="flex items-center justify-between px-5 py-3 hover:bg-indigo-50 transition">
                  <span className="text-indigo-600 hover:underline font-medium">
                    {r.pet.name || r.pet.type}
                  </span>
                  <Badge className={`text-xs ${ADOPTION_BADGE[r.status]}`}>{r.status}</Badge>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </Layout>
  );
}

const InfoItem = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="flex items-start gap-2 text-gray-600">
    <span className="text-indigo-400 mt-0.5 shrink-0">{icon}</span>
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="font-medium text-gray-800 break-all">{value}</p>
    </div>
  </div>
);