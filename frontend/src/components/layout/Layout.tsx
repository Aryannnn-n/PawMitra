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
      /* silent fail */
    }

    logout();
    toast.success('Logged out successfully');
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-white/70 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60 shadow-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-2 text-lg font-semibold text-indigo-700"
        >
          <PawPrint className="h-5 w-5" />
          PawMitra
        </Link>

        {/* Navigation */}
        <div className="flex items-center gap-2">
          <Link to="/">
            <Button variant="ghost" size="sm">
              <Home className="mr-1 h-4 w-4" />
              Home
            </Button>
          </Link>

          <Link to="/search">
            <Button variant="ghost" size="sm">
              <Search className="mr-1 h-4 w-4" />
              Search
            </Button>
          </Link>

          {isAuth ? (
            <>
              {/* Notifications */}
              <Link to="/notifications" className="relative">
                <Button variant="ghost" size="sm">
                  <Bell className="h-4 w-4" />

                  {unreadCount > 0 && (
                    <Badge className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center p-0 text-[10px]">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </Badge>
                  )}
                </Button>
              </Link>

              {/* Chat Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MessageCircle className="mr-1 h-4 w-4" />
                    Chats
                    <ChevronDown className="ml-1 h-3 w-3" />
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

              <Link to="/report">
                <Button variant="ghost" size="sm">
                  <PawPrint className="mr-1 h-4 w-4" />
                  Report Pet
                </Button>
              </Link>

              {user?.role === 'ADMIN' && (
                <Link to="/admin">
                  <Button variant="ghost" size="sm">
                    <LayoutDashboard className="mr-1 h-4 w-4" />
                    Admin
                  </Button>
                </Link>
              )}

              {/* Profile */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <User className="mr-1 h-4 w-4" />
                    {user?.username}
                    <ChevronDown className="ml-1 h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link to="/profile">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-red-600"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  <LogIn className="mr-1 h-4 w-4" />
                  Login
                </Button>
              </Link>

              <Link to="/register">
                <Button size="sm">
                  <UserPlus className="mr-1 h-4 w-4" />
                  Register
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export const Footer = () => (
  <footer className="bg-gray-50 border-t border-gray-200 mt-20">
    {' '}
    <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
      {' '}
      <div className="max-w-md">
        {' '}
        <div className="flex items-center gap-2 mb-2">
          {' '}
          <PawPrint className="w-5 h-5 text-indigo-600" />{' '}
          <h2 className="text-lg font-semibold text-indigo-700">
            {' '}
            PawMitra — Pet Rescue Portal{' '}
          </h2>{' '}
        </div>{' '}
        <p className="text-sm text-gray-500 leading-relaxed">
          {' '}
          Helping lost pets reunite with their owners, find loving homes for
          rescues, and build a community that truly cares for every tail and
          paw.{' '}
        </p>{' '}
      </div>{' '}
      <div className="text-center md:text-right">
        {' '}
        <h3 className="font-semibold text-gray-700 mb-3">
          Connect With Us
        </h3>{' '}
        <div className="flex justify-center md:justify-end gap-4 text-indigo-600 text-xl mb-3">
          {' '}
          <a
            href="#"
            className="hover:text-indigo-900 transition"
            aria-label="Facebook"
          >
            {' '}
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              {' '}
              <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />{' '}
            </svg>{' '}
          </a>{' '}
          <a
            href="#"
            className="hover:text-indigo-900 transition"
            aria-label="Instagram"
          >
            {' '}
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {' '}
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />{' '}
              <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />{' '}
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />{' '}
            </svg>{' '}
          </a>{' '}
          <a
            href="#"
            className="hover:text-indigo-900 transition"
            aria-label="Twitter"
          >
            {' '}
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              {' '}
              <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" />{' '}
            </svg>{' '}
          </a>{' '}
        </div>{' '}
        <p className="text-sm text-gray-400">📧 support@pawmitra.org</p>{' '}
      </div>{' '}
    </div>{' '}
    <div className="border-t border-gray-200 py-3 text-center text-sm text-gray-400">
      {' '}
      © {new Date().getFullYear()} PawMitra — All Rights Reserved.{' '}
    </div>{' '}
  </footer>
);

export const Layout = ({ children }: { children: React.ReactNode }) => (
  <div className="flex min-h-screen flex-col bg-background">
    <Navbar />
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
      {children}
    </main>
    <Footer />
  </div>
);
