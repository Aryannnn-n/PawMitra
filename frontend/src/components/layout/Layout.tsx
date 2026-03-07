import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import {
    Bell,
    ChevronDown,
    Home,
    LayoutDashboard,
    LogIn,
    LogOut,
    MessageCircle,
    PawPrint,
    Search,
    User,
    UserPlus,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

// ── Navbar ────────────────────────────────────────────────────────────────────
export const Navbar = () => {
  const { user, isAuth, logout } = useAuthStore();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!isAuth) return;
    const fetchUnread = async () => {
      try {
        const data = await apiFetch<{ count: number }>(
          '/api/notifications/unread-count',
        );
        setUnreadCount(data.count);
      } catch {
        /* silent fail */
      }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 10000);
    return () => clearInterval(interval);
  }, [isAuth]);

  const handleLogout = async () => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } catch {
      /* silent */
    }
    logout();
    toast.success('Logged out successfully');
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-indigo-100 bg-white/80 backdrop-blur-md shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-2 font-bold text-xl text-indigo-700 hover:text-indigo-900 transition"
        >
          <PawPrint className="w-6 h-6" />
          PawMitra
        </Link>

        {/* Nav Links */}
        <div className="flex items-center gap-1 md:gap-2">
          <Link to="/">
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-600 hover:text-indigo-700"
            >
              <Home className="w-4 h-4 mr-1" /> Home
            </Button>
          </Link>

          <Link to="/search">
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-600 hover:text-indigo-700"
            >
              <Search className="w-4 h-4 mr-1" /> Search
            </Button>
          </Link>

          {isAuth ? (
            <>
              {/* Notification Bell */}
              <Link to="/notifications" className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-600 hover:text-indigo-700"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px] bg-red-500">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </Badge>
                  )}
                </Button>
              </Link>

              {/* Chat Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-600 hover:text-indigo-700"
                  >
                    <MessageCircle className="w-4 h-4 mr-1" />
                    Chats <ChevronDown className="w-3 h-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link to="/chat/rooms">Chat Rooms</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/chat/direct">Direct Chat</Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Report Pet */}
              <Link to="/report">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-600 hover:text-indigo-700"
                >
                  <PawPrint className="w-4 h-4 mr-1" /> Report Pet
                </Button>
              </Link>

              {/* Admin Link */}
              {user?.role === 'ADMIN' && (
                <Link to="/admin">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-600 hover:text-indigo-700"
                  >
                    <LayoutDashboard className="w-4 h-4 mr-1" /> Admin
                  </Button>
                </Link>
              )}

              {/* Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-600 hover:text-indigo-700"
                  >
                    <User className="w-4 h-4 mr-1" />
                    {user?.username} <ChevronDown className="w-3 h-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link to="/profile">
                      <User className="w-4 h-4 mr-2" /> Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-red-600 focus:text-red-600"
                  >
                    <LogOut className="w-4 h-4 mr-2" /> Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-600 hover:text-indigo-700"
                >
                  <LogIn className="w-4 h-4 mr-1" /> Login
                </Button>
              </Link>
              <Link to="/register">
                <Button
                  size="sm"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  <UserPlus className="w-4 h-4 mr-1" /> Register
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

// ── Footer ────────────────────────────────────────────────────────────────────
export const Footer = () => (
  <footer className="bg-gray-50 border-t border-gray-200 mt-20">
    <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
      <div className="max-w-md">
        <div className="flex items-center gap-2 mb-2">
          <PawPrint className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-semibold text-indigo-700">
            PawMitra — Pet Rescue Portal
          </h2>
        </div>
        <p className="text-sm text-gray-500 leading-relaxed">
          Helping lost pets reunite with their owners, find loving homes for
          rescues, and build a community that truly cares for every tail and
          paw.
        </p>
      </div>
      <div className="text-center md:text-right">
        <h3 className="font-semibold text-gray-700 mb-3">Connect With Us</h3>
        <div className="flex justify-center md:justify-end gap-4 text-indigo-600 text-xl mb-3">
          <a
            href="#"
            className="hover:text-indigo-900 transition"
            aria-label="Facebook"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
            </svg>
          </a>
          <a
            href="#"
            className="hover:text-indigo-900 transition"
            aria-label="Instagram"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
              <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
            </svg>
          </a>
          <a
            href="#"
            className="hover:text-indigo-900 transition"
            aria-label="Twitter"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" />
            </svg>
          </a>
        </div>
        <p className="text-sm text-gray-400">📧 support@pawmitra.org</p>
      </div>
    </div>
    <div className="border-t border-gray-200 py-3 text-center text-sm text-gray-400">
      © {new Date().getFullYear()} PawMitra — All Rights Reserved.
    </div>
  </footer>
);

// ── Layout Wrapper ────────────────────────────────────────────────────────────
export const Layout = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen flex flex-col bg-gradient-to-br from-indigo-50 via-white to-purple-50">
    <Navbar />
    <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
      {children}
    </main>
    <Footer />
  </div>
);
