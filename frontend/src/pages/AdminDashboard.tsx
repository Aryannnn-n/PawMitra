import { Layout } from '@/components/layout/Layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';
import type { AdoptionRequest, Pet } from '@/types';
import {
  CheckCircle2,
  LayoutDashboard,
  Loader2,
  PawPrint,
  XCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { toast } from 'sonner';

interface DashboardStats {
  users: { totalUsers: number; totalAdmins: number };
  pets: {
    totalPets: number;
    lostCount: number;
    foundCount: number;
    adoptableCount: number;
    adoptedCount: number;
    reunitedCount: number;
  };
  validation: {
    pendingValidation: number;
    approvedValidation: number;
    rejectedValidation: number;
  };
  adoptions: {
    pendingAdoptions: number;
    approvedAdoptions: number;
    rejectedAdoptions: number;
  };
}

type AdminSection =
  | 'validation'
  | 'lost'
  | 'found'
  | 'adoptable'
  | 'reunited'
  | 'adopted'
  | 'requests'
  | 'users';

const SECTION_TABS: { key: AdminSection; label: string; color: string }[] = [
  { key: 'validation', label: 'Validation', color: 'bg-indigo-600' },
  { key: 'requests', label: 'Adoption Requests', color: 'bg-green-600' },
  { key: 'lost', label: 'Lost', color: 'bg-red-500' },
  { key: 'found', label: 'Found', color: 'bg-teal-600' },
  { key: 'adoptable', label: 'Adoptable', color: 'bg-orange-500' },
  { key: 'reunited', label: 'Reunited', color: 'bg-gray-500' },
  { key: 'adopted', label: 'Adopted', color: 'bg-purple-600' },
  { key: 'users', label: 'Users', color: 'bg-blue-600' },
];

const VALIDATION_COLORS = ['#facc15', '#4ade80', '#f87171'];
const STATUS_COLORS = ['#6366f1', '#14b8a6', '#fb923c', '#a855f7', '#9ca3af'];

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [allPets, setAllPets] = useState<Pet[]>([]);
  const [adoptions, setAdoptions] = useState<AdoptionRequest[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [section, setSection] = useState<AdminSection>('validation');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsData, petsData, adoptData, usersData] = await Promise.all([
          apiFetch<DashboardStats>('/api/admin/dashboard'),
          apiFetch<{ pets: Pet[] }>('/api/admin/pets'),
          apiFetch<{ requests: AdoptionRequest[] }>('/api/admin/adoptions'),
          apiFetch<{ users: any[] }>('/api/admin/users'),
        ]);
        setStats(statsData);
        setAllPets(petsData.pets);
        setAdoptions(adoptData.requests);
        setUsers(usersData.users);
      } catch (err: unknown) {
        toast.error(
          err instanceof Error ? err.message : 'Failed to load dashboard',
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleValidation = async (
    petId: number,
    validationStatus: 'APPROVED' | 'REJECTED',
  ) => {
    try {
      await apiFetch(`/api/admin/pets/${petId}/validation`, {
        method: 'PATCH',
        body: JSON.stringify({ validationStatus }),
      });
      setAllPets((prev) => prev.filter((p) => p.id !== petId));
      toast.success(`Pet ${validationStatus.toLowerCase()} ✅`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Action failed');
    }
  };

  const handleStatusChange = async (petId: number, status: string) => {
    try {
      await apiFetch(`/api/admin/pets/${petId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      setAllPets((prev) =>
        prev.map((p) => (p.id === petId ? { ...p, status: status as any } : p)),
      );
      toast.success(`Status updated to ${status}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Update failed');
    }
  };

  const handleDeletePet = async (petId: number) => {
    if (!confirm('Delete this pet?')) return;
    try {
      await apiFetch(`/api/pets/${petId}`, { method: 'DELETE' });
      setAllPets((prev) => prev.filter((p) => p.id !== petId));
      toast.success('Pet deleted');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const handleAdoptionAction = async (
    reqId: number,
    action: 'approve' | 'reject',
  ) => {
    try {
      await apiFetch(`/api/adoptions/${reqId}/${action}`, { method: 'POST' });
      setAdoptions((prev) =>
        prev.map((r) =>
          r.id === reqId
            ? { ...r, status: action === 'approve' ? 'APPROVED' : 'REJECTED' }
            : r,
        ),
      );
      toast.success(`Request ${action}d ✅`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Action failed');
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Delete this user?')) return;
    try {
      await apiFetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      toast.success('User deleted');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  if (loading)
    return (
      <Layout>
        <div className="flex justify-center py-32">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
      </Layout>
    );

  if (!stats) return null;

  const validationChartData = [
    { name: 'Pending', value: stats.validation.pendingValidation },
    { name: 'Approved', value: stats.validation.approvedValidation },
    { name: 'Rejected', value: stats.validation.rejectedValidation },
  ];

  const statusChartData = [
    { name: 'Lost', count: stats.pets.lostCount },
    { name: 'Found', count: stats.pets.foundCount },
    { name: 'Adoptable', count: stats.pets.adoptableCount },
    { name: 'Adopted', count: stats.pets.adoptedCount },
    { name: 'Reunited', count: stats.pets.reunitedCount },
  ];

  const statCards = [
    {
      label: 'Total Users',
      value: stats.users.totalUsers,
      color: 'text-indigo-600',
    },
    { label: 'Admins', value: stats.users.totalAdmins, color: 'text-blue-600' },
    {
      label: 'Total Pets',
      value: stats.pets.totalPets,
      color: 'text-amber-600',
    },
    { label: 'Lost', value: stats.pets.lostCount, color: 'text-red-500' },
    { label: 'Found', value: stats.pets.foundCount, color: 'text-green-600' },
    {
      label: 'Adoptable',
      value: stats.pets.adoptableCount,
      color: 'text-teal-600',
    },
    {
      label: 'Adopted',
      value: stats.pets.adoptedCount,
      color: 'text-purple-600',
    },
    {
      label: 'Reunited',
      value: stats.pets.reunitedCount,
      color: 'text-pink-600',
    },
  ];

  const pendingPets = allPets.filter((p) => p.validationStatus === 'PENDING');
  const approvedByStatus = (s: string) =>
    allPets.filter((p) => p.validationStatus === 'APPROVED' && p.status === s);
  const pendingAdoptions = adoptions.filter((r) => r.status === 'PENDING');
  const approvedAdoptions = adoptions.filter((r) => r.status === 'APPROVED');

  return (
    <Layout>
      <div className="max-w-6xl mx-auto mt-6 mb-16 space-y-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
            <LayoutDashboard className="w-5 h-5 text-indigo-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-semibold text-gray-700 mb-4">
              Validation Summary
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={validationChartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {validationChartData.map((_, i) => (
                    <Cell key={i} fill={VALIDATION_COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-semibold text-gray-700 mb-4">
              Pet Status Summary
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={statusChartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f0f0f0"
                />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {statusChartData.map((_, i) => (
                    <Cell key={i} fill={STATUS_COLORS[i]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {statCards.map((s) => (
            <div
              key={s.label}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center"
            >
              <p className="text-sm text-gray-500 mb-1">{s.label}</p>
              <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Section Tabs */}
        <div className="flex flex-wrap gap-2">
          {SECTION_TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setSection(t.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition border-2
                ${
                  section === t.key
                    ? `${t.color} text-white border-transparent`
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Section: Validation */}
        {section === 'validation' && (
          <SectionWrapper
            title="Pet Validation Requests"
            count={pendingPets.length}
          >
            {pendingPets.length === 0 ? (
              <EmptyState text="No pending validations 🎉" />
            ) : (
              pendingPets.map((pet) => (
                <AdminPetCard key={pet.id} pet={pet}>
                  <div className="flex gap-2 mt-3">
                    <Button
                      size="sm"
                      onClick={() => handleValidation(pet.id, 'APPROVED')}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1" /> Approve
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleValidation(pet.id, 'REJECTED')}
                      className="bg-red-500 hover:bg-red-600 text-white"
                    >
                      <XCircle className="w-4 h-4 mr-1" /> Reject
                    </Button>
                    <Link to={`/pets/${pet.id}`}>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-indigo-200 text-indigo-700"
                      >
                        View
                      </Button>
                    </Link>
                  </div>
                </AdminPetCard>
              ))
            )}
          </SectionWrapper>
        )}

        {/* Section: Pet Lists */}
        {(
          ['lost', 'found', 'adoptable', 'reunited', 'adopted'] as const
        ).includes(section as any) && (
          <SectionWrapper
            title={`${section.charAt(0).toUpperCase() + section.slice(1)} Pets`}
            count={approvedByStatus(section.toUpperCase()).length}
          >
            {approvedByStatus(section.toUpperCase()).length === 0 ? (
              <EmptyState text={`No ${section} pets`} />
            ) : (
              approvedByStatus(section.toUpperCase()).map((pet) => (
                <AdminPetCard key={pet.id} pet={pet}>
                  <div className="flex gap-2 mt-3 flex-wrap">
                    <select
                      defaultValue={pet.status}
                      onChange={(e) =>
                        handleStatusChange(pet.id, e.target.value)
                      }
                      className="h-8 px-2 rounded-md border border-gray-200 text-sm bg-white"
                    >
                      {[
                        'LOST',
                        'FOUND',
                        'ADOPTABLE',
                        'REUNITED',
                        'ADOPTED',
                      ].map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    <Link to={`/pets/${pet.id}`}>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-indigo-200 text-indigo-700"
                      >
                        View
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      onClick={() => handleDeletePet(pet.id)}
                      className="bg-red-500 hover:bg-red-600 text-white"
                    >
                      Delete
                    </Button>
                  </div>
                </AdminPetCard>
              ))
            )}
          </SectionWrapper>
        )}

        {/* Section: Adoption Requests */}
        {section === 'requests' && (
          <SectionWrapper title="Adoption Requests" count={adoptions.length}>
            {/* Pending */}
            <h4 className="font-semibold text-gray-700 mb-3">
              🕓 Pending ({pendingAdoptions.length})
            </h4>
            {pendingAdoptions.length === 0 ? (
              <EmptyState text="No pending requests" />
            ) : (
              pendingAdoptions.map((r) => (
                <div
                  key={r.id}
                  className="bg-white rounded-xl border-l-4 border-yellow-400 shadow-sm p-4 flex justify-between items-center gap-4 flex-wrap"
                >
                  <div>
                    <p className="font-medium text-gray-800">
                      <Link
                        to={`/users/${r.user.id}`}
                        className="text-indigo-600 hover:underline"
                      >
                        {r.user.username}
                      </Link>
                      {' requested '}
                      <Link
                        to={`/pets/${r.pet.id}`}
                        className="text-indigo-600 hover:underline"
                      >
                        {r.pet.name || r.pet.type}
                      </Link>
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(r.requestDate).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleAdoptionAction(r.id, 'approve')}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleAdoptionAction(r.id, 'reject')}
                      className="bg-red-500 hover:bg-red-600 text-white"
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              ))
            )}

            <h4 className="font-semibold text-gray-700 mt-6 mb-3">
              ✅ Approved ({approvedAdoptions.length})
            </h4>
            {approvedAdoptions.length === 0 ? (
              <EmptyState text="No approved requests" />
            ) : (
              approvedAdoptions.map((r) => (
                <div
                  key={r.id}
                  className="bg-white rounded-xl border-l-4 border-green-400 shadow-sm p-4 flex justify-between items-center"
                >
                  <p className="font-medium text-gray-800">
                    <Link
                      to={`/users/${r.user.id}`}
                      className="text-indigo-600 hover:underline"
                    >
                      {r.user.username}
                    </Link>
                    {' adopted '}
                    <Link
                      to={`/pets/${r.pet.id}`}
                      className="text-indigo-600 hover:underline"
                    >
                      {r.pet.name || r.pet.type}
                    </Link>
                  </p>
                  <Badge className="bg-green-100 text-green-700">
                    APPROVED
                  </Badge>
                </div>
              ))
            )}
          </SectionWrapper>
        )}

        {/* Section: Users */}
        {section === 'users' && (
          <SectionWrapper title="All Users" count={users.length}>
            {users.length === 0 ? (
              <EmptyState text="No users found" />
            ) : (
              users.map((u) => (
                <div
                  key={u.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center uppercase">
                      {u.username[0]}
                    </div>
                    <div>
                      <Link
                        to={`/users/${u.id}`}
                        className="font-semibold text-gray-900 hover:text-indigo-600"
                      >
                        {u.username}
                      </Link>
                      <p className="text-xs text-gray-400">{u.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400">
                      Joined {new Date(u.createdAt).toLocaleDateString('en-IN')}
                    </span>
                    <Button
                      size="sm"
                      onClick={() => handleDeleteUser(u.id)}
                      className="bg-red-500 hover:bg-red-600 text-white"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))
            )}
          </SectionWrapper>
        )}
      </div>
    </Layout>
  );
}

// ── Small helper components ───────────────────────────────────────────────────
const SectionWrapper = ({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) => (
  <div>
    <h3 className="text-lg font-bold text-gray-900 mb-4">
      {title}{' '}
      <span className="text-sm font-normal text-gray-400">({count})</span>
    </h3>
    <div className="space-y-3">{children}</div>
  </div>
);

const EmptyState = ({ text }: { text: string }) => (
  <div className="text-center py-10 text-gray-400">
    <PawPrint className="w-8 h-8 mx-auto mb-2 opacity-20" />
    <p className="text-sm">{text}</p>
  </div>
);

const AdminPetCard = ({
  pet,
  children,
}: {
  pet: Pet;
  children: React.ReactNode;
}) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex gap-4 items-start">
    <div className="w-20 h-20 bg-gray-100 rounded-xl overflow-hidden shrink-0">
      {pet.imageUrl ? (
        <img
          src={pet.imageUrl}
          className="w-full h-full object-cover"
          alt="pet"
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-gray-300 text-xl">
          🐾
        </div>
      )}
    </div>
    <div className="flex-1">
      <div className="flex items-start justify-between flex-wrap gap-2">
        <div>
          <p className="font-semibold text-gray-900">{pet.name || pet.type}</p>
          <p className="text-sm text-gray-500">
            {[pet.breed, pet.color, pet.city, pet.state]
              .filter(Boolean)
              .join(' • ')}
          </p>
        </div>
        <div className="flex gap-2">
          <Badge className="text-xs bg-indigo-100 text-indigo-700">
            {pet.status}
          </Badge>
          <Badge className="text-xs bg-gray-100 text-gray-600">
            {pet.validationStatus}
          </Badge>
        </div>
      </div>
      <p className="text-xs text-gray-400 mt-1">
        Reported: {new Date(pet.dateReported).toLocaleDateString('en-IN')}
        {(pet as any).owner && ` • by ${(pet as any).owner.username}`}
      </p>
      {children}
    </div>
  </div>
);
