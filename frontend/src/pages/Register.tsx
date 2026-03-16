import { Layout } from '@/components/layout/Layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { apiFetch } from '@/lib/api';
import {
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  PawPrint,
  XCircle,
} from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

type OtpStatus =
  | 'idle'
  | 'sending'
  | 'sent'
  | 'verifying'
  | 'verified'
  | 'failed';

export default function Register() {
  const navigate = useNavigate();

  // Form fields
  const [form, setForm] = useState({
    name: '',
    username: '',
    email: '',
    phone: '',
    location: '',
    age: '',
    gender: '',
    role: 'USER',
    adminCode: '',
    password: '',
    confirmPassword: '',
  });

  const [otp, setOtp] = useState('');
  const [otpStatus, setOtpStatus] = useState<OtpStatus>('idle');
  const [showPass, setShowPass] = useState(false);
  const [showConf, setShowConf] = useState(false);
  const [loading, setLoading] = useState(false);

  const set =
    (field: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));

  // ── Send OTP ──────────────────────────────────────────────────────────────
  const sendOtp = async () => {
    if (!form.email.trim()) {
      toast.error('Enter your email first');
      return;
    }
    setOtpStatus('sending');
    try {
      await apiFetch('/api/auth/send-verification', {
        method: 'POST',
        body: JSON.stringify({ email: form.email }),
      });
      setOtpStatus('sent');
      toast.success('Verification code sent to your email 📧');
    } catch (err: unknown) {
      setOtpStatus('idle');
      toast.error(err instanceof Error ? err.message : 'Failed to send code');
    }
  };

  // ── Verify OTP ────────────────────────────────────────────────────────────
  const verifyOtp = async () => {
    if (!otp.trim()) {
      toast.error('Enter the verification code');
      return;
    }
    setOtpStatus('verifying');
    try {
      await apiFetch('/api/auth/verify', {
        method: 'POST',
        body: JSON.stringify({ email: form.email, otp }),
      });
      setOtpStatus('verified');
      toast.success('Email verified! ✅');
    } catch (err: unknown) {
      setOtpStatus('failed');
      toast.error(err instanceof Error ? err.message : 'Invalid code');
    }
  };

  // ── Register ──────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (otpStatus !== 'verified') {
      toast.error('Please verify your email first');
      return;
    }
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await apiFetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name,
          username: form.username,
          email: form.email,
          password: form.password,
          otp,
          role: form.role,
          adminCode: form.adminCode || undefined,
          phone: form.phone || undefined,
          location: form.location || undefined,
          age: form.age ? parseInt(form.age) : undefined,
          gender: form.gender || undefined,
        }),
      });
      toast.success('Registered successfully! Please login 🎉');
      navigate('/login');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const otpVerifiedBadge =
    otpStatus === 'verified' ? (
      <Badge className="bg-green-100 text-green-700 border-green-200 gap-1">
        <CheckCircle2 className="w-3 h-3" /> Verified
      </Badge>
    ) : otpStatus === 'failed' ? (
      <Badge variant="destructive" className="gap-1">
        <XCircle className="w-3 h-3" /> Failed
      </Badge>
    ) : null;

  return (
    <Layout>
      <div className="flex items-center justify-center px-4 py-10">
        <Card className="w-full max-w-lg shadow-lg border-0 bg-white/80 backdrop-transparent">
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-3">
              <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center">
                <PawPrint className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Create an account
            </CardTitle>
            <CardDescription>
              Join PawMitra and help pets find their way home
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name + Username */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">
                    Full Name
                  </label>
                  <Input
                    placeholder="John Doe"
                    value={form.name}
                    onChange={set('name')}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">
                    Username
                  </label>
                  <Input
                    placeholder="johndoe"
                    value={form.username}
                    onChange={set('username')}
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Email + Send OTP */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">
                  Email
                </label>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={set('email')}
                    disabled={loading || otpStatus === 'verified'}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={sendOtp}
                    disabled={
                      otpStatus === 'sending' || otpStatus === 'verified'
                    }
                    className="shrink-0 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                  >
                    {otpStatus === 'sending' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : otpStatus === 'verified' ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    ) : (
                      'Send Code'
                    )}
                  </Button>
                </div>
              </div>

              {/* OTP Verify */}
              {(otpStatus === 'sent' ||
                otpStatus === 'verifying' ||
                otpStatus === 'verified' ||
                otpStatus === 'failed') && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700">
                      Verification Code
                    </label>
                    {otpVerifiedBadge}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="6-digit code"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      maxLength={6}
                      disabled={
                        otpStatus === 'verified' || otpStatus === 'verifying'
                      }
                      className="flex-1 tracking-widest font-mono"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={verifyOtp}
                      disabled={
                        otpStatus === 'verified' || otpStatus === 'verifying'
                      }
                      className="shrink-0 border-green-200 text-green-700 hover:bg-green-50"
                    >
                      {otpStatus === 'verifying' ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        'Verify'
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* Phone + Location */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">
                    Phone
                  </label>
                  <Input
                    placeholder="9876543210"
                    value={form.phone}
                    onChange={set('phone')}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">
                    Location
                  </label>
                  <Input
                    placeholder="Mumbai"
                    value={form.location}
                    onChange={set('location')}
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Age + Gender */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">
                    Age
                  </label>
                  <Input
                    type="number"
                    placeholder="25"
                    value={form.age}
                    onChange={set('age')}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">
                    Gender
                  </label>
                  <select
                    value={form.gender}
                    onChange={set('gender')}
                    disabled={loading}
                    className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select gender</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                    <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
                  </select>
                </div>
              </div>

              {/* Role */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">
                  Role
                </label>
                <select
                  value={form.role}
                  onChange={set('role')}
                  disabled={loading}
                  className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="USER">User</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>

              {/* Admin Code */}
              {form.role === 'ADMIN' && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">
                    Admin Verification Code
                  </label>
                  <Input
                    type="password"
                    placeholder="Enter admin code"
                    value={form.adminCode}
                    onChange={set('adminCode')}
                    disabled={loading}
                  />
                </div>
              )}

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="relative">
                  <Input
                    type={showPass ? 'text' : 'password'}
                    placeholder="Min 6 characters"
                    value={form.password}
                    onChange={set('password')}
                    disabled={loading}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPass ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">
                  Confirm Password
                </label>
                <div className="relative">
                  <Input
                    type={showConf ? 'text' : 'password'}
                    placeholder="Repeat your password"
                    value={form.confirmPassword}
                    onChange={set('confirmPassword')}
                    disabled={loading}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConf((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConf ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <Button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg mt-2"
                disabled={loading || otpStatus !== 'verified'}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating
                    account...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>

              {otpStatus !== 'verified' && (
                <p className="text-center text-xs text-amber-600">
                  ⚠️ Please verify your email to enable registration
                </p>
              )}
            </form>

            <p className="text-center text-sm text-gray-500 mt-6">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-indigo-600 font-medium hover:underline"
              >
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
