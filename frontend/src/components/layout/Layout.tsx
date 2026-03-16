import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StarsBackground } from './StarsBackground';
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
  Menu,
  MessageCircle,
  Moon,
  PawPrint,
  Search,
  Sun,
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
  const [mobileOpen, setMobileOpen] = useState(false);

  // Dark mode setup
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;

    if (darkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode((prev) => !prev);
  };

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
      // Silent fail
    }

    logout();
    toast.success('Logged out successfully');
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 dark:border-neutral-800 bg-white/70 dark:bg-neutral-950/80 backdrop-blur-xl supports-backdrop-filter:bg-white/60 dark:supports-backdrop-filter:bg-neutral-950/70 shadow-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-2 text-lg font-semibold text-indigo-700"
        >
          <PawPrint className="h-5 w-5" />
          PawMitra
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={toggleDarkMode}>
            {darkMode ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>

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

        {/* Mobile Hamburger */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/10 px-4 pb-4 pt-2 flex flex-col gap-2">
          <Link to="/" onClick={() => setMobileOpen(false)}>
            <Button variant="ghost" size="sm" className="w-full justify-start">
              <Home className="mr-2 h-4 w-4" />
              Home
            </Button>
          </Link>

          <Link to="/search" onClick={() => setMobileOpen(false)}>
            <Button variant="ghost" size="sm" className="w-full justify-start">
              <Search className="mr-2 h-4 w-4" />
              Search
            </Button>
          </Link>

          {isAuth ? (
            <>
              <Link to="/notifications" onClick={() => setMobileOpen(false)}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                >
                  <Bell className="mr-2 h-4 w-4" />
                  Notifications
                </Button>
              </Link>

              <Link to="/chat/rooms" onClick={() => setMobileOpen(false)}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Chat Rooms
                </Button>
              </Link>

              <Link to="/report" onClick={() => setMobileOpen(false)}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                >
                  <PawPrint className="mr-2 h-4 w-4" />
                  Report Pet
                </Button>
              </Link>

              {user?.role === 'ADMIN' && (
                <Link to="/admin" onClick={() => setMobileOpen(false)}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                  >
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Admin
                  </Button>
                </Link>
              )}

              <Link to="/profile" onClick={() => setMobileOpen(false)}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                >
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Button>
              </Link>

              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-red-600"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setMobileOpen(false)}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                >
                  <LogIn className="mr-2 h-4 w-4" />
                  Login
                </Button>
              </Link>

              <Link to="/register" onClick={() => setMobileOpen(false)}>
                <Button size="sm" className="w-full justify-start">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Register
                </Button>
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

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
          {/* icons omitted for brevity (same as your code) */}
        </div>

        <p className="text-sm text-gray-400">📧 support@pawmitra.org</p>
      </div>
    </div>

    <div className="border-t border-gray-200 py-3 text-center text-sm text-gray-400">
      © {new Date().getFullYear()} PawMitra — All Rights Reserved.
    </div>
  </footer>
);

export const Layout = ({ children }: { children: React.ReactNode }) => (
  <div className="flex min-h-screen flex-col bg-background dark:bg-transparent relative">
    <StarsBackground />
    <div className="relative z-10 flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        {children}
      </main>
      <Footer />
    </div>
  </div>
);
