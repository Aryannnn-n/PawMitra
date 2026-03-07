import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { PetCard } from '@/components/shared/PetCard';
import { toast } from 'sonner';
import {
  User, Phone, MapPin, Calendar, Eye, EyeOff,
  Pencil, Lock, Trash2, ChevronDown, ChevronUp, Loader2
} from 'lucide-react';
import type { Pet, AdoptionRequest } from '@/types';

const STATUS_FILTERS = ['ALL', 'LOST', 'FOUND', 'ADOPTABLE', 'ADOPTED', 'REUNITED'] as const;
type StatusFilter = typeof STATUS_FILTERS[number];

const ADOPTION_BADGE: Record<string, string> = {
  PENDING:  'bg-yellow-100 text-yellow-700',
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
};

export default function Profile() {
  const { user, setAuth, logout } = useAuthStore();

  const [reportedPets, setReportedPets] = useState<Pet[]>([]);
  const [adoptionReqs, setAdoptionReqs] = useState<AdoptionRequest[]>([]);
  const [petFilter,    setPetFilter]    = useState<StatusFilter>('ALL');
  const [showDetails,  setShowDetails]  = useState(false);
  const [activeForm,   setActiveForm]   = useState<'none' | 'edit' | 'password'>('none');

  // Edit profile form
  const [editForm, setEditForm] = useState({
    name: user?.name ?? '', username: user?.username ?? '',
    email: user?.email ?? '', phone: '', location: '',
    age: '', gender: '',
  });

  // Password form
  const [passForm,  setPassForm]  = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPass,  setShowPass]  = useState({ curr: false, new: false, conf: false });
  const [saving,    setSaving]    = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [meData, petsData, adoptData] = await Promise.all([
          apiFetch<{ user: any }>('/api/users/me'),
          apiFetch<{ pets: Pet[] }>('/api/pets'),
          apiFetch<{ requests: AdoptionRequest[] }>('/api/adoptions/my'),
        ]);

        // Filter pets owned by me
        const myPets = petsData.pets.filter((p: any) => p.owner?.id === meData.user.id);
        setReportedPets(myPets);
        setAdoptionReqs(adoptData.requests);

        setEditForm({
          name:     meData.user.name     ?? '',
          username: meData.user.username ?? '',
          email:    meData.user.email    ?? '',
          phone:    meData.user.phone    ?? '',
          location: meData.user.location ?? '',
          age:      meData.user.age      ? String(meData.user.age) : '',
          gender:   meData.user.gender   ?? '',
        });
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Failed to load profile');
      }
    };
    fetchData();
  }, []);

  const setEdit = (field: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setEditForm(f => ({ ...f, [field]: e.target.value }));

  const setPass = (field: string) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setPassForm(f => ({ ...f, [field]: e.target.value }));

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = await apiFetch<{ user: any }>('/api/users/me', {
        method: 'PUT',
        body: JSON.stringify({
          ...editForm,
          age: editForm.age ? parseInt(editForm.age) : undefined,
          gender: editForm.gender || undefined,
        }),
      });
      setAuth(data.user, localStorage.getItem('token')!);
      toast.success('Profile updated! ✅');
      setActiveForm('none');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passForm.newPassword !== passForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setSaving(true);
    try {
      await apiFetch('/api/users/change-password', {
        method: 'PUT',
        body: JSON.stringify({
          currentPassword: passForm.currentPassword,
          newPassword:     passForm.newPassword,
        }),
      });
      toast.success('Password changed! 🔑');
      setPassForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setActiveForm('none');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This cannot be undone.')) return;
    try {
      await apiFetch('/api/users/me', { method: 'DELETE' });
      logout();
      toast.success('Account deleted');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete account');
    }
  };

  const visiblePets = petFilter === 'ALL'
    ? reportedPets
    : reportedPets.filter(p => p.status === petFilter);

  return (
    <Layout>
      <div className="max-w-5xl mx-auto mt-8 mb-16 space-y-8">

        {/* Profile Header */}
        <Card className="border-0 shadow-sm bg-white/80 backdrop-blur">
          <CardContent className="pt-8 pb-6">
            <div className="flex flex-col items-center text-center mb-6">
              <img
                src={`https://api.dicebear.com/7.x/initials/svg?seed=${user?.username}`}
                alt="avatar"
                className="w-24 h-24 rounded-full border-4 border-indigo-200 shadow-md mb-4"
              />
              <h2 className="text-2xl font-bold text-gray-900">{user?.username}</h2>
              <p className="text-gray-500 text-sm">{user?.email}</p>
              <Badge className="mt-2 bg-indigo-100 text-indigo-700 border-indigo-200">
                {user?.role}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                className="mt-4 text-gray-500"
                onClick={() => setShowDetails(v => !v)}
              >
                {showDetails ? <><ChevronUp className="w-4 h-4 mr-1" /> Hide Details</> : <><ChevronDown className="w-4 h-4 mr-1" /> View Details</>}
              </Button>
            </div>

            {showDetails && (
              <div className="space-y-5 border-t pt-5">
                {/* Info Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm text-gray-600">
                  <InfoItem icon={<Phone className="w-4 h-4" />}    label="Phone"    value={editForm.phone    || 'N/A'} />
                  <InfoItem icon={<Calendar className="w-4 h-4" />} label="Age"      value={editForm.age      || 'N/A'} />
                  <InfoItem icon={<User className="w-4 h-4" />}     label="Gender"   value={editForm.gender   || 'N/A'} />
                  <InfoItem icon={<MapPin className="w-4 h-4" />}   label="Location" value={editForm.location || 'N/A'} />
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setActiveForm(f => f === 'edit' ? 'none' : 'edit')}
                    className="flex-1 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                  >
                    <Pencil className="w-4 h-4 mr-2" /> Update Info
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setActiveForm(f => f === 'password' ? 'none' : 'password')}
                    className="flex-1 border-yellow-200 text-yellow-700 hover:bg-yellow-50"
                  >
                    <Lock className="w-4 h-4 mr-2" /> Change Password
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleDeleteAccount}
                    className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-2" /> Delete Account
                  </Button>
                </div>

                {/* Edit Form */}
                {activeForm === 'edit' && (
                  <form onSubmit={handleUpdateProfile} className="bg-gray-50 rounded-xl p-5 space-y-3 border">
                    <h4 className="font-semibold text-gray-700 mb-2">Update Profile Info</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {(['name', 'username', 'email', 'phone', 'location'] as const).map(f => (
                        <div key={f} className="space-y-1">
                          <label className="text-xs font-medium text-gray-500 capitalize">{f}</label>
                          <Input value={editForm[f]} onChange={setEdit(f)} disabled={saving} />
                        </div>
                      ))}
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-500">Age</label>
                        <Input type="number" value={editForm.age} onChange={setEdit('age')} disabled={saving} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-500">Gender</label>
                        <select value={editForm.gender} onChange={setEdit('gender')} disabled={saving}
                          className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm">
                          <option value="">Select</option>
                          <option value="MALE">Male</option>
                          <option value="FEMALE">Female</option>
                          <option value="OTHER">Other</option>
                          <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
                        </select>
                      </div>
                    </div>
                    <Button type="submit" disabled={saving} className="bg-green-600 hover:bg-green-700 text-white">
                      {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Save Changes
                    </Button>
                  </form>
                )}

                {/* Password Form */}
                {activeForm === 'password' && (
                  <form onSubmit={handleChangePassword} className="bg-gray-50 rounded-xl p-5 space-y-3 border">
                    <h4 className="font-semibold text-gray-700 mb-2">Change Password</h4>
                    {([
                      { key: 'currentPassword', label: 'Current Password', show: showPass.curr, toggle: () => setShowPass(s => ({ ...s, curr: !s.curr })) },
                      { key: 'newPassword',     label: 'New Password',     show: showPass.new,  toggle: () => setShowPass(s => ({ ...s, new: !s.new })) },
                      { key: 'confirmPassword', label: 'Confirm Password', show: showPass.conf, toggle: () => setShowPass(s => ({ ...s, conf: !s.conf })) },
                    ] as const).map(({ key, label, show, toggle }) => (
                      <div key={key} className="space-y-1">
                        <label className="text-xs font-medium text-gray-500">{label}</label>
                        <div className="relative">
                          <Input
                            type={show ? 'text' : 'password'}
                            value={passForm[key]}
                            onChange={setPass(key)}
                            disabled={saving}
                            className="pr-10"
                          />
                          <button type="button" onClick={toggle}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    ))}
                    <Button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white">
                      {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Update Password
                    </Button>
                  </form>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* My Reported Pets */}
        <section>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <h3 className="text-xl font-bold text-gray-900">🐾 My Reported Pets</h3>
            <div className="flex gap-2 flex-wrap">
              {STATUS_FILTERS.map(s => (
                <button
                  key={s}
                  onClick={() => setPetFilter(s)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition
                    ${petFilter === s
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-gray-600 border border-gray-200 hover:border-indigo-300'}`}
                >
                  {s} ({s === 'ALL' ? reportedPets.length : reportedPets.filter(p => p.status === s).length})
                </button>
              ))}
            </div>
          </div>

          {visiblePets.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {visiblePets.map(pet => <PetCard key={pet.id} pet={pet} />)}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <p className="text-4xl mb-3">🐶</p>
              <p>You haven't reported any pets yet.</p>
              <Link to="/report">
                <Button className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white">Report a Pet</Button>
              </Link>
            </div>
          )}
        </section>

        {/* My Adoption Requests */}
        <section>
          <h3 className="text-xl font-bold text-gray-900 mb-4">📩 My Adoption Requests</h3>
          {adoptionReqs.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {adoptionReqs.map(r => (
                <Link to={`/pets/${r.pet.id}`} key={r.id}>
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition overflow-hidden">
                    <div className="h-40 bg-gray-100 overflow-hidden">
                      {r.pet.imageUrl ? (
                        <img src={r.pet.imageUrl} alt={r.pet.name || r.pet.type} className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300 text-sm">No Image</div>
                      )}
                    </div>
                    <div className="p-4">
                      <h4 className="font-semibold text-gray-900">{r.pet.name || r.pet.type}</h4>
                      <div className="flex items-center justify-between mt-2">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${ADOPTION_BADGE[r.status]}`}>
                          {r.status}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(r.requestDate).toLocaleDateString('en-IN')}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <p className="text-4xl mb-3">📭</p>
              <p>No adoption requests yet.</p>
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
}

const InfoItem = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="flex items-start gap-2">
    <span className="text-indigo-400 mt-0.5">{icon}</span>
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="font-medium text-gray-700">{value}</p>
    </div>
  </div>
);