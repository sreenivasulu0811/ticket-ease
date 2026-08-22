import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Ticket,
  Film,
  Music,
  Calendar,
  User as UserIcon,
  LogOut,
  ShieldCheck,
  Menu,
  X,
  ListOrdered,
  Search,
} from 'lucide-react';

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
    setUserDropdownOpen(false);
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur border-b border-slate-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-brand-500/25 group-hover:scale-105 transition-transform">
              <Ticket className="w-5 h-5 text-white transform -rotate-12" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              Ticket<span className="text-brand-400">Ease</span>
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1 lg:gap-2">
            <Link
              to="/events?type=MOVIE"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.search.includes('MOVIE')
                  ? 'bg-brand-600/20 text-brand-400'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Film className="w-4 h-4 text-brand-400" />
              Movies
            </Link>

            <Link
              to="/events?type=CONCERT"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.search.includes('CONCERT')
                  ? 'bg-brand-600/20 text-brand-400'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Music className="w-4 h-4 text-purple-400" />
              Concerts
            </Link>

            <Link
              to="/events"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive('/events') && !location.search
                  ? 'bg-brand-600/20 text-brand-400'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Calendar className="w-4 h-4 text-emerald-400" />
              All Events
            </Link>

            {isAuthenticated && (
              <>
                <Link
                  to="/my-bookings"
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive('/my-bookings')
                      ? 'bg-brand-600/20 text-brand-400'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Ticket className="w-4 h-4 text-amber-400" />
                  My Bookings
                </Link>

                <Link
                  to="/waitlist"
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive('/waitlist')
                      ? 'bg-brand-600/20 text-brand-400'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <ListOrdered className="w-4 h-4 text-cyan-400" />
                  Waitlist
                </Link>
              </>
            )}

            {isAdmin && (
              <Link
                to="/admin"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 transition-colors ml-2"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Admin Portal
              </Link>
            )}
          </div>

          {/* Right Action buttons */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 hover:border-slate-600 text-sm font-medium transition-colors focus:outline-none"
                >
                  <div className="w-7 h-7 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-bold">
                    {user?.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="max-w-[120px] truncate text-slate-200">{user?.name}</span>
                </button>

                {userDropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-56 rounded-xl bg-slate-800 border border-slate-700 shadow-xl py-2 z-50 text-sm text-slate-200"
                    onClick={() => setUserDropdownOpen(false)}
                  >
                    <div className="px-4 py-2 border-b border-slate-700">
                      <p className="font-semibold text-white truncate">{user?.name}</p>
                      <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                      <span className="inline-block mt-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-brand-900/60 text-brand-300 border border-brand-700/50">
                        {user?.role}
                      </span>
                    </div>

                    <Link
                      to="/my-bookings"
                      className="flex items-center gap-2 px-4 py-2 hover:bg-slate-700/50 text-slate-200 transition-colors"
                    >
                      <Ticket className="w-4 h-4 text-amber-400" />
                      My Bookings
                    </Link>

                    <Link
                      to="/waitlist"
                      className="flex items-center gap-2 px-4 py-2 hover:bg-slate-700/50 text-slate-200 transition-colors"
                    >
                      <ListOrdered className="w-4 h-4 text-cyan-400" />
                      My Waitlists
                    </Link>

                    {isAdmin && (
                      <Link
                        to="/admin"
                        className="flex items-center gap-2 px-4 py-2 hover:bg-slate-700/50 text-amber-300 transition-colors border-t border-slate-700/50"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        Admin Dashboard
                      </Link>
                    )}

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2 hover:bg-red-950/40 text-red-400 transition-colors border-t border-slate-700/50 text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-brand-600 hover:bg-brand-500 text-white shadow-md shadow-brand-600/20 transition-all hover:scale-[1.02]"
                >
                  Create Account
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-900 border-b border-slate-800 px-4 pt-2 pb-6 space-y-2">
          <Link
            to="/events?type=MOVIE"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-base font-medium text-slate-200 hover:bg-slate-800"
          >
            <Film className="w-5 h-5 text-brand-400" />
            Movies
          </Link>
          <Link
            to="/events?type=CONCERT"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-base font-medium text-slate-200 hover:bg-slate-800"
          >
            <Music className="w-5 h-5 text-purple-400" />
            Concerts
          </Link>
          <Link
            to="/events"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-base font-medium text-slate-200 hover:bg-slate-800"
          >
            <Calendar className="w-5 h-5 text-emerald-400" />
            All Events
          </Link>

          {isAuthenticated ? (
            <>
              <Link
                to="/my-bookings"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-base font-medium text-slate-200 hover:bg-slate-800"
              >
                <Ticket className="w-5 h-5 text-amber-400" />
                My Bookings
              </Link>
              <Link
                to="/waitlist"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-base font-medium text-slate-200 hover:bg-slate-800"
              >
                <ListOrdered className="w-5 h-5 text-cyan-400" />
                My Waitlists
              </Link>
              {isAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-base font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/20"
                >
                  <ShieldCheck className="w-5 h-5" />
                  Admin Portal
                </Link>
              )}
              <div className="pt-4 border-t border-slate-800 flex justify-between items-center">
                <span className="text-sm text-slate-400">Signed in as {user?.name}</span>
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="text-sm text-red-400 font-medium hover:underline"
                >
                  Sign Out
                </button>
              </div>
            </>
          ) : (
            <div className="pt-4 border-t border-slate-800 grid grid-cols-2 gap-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="text-center px-4 py-2.5 rounded-lg text-sm font-medium bg-slate-800 text-white"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="text-center px-4 py-2.5 rounded-lg text-sm font-semibold bg-brand-600 text-white"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
